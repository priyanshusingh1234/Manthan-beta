require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const teacherEmail = 'kpk22128@gmail.com';

async function updateOwner() {
    console.log(`Searching for teacher with email: ${teacherEmail}`);
    
    // 1. Get Teacher UUID by Email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const teacher = userData.users.find(u => u.email === teacherEmail);

    if (!teacher) {
        console.error(`Teacher with email ${teacherEmail} not found!`);
        return;
    }

    const teacherId = teacher.id;
    console.log(`Found Teacher ID: ${teacherId}`);

    // 2. Update Questions Table
    const { data: updatedQs, error: qError } = await supabase
        .from('questions')
        .update({ created_by: teacherId })
        .eq('subject', 'English Literature');

    if (qError) {
        console.error('Error updating questions owner:', qError);
    } else {
        console.log(`Updated owner for English Literature questions.`);
    }

    // 3. Update Teacher Solutions Table — we need the question IDs first
    const { data: qRows } = await supabase
        .from('questions')
        .select('id')
        .eq('subject', 'English Literature');
    
    const qIds = qRows.map(r => r.id);

    if (qIds.length > 0) {
        const { error: solError } = await supabase
            .from('teacher_solutions')
            .update({ teacher_id: teacherId })
            .in('question_id', qIds);

        if (solError) {
            console.error('Error updating solutions owner:', solError);
        } else {
            console.log(`Updated owner for teacher solutions.`);
        }
    }

    console.log('Ownership update complete.');
}

updateOwner().catch(console.error);
