import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o';

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const questions = [
  { title: 'Along the banks of which river have people lived for several hundred thousand years?', options: ['Ganga', 'Yamuna', 'Narmada', 'Kaveri'], correctOption: 2 },
  { title: 'Where are the Sulaiman and Kirthar hills located?', options: ['North-east', 'North-west', 'South', 'East'], correctOption: 1 },
  { title: 'In which of the following areas did women and men first begin to grow crops such as wheat and barley about 8000 years ago?', options: ['Garo Hills', 'Vindhyas', 'Sulaiman and Kirthar hills', 'Deccan Plateau'], correctOption: 2 },
  { title: 'Where are the Garo hills located?', options: ['North-west', 'South', 'Central India', 'North-east'], correctOption: 3 },
  { title: 'The Garo hills and the Vindhyas were some of the areas where:', options: ['Agriculture developed', 'First cities emerged', 'First kingdoms were formed', 'Sea trade started'], correctOption: 0 },
  { title: 'Where was rice first grown in the Indian subcontinent?', options: ['South of the Godavari', 'North of the Vindhyas', 'Banks of the Narmada', 'Thar Desert'], correctOption: 1 },
  { title: 'What are smaller rivers that flow into a larger river called?', options: ['Distributaries', 'Tributaries', 'Streams', 'Canals'], correctOption: 1 },
  { title: 'About 4700 years ago, some of the earliest cities flourished on the banks of which river?', options: ['Ganga', 'Brahmaputra', 'Indus', 'Mahanadi'], correctOption: 2 },
  { title: 'About 2500 years ago, cities developed on the banks of which river and its tributaries?', options: ['Ganga', 'Indus', 'Narmada', 'Krishna'], correctOption: 0 },
  { title: 'What is the name of the tributary of the Ganga mentioned in Chapter 1?', options: ['Yamuna', 'Son', 'Chambal', 'Kosi'], correctOption: 1 },
  { title: 'In ancient times, the area to the south of the Ganga was known as:', options: ['Kalinga', 'Kosala', 'Magadha', 'Avanti'], correctOption: 2 },
  { title: 'Magadha, the first large kingdom, is currently located in which Indian state?', options: ['Uttar Pradesh', 'Bihar', 'West Bengal', 'Jharkhand'], correctOption: 1 },
  { title: 'Why did people travel from one part of the subcontinent to another in ancient times?', options: ['To escape natural disasters', 'To trade', 'To conquer other lands', 'All of the above'], correctOption: 3 },
  { title: 'The word \'India\' comes from the river Indus, which is called what in Sanskrit?', options: ['Bharata', 'Sindhu', 'Ganga', 'Saraswati'], correctOption: 1 },
  { title: 'Who came through the northwest about 2500 years ago and were familiar with the Indus?', options: ['Iranians and Greeks', 'Romans and Egyptians', 'Chinese and Japanese', 'Arabs and Turks'], correctOption: 0 },
  { title: 'What did the Iranians and Greeks call the Indus river?', options: ['Hindos or Indos', 'Sindhu', 'Bharat', 'Aryavarta'], correctOption: 0 },
  { title: 'The name \'Bharata\' was used for a group of people who lived in the:', options: ['South', 'North-east', 'North-west', 'Central India'], correctOption: 2 },
  { title: 'In which early composition is the name \'Bharata\' mentioned?', options: ['Samaveda', 'Yajurveda', 'Rigveda', 'Atharvaveda'], correctOption: 2 },
  { title: 'What are books that were written by hand long ago called?', options: ['Inscriptions', 'Manuscripts', 'Edicts', 'Journals'], correctOption: 1 },
  { title: 'The word \'manuscript\' comes from the Latin word \'manu\', which means:', options: ['Mind', 'Man', 'Hand', 'Paper'], correctOption: 2 },
  { title: 'What were ancient manuscripts usually written on?', options: ['Stone slabs', 'Palm leaf or birch bark', 'Animal skin', 'Cotton cloth'], correctOption: 1 },
  { title: 'The specially prepared bark of a tree known as the birch, used for writing, grows in the:', options: ['Vindhyas', 'Nilgiris', 'Himalayas', 'Aravallis'], correctOption: 2 },
  { title: 'Over the years, what happened to many manuscripts?', options: ['They were preserved safely underground', 'They were eaten by insects or destroyed', 'They were turned into stone', 'They were sold to other countries'], correctOption: 1 },
  { title: 'Where are surviving manuscripts often preserved?', options: ['In modern libraries', 'In temples and monasteries', 'Underneath old houses', 'In caves'], correctOption: 1 },
  { title: 'In what languages were many ancient Indian manuscripts written?', options: ['English, Hindi, and Urdu', 'Sanskrit, Prakrit, and Tamil', 'Arabic, Persian, and Turkish', 'Greek, Latin, and Aramaic'], correctOption: 1 },
  { title: 'Which language was used by ordinary people in ancient India?', options: ['Sanskrit', 'Persian', 'Prakrit', 'Latin'], correctOption: 2 },
  { title: 'What are writings on relatively hard surfaces such as stone or metal called?', options: ['Manuscripts', 'Inscriptions', 'Biographies', 'Diaries'], correctOption: 1 },
  { title: 'Why did kings often get their orders inscribed?', options: ['To decorate their palaces', 'So people could see, read, and obey them', 'To practice their writing skills', 'To send secret messages'], correctOption: 1 },
  { title: 'What kind of information besides orders did inscriptions sometimes contain?', options: ['Recipes for food', 'Records of victories in battle', 'Maps of the world', 'Weather forecasts'], correctOption: 1 },
  { title: 'What do we call the scholars who study the objects made and used in the past?', options: ['Geologists', 'Astronomers', 'Archaeologists', 'Biologists'], correctOption: 2 },
  { title: 'Which of the following do archaeologists study?', options: ['Remains of buildings', 'Paintings and sculpture', 'Tools, weapons, and coins', 'All of the above'], correctOption: 3 },
  { title: 'Which of the following materials used to make objects usually survives for a long time?', options: ['Wood', 'Cloth', 'Baked clay or stone', 'Leaves'], correctOption: 2 },
  { title: 'Why do archaeologists look for bones of animals, birds, and fish?', options: ['To study animal diseases', 'To find out what people ate in the past', 'To make weapons out of them', 'To sell them'], correctOption: 1 },
  { title: 'What do plant remains need to be in order to survive for a long time?', options: ['Buried in water', 'Kept in sunlight', 'Burnt or charred', 'Frozen'], correctOption: 2 },
  { title: 'Historians use the word "source" to refer to the information found from:', options: ['Manuscripts', 'Inscriptions', 'Archaeology', 'All of the above'], correctOption: 3 },
  { title: 'Why is the title of the NCERT history book "Our Pasts" in the plural?', options: ['Because there are many books', 'To draw attention to the fact that the past was different for different groups of people', 'Because it covers the history of many countries', 'Because it was written by many authors'], correctOption: 1 },
  { title: 'How did the lives of kings and queens differ from those of farmers and herders?', options: ['Kings kept records of their victories, while ordinary people usually did not', 'Farmers fought in wars, kings grew crops', 'Herders lived in palaces, queens lived in forests', 'There was no difference'], correctOption: 0 },
  { title: 'Where do people living in the Andaman Islands today get most of their food from?', options: ['Supermarkets', 'Farming, fishing, and collecting forest produce', 'Importing from the mainland', 'Government rations'], correctOption: 1 },
  { title: 'What does the date abbreviation A.D. stand for?', options: ['After Death', 'Anno Domini', 'After Decade', 'Antique Dates'], correctOption: 1 },
  { title: 'What does the Latin phrase "Anno Domini" mean?', options: ['In the year of the Lord', 'End of the era', 'Before the birth of Christ', 'The new century'], correctOption: 0 },
  { title: 'What does B.C. stand for?', options: ['Before Christ', 'Before Century', 'Beyond Christ', 'Behind Century'], correctOption: 0 },
  { title: 'What does C.E. stand for?', options: ['Christian Era', 'Common Era', 'Central Era', 'Current Era'], correctOption: 1 },
  { title: 'What does B.C.E. stand for?', options: ['Before Common Era', 'Before Christian Era', 'Behind Current Era', 'Beyond Century Era'], correctOption: 0 },
  { title: 'What does B.P. stand for?', options: ['Before Past', 'Before Present', 'Behind Past', 'Beyond Present'], correctOption: 1 },
  { title: 'An ancient inscription found in Kandahar (present-day Afghanistan) was written in which two languages/scripts?', options: ['Sanskrit and Prakrit', 'Greek and Aramaic', 'Persian and Arabic', 'Tamil and Brahmi'], correctOption: 1 },
  { title: 'The Kandahar inscription contains the orders of which famous ruler?', options: ['Chandragupta Maurya', 'Akbar', 'Ashoka', 'Alexander'], correctOption: 2 },
  { title: 'The letters or signs used in writing are collectively known as a:', options: ['Language', 'Script', 'Manuscript', 'Grammar'], correctOption: 1 },
  { title: 'The process by which scholars understand what was written in unknown ancient scripts is called:', options: ['Decipherment', 'Translation', 'Excavation', 'Memorization'], correctOption: 0 },
  { title: 'In which African country was a famous stone found that helped scholars read an ancient script?', options: ['South Africa', 'Kenya', 'Egypt', 'Morocco'], correctOption: 2 },
  { title: 'On the Rosetta stone found in Egypt, the picture of a lion stood for which letter?', options: ['A', 'P', 'L', 'T'], correctOption: 2 }
];

const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

async function run() {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('Login failed:', authError); return; }

  const teacherId = authData.session.user.id;
  console.log(`Logged in as teacher: ${teacherId}`);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  const { data: existing } = await adminClient.from('questions').select('title').eq('created_by', teacherId);
  const existingTitles = new Set((existing || []).map(r => r.title));
  console.log(`Found ${existingTitles.size} existing questions. Seeding ${questions.length} new ones...`);

  let ok = 0, skip = 0, fail = 0;

  for (const q of questions) {
    if (existingTitles.has(q.title)) {
      console.log(`Skip (duplicate): ${q.title.slice(0, 60)}`);
      skip++;
      continue;
    }

    const { error } = await adminClient.from('questions').insert({
      created_by: teacherId,
      title: q.title,
      body: '',
      subject: 'SST',
      class_grade: '6',
      chapter: 'What, Where, How and When?',
      points: 2,
      time_limit: 2,
      difficulty: 'moderate',
      options: q.options,
      correct_option: q.correctOption,
      image_path: null,
      image_url: null,
    });

    if (error) {
      console.error(`FAILED: ${q.title.slice(0, 60)} - Error: ${error.message}`);
      fail++;
    } else {
      console.log(`Added: ${q.title.slice(0, 60)}`);
      ok++;
    }

    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`Done! ${ok} added, ${skip} skipped, ${fail} failed.`);
}

run();