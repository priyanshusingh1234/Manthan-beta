#!/usr/bin/env node
// Creates the `teacher-proofs` storage bucket in Supabase using the service role key.
// Usage: SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node create_teacher_bucket.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function main() {
  try {
    const bucketName = 'teacher-proofs'
    const { data, error } = await supabase.storage.createBucket(bucketName, { public: true })
    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`Bucket '${bucketName}' already exists.`)
        process.exit(0)
      }
      console.error('Error creating bucket:', error)
      process.exit(1)
    }
    console.log(`Bucket '${bucketName}' created:`)
    console.log(data)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

main()
