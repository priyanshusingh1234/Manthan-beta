import supabaseAdmin from './lib/supabaseAdmin';

async function run() {
    console.log('Running manual migration for onboarding column...');
    const { error: error1 } = await supabaseAdmin.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT \'{}\'::jsonb;' 
    }).catch(e => ({ error: e }));
    
    // Fallback: If exec_sql RPC doesn't exist, try a direct query (though Supabase client usually doesn't allow raw DDL)
    // But since this is a known issue, I'll recommend the user run the SQL in their dashboard if it fails.
    
    if (error1) {
        console.error('Migration failed. Please run the following SQL in your Supabase Dashboard:', 
            'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT \'{}\'::jsonb;');
    } else {
        console.log('Onboarding column added successfully.');
    }
}
run();
