const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function fix() {
    console.log("Fixing database metadata...");
    
    // Fix class_grade for all 'Class 10' -> '10'
    const { data: updateClass, error: err1 } = await supabase
        .from('questions')
        .update({ class_grade: '10' })
        .eq('class_grade', 'Class 10');
        
    console.log("Fixed class_grade", err1);

    // Make sure Samas questions are assigned to 'Hindi' and chapter 'Samas'
    // They currently might have chapter null or subject 'Hindi Gr'
    // The easiest way to find them is to search title containing 'समास' or 'विग्रह'
    const { data: samasQs, error: err2 } = await supabase
        .from('questions')
        .select('id, title, subject')
        .or('title.ilike.%समास%,title.ilike.%विग्रह%');
        
    if (samasQs && samasQs.length > 0) {
        const samasIds = samasQs.map(q => q.id);
        const { error: err3 } = await supabase
            .from('questions')
            .update({ subject: 'Hindi', chapter: 'Samas' })
            .in('id', samasIds);
        console.log(`Fixed subject and chapter for ${samasIds.length} Samas questions.`, err3);
    }
}
fix();
