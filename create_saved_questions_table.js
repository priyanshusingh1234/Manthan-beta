const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTable() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL; // check what's available
  // Fallback if we need to construct it
  let url = process.env.DATABASE_URL;
  if (!url) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];
    const password = process.env.SUPABASE_DB_PASSWORD; // Assuming it's in .env
    url = `postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
    console.log("No DATABASE_URL. Please run with correct DB URL");
  }

  console.log("Connecting to:", url ? "URL found" : "No URL");

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("Connected.");

  const query = `
    CREATE TABLE IF NOT EXISTS public.saved_questions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(user_id, question_id)
    );
    ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
    
    -- Drop policy if exists to avoid error
    DROP POLICY IF EXISTS "Users can manage their own saved questions" ON public.saved_questions;
    
    CREATE POLICY "Users can manage their own saved questions" ON public.saved_questions
      FOR ALL USING (auth.uid() = user_id);
  `;
  await client.query(query);
  console.log("Table and policy created successfully.");
  await client.end();
}

createTable().catch(console.error);
