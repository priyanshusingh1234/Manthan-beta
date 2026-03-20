const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkSchema() {
    console.log("Checking wars schema...");
    const { data, error } = await supabase.from('wars').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log("Wars", Object.keys(data[0] || {}));
    }
}
checkSchema();
