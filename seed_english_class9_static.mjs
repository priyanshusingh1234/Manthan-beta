import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const questions = [
  // ── The Road Not Taken ────────────────────────
  { subject: 'English', chapter: 'The Road Not Taken', title: 'What does the diverged road signify in the poem?', options: ['Choices in life', 'Two different paths in a forest', 'A confusing situation', 'Traveling'], correctOption: 0 },
  { subject: 'English', chapter: 'The Road Not Taken', title: 'Why did the poet choose the second road?', options: ['It was less traveled by', 'It was shorter', 'It was more beautiful', 'It was paved'], correctOption: 0 },
  { subject: 'English', chapter: 'The Road Not Taken', title: 'What is the poet’s tone in the last stanza?', options: ['Joyful', 'Regretful or reflective', 'Angry', 'Indifferent'], correctOption: 1 },
  { subject: 'English', chapter: 'The Road Not Taken', title: 'What does "yellow wood" mean?', options: ['Spring season', 'Autumn season', 'Winter season', 'Summer season'], correctOption: 1 },
  { subject: 'English', chapter: 'The Road Not Taken', title: 'Did the poet think he would ever come back to take the first road?', options: ['Yes, definitely', 'He doubted if he should ever come back', 'He planned to return the next day', 'He never thought about it'], correctOption: 1 },
  
  // ── The Sound of Music ────────────────────────
  { subject: 'English', chapter: 'The Sound of Music', title: 'How old was Evelyn when she went to the Royal Academy of Music?', options: ['15', '16', '17', '18'], correctOption: 2 },
  { subject: 'English', chapter: 'The Sound of Music', title: 'Who helped Evelyn to continue with music?', options: ['Her mother', 'Ron Forbes', 'Her teacher', 'Her father'], correctOption: 1 },
  { subject: 'English', chapter: 'The Sound of Music', title: 'What did Ron Forbes ask Evelyn to do?', options: ['Listen through her ears', 'Sense the sound some other way', 'Stop playing music', 'Play the piano'], correctOption: 1 },
  { subject: 'English', chapter: 'The Sound of Music', title: 'Bismillah Khan played the shehnai on 15 August 1947 from the:', options: ['Taj Mahal', 'Red Fort', 'India Gate', 'Gateway of India'], correctOption: 1 },
  { subject: 'English', chapter: 'The Sound of Music', title: 'Which highest civilian award was conferred on Bismillah Khan?', options: ['Padma Shri', 'Padma Bhushan', 'Padma Vibhushan', 'Bharat Ratna'], correctOption: 3 },

  // ── Wind ────────────────────────
  { subject: 'English', chapter: 'Wind', title: 'What does the wind do to the weak fires?', options: ['Blows them out', 'Makes them roar', 'Lets them burn', 'Turns them to ash'], correctOption: 0 },
  { subject: 'English', chapter: 'Wind', title: 'What is the poet’s advice to the people?', options: ['To hide from the wind', 'To build strong homes and hearts', 'To cry', 'To pray to the wind god'], correctOption: 1 },
  { subject: 'English', chapter: 'Wind', title: 'Who is the poet of the poem "Wind"?', options: ['Subramania Bharati', 'Robert Frost', 'Coates Kinney', 'William Wordsworth'], correctOption: 0 },
  { subject: 'English', chapter: 'Wind', title: 'What does the wind god do?', options: ['Winnows and crushes them all', 'Pity them', 'Help them grow', 'Protect them'], correctOption: 0 },
  { subject: 'English', chapter: 'Wind', title: 'What is the effect of wind on strong fires?', options: ['Blows them out', 'Makes them roar and flourish', 'Has no effect', 'Slows them down'], correctOption: 1 },

  // ── The Little Girl ────────────────────────
  { subject: 'English', chapter: 'The Little Girl', title: 'What did Kezia make for her father’s birthday?', options: ['A cake', 'A pin-cushion', 'A painting', 'A card'], correctOption: 1 },
  { subject: 'English', chapter: 'The Little Girl', title: 'Why was Kezia afraid of her father?', options: ['He was very strict and big', 'He used to beat her daily', 'He never spoke to her', 'He looked like a ghost'], correctOption: 0 },
  { subject: 'English', chapter: 'The Little Girl', title: 'What did Kezia tear up to stuff the pin-cushion?', options: ['Old newspapers', 'Her mother’s dress', 'Her father’s important speech', 'Blank paper'], correctOption: 2 },
  { subject: 'English', chapter: 'The Little Girl', title: 'Who was the MacDonald family?', options: ['Kezia’s relatives', 'Next-door neighbors who played with their kids', 'Strict teachers', 'Shopkeepers'], correctOption: 1 },
  { subject: 'English', chapter: 'The Little Girl', title: 'When did Kezia realize her father was actually caring?', options: ['When he gave her a gift', 'When she had a nightmare and he comforted her', 'When he played with her', 'When her mother told her'], correctOption: 1 },

  // ── A Truly Beautiful Mind ────────────────────────
  { subject: 'English', chapter: 'A Truly Beautiful Mind', title: 'What did Einstein call his desk drawer at the patent office?', options: ['Bureau of theoretical physics', 'Desk of secrets', 'Drawer of science', 'Box of ideas'], correctOption: 0 },
  { subject: 'English', chapter: 'A Truly Beautiful Mind', title: 'What world-famous paper did Einstein publish in 1905?', options: ['General Theory of Relativity', 'Special Theory of Relativity', 'Quantum Mechanics', 'String Theory'], correctOption: 1 },
  { subject: 'English', chapter: 'A Truly Beautiful Mind', title: 'Who did Einstein marry in 1903?', options: ['Marie Curie', 'Mileva Maric', 'His cousin Elsa', 'Helen Dukas'], correctOption: 1 },
  { subject: 'English', chapter: 'A Truly Beautiful Mind', title: 'Why did Einstein leave Germany?', options: ['To travel', 'Because the Nazis came to power', 'For a better job', 'He didn’t like the climate'], correctOption: 1 },
  { subject: 'English', chapter: 'A Truly Beautiful Mind', title: 'Einstein was deeply shaken by the extent of destruction caused by:', options: ['World War I', 'The atomic bomb dropped on Hiroshima and Nagasaki', 'The Holocaust', 'World War II'], correctOption: 1 },

  // ── The Legend of the Northland ────────────────────────
  { subject: 'English', chapter: 'The Legend of the Northland', title: 'Who came to the old woman’s door in the legend?', options: ['A beggar', 'Saint Peter', 'An angel', 'A king'], correctOption: 1 },
  { subject: 'English', chapter: 'The Legend of the Northland', title: 'What did Saint Peter turn the old woman into?', options: ['A tree', 'A woodpecker', 'A stone', 'A crow'], correctOption: 1 },
  { subject: 'English', chapter: 'The Legend of the Northland', title: 'Why was the old woman punished?', options: ['For being greedy and refusing to give a small cake', 'For being a witch', 'For being rude to the king', 'For stealing'], correctOption: 0 },
  { subject: 'English', chapter: 'The Legend of the Northland', title: 'Where does the legend take place?', options: ['In a desert', 'In the Northland', 'In a forest', 'In a big city'], correctOption: 1 },
  { subject: 'English', chapter: 'The Legend of the Northland', title: 'What did the woman bake for Saint Peter?', options: ['A huge loaf of bread', 'A cake that she kept making smaller', 'A pie', 'Cookies'], correctOption: 1 },

  // ── My Childhood ────────────────────────
  { subject: 'English', chapter: 'My Childhood', title: 'Who is the author of "My Childhood"?', options: ['A.P.J. Abdul Kalam', 'Mahatma Gandhi', 'Jawaharlal Nehru', 'Rabindranath Tagore'], correctOption: 0 },
  { subject: 'English', chapter: 'My Childhood', title: 'What did Kalam’s father do for a living?', options: ['He was a teacher', 'He built boats', 'He was a doctor', 'He was a shopkeeper'], correctOption: 1 },
  { subject: 'English', chapter: 'My Childhood', title: 'Who was Kalam’s close friend?', options: ['Ramanadha Sastry', 'Shiva', 'Arvind', 'Prakash'], correctOption: 0 },
  { subject: 'English', chapter: 'My Childhood', title: 'What did the new teacher in the fifth standard do?', options: ['He praised Kalam', 'He asked Kalam to sit on the back bench', 'He made Kalam the monitor', 'He gave Kalam a prize'], correctOption: 1 },
  { subject: 'English', chapter: 'My Childhood', title: 'How did Kalam earn his first wages?', options: ['By selling tamarind seeds', 'By helping his cousin catch newspapers thrown from the train', 'By teaching', 'By selling boats'], correctOption: 1 },

  // ── No Men Are Foreign ────────────────────────
  { subject: 'English', chapter: 'No Men Are Foreign', title: 'What is the central theme of "No Men Are Foreign"?', options: ['Universal brotherhood', 'War and peace', 'Nature', 'Love'], correctOption: 0 },
  { subject: 'English', chapter: 'No Men Are Foreign', title: 'According to the poet, what are we doing when we hate our brothers?', options: ['We are protecting ourselves', 'We are betraying and condemning ourselves', 'We are being patriotic', 'We are saving our country'], correctOption: 1 },
  { subject: 'English', chapter: 'No Men Are Foreign', title: 'What does the poet mean by "uniforms"?', options: ['School clothes', 'Military uniforms representing different countries', 'Work clothes', 'Costumes'], correctOption: 1 },
  { subject: 'English', chapter: 'No Men Are Foreign', title: 'How do we all breathe, walk, and lie?', options: ['On different planets', 'On the same earth', 'In the air', 'In the water'], correctOption: 1 },
  { subject: 'English', chapter: 'No Men Are Foreign', title: 'What defiles the human earth?', options: ['Hells of fire and dust (war)', 'Pollution', 'Building cities', 'Farming'], correctOption: 0 },

  // ── The Beggar ────────────────────────
  { subject: 'English', chapter: 'The Beggar', title: 'What was the beggar’s name?', options: ['Lushkoff', 'Sergei', 'Olga', 'Ivan'], correctOption: 0 },
  { subject: 'English', chapter: 'The Beggar', title: 'Who finally changed Lushkoff’s life?', options: ['Sergei', 'Olga the cook', 'The police', 'A school teacher'], correctOption: 1 },
  { subject: 'English', chapter: 'The Beggar', title: 'What job did Sergei offer to Lushkoff?', options: ['To clean his house', 'To chop wood', 'To cook', 'To sing'], correctOption: 1 },
  { subject: 'English', chapter: 'The Beggar', title: 'How did Olga help Lushkoff?', options: ['She gave him money', 'She chopped the wood for him and scolded him out of pity', 'She bought him clothes', 'She taught him to read'], correctOption: 1 },
  { subject: 'English', chapter: 'The Beggar', title: 'What did Lushkoff become two years later?', options: ['A woodchopper', 'A notary earning 35 roubles a month', 'A singer', 'A teacher'], correctOption: 1 }
];

async function run() {
  console.log('🚀 Starting Manual Seeding for Class 9 English...');
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('❌ Login failed:', authError); return; }
  
  const teacherId = authData.session.user.id;
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  let ok = 0, fail = 0;
  for (const q of questions) {
    const { error } = await adminClient.from('questions').insert({
      created_by: teacherId,
      title: q.title,
      body: '',
      subject: q.subject,
      class_grade: '9',
      chapter: q.chapter,
      points: 2,
      time_limit: 2,
      difficulty: 'moderate',
      options: q.options,
      correct_option: q.correctOption
    });
    
    if (error) {
      console.error(`❌ Failed: ${q.title} — ${error.message}`);
      fail++;
    } else {
      console.log(`✅ Inserted: ${q.title}`);
      ok++;
    }
  }
  console.log(`\n🎉 Done! ${ok} questions added, ${fail} failed.`);
}

run();
