const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function run() {
  try {
    const { data: questions, error: fetchErr } = await supabase
      .from('questions')
      .select('id, image_url, explanation_image_url')
      .eq('chapter', 'Chemical Reactions and Equations')
      .eq('subject', 'Science');
      
    if (fetchErr) throw fetchErr;
    console.log(`Found ${questions.length} questions to fix.`);
    
    for (const q of questions) {
      const updates = {};
      
      // Fix main image
      if (q.image_url && q.image_url.startsWith('data:image/png;base64,')) {
        const base64Data = q.image_url.replace('data:image/png;base64,', '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `chem_main_${q.id}.png`;
        
        const { error: uploadErr } = await supabase.storage
          .from('question-images')
          .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
          
        if (uploadErr) console.error('Upload Error Main:', uploadErr);
        else updates.image_url = fileName;
      }
      
      // Fix explanation image
      if (q.explanation_image_url && q.explanation_image_url.startsWith('data:image/png;base64,')) {
        const base64Data = q.explanation_image_url.replace('data:image/png;base64,', '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `chem_exp_${q.id}.png`;
        
        const { error: uploadErr } = await supabase.storage
          .from('question-images')
          .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
          
        if (uploadErr) console.error('Upload Error Exp:', uploadErr);
        else updates.explanation_image_url = fileName;
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('questions').update(updates).eq('id', q.id);
        console.log(`Fixed images for question ${q.id}`);
      }
    }
    console.log('All done!');
  } catch (err) {
    console.error('Fatal:', err);
  }
}

run();
