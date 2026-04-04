import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkStorage() {
    const { default: supabaseAdmin } = await import('./lib/supabaseAdmin.js');
    const { data, error } = await supabaseAdmin.storage
        .from('written-answers')
        .list('ai-reviews');
    console.log('Error:', error);
    console.log('Files:', data);
}
checkStorage();
