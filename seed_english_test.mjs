import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const TEST = {
  title: "Class 10 English Formative Assessment",
  description: "Formative Assessment on Tenses, Literature, and Writing Skills"
};

const QUESTIONS = [
  {
    type: 'mcq',
    question_text: 'The sentence, "I have a pen" is in which tense?',
    options: ['Present perfect', 'Present perfect Continuous', 'Simple present', 'Present imperfect'],
    correct_answer: 'Simple present',
    marks: 1,
    order_index: 1
  },
  {
    type: 'mcq',
    question_text: 'Who is the writer of the poem, "Fire and Ice"?',
    options: ['William Blake', 'Robert Carlos', 'Robert Frost', 'Oscar Wilde'],
    correct_answer: 'Robert Frost',
    marks: 1,
    order_index: 2
  },
  {
    type: 'written',
    question_text: 'Change the sentence in present perfect "I am doing my homework"',
    marks: 2,
    order_index: 3
  },
  {
    type: 'written',
    question_text: 'Explain briefly the story, "A letter to god".',
    marks: 5,
    order_index: 4
  },
  {
    type: 'written',
    question_text: 'What has been compared to fire? According to you, how will the world end?',
    marks: 5,
    order_index: 5
  },
  {
    type: 'written',
    question_text: "Lencho received 70 pesos from the post office employees. What could've happened if no one would've helped him?",
    marks: 5,
    order_index: 6
  },
  {
    type: 'written',
    question_text: 'Besides fire and Ice, do you think, there may be other reasons which will end the world?',
    marks: 5,
    order_index: 7
  },
  {
    type: 'written',
    question_text: 'Write an essay on the topic "Who you are" in 150-200 words.',
    marks: 10,
    order_index: 8
  }
];

async function seed() {
  try {
    // 1. Insert Test
    const { data: testData, error: testErr } = await supabaseAdmin
      .from('tests')
      .insert(TEST)
      .select('id')
      .single();

    if (testErr) throw testErr;
    
    const testId = testData.id;
    console.log("Created Test with ID:", testId);

    // 2. Insert Questions
    const qsToInsert = QUESTIONS.map(q => ({
      ...q,
      test_id: testId
    }));

    const { error: qErr } = await supabaseAdmin
      .from('test_questions')
      .insert(qsToInsert);

    if (qErr) throw qErr;

    console.log(`Successfully seeded ${QUESTIONS.length} questions for the English Test!`);
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

seed();
