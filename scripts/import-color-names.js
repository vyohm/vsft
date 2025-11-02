#!/usr/bin/env node

/**
 * Script to import color names from CSV to catalogue_item_photos table
 * Reads data/design-color-names.csv and updates the color_name field
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const vsftUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const vsftServiceKey = envContent.match(/VSFT_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

const supabase = createClient(vsftUrl, vsftServiceKey)

// Simple CSV parser
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')

  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || null
    })
    return obj
  })
}

async function importColorNames() {
  console.log('🎨 Starting color names import process...\n')

  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'data', 'design-color-names.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const colorData = parseCSV(csvContent)

    console.log(`📋 Found ${colorData.length} designs in CSV\n`)

    // Fetch all catalogue items
    const { data: catalogueItems, error: catalogueError } = await supabase
      .from('catalogue_items')
      .select('id, design_number')

    if (catalogueError) throw catalogueError

    // Create design number to ID map
    const designMap = new Map(
      catalogueItems.map(item => [item.design_number.toUpperCase(), item.id])
    )

    // Fetch all photos
    const { data: photos, error: photosError } = await supabase
      .from('catalogue_item_photos')
      .select('id, catalogue_item_id, color_variant')

    if (photosError) throw photosError

    console.log(`📸 Found ${photos.length} photos in database\n`)

    // Build updates
    const updates = []
    let matchedCount = 0
    let unmatchedCount = 0

    colorData.forEach(row => {
      const designNumber = row.Design?.toUpperCase()
      const catalogueItemId = designMap.get(designNumber)

      if (!catalogueItemId) {
        unmatchedCount++
        console.log(`  ✗ ${designNumber} - No matching catalogue item`)
        return
      }

      // Get photos for this catalogue item
      const itemPhotos = photos.filter(p => p.catalogue_item_id === catalogueItemId)

      if (itemPhotos.length === 0) {
        console.log(`  ⚠️  ${designNumber} - Has catalogue item but no photos`)
        return
      }

      // Map color variants to color names from CSV
      const colorMapping = [
        { variant: 'color1', name: row['Colour 1'] },
        { variant: 'color2', name: row['Colour 2'] },
        { variant: 'color3', name: row['Colour 3'] },
        { variant: 'color4', name: row['Colour 4'] },
        { variant: 'color5', name: row['Colour 5'] }
      ]

      let colorsUpdated = 0
      colorMapping.forEach(({ variant, name }) => {
        if (!name) return

        const photo = itemPhotos.find(p => p.color_variant === variant)
        if (photo) {
          updates.push({
            id: photo.id,
            color_name: name
          })
          colorsUpdated++
        }
      })

      if (colorsUpdated > 0) {
        matchedCount++
        console.log(`  ✓ ${designNumber} - ${colorsUpdated} color(s) updated`)
      }
    })

    console.log(`\n📊 Summary:`)
    console.log(`  Matched designs: ${matchedCount}`)
    console.log(`  Unmatched designs: ${unmatchedCount}`)
    console.log(`  Total updates to apply: ${updates.length}\n`)

    if (updates.length === 0) {
      console.log('❌ No updates to apply. Exiting.')
      return
    }

    // Ask for confirmation
    const isDryRun = !process.argv.includes('--execute')

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made')
      console.log('   To actually update the data, run: node scripts/import-color-names.js --execute\n')

      console.log('Sample updates:')
      console.log(JSON.stringify(updates.slice(0, 5), null, 2))
      console.log(`\n... and ${updates.length - 5} more updates`)
    } else {
      console.log('⚠️  EXECUTE MODE - Updating database...\n')

      // Update in batches of 100
      const batchSize = 100
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)

        for (const update of batch) {
          const { error } = await supabase
            .from('catalogue_item_photos')
            .update({ color_name: update.color_name })
            .eq('id', update.id)

          if (error) {
            console.error(`Error updating photo ${update.id}:`, error)
          }
        }

        console.log(`  Updated ${Math.min(i + batchSize, updates.length)}/${updates.length}`)
      }

      console.log(`\n✅ Successfully updated ${updates.length} photo records!`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

importColorNames()
