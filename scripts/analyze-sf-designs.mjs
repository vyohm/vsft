import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.VSFT_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeSFDesigns() {
  console.log('Analyzing SF vs SFT design numbers in stock table...\n')

  // Fetch all stock items with SF prefix
  const { data: sfItems, error: sfError } = await supabase
    .from('stock_items')
    .select('id, design_number, size, color, quantity')
    .ilike('design_number', 'SF%')
    .order('design_number')

  if (sfError) {
    console.error('Error fetching SF items:', sfError)
    return
  }

  // Separate SF from SFT
  const puresSF = sfItems.filter(item => item.design_number.toUpperCase().match(/^SF\d/))
  const sftItems = sfItems.filter(item => item.design_number.toUpperCase().startsWith('SFT'))

  console.log(`Total items starting with SF*: ${sfItems.length}`)
  console.log(`Items with SF (not SFT): ${puresSF.length}`)
  console.log(`Items with SFT: ${sftItems.length}\n`)

  if (puresSF.length > 0) {
    console.log('=== ITEMS WITH SF PREFIX (should be SFT) ===')

    // Group by design number
    const grouped = {}
    puresSF.forEach(item => {
      const design = item.design_number.toUpperCase()
      if (!grouped[design]) {
        grouped[design] = []
      }
      grouped[design].push(item)
    })

    const uniqueDesigns = Object.keys(grouped).sort()
    console.log(`Unique SF design numbers: ${uniqueDesigns.length}`)
    console.log(`Total SF stock items (rows): ${puresSF.length}\n`)

    console.log('First 20 SF designs:')
    uniqueDesigns.slice(0, 20).forEach(design => {
      const items = grouped[design]
      const sizes = [...new Set(items.map(i => i.size).filter(Boolean))].sort()
      const colors = [...new Set(items.map(i => i.color).filter(Boolean))].sort()
      const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

      console.log(`  ${design}: ${items.length} items, ${totalQty} qty`)
      if (sizes.length > 0) console.log(`    Sizes: ${sizes.join(', ')}`)
      if (colors.length > 0) console.log(`    Colors: ${colors.join(', ')}`)
    })

    if (uniqueDesigns.length > 20) {
      console.log(`  ... and ${uniqueDesigns.length - 20} more`)
    }

    // Check if corresponding SFT exists in catalogue
    console.log('\n=== CHECKING CATALOGUE FOR SFT EQUIVALENTS ===')
    const { data: catalogueItems } = await supabase
      .from('catalogue_items')
      .select('id, design_number')
      .eq('is_active', true)

    const catalogueMap = new Map(catalogueItems.map(item => [item.design_number.toUpperCase(), item]))

    let matchedCount = 0
    console.log('SF designs that have SFT equivalent in catalogue:')
    uniqueDesigns.slice(0, 10).forEach(sfDesign => {
      const sftDesign = 'SFT' + sfDesign.substring(2)
      if (catalogueMap.has(sftDesign)) {
        console.log(`  ${sfDesign} -> ${sftDesign} ✓`)
        matchedCount++
      }
    })

    console.log(`\nTotal SF designs with SFT in catalogue: ${matchedCount}/${uniqueDesigns.length}`)
  }
}

analyzeSFDesigns().catch(console.error)
