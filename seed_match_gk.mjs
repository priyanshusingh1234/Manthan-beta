import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          matchPairs: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                left: { type: SchemaType.STRING },
                right: { type: SchemaType.STRING }
              },
              required: ["left", "right"]
            }
          }
        },
        required: ["title", "matchPairs"]
      }
    }
  }
});

async function run() {
  console.log('🔄 Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('✅ Logged in!\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  console.log('🧠 Generating 30 Match the Following General Knowledge (G.K) questions for All Classes...');
  const prompt = `Generate exactly 30 high-quality, fun, and educational "Match the Following" questions for General Knowledge (G.K). These should be suitable for students across all middle and high school classes.
Topics can include geography, science, history, pop culture, sports, inventions, and nature.
Each question should have a descriptive title (e.g., "Match the countries to their capital cities:") and an array of 4 to 5 perfect matching pairs. Ensure the 'left' corresponds exactly to the 'right' logically. Return them as JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const questions = JSON.parse(result.response.text());
    console.log(`✅ Successfully generated ${questions.length} questions. Uploading to database...`);

    let ok = 0, fail = 0;
    for (const q of questions) {
      const { error } = await adminClient.from('questions').insert({
        created_by: teacherId,
        title: q.title,
        body: '',
        subject: 'G.K',
        class_grade: 'All', // Sets it to all classes!
        chapter: 'General Mix',
        points: 4, // More points because matching is harder!
        time_limit: 3, // More time
        difficulty: 'moderate',
        question_type: 'match', // Tells the app to render the match UI
        match_pairs: q.matchPairs,
        options: null,
        correct_option: null,
        image_path: null,
        image_url: null,
      });

      if (error) {
        console.error(`❌ Failed to insert: ${q.title} - ${error.message}`);
        fail++;
      } else {
        ok++;
      }
    }

    console.log(`\n🎉 Upload complete: ${ok} added, ${fail} failed.`);
  } catch (error) {
    console.error(`\n❌ Failed to generate questions:`, error);
  }
}

run();
