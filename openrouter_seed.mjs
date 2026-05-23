import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SYLLABUS = [
  {
    class_grade: '8',
    subject: 'Science',
    chapters: [
      'Crop Production and Management',
      'Microorganisms: Friend and Foe',
      'Coal and Petroleum',
      'Combustion and Flame',
      'Conservation of Plants and Animals',
      'Reproduction in Animals',
      'Reaching the Age of Adolescence',
      'Force and Pressure',
      'Friction',
      'Sound',
      'Chemical Effects of Electric Current',
      'Some Natural Phenomena',
      'Light'
    ],
  },
];

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

async function generateQuestionsFromOpenRouter(chapterName, classGrade, subject, modelId) {
  const prompt = `Generate 15 high-quality, academic multiple-choice questions for Class ${classGrade} ${subject}, specifically focusing on the chapter "${chapterName}".
Each question must have exactly 4 options and indicate the correct option index (0 to 3). Include a helpful "hint" to guide the student, and a detailed "explanation" for why the answer is correct. Make the questions varied in difficulty (easy, moderate, hard) and ensure they are accurate and relevant to the NCERT curriculum.

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
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

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
  console.log(' 🚀 Dheeyudha — Bulk AI Question Seeder (OpenRouter)');
  console.log('=======================================================\n');

  console.log('🔄 Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('✅ Logged in!\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Fetch all existing combos to deduplicate
  const { data: existing } = await adminClient
    .from('questions')
    .select('chapter, class_grade, subject')
    .eq('created_by', teacherId)
    .eq('class_grade', '8');

  const seededKeys = new Set(
    (existing || []).map((r) => `${r.class_grade}|${r.subject}|${r.chapter}`)
  );
  console.log(`ℹ️  Already seeded chapters: ${seededKeys.size > 0 ? [...seededKeys].join(', ') : 'none'}\n`);

  const modelId = await getFreeModelId();

  let totalOk = 0, totalSkip = 0, totalFail = 0;

  for (const block of SYLLABUS) {
    console.log(`\n📘 Class ${block.class_grade} — ${block.subject}`);
    console.log('─'.repeat(50));

    for (let i = 0; i < block.chapters.length; i++) {
      const chapterName = block.chapters[i];
      const key = `${block.class_grade}|${block.subject}|${chapterName}`;

      if (seededKeys.has(key)) {
        console.log(`⏭️  [${i + 1}/${block.chapters.length}] SKIPPED (already seeded): "${chapterName}"`);
        totalSkip++;
        continue;
      }

      console.log(`\n🧠 [${i + 1}/${block.chapters.length}] Generating 15 questions for: "${chapterName}"...`);

      let success = false;
      let retries = 0;
      while (!success && retries < 3) {
        try {
          const questions = await generateQuestionsFromOpenRouter(chapterName, block.class_grade, block.subject, modelId);
          console.log(`   ✅ Generated ${questions.length} questions. Uploading...`);

          let ok = 0, fail = 0;
          for (const q of questions) {
            const { error } = await adminClient.from('questions').insert({
              created_by:    teacherId,
              title:         q.title,
              body:          '',
              subject:       block.subject,
              class_grade:   block.class_grade,
              chapter:       chapterName,
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

          console.log(`   🎉 "${chapterName}": ${ok} added, ${fail} failed.`);
          totalOk   += ok;
          totalFail += fail;

          seededKeys.add(key);
          success = true;

        } catch (err) {
          console.error(`   ❌ Error generating "${chapterName}":`, err.message);
          retries++;
          if (retries < 3) {
             console.log(`   ⏳ Retrying in 10s... (Attempt ${retries+1}/3)`);
             await delay(10000);
          } else {
             totalFail++;
          }
        }
      }

      // Small delay between chapters to be nice to the API
      if (i < block.chapters.length - 1) {
        console.log('   ⏳ Waiting 5s before next chapter...');
        await delay(5000);
      }
    }
  }

  console.log('\n=======================================================');
  console.log(` ✅ All done! ${totalOk} added | ${totalSkip} skipped | ${totalFail} failed`);
  console.log('=======================================================\n');
}

run();
