#!/usr/bin/env node

/**
 * Script to analyze photos in the wotbot Supabase bucket
 * Lists all files in test-buck/photoshoots-colored and helps map them to catalogue items
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const serviceRoleKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

// Connect to wotbot project using service role key
const supabaseUrl = 'https://adncxesithjuzyhcsuff.supabase.co'

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function analyzePhotos() {
  console.log('🔍 Analyzing photos in wotbot project...\n')
  console.log(`📦 Bucket: test-buck`)
  console.log(`📁 Folder: photoshoots-colored\n`)

  try {
    // List all files in the photoshoots-colored folder
    const { data: files, error } = await supabase
      .storage
      .from('test-buck')
      .list('photoshoots-colored', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listing files:', error)
      return
    }

    if (!files || files.length === 0) {
      console.log('⚠️  No files found in photoshoots-colored folder')
      return
    }

    console.log(`✅ Found ${files.length} files\n`)
    console.log('=' .repeat(80))

    // Analyze file naming patterns
    const filePatterns = {}
    const designNumbers = new Set()

    files.forEach((file, index) => {
      const fileName = file.name

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('test-buck')
        .getPublicUrl(`photoshoots-colored/${fileName}`)

      console.log(`\n${index + 1}. ${fileName}`)
      console.log(`   Size: ${(file.metadata?.size || 0 / 1024).toFixed(2)} KB`)
      console.log(`   URL: ${urlData.publicUrl}`)

      // Try to extract design number and color from filename
      // Common patterns: "DESIGN-color1.jpg", "DESIGN_color2.jpg", etc.
      const patterns = [
        /^(\d+)[-_]?(color[123])?/i,
        /^([A-Z0-9]+)[-_]?(color[123])?/i,
        /^(\d+)[-_]?(red|blue|green|black|white|pink|etc)/i
      ]

      let matched = false
      for (const pattern of patterns) {
        const match = fileName.match(pattern)
        if (match) {
          const designNumber = match[1]
          const colorInfo = match[2] || 'unknown'

          console.log(`   → Detected: Design #${designNumber}, Color: ${colorInfo}`)

          designNumbers.add(designNumber)
          if (!filePatterns[designNumber]) {
            filePatterns[designNumber] = []
          }
          filePatterns[designNumber].push({
            file: fileName,
            color: colorInfo,
            url: urlData.publicUrl
          })
          matched = true
          break
        }
      }

      if (!matched) {
        console.log(`   ⚠️  Could not parse design/color from filename`)
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log('\n📊 SUMMARY\n')
    console.log(`Total files: ${files.length}`)
    console.log(`Unique designs detected: ${designNumbers.size}`)

    if (Object.keys(filePatterns).length > 0) {
      console.log('\n🎨 Designs with multiple colors:')
      Object.entries(filePatterns).forEach(([design, photos]) => {
        if (photos.length > 1) {
          console.log(`\n  Design #${design} (${photos.length} photos):`)
          photos.forEach(p => {
            console.log(`    - ${p.color}: ${p.file}`)
          })
        }
      })
    }

    // Output as JSON for further processing
    console.log('\n\n📋 JSON Output (for import script):\n')
    console.log(JSON.stringify(filePatterns, null, 2))

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

analyzePhotos()
