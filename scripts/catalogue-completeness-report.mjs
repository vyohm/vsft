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

  if (upper.startsWith('SFT')) {
    variations.add(upper.replace('SFT', 'SF'))
  } else if (upper.startsWith('SF')) {
    variations.add('SFT' + upper.substring(2))
  }

  const match = upper.match(/^([A-Z]+)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const number = match[2]

    const numWithoutZeros = parseInt(number, 10).toString()
    if (numWithoutZeros !== number) {
      variations.add(prefix + numWithoutZeros)
    }

    const paddedVariations = [
      number.padStart(4, '0'),
      number.padStart(3, '0'),
      number.padStart(2, '0')
    ]
    paddedVariations.forEach(padded => {
      variations.add(prefix + padded)
      if (prefix === 'SFT') {
        variations.add('SF' + padded)
      } else if (prefix === 'SF') {
        variations.add('SFT' + padded)
      }
    })
  }

  return Array.from(variations)
}

async function generateReport() {
  console.log('Generating Catalogue Completeness Report...\n')

  // Fetch all catalogue items
  const { data: catalogueItems, error: catalogueError } = await supabase
    .from('catalogue_items')
    .select('*')
    .eq('is_active', true)
    .order('design_number')

  if (catalogueError) {
    console.error('Error fetching catalogue items:', catalogueError)
    return
  }

  console.log(`Total active catalogue items: ${catalogueItems.length}\n`)

  // Fetch all photos
  const { data: allPhotos, error: photosError } = await supabase
    .from('catalogue_item_photos')
    .select('*')

  if (photosError) {
    console.error('Error fetching photos:', photosError)
    return
  }

  // Group photos by catalogue_item_id
  const photosByItemId = new Map()
  allPhotos?.forEach(photo => {
    const existing = photosByItemId.get(photo.catalogue_item_id) || []
    photosByItemId.set(photo.catalogue_item_id, [...existing, photo])
  })

  // Fetch all stock items with pagination
  let allStockItems = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Error fetching stock items:', error)
      return
    }

    if (data && data.length > 0) {
      allStockItems = allStockItems.concat(data)
      page++
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  // Build stock variation map
  const stockByDesign = new Map()
  allStockItems.forEach(stockItem => {
    const variations = generateVariations(stockItem.design_number)
    variations.forEach(variation => {
      const existing = stockByDesign.get(variation) || []
      stockByDesign.set(variation, [...existing, stockItem])
    })
  })

  // Analyze each catalogue item
  const itemsWithoutPhotos = []
  const itemsWithoutPrice = []
  const itemsWithoutStock = []
  const itemsMissingMultiple = []

  catalogueItems.forEach(item => {
    const hasPhotos = photosByItemId.has(item.id)
    const hasPrice = item.price && item.price > 0

    // Check stock using fuzzy matching
    const catalogueVariations = generateVariations(item.design_number)
    let hasStock = false
    for (const variation of catalogueVariations) {
      if (stockByDesign.has(variation)) {
        hasStock = true
        break
      }
    }

    const missing = []
    if (!hasPhotos) {
      missing.push('photos')
      itemsWithoutPhotos.push(item)
    }
    if (!hasPrice) {
      missing.push('price')
      itemsWithoutPrice.push(item)
    }
    if (!hasStock) {
      missing.push('stock')
      itemsWithoutStock.push(item)
    }

    if (missing.length > 1) {
      itemsMissingMultiple.push({
        item,
        missing
      })
    }
  })

  // Print report
  console.log('═══════════════════════════════════════════════════════════')
  console.log('                 COMPLETENESS SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`Items WITHOUT photos: ${itemsWithoutPhotos.length} (${((itemsWithoutPhotos.length / catalogueItems.length) * 100).toFixed(1)}%)`)
  console.log(`Items WITHOUT price:  ${itemsWithoutPrice.length} (${((itemsWithoutPrice.length / catalogueItems.length) * 100).toFixed(1)}%)`)
  console.log(`Items WITHOUT stock:  ${itemsWithoutStock.length} (${((itemsWithoutStock.length / catalogueItems.length) * 100).toFixed(1)}%)`)
  console.log(`Items missing 2+ things: ${itemsMissingMultiple.length}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  // Items without photos
  if (itemsWithoutPhotos.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ITEMS WITHOUT PHOTOS (${itemsWithoutPhotos.length} items)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    itemsWithoutPhotos.forEach(item => {
      console.log(`  ${item.design_number.padEnd(12)} - ₹${item.price || 'NO PRICE'} - ID: ${item.id}`)
    })
    console.log()
  }

  // Items without price
  if (itemsWithoutPrice.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ITEMS WITHOUT PRICE (${itemsWithoutPrice.length} items)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    itemsWithoutPrice.forEach(item => {
      const photoCount = photosByItemId.get(item.id)?.length || 0
      console.log(`  ${item.design_number.padEnd(12)} - ${photoCount} photo(s) - ID: ${item.id}`)
    })
    console.log()
  }

  // Items without stock
  if (itemsWithoutStock.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ITEMS WITHOUT STOCK (${itemsWithoutStock.length} items)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    itemsWithoutStock.forEach(item => {
      const photoCount = photosByItemId.get(item.id)?.length || 0
      console.log(`  ${item.design_number.padEnd(12)} - ₹${item.price || 'NO PRICE'} - ${photoCount} photo(s) - ID: ${item.id}`)
    })
    console.log()
  }

  // Items missing multiple things
  if (itemsMissingMultiple.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ITEMS MISSING MULTIPLE THINGS (${itemsMissingMultiple.length} items)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    itemsMissingMultiple.forEach(({ item, missing }) => {
      console.log(`  ${item.design_number.padEnd(12)} - Missing: ${missing.join(', ')} - ID: ${item.id}`)
    })
    console.log()
  }

  // Generate CSV-style output for easy copy-paste
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('CSV FORMAT (for spreadsheet)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Design Number,Has Photos,Has Price,Has Stock,Missing')
  catalogueItems.forEach(item => {
    const hasPhotos = photosByItemId.has(item.id) ? 'Yes' : 'No'
    const hasPrice = (item.price && item.price > 0) ? 'Yes' : 'No'

    const catalogueVariations = generateVariations(item.design_number)
    let hasStock = 'No'
    for (const variation of catalogueVariations) {
      if (stockByDesign.has(variation)) {
        hasStock = 'Yes'
        break
      }
    }

    const missing = []
    if (hasPhotos === 'No') missing.push('photos')
    if (hasPrice === 'No') missing.push('price')
    if (hasStock === 'No') missing.push('stock')

    if (missing.length > 0) {
      console.log(`${item.design_number},${hasPhotos},${hasPrice},${hasStock},"${missing.join(', ')}"`)
    }
  })
}

generateReport().catch(console.error)
