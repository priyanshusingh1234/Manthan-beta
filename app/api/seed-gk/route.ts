import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

// One-time seeder endpoint. Protected by a secret key.
// Call: POST /api/seed-gk with body { secret: "seed-gk-2024" }

const SEED_SECRET = 'seed-gk-2024';

const GK_QUESTIONS = [
  { title: "What is the capital of France?", options: ["Berlin","Madrid","Paris","Rome"], correct: 2 },
  { title: "Which planet is known as the Red Planet?", options: ["Venus","Jupiter","Saturn","Mars"], correct: 3 },
  { title: "Who wrote Romeo and Juliet?", options: ["Charles Dickens","William Shakespeare","Mark Twain","Leo Tolstoy"], correct: 1 },
  { title: "What is the largest ocean in the world?", options: ["Atlantic Ocean","Indian Ocean","Arctic Ocean","Pacific Ocean"], correct: 3 },
  { title: "Which country has the longest coastline?", options: ["Russia","Australia","Canada","USA"], correct: 2 },
  { title: "Who invented the telephone?", options: ["Thomas Edison","Nikola Tesla","Alexander Graham Bell","James Watt"], correct: 2 },
  { title: "What is the chemical symbol for Gold?", options: ["Gd","Go","Au","Ag"], correct: 2 },
  { title: "How many continents are there on Earth?", options: ["5","6","7","8"], correct: 2 },
  { title: "What is the largest mammal in the world?", options: ["Elephant","Blue Whale","Giraffe","Great White Shark"], correct: 1 },
  { title: "Which country is known as the Land of the Rising Sun?", options: ["China","South Korea","Japan","Thailand"], correct: 2 },
  { title: "What is the smallest planet in our solar system?", options: ["Mars","Pluto","Venus","Mercury"], correct: 3 },
  { title: "Who painted the Mona Lisa?", options: ["Vincent van Gogh","Pablo Picasso","Leonardo da Vinci","Michelangelo"], correct: 2 },
  { title: "What is the currency of Japan?", options: ["Yuan","Won","Rupee","Yen"], correct: 3 },
  { title: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], correct: 2 },
  { title: "What is the longest river in the world?", options: ["Amazon","Yangtze","Mississippi","Nile"], correct: 3 },
  { title: "In which year did World War II end?", options: ["1943","1944","1946","1945"], correct: 3 },
  { title: "What is the hardest natural substance on Earth?", options: ["Quartz","Diamond","Topaz","Corundum"], correct: 1 },
  { title: "Which is the largest desert in the world?", options: ["Arabian Desert","Gobi Desert","Sahara Desert","Antarctic Desert"], correct: 3 },
  { title: "Who was the first person to walk on the Moon?", options: ["Buzz Aldrin","Yuri Gagarin","Neil Armstrong","John Glenn"], correct: 2 },
  { title: "What is the capital of Australia?", options: ["Sydney","Melbourne","Canberra","Brisbane"], correct: 2 },
  { title: "What is the speed of light approximately?", options: ["200,000 km/s","250,000 km/s","350,000 km/s","300,000 km/s"], correct: 3 },
  { title: "Which country invented paper?", options: ["India","Egypt","China","Japan"], correct: 2 },
  { title: "What is the official language of Brazil?", options: ["Spanish","English","French","Portuguese"], correct: 3 },
  { title: "How many bones are in the adult human body?", options: ["196","206","216","226"], correct: 1 },
  { title: "Which planet is closest to the Sun?", options: ["Venus","Earth","Mercury","Mars"], correct: 2 },
  { title: "What is the largest country in the world by area?", options: ["Canada","China","USA","Russia"], correct: 3 },
  { title: "Who is known as the Father of Computers?", options: ["Alan Turing","Bill Gates","Charles Babbage","Steve Jobs"], correct: 2 },
  { title: "What is the tallest mountain in the world?", options: ["K2","Kangchenjunga","Mount Kilimanjaro","Mount Everest"], correct: 3 },
  { title: "Which is the smallest country in the world?", options: ["Monaco","Nauru","San Marino","Vatican City"], correct: 3 },
  { title: "What is the national sport of Canada?", options: ["Ice Hockey","Basketball","Lacrosse","Baseball"], correct: 0 },
  { title: "Which organ produces insulin in the human body?", options: ["Liver","Kidney","Pancreas","Stomach"], correct: 2 },
  { title: "What is the main component of the Sun?", options: ["Helium","Hydrogen","Oxygen","Nitrogen"], correct: 1 },
  { title: "In which country is the Amazon Rainforest primarily located?", options: ["Colombia","Peru","Venezuela","Brazil"], correct: 3 },
  { title: "Which is the most spoken language in the world?", options: ["English","Spanish","Hindi","Mandarin Chinese"], correct: 3 },
  { title: "What is the atomic number of Carbon?", options: ["4","6","8","12"], correct: 1 },
  { title: "Who wrote 'A Brief History of Time'?", options: ["Albert Einstein","Carl Sagan","Stephen Hawking","Richard Feynman"], correct: 2 },
  { title: "What is the largest bone in the human body?", options: ["Tibia","Spine","Humerus","Femur"], correct: 3 },
  { title: "Which country is the largest producer of coffee?", options: ["Colombia","Vietnam","Ethiopia","Brazil"], correct: 3 },
  { title: "What is the chemical formula for water?", options: ["HO","H2O2","H3O","H2O"], correct: 3 },
  { title: "Which is the largest continent by area?", options: ["Americas","Africa","Europe","Asia"], correct: 3 },
  { title: "Who discovered penicillin?", options: ["Louis Pasteur","Alexander Fleming","Marie Curie","Joseph Lister"], correct: 1 },
  { title: "What is the capital of Canada?", options: ["Toronto","Vancouver","Montreal","Ottawa"], correct: 3 },
  { title: "Which planet has the most moons?", options: ["Jupiter","Uranus","Neptune","Saturn"], correct: 3 },
  { title: "What is the boiling point of water at sea level?", options: ["80°C","90°C","110°C","100°C"], correct: 3 },
  { title: "Which organization has won the most Nobel Peace Prizes?", options: ["Amnesty International","United Nations","ICRC (Red Cross)","Doctors Without Borders"], correct: 2 },
  { title: "What is the currency of the United Kingdom?", options: ["Euro","Dollar","Franc","Pound Sterling"], correct: 3 },
  { title: "Which element is represented by the symbol 'Fe'?", options: ["Fluorine","Francium","Iron","Fermium"], correct: 2 },
  { title: "What is the largest internal organ in the human body?", options: ["Heart","Brain","Kidney","Liver"], correct: 3 },
  { title: "Which country hosted the 2016 Summer Olympics?", options: ["China","UK","Russia","Brazil"], correct: 3 },
  { title: "Who was the first female Prime Minister of the UK?", options: ["Theresa May","Margaret Thatcher","Queen Elizabeth I","Angela Merkel"], correct: 1 },
  { title: "What does 'www' stand for in a web address?", options: ["Wide World Web","World Wide Web","Web World Wide","World Web Wide"], correct: 1 },
  { title: "Which is the deepest lake in the world?", options: ["Lake Superior","Lake Titicaca","Lake Baikal","Caspian Sea"], correct: 2 },
  { title: "What is the national animal of India?", options: ["Lion","Peacock","Elephant","Bengal Tiger"], correct: 3 },
  { title: "Who invented the light bulb?", options: ["Nikola Tesla","Alexander Graham Bell","Thomas Edison","Michael Faraday"], correct: 2 },
  { title: "Which is the biggest planet in our solar system?", options: ["Saturn","Uranus","Neptune","Jupiter"], correct: 3 },
  { title: "What is the capital of China?", options: ["Shanghai","Guangzhou","Hong Kong","Beijing"], correct: 3 },
  { title: "Which country gave the Statue of Liberty to the USA?", options: ["UK","Italy","Germany","France"], correct: 3 },
  { title: "What is the chemical symbol for Oxygen?", options: ["Ox","Om","Or","O"], correct: 3 },
  { title: "In which year did the Titanic sink?", options: ["1910","1911","1913","1912"], correct: 3 },
  { title: "What is photosynthesis?", options: ["Respiration process in animals","Breaking down food in stomach","Process by which plants make food using sunlight","Water purification process"], correct: 2 },
  { title: "Which is the smallest continent?", options: ["Europe","Antarctica","Australia","South America"], correct: 2 },
  { title: "What is the approximate value of Pi (π)?", options: ["3.14159","2.71828","1.41421","1.61803"], correct: 0 },
  { title: "Who gave the theory of relativity?", options: ["Isaac Newton","Niels Bohr","Albert Einstein","Max Planck"], correct: 2 },
  { title: "What is the capital of Russia?", options: ["St. Petersburg","Kiev","Minsk","Moscow"], correct: 3 },
  { title: "Which is the world's most populous country?", options: ["USA","India","China","Indonesia"], correct: 2 },
  { title: "What does DNA stand for?", options: ["Dynamic Neural Acid","Digital Nucleic Arrangement","Deoxyribonucleic Acid","Diatomic Nitrogen Array"], correct: 2 },
  { title: "What is the freezing point of water?", options: ["-10°C","5°C","10°C","0°C"], correct: 3 },
  { title: "Which is one of the Seven Wonders of the Ancient World?", options: ["Hadrian's Wall","Berlin Wall","Great Wall of China","Great Wall of Babylon"], correct: 2 },
  { title: "Which planet has a ring system most famously?", options: ["Jupiter","Uranus","Neptune","Saturn"], correct: 3 },
  { title: "Who was the first President of the United States?", options: ["Abraham Lincoln","John Adams","Thomas Jefferson","George Washington"], correct: 3 },
  { title: "What is the largest bird in the world?", options: ["Emu","Albatross","Ostrich","Condor"], correct: 2 },
  { title: "Which country is home to the kangaroo?", options: ["New Zealand","South Africa","Brazil","Australia"], correct: 3 },
  { title: "What is the powerhouse of the cell?", options: ["Nucleus","Ribosome","Mitochondria","Golgi apparatus"], correct: 2 },
  { title: "What is the name of the force that attracts objects toward Earth?", options: ["Magnetism","Electromagnetism","Nuclear force","Gravity"], correct: 3 },
  { title: "Who was the first Indian to win a Nobel Prize?", options: ["Amartya Sen","C.V. Raman","Mother Teresa","Rabindranath Tagore"], correct: 3 },
  { title: "What is the capital of Germany?", options: ["Munich","Frankfurt","Hamburg","Berlin"], correct: 3 },
  { title: "Which blood type is known as the universal donor?", options: ["AB","B","A","O"], correct: 3 },
  { title: "Which sea is the saltiest in the world?", options: ["Red Sea","Caspian Sea","Black Sea","Dead Sea"], correct: 3 },
  { title: "What year did man first land on the Moon?", options: ["1967","1968","1970","1969"], correct: 3 },
  { title: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen","Argon","Carbon Dioxide","Nitrogen"], correct: 3 },
  { title: "Who wrote 'The Origin of Species'?", options: ["Gregor Mendel","Charles Darwin","Louis Pasteur","Carl Linnaeus"], correct: 1 },
  { title: "Which city is known as the 'City of Love'?", options: ["Venice","Rome","Paris","Vienna"], correct: 2 },
  { title: "What is the capital of Japan?", options: ["Osaka","Hiroshima","Kyoto","Tokyo"], correct: 3 },
  { title: "How many players are there in a cricket team?", options: ["9","10","12","11"], correct: 3 },
  { title: "What is the most widely practiced religion in the world?", options: ["Islam","Hinduism","Christianity","Buddhism"], correct: 2 },
  { title: "Which country has the highest number of UNESCO World Heritage Sites?", options: ["France","Spain","China","Italy"], correct: 3 },
  { title: "What is the unit of electric current?", options: ["Volt","Watt","Ohm","Ampere"], correct: 3 },
  { title: "Who discovered gravity?", options: ["Galileo Galilei","Albert Einstein","Isaac Newton","Johannes Kepler"], correct: 2 },
  { title: "Which country is Mount Fuji located in?", options: ["China","South Korea","Taiwan","Japan"], correct: 3 },
  { title: "What is the capital of Brazil?", options: ["São Paulo","Rio de Janeiro","Salvador","Brasília"], correct: 3 },
  { title: "Which element has the highest melting point?", options: ["Iron","Platinum","Tantalum","Tungsten"], correct: 3 },
  { title: "Who was the first woman to win a Nobel Prize?", options: ["Dorothy Hodgkin","Mother Teresa","Rosalind Franklin","Marie Curie"], correct: 3 },
  { title: "Which country invented gunpowder?", options: ["India","Persia","Japan","China"], correct: 3 },
  { title: "What is the largest living structure on Earth?", options: ["Congo Rainforest","Great Barrier Reef","Amazon River","Sahara Desert"], correct: 1 },
  { title: "Which gas primarily makes up the Sun?", options: ["Helium","Hydrogen","Oxygen","Carbon"], correct: 1 },
  { title: "What is the administrative capital of South Africa?", options: ["Cape Town","Johannesburg","Pretoria","Durban"], correct: 2 },
  { title: "What is the study of earthquakes called?", options: ["Vulcanology","Geology","Meteorology","Seismology"], correct: 3 },
  { title: "Which organ is responsible for pumping blood?", options: ["Lungs","Kidneys","Liver","Heart"], correct: 3 },
  { title: "What is the national flower of India?", options: ["Rose","Jasmine","Lotus","Marigold"], correct: 2 },
  { title: "Which year was the United Nations founded?", options: ["1942","1944","1948","1945"], correct: 3 },
];

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the teacher by email
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

    const teacher = userData.users.find(u => u.email === 'kpk22128@gmail.com');
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher account not found' }, { status: 404 });
    }

    const teacherId = teacher.id;
    const meta = teacher.user_metadata || {};
    const teacherName = meta.fullName || meta.full_name || meta.name || 'Teacher';

    const rows = GK_QUESTIONS.map((q) => ({
      created_by: teacherId,
      title: q.title,
      body: '',
      subject: 'G.K',
      class_grade: 'All',
      points: 2,
      time_limit: 2,
      difficulty: 'moderate',
      options: q.options,
      correct_option: q.correct,
      image_path: null,
      image_url: null,
    }));

    // Insert in batches of 20
    const BATCH = 20;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabaseAdmin.from('questions').insert(batch);
      if (error) {
        errors.push(`Batch ${Math.floor(i/BATCH)+1}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      total: GK_QUESTIONS.length,
      errors: errors.length > 0 ? errors : undefined,
      teacher: teacherName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
