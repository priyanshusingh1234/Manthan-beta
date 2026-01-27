#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// load env.local if present
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')
  env.split(/\n/).forEach(line => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function main(){
  try {
    const { data, error } = await supabase.from('teacher_applications').select('id', { count: 'exact', head: false }).limit(1)
    if (error) {
      console.error('Query error:', error.message || error)
      process.exit(1)
    }
    // fetch count via RPC is not set; instead try simple select count
    console.log('Table `teacher_applications` is accessible. Sample row:', data[0] || null)
    process.exit(0)
  } catch (err) {
    console.error('Unexpected:', err)
    process.exit(1)
  }
}

main()
