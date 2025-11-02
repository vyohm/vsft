const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'database/add_whatsapp_verification.sql'), 'utf8')

  console.log('Running migration...')
  console.log(sql)

  // Split by semicolons and run each statement
  const statements = sql.split(';').filter(s => s.trim())

  for (const statement of statements) {
    if (statement.trim()) {
      console.log('\nExecuting:', statement.trim().substring(0, 50) + '...')
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        console.error('Error:', error)
      } else {
        console.log('Success!')
      }
    }
  }
}

runMigration().then(() => {
  console.log('\nMigration completed!')
  process.exit(0)
}).catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
