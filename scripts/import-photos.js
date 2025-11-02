#!/usr/bin/env node

/**
 * Script to import photos from wotbot bucket to catalogue_item_photos table
 * Maps photos to catalogue items and assigns color variants (color1, color2, color3)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const wotbotServiceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
const vsftUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const vsftAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()

// Connect to both projects
const wotbotUrl = 'https://adncxesithjuzyhcsuff.supabase.co'

const wotbot = createClient(wotbotUrl, wotbotServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// For vSFT, we'll use anon key for reading and need service role for writing
// You can add VSFT_SERVICE_ROLE_KEY to .env.local if available
const vsftServiceKey = envContent.match(/VSFT_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() || vsftAnonKey

const vsft = createClient(vsftUrl, vsftServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function importPhotos() {
  console.log('🚀 Starting photo import process...\n')

  try {
    // Step 1: Fetch all catalogue items from vSFT
    console.log('📋 Fetching catalogue items from vSFT database...')
    const { data: catalogueItems, error: catalogueError } = await vsft
      .from('catalogue_items')
      .select('id, design_number')

    if (catalogueError) throw catalogueError
    console.log(`✅ Found ${catalogueItems.length} catalogue items\n`)

    // Create a map of design_number to catalogue_item_id with multiple variations
    const designMap = new Map()

    // Helper function to generate design number variations
    function generateVariations(designNumber) {
      const upper = designNumber.toUpperCase()
      const variations = [upper]

      // SFT <-> SF conversion: SFT1050 -> SF1050, SF1050 -> SFT1050
      if (upper.startsWith('SFT')) {
        variations.push(upper.replace('SFT', 'SF'))
      } else if (upper.startsWith('SF')) {
        variations.push('SFT' + upper.substring(2))
      }

      // Remove leading zeros: NK0005 -> NK005, NK05, NK5
      const match = upper.match(/^([A-Z]+)0+(\d+)$/)
      if (match) {
        const prefix = match[1]
        const number = match[2]
        variations.push(`${prefix}${number}`)
        // Also add SFT/SF variants with removed zeros
        if (prefix === 'SFT') {
          variations.push(`SF${number}`)
        } else if (prefix === 'SF') {
          variations.push(`SFT${number}`)
        }
      }

      // Also try removing just one leading zero: NK0005 -> NK005, RS0008 -> RS008
      const singleZeroMatch = upper.match(/^([A-Z]+)0(\d{3,})$/)
      if (singleZeroMatch) {
        const prefix = singleZeroMatch[1]
        const number = singleZeroMatch[2]
        variations.push(`${prefix}${number}`)
        // Also add SFT/SF variants
        if (prefix === 'SFT') {
          variations.push(`SF${number}`)
        } else if (prefix === 'SF') {
          variations.push(`SFT${number}`)
        }
      }

      // Add leading zeros: NK5 -> NK05, NK005, NK0005
      const match2 = upper.match(/^([A-Z]+)(\d+)$/)
      if (match2) {
        const prefix = match2[1]
        const number = match2[2]
        if (number.length < 4) {
          variations.push(`${prefix}${number.padStart(2, '0')}`)
          variations.push(`${prefix}${number.padStart(3, '0')}`)
          variations.push(`${prefix}${number.padStart(4, '0')}`)
          // Also add SFT/SF variants with padded zeros
          if (prefix === 'SFT') {
            variations.push(`SF${number.padStart(2, '0')}`)
            variations.push(`SF${number.padStart(3, '0')}`)
            variations.push(`SF${number.padStart(4, '0')}`)
          } else if (prefix === 'SF') {
            variations.push(`SFT${number.padStart(2, '0')}`)
            variations.push(`SFT${number.padStart(3, '0')}`)
            variations.push(`SFT${number.padStart(4, '0')}`)
          }
        }
      }

      // Add with dash: NK005 -> NK-005
      const match3 = upper.match(/^([A-Z]+)(\d+)$/)
      if (match3) {
        variations.push(`${match3[1]}-${match3[2]}`)
      }

      // Remove dash: NK-005 -> NK005
      if (upper.includes('-')) {
        variations.push(upper.replace(/-/g, ''))
      }

      return [...new Set(variations)]
    }

    catalogueItems.forEach(item => {
      const variations = generateVariations(item.design_number)
      variations.forEach(variant => {
        designMap.set(variant, item.id)
      })
    })

    // Step 2: Fetch all photos from both folders in wotbot bucket
    console.log('📸 Fetching photos from wotbot bucket...')

    // Fetch from photoshoots-colored folder
    const { data: coloredFiles, error: coloredError } = await wotbot
      .storage
      .from('test-buck')
      .list('photoshoots-colored', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (coloredError) throw coloredError
    console.log(`  ✅ Found ${coloredFiles.length} photos in photoshoots-colored`)

    // Fetch from photoshoots folder
    const { data: regularFiles, error: regularError } = await wotbot
      .storage
      .from('test-buck')
      .list('photoshoots', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (regularError) throw regularError
    console.log(`  ✅ Found ${regularFiles.length} photos in photoshoots`)

    // Combine both sources
    const allFiles = [
      ...coloredFiles.map(f => ({ ...f, folder: 'photoshoots-colored' })),
      ...regularFiles.map(f => ({ ...f, folder: 'photoshoots' }))
    ]
    console.log(`  📊 Total: ${allFiles.length} photos\n`)

    // Step 3: Parse files and organize by design number
    console.log('🔍 Parsing photo filenames...')
    const photosByDesign = new Map()

    allFiles.forEach(file => {
      const fileName = file.name
      const folder = file.folder

      // Pattern 1: DESIGN-COLOR.png (e.g., "NK0005-TBLUE.png") - from photoshoots-colored
      // Pattern 2: DESIGN.png (e.g., "NK0005.png") - from photoshoots
      const matchWithColor = fileName.match(/^([A-Z0-9]+)-(.+)\.(png|jpg|jpeg)$/i)
      const matchNoColor = fileName.match(/^([A-Z0-9]+)\.(png|jpg|jpeg)$/i)

      let designNumber, colorName

      if (matchWithColor) {
        designNumber = matchWithColor[1].toUpperCase()
        colorName = matchWithColor[2]
      } else if (matchNoColor) {
        designNumber = matchNoColor[1].toUpperCase()
        colorName = 'default' // No color specified
      } else {
        console.log(`⚠️  Skipping file with unexpected format: ${fileName}`)
        return
      }

      // Get public URL
      const { data: urlData } = wotbot
        .storage
        .from('test-buck')
        .getPublicUrl(`${folder}/${fileName}`)

      if (!photosByDesign.has(designNumber)) {
        photosByDesign.set(designNumber, [])
      }

      photosByDesign.get(designNumber).push({
        colorName,
        url: urlData.publicUrl,
        fileName,
        folder
      })
    })

    console.log(`✅ Organized photos for ${photosByDesign.size} unique designs\n`)

    // Step 4: Match photos to catalogue items and assign color variants
    console.log('🎨 Matching photos to catalogue items and assigning color variants...\n')

    const photoRecords = []
    let matchedCount = 0
    let unmatchedCount = 0

    photosByDesign.forEach((photos, designNumber) => {
      const catalogueItemId = designMap.get(designNumber)

      if (catalogueItemId) {
        matchedCount++
        // Sort photos by color name for consistency
        photos.sort((a, b) => a.colorName.localeCompare(b.colorName))

        // Assign color variants (max 3)
        const colorVariants = ['color1', 'color2', 'color3']
        photos.slice(0, 3).forEach((photo, index) => {
          photoRecords.push({
            catalogue_item_id: catalogueItemId,
            color_variant: colorVariants[index],
            photo_url: photo.url,
            display_order: 0
          })

          console.log(`  ✓ ${designNumber} - ${colorVariants[index]}: ${photo.colorName}`)
        })

        if (photos.length > 3) {
          console.log(`    ⚠️  ${designNumber} has ${photos.length} colors, using first 3`)
        }
      } else {
        unmatchedCount++
        console.log(`  ✗ ${designNumber} - No matching catalogue item (${photos.length} photos)`)
      }
    })

    console.log(`\n📊 Matching Summary:`)
    console.log(`  Matched: ${matchedCount} designs`)
    console.log(`  Unmatched: ${unmatchedCount} designs`)
    console.log(`  Total photo records to insert: ${photoRecords.length}\n`)

    // Step 5: Ask for confirmation
    if (photoRecords.length === 0) {
      console.log('❌ No photo records to insert. Exiting.')
      return
    }

    console.log('💾 Ready to insert records into catalogue_item_photos table.')
    console.log('   Run with --dry-run flag to skip insertion (default: dry run)\n')

    const isDryRun = !process.argv.includes('--execute')

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made')
      console.log('   To actually insert the data, run: node scripts/import-photos.js --execute\n')

      // Show sample records
      console.log('Sample records to be inserted:')
      console.log(JSON.stringify(photoRecords.slice(0, 5), null, 2))
      console.log(`\n... and ${photoRecords.length - 5} more records`)

    } else {
      console.log('⚠️  EXECUTE MODE - Inserting data into database...\n')

      const { data, error } = await vsft
        .from('catalogue_item_photos')
        .insert(photoRecords)

      if (error) {
        console.error('❌ Error inserting records:', error)
        throw error
      }

      console.log(`✅ Successfully inserted ${photoRecords.length} photo records!`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

importPhotos()
