const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function createPuzzleTable() {
  // Create the puzzle_attempts table via raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS puzzle_attempts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        puzzle_id text NOT NULL,
        user_answer integer NOT NULL CHECK (user_answer >= 1 AND user_answer <= 99),
        is_correct boolean NOT NULL DEFAULT false,
        submitted_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, puzzle_id)
      );
      CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_user ON puzzle_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_puzzle ON puzzle_attempts(puzzle_id);
    `
  });

  if (error) {
    console.error('RPC failed, trying direct insert test:', error.message);
    // Try inserting a dummy row to test if table already exists
    const { error: testError } = await supabase
      .from('puzzle_attempts')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Table does not exist. Please create it manually in Supabase dashboard with this SQL:');
      console.log(`
CREATE TABLE puzzle_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzle_id text NOT NULL,
  user_answer integer NOT NULL CHECK (user_answer >= 1 AND user_answer <= 99),
  is_correct boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);
CREATE INDEX idx_puzzle_attempts_user ON puzzle_attempts(user_id);
CREATE INDEX idx_puzzle_attempts_puzzle ON puzzle_attempts(puzzle_id);
      `);
    } else {
      console.log('✅ Table puzzle_attempts already exists!');
    }
  } else {
    console.log('✅ Table puzzle_attempts created successfully!');
  }
}

createPuzzleTable();
