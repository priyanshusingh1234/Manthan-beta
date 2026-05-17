import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o';

const EMAIL = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const questions = [
  { title: 'Which one of the following is an example of biotic resources?', options: ['Rocks', 'Metals', 'Flora and fauna', 'Minerals'], correctOption: 2 },
  { title: 'Which of the following is an example of abiotic resources?', options: ['Animals', 'Plants', 'Metals', 'Human beings'], correctOption: 2 },
  { title: 'Resources which can be renewed or reproduced are known as?', options: ['Non-renewable resources', 'Renewable resources', 'Human resources', 'Potential resources'], correctOption: 1 },
  { title: 'Fossil fuels are examples of which type of resource?', options: ['Renewable', 'Non-renewable', 'Biotic', 'Individual'], correctOption: 1 },
  { title: 'Resources which are found in a region but have not been utilized are called?', options: ['Developed resources', 'Stock', 'Potential resources', 'Reserve'], correctOption: 2 },
  { title: 'Materials in the environment which have the potential to satisfy human needs but humans do not have the appropriate technology to access them are called?', options: ['Potential resources', 'Reserves', 'Stock', 'Developed resources'], correctOption: 2 },
  { title: 'Which of the following is the subset of the stock, which can be put into use with the help of existing technical "know-how" but their use has not been started?', options: ['Reserves', 'Potential resources', 'Developed resources', 'National resources'], correctOption: 0 },
  { title: 'Which of the following is essential for sustainable existence of all forms of life?', options: ['Resource planning', 'Resource depletion', 'Resource accumulation', 'Resource exploitation'], correctOption: 0 },
  { title: 'Agenda 21 was signed at the United Nations Conference on Environment and Development (UNCED) in the year?', options: ['1990', '1991', '1992', '1993'], correctOption: 2 },
  { title: 'Where was the Earth Summit 1992 held?', options: ['New York', 'Paris', 'Rio de Janeiro', 'London'], correctOption: 2 },
  { title: 'Which state in India has enormous potential for the development of wind and solar energy but lacks water resources?', options: ['Madhya Pradesh', 'Rajasthan', 'Jharkhand', 'Arunachal Pradesh'], correctOption: 1 },
  { title: 'Which of the following states is rich in minerals and coal deposits?', options: ['Gujarat', 'Rajasthan', 'Jharkhand', 'Haryana'], correctOption: 2 },
  { title: 'In India, about what percentage of land area is plain?', options: ['30%', '43%', '27%', '10%'], correctOption: 1 },
  { title: 'Mountains account for what percentage of the total surface area of India?', options: ['10%', '20%', '30%', '40%'], correctOption: 2 },
  { title: 'What percentage of the land area in India is plateau region?', options: ['43%', '30%', '27%', '50%'], correctOption: 2 },
  { title: 'Land left without cultivation for one or less than one agricultural year is called?', options: ['Cultruable waste land', 'Current fallow', 'Other than current fallow', 'Net sown area'], correctOption: 1 },
  { title: 'Area sown more than once in an agricultural year plus net sown area is known as?', options: ['Gross cropped area', 'Net sown area', 'Fallow land', 'Cultivable land'], correctOption: 0 },
  { title: 'According to the National Forest Policy (1952), what percentage of geographical area should be under forest?', options: ['22%', '33%', '44%', '55%'], correctOption: 1 },
  { title: 'Which of the following is a cause of land degradation in states like Jharkhand, Chhattisgarh, and Madhya Pradesh?', options: ['Overgrazing', 'Over irrigation', 'Mining', 'Deforestation due to overgrazing'], correctOption: 2 },
  { title: 'In states like Gujarat, Rajasthan, and Maharashtra, what is the main cause of land degradation?', options: ['Mining', 'Over irrigation', 'Overgrazing', 'Industrial effluents'], correctOption: 2 },
  { title: 'In Punjab, Haryana, and Western Uttar Pradesh, the main reason for land degradation is?', options: ['Overgrazing', 'Mining', 'Over irrigation', 'Deforestation'], correctOption: 2 },
  { title: 'Which of the following is the most widely spread and important soil in India?', options: ['Black soil', 'Alluvial soil', 'Red soil', 'Laterite soil'], correctOption: 1 },
  { title: 'Alluvial soils have been deposited by three important Himalayan river systems: the Indus, the Ganga, and the?', options: ['Godavari', 'Krishna', 'Brahmaputra', 'Kaveri'], correctOption: 2 },
  { title: 'Old alluvial soil is also known as?', options: ['Khadar', 'Bangar', 'Regur', 'Laterite'], correctOption: 1 },
  { title: 'New alluvial soil is called?', options: ['Bangar', 'Khadar', 'Bhabar', 'Terai'], correctOption: 1 },
  { title: 'Which soil is known as regur soil?', options: ['Alluvial soil', 'Laterite soil', 'Black soil', 'Red soil'], correctOption: 2 },
  { title: 'Black soil is ideal for growing which crop?', options: ['Wheat', 'Rice', 'Cotton', 'Sugarcane'], correctOption: 2 },
  { title: 'Black soils are generally poor in which of the following contents?', options: ['Calcium carbonate', 'Magnesium', 'Potash', 'Phosphoric contents'], correctOption: 3 },
  { title: 'Which soils develop a reddish colour due to diffusion of iron in crystalline and metamorphic rocks?', options: ['Laterite soils', 'Red and yellow soils', 'Black soils', 'Alluvial soils'], correctOption: 1 },
  { title: 'Laterite soils develop in areas with?', options: ['High temperature and high rainfall', 'Low temperature and low rainfall', 'High temperature and low rainfall', 'Low temperature and high rainfall'], correctOption: 0 },
  { title: 'Which soil is very useful for growing tea and coffee in Karnataka, Kerala, and Tamil Nadu?', options: ['Alluvial soil', 'Laterite soil', 'Black soil', 'Arid soil'], correctOption: 1 },
  { title: 'Red laterite soils in Tamil Nadu, Andhra Pradesh, and Kerala are more suitable for crops like?', options: ['Cashew nut', 'Cotton', 'Wheat', 'Jute'], correctOption: 0 },
  { title: 'Arid soils range in colour from?', options: ['Red to brown', 'Black to brown', 'Yellow to red', 'White to grey'], correctOption: 0 },
  { title: 'Due to dry climate, high temperature, and faster evaporation, which soil lacks humus and moisture?', options: ['Forest soil', 'Black soil', 'Arid soil', 'Alluvial soil'], correctOption: 2 },
  { title: 'In the lower horizons of the arid soil, Kankar layers are formed because of the increasing content of?', options: ['Nitrogen', 'Phosphorus', 'Calcium', 'Potassium'], correctOption: 2 },
  { title: 'Forest soils are loamy and silty in valley sides and ________ in the upper slopes.', options: ['Fine grained', 'Coarse grained', 'Clayey', 'Muddy'], correctOption: 1 },
  { title: 'In the snow-covered areas of Himalayas, which soil experiences denudation and is acidic with low humus content?', options: ['Forest soils', 'Laterite soils', 'Black soils', 'Arid soils'], correctOption: 0 },
  { title: 'The denudation of the soil cover and subsequent washing down is described as?', options: ['Soil formation', 'Soil conservation', 'Soil erosion', 'Weathering'], correctOption: 2 },
  { title: 'Running water cuts through the clayey soils and makes deep channels known as?', options: ['Tributaries', 'Gullies', 'Valleys', 'Gorges'], correctOption: 1 },
  { title: 'The land that becomes unfit for cultivation due to gullies is known as?', options: ['Fallow land', 'Bad land', 'Waste land', 'Pasture land'], correctOption: 1 },
  { title: 'In the Chambal basin, bad lands are called?', options: ['Ravines', 'Khadar', 'Bangar', 'Terai'], correctOption: 0 },
  { title: 'When water flows as a sheet over large areas down a slope, washing away the topsoil, it is known as?', options: ['Gully erosion', 'Sheet erosion', 'Wind erosion', 'Glacial erosion'], correctOption: 1 },
  { title: 'Wind blowing loose soil off flat or sloping land is known as?', options: ['Sheet erosion', 'Gully erosion', 'Wind erosion', 'Water erosion'], correctOption: 2 },
  { title: 'Ploughing along the contour lines to decelerate the flow of water down the slopes is called?', options: ['Strip cropping', 'Terrace cultivation', 'Contour ploughing', 'Shelter belts'], correctOption: 2 },
  { title: 'Steps can be cut out on the slopes making terraces. Terrace cultivation restricts?', options: ['Soil formation', 'Wind erosion', 'Erosion', 'Crop growth'], correctOption: 2 },
  { title: 'Large fields can be divided into strips. Strips of grass are left to grow between the crops to break the force of the wind. This method is known as?', options: ['Contour ploughing', 'Terrace farming', 'Strip cropping', 'Crop rotation'], correctOption: 2 },
  { title: 'Planting lines of trees to create shelter and break the wind force is called?', options: ['Shelter belts', 'Strip cropping', 'Contour ploughing', 'Afforestation'], correctOption: 0 },
  { title: 'Shelter belts have contributed significantly to the stabilization of sand dunes and in establishing the desert in which state?', options: ['Gujarat', 'Rajasthan', 'Haryana', 'Punjab'], correctOption: 1 },
  { title: 'Which one of the following human activities has contributed significantly in land degradation?', options: ['Deforestation', 'Crop rotation', 'Shelter belts', 'Contour ploughing'], correctOption: 0 },
  { title: 'The phrase "There is enough for everybody\'s need and not for any body\'s greed" was said by?', options: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'B.R. Ambedkar', 'Sardar Patel'], correctOption: 1 }
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
      class_grade: '10',
      chapter: 'Resources and Development',
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
