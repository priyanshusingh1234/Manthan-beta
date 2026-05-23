import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import readline from 'readline/promises';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// ─────────────────────────────────────────────────────────────
// 📚 SYLLABUS — Add or edit chapters here anytime
// ─────────────────────────────────────────────────────────────
const SYLLABUS = [
  {
    class_grade: '8',
    subject: 'English',
    chapters: [
      'The Best Christmas Present in the World',
      'The Tsunami',
      'Glimpses of the Past',
      'Bepin Choudhury\'s Lapse of Memory',
      'The Summit Within',
      'This is Jody\'s Fawn',
      'A Visit to Cambridge',
      'A Short Monsoon Diary',
      'The Great Stone Face - I',
      'The Great Stone Face - II'
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Supabase & AI config
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL    = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title:         { type: SchemaType.STRING },
          options:       { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctOption: { type: SchemaType.INTEGER },
          hint:          { type: SchemaType.STRING },
          explanation:   { type: SchemaType.STRING },
        },
        required: ['title', 'options', 'correctOption', 'hint', 'explanation'],
      },
    },
  },
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function run() {
  console.log('\n=======================================================');
  console.log(' 🚀 Dheeyudha — Bulk AI Question Seeder');
  console.log('=======================================================\n');

  // Login
  console.log('🔄 Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('✅ Logged in!\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Fetch all existing (chapter, class_grade, subject) combos to deduplicate
  const { data: existing } = await adminClient
    .from('questions')
    .select('chapter, class_grade, subject')
    .eq('created_by', teacherId);

  // Build a Set of keys like "10|History|Nationalism in India"
  const seededKeys = new Set(
    (existing || []).map((r) => `${r.class_grade}|${r.subject}|${r.chapter}`)
  );
  console.log(`ℹ️  Already seeded chapters: ${seededKeys.size > 0 ? [...seededKeys].join(', ') : 'none'}\n`);

  let totalOk = 0, totalSkip = 0, totalFail = 0;

  for (const block of SYLLABUS) {
    console.log(`\n📘 Class ${block.class_grade} — ${block.subject}`);
    console.log('─'.repeat(50));

    for (let i = 0; i < block.chapters.length; i++) {
      const chapterName = block.chapters[i];
      const key = `${block.class_grade}|${block.subject}|${chapterName}`;

      // ── Deduplication check ──
      if (seededKeys.has(key)) {
        console.log(`⏭️  [${i + 1}/${block.chapters.length}] SKIPPED (already seeded): "${chapterName}"`);
        totalSkip++;
        continue;
      }

      console.log(`\n🧠 [${i + 1}/${block.chapters.length}] Generating 50 questions for: "${chapterName}"...`);

      const prompt = `Generate 50 high-quality, academic multiple-choice questions for Class ${block.class_grade} ${block.subject}, specifically focusing on the chapter "${chapterName}". Each question must have exactly 4 options and indicate the correct option index (0 to 3). Include a helpful "hint" to guide the student, and a detailed "explanation" for why the answer is correct. Make the questions varied in difficulty (easy, moderate, hard) and ensure they are accurate and relevant to the NCERT curriculum.`;

      let success = false;
      let retries = 0;
      while (!success && retries < 3) {
        try {
          const result = await model.generateContent(prompt);
          const questions = JSON.parse(result.response.text());
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
              description:   q.explanation,
              hint:          q.hint,
              image_path:    null,
              image_url:     null,
            });
            if (error) { console.error(`   ❌ Failed: ${q.title?.slice(0, 60)} — ${error.message}`); fail++; }
            else {
              ok++;
              console.log(`     ✔️ Inserted question ${ok}/50`);
            }
            // Add 1 second gap after each question
            await delay(1000);
          }

          console.log(`   🎉 "${chapterName}": ${ok} added, ${fail} failed.`);
          totalOk   += ok;
          totalFail += fail;

          // Mark as done so if re-run it won't duplicate
          seededKeys.add(key);
          success = true;

        } catch (err) {
          console.error(`   ❌ Error generating "${chapterName}":`, err.message);
          if (err.message.includes('429')) {
             console.log('   ⏳ Hit rate limit. Waiting 60s before retry...');
             await delay(60000);
             retries++;
          } else {
             totalFail++;
             break;
          }
        }
      }

      // ── Rate-limit guard (free plan: 15 req/min) ──
      if (i < block.chapters.length - 1) {
        console.log('   ⏳ Waiting 8s before next chapter (free-tier rate limit)...');
        await delay(8000);
      }
    }
  }

  console.log('\n=======================================================');
  console.log(` ✅ All done! ${totalOk} added | ${totalSkip} skipped | ${totalFail} failed`);
  console.log('=======================================================\n');
}

run();
