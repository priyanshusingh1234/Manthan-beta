import supabaseAdmin from './lib/supabaseAdmin';

async function run() {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Error fetching profile:', error);
    } else {
        console.log('Columns in profiles:', Object.keys(data[0] || {}));
    }
}
run();
