import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.VSFT_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Copy the exact function from analyze script
function generateVariations(designNumber) {
  const variations = new Set()
  const upper = designNumber.toUpperCase().trim()
  variations.add(upper)

  // SFT <-> SF conversion
  if (upper.startsWith('SFT')) {
    variations.add(upper.replace('SFT', 'SF'))
  } else if (upper.startsWith('SF')) {
    variations.add('SFT' + upper.substring(2))
  }

  // Remove leading zeros: NK0005 -> NK005, NK05, NK5
  const match = upper.match(/^([A-Z]+)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const number = match[2]

    // Add version without leading zeros
    const numWithoutZeros = parseInt(number, 10).toString()
    if (numWithoutZeros !== number) {
      variations.add(prefix + numWithoutZeros)
    }

    // Add versions with different zero counts
    const paddedVariations = [
      number.padStart(4, '0'),
      number.padStart(3, '0'),
      number.padStart(2, '0')
    ]
    paddedVariations.forEach(padded => {
      variations.add(prefix + padded)
      // Also add SFT/SF variants
      if (prefix === 'SFT') {
        variations.add('SF' + padded)
      } else if (prefix === 'SF') {
        variations.add('SFT' + padded)
      }
    })
  }

  // Add version with hyphen: NK0005 -> NK-0005, NK-005, NK-05, NK-5
  if (!upper.includes('-')) {
    Array.from(variations).forEach(v => {
      const vMatch = v.match(/^([A-Z]+)(\d+)$/)
      if (vMatch) {
        variations.add(vMatch[1] + '-' + vMatch[2])
      }
    })
  }

  // Add version without hyphen
  if (upper.includes('-')) {
    variations.add(upper.replace('-', ''))
  }

  return Array.from(variations)
}

async function debugMatch() {
  console.log('Debugging SFT1610 matching...\n')

  // Get catalogue item
  const { data: catalogueItem } = await supabase
    .from('catalogue_items')
    .select('*')
    .eq('design_number', 'SFT1610')
    .single()

  console.log('Catalogue item:', catalogueItem)

  // Generate variations for SFT1610
  const catalogueVariations = generateVariations('SFT1610')
  console.log('\nGenerated variations for SFT1610:')
  console.log(catalogueVariations)

  // Get stock items
  const { data: stockItems } = await supabase
    .from('stock_items')
    .select('id, design_number')
    .eq('design_number', 'SFT1610')

  console.log(`\nStock items with design_number = 'SFT1610': ${stockItems?.length || 0}`)

  // Try to match using the same logic as analyze script
  const { data: allStock, count } = await supabase
    .from('stock_items')
    .select('design_number', { count: 'exact' })

  console.log(`\nTotal stock items in database: ${allStock?.length || 0}`)
  console.log(`Actual count from database: ${count}`)

  // Build variation map
  const stockVariationMap = new Map()
  for (const stockItem of allStock || []) {
    const variations = generateVariations(stockItem.design_number)
    variations.forEach(variation => {
      if (!stockVariationMap.has(variation)) {
        stockVariationMap.set(variation, stockItem.design_number)
      }
    })
  }

  console.log(`\nGenerated ${stockVariationMap.size} total stock variations`)

  // Check if any catalogue variation matches
  let matched = false
  for (const variation of catalogueVariations) {
    if (stockVariationMap.has(variation)) {
      console.log(`\n✓ MATCH FOUND! Variation "${variation}" maps to "${stockVariationMap.get(variation)}"`)
      matched = true
      break
    }
  }

  if (!matched) {
    console.log('\n✗ NO MATCH FOUND')
    console.log('Checking if SFT1610 exists in variation map:', stockVariationMap.has('SFT1610'))
    console.log('What SFT1610 maps to:', stockVariationMap.get('SFT1610'))

    // Check what SFT16xx variations exist
    console.log('\nAll SFT16xx variations in map:')
    const sft16Variations = []
    for (const [key, value] of stockVariationMap.entries()) {
      if (key.startsWith('SFT16')) {
        sft16Variations.push(`${key} -> ${value}`)
      }
    }
    console.log(`Found ${sft16Variations.length} SFT16xx variations`)
    console.log(sft16Variations.slice(0, 20).join('\n'))

    // Check the actual stock items
    console.log('\n\nActual stock items starting with SFT16:')
    const sft16Stock = allStock.filter(s => s.design_number.startsWith('SFT16'))
    console.log(`Found ${sft16Stock.length} stock items`)
    const uniqueSft16 = [...new Set(sft16Stock.map(s => s.design_number))].sort()
    console.log('Unique design numbers:', uniqueSft16.slice(0, 20))
  }
}

debugMatch().catch(console.error)
