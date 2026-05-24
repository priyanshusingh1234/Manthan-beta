import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';
const OPENROUTER_API_KEY = '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';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function getFreeModelId() {
  console.log("Fetching available free models from OpenRouter...");
  const res = await fetch("https://openrouter.ai/api/v1/models");
  const data = await res.json();
  const freeModels = data.data.filter(m => m.pricing.prompt === "0" && m.pricing.completion === "0");
  if (freeModels.length === 0) throw new Error("No free models found on OpenRouter!");
  
  console.log(`Using: baidu/cobuddy:free`);
  return 'baidu/cobuddy:free';
}

async function generateQuestionsFromOpenRouter(modelId) {
  const prompt = `Generate exactly 30 high-quality multiple-choice questions for General Knowledge on the topic of "Cricket".
Each question must have exactly 4 options and indicate the correct option index (0 to 3). Include a helpful "hint" to guide the student, and a detailed "explanation" for why the answer is correct. Ensure they are accurate and cover various aspects of Cricket (World Cups, records, rules, famous players).

CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON array. Do not include any conversational text, do not include markdown blocks like \`\`\`json. The output should start with [ and end with ].
Format of array items:
{
  "title": "string",
  "options": ["string", "string", "string", "string"],
  "correctOption": integer,
  "hint": "string",
  "explanation": "string"
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for 30 questions

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId, 
      messages: [{ role: "user", content: prompt }]
    }),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  let text = data.choices[0].message.content.trim();
  
  // Strip markdown if the AI stubbornly includes it
  if (text.startsWith("```json")) {
    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(text);
}

async function run() {
  console.log('\n=======================================================');
  console.log(' 🏏 Dheeyudha — Seeding 30 Cricket Trivia Questions');
  console.log('=======================================================\n');

  console.log('🔄 Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('✅ Logged in!\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  const modelId = await getFreeModelId();

  let totalOk = 0, totalFail = 0;
  
  console.log(`\n🧠 Generating 30 questions for: "Cricket GK"...`);

  let success = false;
  let retries = 0;
  while (!success && retries < 3) {
    try {
      const questions = await generateQuestionsFromOpenRouter(modelId);
      console.log(`   ✅ Generated ${questions.length} questions. Uploading...`);

      let ok = 0, fail = 0;
      for (const q of questions) {
        const { error } = await adminClient.from('questions').insert({
          created_by:    teacherId,
          title:         q.title,
          body:          '',
          subject:       'GK',
          class_grade:   'All',
          chapter:       'Cricket Trivia',
          points:        2,
          time_limit:    2,
          difficulty:    'moderate',
          options:       q.options,
          correct_option: q.correctOption,
          explanation:   q.explanation,
          hint:          q.hint,
          image_path:    null,
          image_url:     null,
        });
        if (error) { console.error(`   ❌ Failed: ${q.title?.slice(0, 60)} — ${error.message}`); fail++; }
        else {
          ok++;
        }
      }

      console.log(`   🎉 "Cricket Trivia": ${ok} added, ${fail} failed.`);
      totalOk   += ok;
      totalFail += fail;

      success = true;

    } catch (err) {
      console.error(`   ❌ Error generating questions:`, err.message);
      retries++;
      if (retries < 3) {
         console.log(`   ⏳ Retrying in 10s... (Attempt ${retries+1}/3)`);
         await delay(10000);
      } else {
         totalFail++;
      }
    }
  }

  console.log('\n=======================================================');
  console.log(` ✅ All done! ${totalOk} added | ${totalFail} failed`);
  console.log('=======================================================\n');
}

run();
