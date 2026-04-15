import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivkrupsksxibaibmiibk.supabase.co';
// Need service role key to update questions unless RLS allows it
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyDPJqpIRMVYwaHZkVnGcbyRLiuYS8iprSw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function determineChapterWithAI(title, subject, body, classGrade) {
  const prompt = `You are an expert CBSE teacher for class ${classGrade || '10'} subject ${subject}.
I will give you a question, and you must tell me exactly which chapter it belongs to based on the standard syllabus.
Return ONLY the chapter name. Do not include quotes, extra spaces, or explanations. Examples: "Light Reflection and Refraction", "A Question of Trust", "Quadratic Equations".

Question Title: ${title}
${body ? 'Question Details: ' + body : ''}

Chapter Name:`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  return rawText.trim().replace(/^"|"$/g, '');
}

async function run() {
  console.log("Checking DB for questions without a chapter...");

  // Select questions where chapter is either null or doesn't exist yet, excluding G.K
  const { data: questions, error: fetchErr } = await supabase
    .from('questions')
    .select('id, title, body, subject, class_grade')
    .neq('subject', 'G.K')
    .neq('subject', 'GK')
    .is('chapter', null);

  if (fetchErr) {
    if (fetchErr.code === '42703' && fetchErr.message.includes('chapter')) {
      console.error("\n❌ ERROR: The 'chapter' column does not exist yet!");
      console.error("Please go to your Supabase SQL Editor and run this query:");
      console.error("ALTER TABLE questions ADD COLUMN chapter TEXT;\n");
      return;
    }
    console.error("Failed to fetch questions:", fetchErr);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log("No questions found that need chapter categorization!");
    return;
  }

  console.log(`Found ${questions.length} questions to categorize. Starting AI categorization...`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      console.log(`[${i+1}/${questions.length}] Processing: "${q.title.substring(0, 40)}..."`);
      
      let chapter = await determineChapterWithAI(q.title, q.subject, q.body, q.class_grade);
      
      if (chapter && chapter.length > 0) {
        // Update database
        const { error: updateErr } = await supabase
          .from('questions')
          .update({ chapter: chapter })
          .eq('id', q.id);
          
        if (updateErr) {
          console.error(`  ⚠️ Failed to save chapter '${chapter}' to DB:`, updateErr.message);
        } else {
          console.log(`  ✅ Assigned Chapter: ${chapter}`);
        }
      }
      
      // Sleep slightly to avoid hitting Gemini rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`  ⚠️ Error organizing this question:`, e.message);
    }
  }
  console.log("Done categorizing questions!");
}

run();
