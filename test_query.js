const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const normalizedClass = '10';
    const { data, error } = await supabase
        .from('gauntlets')
        .select('*')
        .eq('is_active', true)
        .or(`class_grade.eq.${normalizedClass},class_grade.ilike.${normalizedClass}%,class_grade.ilike.All,class_grade.ilike.Any`);
    
    console.log('Error:', error);
    console.log('Gauntlets matched:', data?.length);
    if (data?.length > 0) {
        console.log('First:', data[0].title);
    }
}
test();
