import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

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
          chapter:       { type: SchemaType.STRING, description: "Name of the Class 10 Science chapter" },
          title:         { type: SchemaType.STRING },
          options:       { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctOption: { type: SchemaType.INTEGER },
          hint:          { type: SchemaType.STRING },
          explanation:   { type: SchemaType.STRING },
        },
        required: ['chapter', 'title', 'options', 'correctOption', 'hint', 'explanation'],
      },
    },
  },
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('Logged in as teacher:', teacherId);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  console.log('Generating 50 hard questions for Class 10 Science...');
  const prompt = `Generate exactly 50 HARD-difficulty, high-quality, academic multiple-choice questions for Class 10 Science. Ensure they cover various chapters of the syllabus. For each question, provide the corresponding chapter name in the 'chapter' field. Each question must have exactly 4 options and indicate the correct option index (0 to 3). Include a helpful "hint" to guide the student, and a detailed "explanation" for why the answer is correct.`;

  try {
    const result = await model.generateContent(prompt);
    const questions = JSON.parse(result.response.text());
    console.log(`Generated ${questions.length} questions. Uploading...`);

    let ok = 0, fail = 0;
    for (const q of questions) {
      const { error } = await adminClient.from('questions').insert({
        created_by:    teacherId,
        title:         q.title,
        body:          '',
        subject:       'Science',
        class_grade:   '10',
        chapter:       q.chapter,
        points:        2,
        time_limit:    2,
        difficulty:    'hard',
        options:       q.options,
        correct_option: q.correctOption,
        description:   q.explanation,
        hint:          q.hint,
        image_path:    null,
        image_url:     null,
      });
      if (error) { 
        console.error(`Failed: ${q.title?.slice(0, 60)} - ${error.message}`); 
        fail++; 
      } else {
        ok++;
        console.log(`Inserted question ${ok}/50: ${q.title?.slice(0, 40)}...`);
      }
      await delay(100);
    }
    console.log(`Done! ${ok} added, ${fail} failed.`);
  } catch (err) {
    console.error(`Error generating questions:`, err.message);
  }
}

run();
