import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const QUESTIONS = [
  // The Best Christmas Present in the World
  {
    chapter: "The Best Christmas Present in the World",
    title: "What did the author find in the secret drawer of the roll-top desk?",
    options: ["A gold coin", "A small black tin box", "A bundle of old photographs", "An antique watch"],
    correct_option: 1,
    hint: "It was made of metal and contained something very personal.",
    description: "The author found a small black tin box sellotaped to the top, inside of which was a letter written by Jim Macpherson."
  },
  {
    chapter: "The Best Christmas Present in the World",
    title: "Who was the letter written by and to whom?",
    options: ["By the author to his mother", "By Hans Wolf to his wife", "By Jim Macpherson to his wife Connie", "By a German soldier to a British soldier"],
    correct_option: 2,
    hint: "It was written by a British officer to his beloved wife.",
    description: "The letter was written by Jim Macpherson, a captain in the British army, to his wife Connie."
  },
  {
    chapter: "The Best Christmas Present in the World",
    title: "What extraordinary event happened on Christmas morning during the war?",
    options: ["A massive bombardment", "The soldiers declared a ceasefire and celebrated Christmas together", "The British army retreated", "A new general arrived"],
    correct_option: 1,
    hint: "It was a rare moment of peace and humanity amidst the brutal war.",
    description: "The German and British soldiers stopped fighting, shared food and drinks, and even played a football match together in No Man's Land."
  },
  {
    chapter: "The Best Christmas Present in the World",
    title: "Why did the author go to Bridport, Dorset?",
    options: ["To buy another desk", "To return the letter to Mrs. Macpherson", "To visit a museum", "To meet an old friend"],
    correct_option: 1,
    hint: "He wanted to do the right thing after reading the personal contents.",
    description: "The author felt guilty for reading the letter and wanted to personally return it to Connie Macpherson at the address on the envelope."
  },
  {
    chapter: "The Best Christmas Present in the World",
    title: "Who did Connie Macpherson mistake the author for?",
    options: ["Her son", "Hans Wolf", "Her husband, Jim Macpherson", "The postman"],
    correct_option: 2,
    hint: "She had been waiting for this person's return for many years.",
    description: "Due to her old age and confused state of mind, she mistook the author for her husband Jim, believing he had finally returned home for Christmas."
  },

  // The Tsunami
  {
    chapter: "The Tsunami",
    title: "Who was Ignesious?",
    options: ["A fisherman from Sri Lanka", "The manager of a cooperative society in Katchall", "A tourist from England", "A rescue worker"],
    correct_option: 1,
    hint: "He lived in the Andaman and Nicobar Islands and lost his family.",
    description: "Ignesious was the manager of a cooperative society in Katchall. He tragically lost his wife, two children, father-in-law, and brother-in-law in the tsunami."
  },
  {
    chapter: "The Tsunami",
    title: "How did Sanjeev, the policeman, die?",
    options: ["He was hit by falling debris", "He drowned while trying to save the guesthouse cook's wife", "He was trapped in his house", "He died of shock"],
    correct_option: 1,
    hint: "He acted heroically but was swept away by the massive waves.",
    description: "Sanjeev managed to save himself and his family initially, but he jumped back into the water to rescue John's wife (the cook), and both were swept away."
  },
  {
    chapter: "The Tsunami",
    title: "What saved Tilly Smith and her family on the beach in Thailand?",
    options: ["A warning siren", "Tilly remembering her geography lesson about tsunamis", "A local fisherman's advice", "They left early by chance"],
    correct_option: 1,
    hint: "Her education played a crucial role in saving lives.",
    description: "Tilly recognized the signs of a tsunami (the sea swelling and bubbling) from a geography video she had watched in class, prompting her family and others to evacuate."
  },
  {
    chapter: "The Tsunami",
    title: "Why did animals survive the tsunami better than humans?",
    options: ["They can swim better", "They have a sixth sense or acute hearing that helps them feel the earth's vibration", "They were kept indoors", "The waves avoided them"],
    correct_option: 1,
    hint: "It relates to their heightened sensory perception.",
    description: "Many believe animals possess a sixth sense or acute hearing that allows them to sense an approaching disaster and move to safer, higher ground."
  },
  {
    chapter: "The Tsunami",
    title: "What happened to Almas Javed's family?",
    options: ["They all survived by holding onto a tree", "Only Almas survived by climbing onto a floating wooden log", "They were rescued by a helicopter", "They outran the waves in a car"],
    correct_option: 1,
    hint: "She was found later at a hospital in Kamorta.",
    description: "Almas's entire family was swept away. She survived by climbing onto a floating log of wood and fainted, later waking up in a hospital."
  }
];

async function run() {
  console.log('🔄 Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('✅ Logged in!\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  let ok = 0;
  let fail = 0;

  for (const q of QUESTIONS) {
    const { error } = await adminClient.from('questions').insert({
      created_by: teacherId,
      title: q.title,
      body: '',
      subject: 'English',
      class_grade: '8',
      chapter: q.chapter,
      points: 2,
      time_limit: 2,
      difficulty: 'moderate',
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.description,
      hint: q.hint,
      image_path: null,
      image_url: null,
    });

    if (error) {
      console.error(`❌ Failed to insert: ${q.title} - ${error.message}`);
      fail++;
    } else {
      console.log(`✔️ Inserted: ${q.title}`);
      ok++;
    }
  }

  console.log(`\n✅ Done! Inserted ${ok} questions, ${fail} failed.`);
}

run();
