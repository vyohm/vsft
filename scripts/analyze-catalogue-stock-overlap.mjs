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

// Generate design number variations for fuzzy matching
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

async function analyzeOverlap() {
  console.log('Analyzing catalogue items vs stock items...\n')

  // Fetch all catalogue items
  const { data: catalogueItems, error: catalogueError } = await supabase
    .from('catalogue_items')
    .select('id, design_number')
    .eq('is_active', true)
    .order('design_number')

  if (catalogueError) {
    console.error('Error fetching catalogue items:', catalogueError)
    return
  }

  console.log(`Total catalogue items: ${catalogueItems.length}`)

  // Fetch all stock items (paginated to handle large datasets)
  let stockItems = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('stock_items')
      .select('id, design_number, size, color, quantity, catalogue_item_id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('design_number')

    if (error) {
      console.error('Error fetching stock items:', error)
      return
    }

    if (data && data.length > 0) {
      stockItems = stockItems.concat(data)
      page++
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  console.log(`Total stock items: ${stockItems.length}\n`)

  // Create a map of all stock design variations
  const stockVariationMap = new Map() // variation -> original design
  for (const stockItem of stockItems) {
    const variations = generateVariations(stockItem.design_number)
    variations.forEach(variation => {
      if (!stockVariationMap.has(variation)) {
        stockVariationMap.set(variation, stockItem.design_number)
      }
    })
  }

  console.log(`Generated ${stockVariationMap.size} stock design variations from ${stockItems.length} items\n`)

  // Analyze overlap with fuzzy matching
  const catalogueInStock = []
  const catalogueNotInStock = []
  const fuzzyMatches = new Map() // catalogue design -> matched stock design

  for (const catalogueItem of catalogueItems) {
    const variations = generateVariations(catalogueItem.design_number)
    let matched = false

    for (const variation of variations) {
      if (stockVariationMap.has(variation)) {
        catalogueInStock.push(catalogueItem)
        fuzzyMatches.set(catalogueItem.design_number, stockVariationMap.get(variation))
        matched = true
        break
      }
    }

    if (!matched) {
      catalogueNotInStock.push(catalogueItem)
    }
  }

  console.log('=== OVERLAP ANALYSIS ===')
  console.log(`Catalogue items WITH stock: ${catalogueInStock.length} (${((catalogueInStock.length / catalogueItems.length) * 100).toFixed(1)}%)`)
  console.log(`Catalogue items WITHOUT stock: ${catalogueNotInStock.length} (${((catalogueNotInStock.length / catalogueItems.length) * 100).toFixed(1)}%)\n`)

  // Show catalogue items with stock
  console.log('=== CATALOGUE ITEMS WITH STOCK (with fuzzy matching) ===')
  for (const item of catalogueInStock.slice(0, 10)) {
    const matchedStockDesign = fuzzyMatches.get(item.design_number)
    const stockVariations = stockItems.filter(s => {
      const variations = generateVariations(s.design_number)
      const catalogueVariations = generateVariations(item.design_number)
      return variations.some(v => catalogueVariations.includes(v))
    })
    const sizes = [...new Set(stockVariations.map(s => s.size).filter(Boolean))].sort()
    const colors = [...new Set(stockVariations.map(s => s.color).filter(Boolean))].sort()
    const totalQty = stockVariations.reduce((sum, s) => sum + s.quantity, 0)

    const matchInfo = matchedStockDesign !== item.design_number ? ` (matched as ${matchedStockDesign})` : ''
    console.log(`${item.design_number}${matchInfo}: ${stockVariations.length} variations, ${totalQty} total qty`)
    if (sizes.length > 0) console.log(`  Sizes: ${sizes.join(', ')}`)
    if (colors.length > 0) console.log(`  Colors: ${colors.join(', ')}`)
  }
  if (catalogueInStock.length > 10) {
    console.log(`... and ${catalogueInStock.length - 10} more`)
  }

  // Show catalogue items without stock
  console.log('\n=== CATALOGUE ITEMS WITHOUT STOCK ===')
  console.log(`Total: ${catalogueNotInStock.length} items\n`)

  // Show ALL items without stock
  for (const item of catalogueNotInStock) {
    console.log(`  ${item.design_number} (ID: ${item.id})`)
  }

  // Analyze stock items
  const stockDesignsGrouped = {}
  for (const stockItem of stockItems) {
    const design = stockItem.design_number.toUpperCase()
    if (!stockDesignsGrouped[design]) {
      stockDesignsGrouped[design] = {
        design_number: stockItem.design_number,
        variations: [],
        totalQty: 0,
        sizes: new Set(),
        colors: new Set()
      }
    }
    stockDesignsGrouped[design].variations.push(stockItem)
    stockDesignsGrouped[design].totalQty += stockItem.quantity
    if (stockItem.size) stockDesignsGrouped[design].sizes.add(stockItem.size)
    if (stockItem.color) stockDesignsGrouped[design].colors.add(stockItem.color)
  }

  const uniqueStockDesigns = Object.keys(stockDesignsGrouped).length
  console.log(`\n=== STOCK ANALYSIS ===`)
  console.log(`Unique design numbers in stock: ${uniqueStockDesigns}`)

  // Find stock items not in catalogue
  const stockNotInCatalogue = Object.values(stockDesignsGrouped).filter(item => {
    const designUpper = item.design_number.toUpperCase()
    return !catalogueItems.some(c => c.design_number.toUpperCase() === designUpper)
  })

  console.log(`Stock designs NOT in catalogue: ${stockNotInCatalogue.length}`)
  if (stockNotInCatalogue.length > 0) {
    console.log('Examples:', stockNotInCatalogue.slice(0, 10).map(item => item.design_number).join(', '))
  }

  // Analyze size/color distribution
  const allSizes = new Set()
  const allColors = new Set()
  Object.values(stockDesignsGrouped).forEach(item => {
    item.sizes.forEach(size => allSizes.add(size))
    item.colors.forEach(color => allColors.add(color))
  })

  console.log(`\n=== SIZE & COLOR DISTRIBUTION ===`)
  console.log(`Unique sizes in stock: ${allSizes.size}`)
  console.log(`Sizes: ${Array.from(allSizes).sort().join(', ')}`)
  console.log(`\nUnique colors in stock: ${allColors.size}`)
  console.log(`Colors: ${Array.from(allColors).sort().slice(0, 20).join(', ')}`)
  if (allColors.size > 20) {
    console.log(`... and ${allColors.size - 20} more colors`)
  }

  // Summary
  console.log('\n=== SUMMARY ===')
  console.log(`Total catalogue items: ${catalogueItems.length}`)
  console.log(`Total stock items (rows): ${stockItems.length}`)
  console.log(`Unique designs in stock: ${uniqueStockDesigns}`)
  console.log(`Catalogue items with stock: ${catalogueInStock.length}`)
  console.log(`Catalogue items without stock: ${catalogueNotInStock.length}`)
  console.log(`Stock designs not in catalogue: ${stockNotInCatalogue.length}`)
}

analyzeOverlap().catch(console.error)
