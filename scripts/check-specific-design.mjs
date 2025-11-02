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

async function checkDesign() {
  console.log('Checking for SFT1610 in stock table...\n')

  // Check exact match
  const { data: exact, error: exactError } = await supabase
    .from('stock_items')
    .select('*')
    .eq('design_number', 'SFT1610')

  console.log('Exact match (SFT1610):')
  console.log(`Found ${exact?.length || 0} items`)
  if (exact && exact.length > 0) {
    exact.forEach(item => {
      console.log(`  ID: ${item.id}, Size: ${item.size}, Color: ${item.color}, Qty: ${item.quantity}`)
    })
  }

  // Check case-insensitive match
  const { data: caseInsensitive } = await supabase
    .from('stock_items')
    .select('*')
    .ilike('design_number', 'sft1610')

  console.log('\nCase-insensitive match (sft1610):')
  console.log(`Found ${caseInsensitive?.length || 0} items`)
  if (caseInsensitive && caseInsensitive.length > 0) {
    caseInsensitive.forEach(item => {
      console.log(`  ID: ${item.id}, Design: ${item.design_number}, Size: ${item.size}, Color: ${item.color}, Qty: ${item.quantity}`)
    })
  }

  // Check with wildcard
  const { data: wildcard } = await supabase
    .from('stock_items')
    .select('*')
    .ilike('design_number', '%1610%')

  console.log('\nWildcard match (%1610%):')
  console.log(`Found ${wildcard?.length || 0} items`)
  if (wildcard && wildcard.length > 0) {
    wildcard.forEach(item => {
      console.log(`  ID: ${item.id}, Design: ${item.design_number}, Size: ${item.size}, Color: ${item.color}, Qty: ${item.quantity}`)
    })
  }

  // Check all designs starting with SFT16
  const { data: sft16 } = await supabase
    .from('stock_items')
    .select('design_number')
    .ilike('design_number', 'SFT16%')
    .order('design_number')

  console.log('\nAll designs starting with SFT16:')
  if (sft16 && sft16.length > 0) {
    const uniqueDesigns = [...new Set(sft16.map(item => item.design_number))].sort()
    console.log(`Found ${uniqueDesigns.length} unique designs:`)
    uniqueDesigns.forEach(design => {
      console.log(`  ${design}`)
    })
  } else {
    console.log('No designs found starting with SFT16')
  }

  // Check if SFT1610 exists in catalogue
  const { data: catalogue } = await supabase
    .from('catalogue_items')
    .select('*')
    .eq('design_number', 'SFT1610')

  console.log('\nSFT1610 in catalogue:')
  if (catalogue && catalogue.length > 0) {
    console.log(`  ✓ Found in catalogue (ID: ${catalogue[0].id})`)
  } else {
    console.log('  ✗ Not found in catalogue')
  }
}

checkDesign().catch(console.error)
