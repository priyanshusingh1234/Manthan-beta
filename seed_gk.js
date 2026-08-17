const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const TEACHER_ID = '83ea8424-f849-4773-b1fc-aaa987d33b2b';

const questions = [
  {
    title: "Which of the following books is considered the oldest surviving literature of India?",
    options: ["Ramayana", "Mahabharata", "Rigveda", "Arthashastra"],
    correct_option: 2,
    hint: "It is one of the four sacred canonical texts (śruti) of Hinduism.",
    explanation: "The Rigveda is an ancient Indian collection of Vedic Sanskrit hymns. It is one of the four sacred canonical texts of Hinduism known as the Vedas and is considered the oldest known Vedic Sanskrit text."
  },
  {
    title: "Which gas is most abundant in the Earth's atmosphere?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    correct_option: 2,
    hint: "It makes up about 78% of the air we breathe.",
    explanation: "Nitrogen is the most abundant gas in the Earth's atmosphere, constituting approximately 78% of the total volume, followed by Oxygen at about 21%."
  },
  {
    title: "Who is known as the 'Father of the Indian Constitution'?",
    options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Dr. B.R. Ambedkar"],
    correct_option: 3,
    hint: "He was the chairman of the drafting committee.",
    explanation: "Dr. B.R. Ambedkar was the Chairman of the Drafting Committee of the Constituent Assembly and played a pivotal role in framing the Indian Constitution, earning him this title."
  },
  {
    title: "Which planet in our solar system is known for having a prominent ring system?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correct_option: 1,
    hint: "It is the sixth planet from the Sun.",
    explanation: "Saturn is the most famous for its stunning, complex ring system made mostly of ice particles, with a smaller amount of rocky debris and dust."
  },
  {
    title: "In which year did India gain independence from British rule?",
    options: ["1945", "1947", "1950", "1952"],
    correct_option: 1,
    hint: "It happened shortly after the end of World War II.",
    explanation: "India achieved independence from British rule on August 15, 1947, following the Indian independence movement."
  },
  {
    title: "What is the largest organ in the human body?",
    options: ["Liver", "Brain", "Heart", "Skin"],
    correct_option: 3,
    hint: "It covers the entire outside of your body.",
    explanation: "The skin is the largest organ of the human body, providing a protective barrier against the environment and helping regulate body temperature."
  },
  {
    title: "Which historical monument was built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal?",
    options: ["Red Fort", "Qutub Minar", "Taj Mahal", "Hawa Mahal"],
    correct_option: 2,
    hint: "It is located in Agra and made of white marble.",
    explanation: "The Taj Mahal, located in Agra, was commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal."
  },
  {
    title: "Which element is a diamond primarily composed of?",
    options: ["Silicon", "Carbon", "Iron", "Gold"],
    correct_option: 1,
    hint: "It is an allotrope of the same element that makes up graphite.",
    explanation: "Diamond is a solid form of the element carbon with its atoms arranged in a crystal structure called diamond cubic."
  },
  {
    title: "Who invented the World Wide Web (WWW)?",
    options: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Mark Zuckerberg"],
    correct_option: 2,
    hint: "He is an English computer scientist.",
    explanation: "Sir Tim Berners-Lee, an English computer scientist, invented the World Wide Web in 1989 while working at CERN."
  },
  {
    title: "Which is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
    correct_option: 1,
    hint: "It flows generally north through eastern Africa.",
    explanation: "The Nile River, located in northeastern Africa, is traditionally considered the longest river in the world, though some studies suggest the Amazon might be longer."
  },
  {
    title: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correct_option: 2,
    hint: "It is located inland between Sydney and Melbourne.",
    explanation: "Canberra is the capital city of Australia, chosen as a compromise location between the two largest cities, Sydney and Melbourne."
  },
  {
    title: "Which scientist proposed the theory of general relativity?",
    options: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Galileo Galilei"],
    correct_option: 2,
    hint: "He also developed the mass-energy equivalence formula E=mc².",
    explanation: "Albert Einstein published the theory of general relativity in 1915, fundamentally changing our understanding of gravity."
  },
  {
    title: "In computing, what does CPU stand for?",
    options: ["Central Process Unit", "Computer Personal Unit", "Central Processor Unit", "Central Processing Unit"],
    correct_option: 3,
    hint: "It is considered the 'brain' of the computer.",
    explanation: "CPU stands for Central Processing Unit. It performs the basic arithmetic, logic, controlling, and input/output operations specified by the instructions in the program."
  },
  {
    title: "Which country is the largest by land area?",
    options: ["Canada", "China", "United States", "Russia"],
    correct_option: 3,
    hint: "It spans Eastern Europe and Northern Asia.",
    explanation: "Russia is the largest country in the world by surface area, covering more than one-eighth of the Earth's inhabited land area."
  },
  {
    title: "Who was the first woman to win a Nobel Prize?",
    options: ["Mother Teresa", "Marie Curie", "Rosalind Franklin", "Ada Lovelace"],
    correct_option: 1,
    hint: "She won it for her work in radioactivity.",
    explanation: "Marie Curie was the first woman to win a Nobel Prize (Physics, 1903) and remains the only person to win Nobel Prizes in two different scientific fields (Physics and Chemistry)."
  },
  {
    title: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correct_option: 2,
    hint: "It is made of pure carbon.",
    explanation: "Diamond is the hardest known natural material, scoring a perfect 10 on the Mohs scale of mineral hardness."
  },
  {
    title: "Which ocean is the largest and deepest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Southern Ocean", "Pacific Ocean"],
    correct_option: 3,
    hint: "It separates Asia and Australia from the Americas.",
    explanation: "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions, extending from the Arctic Ocean in the north to the Southern Ocean in the south."
  },
  {
    title: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct_option: 1,
    hint: "He is often called England's national poet and the 'Bard of Avon'.",
    explanation: "William Shakespeare, an English playwright, poet, and actor, wrote the tragedy 'Romeo and Juliet' early in his career."
  },
  {
    title: "What is the chemical symbol for Gold?",
    options: ["Ag", "Au", "Go", "Gd"],
    correct_option: 1,
    hint: "It comes from the Latin word 'aurum'.",
    explanation: "The chemical symbol for Gold is Au, which is derived from the Latin word 'aurum', meaning 'shining dawn'."
  },
  {
    title: "Which is the smallest planet in our solar system?",
    options: ["Mars", "Venus", "Mercury", "Pluto"],
    correct_option: 2,
    hint: "It is also the closest planet to the Sun.",
    explanation: "Mercury is the smallest planet in the Solar System and the closest to the Sun. (Pluto is classified as a dwarf planet)."
  },
  {
    title: "Which Indian festival is known as the 'Festival of Lights'?",
    options: ["Holi", "Diwali", "Navratri", "Eid"],
    correct_option: 1,
    hint: "It symbolizes the spiritual 'victory of light over darkness, good over evil, and knowledge over ignorance'.",
    explanation: "Diwali (or Deepavali) is the Hindu festival of lights, celebrated every year in autumn in the northern hemisphere."
  },
  {
    title: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correct_option: 1,
    hint: "It lives in the ocean.",
    explanation: "The Blue Whale is a marine mammal and the largest animal known to have ever lived, reaching lengths of up to 100 feet."
  },
  {
    title: "Who was the first person to step on the Moon?",
    options: ["Yuri Gagarin", "Buzz Aldrin", "Neil Armstrong", "Michael Collins"],
    correct_option: 2,
    hint: "He famously said, 'That's one small step for [a] man, one giant leap for mankind.'",
    explanation: "American astronaut Neil Armstrong became the first person to walk on the Moon on July 20, 1969, during the Apollo 11 mission."
  },
  {
    title: "Which vitamin is primarily produced in the body when exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    correct_option: 3,
    hint: "It helps the body absorb calcium and maintain strong bones.",
    explanation: "Vitamin D is unique because it can be synthesized in the skin through a photosynthetic reaction triggered by exposure to UVB radiation from sunlight."
  },
  {
    title: "What is the main ingredient in traditional Japanese sushi?",
    options: ["Raw fish", "Seaweed", "Vinegared rice", "Soy sauce"],
    correct_option: 2,
    hint: "The word 'sushi' actually refers to this specific ingredient, not the fish.",
    explanation: "Sushi refers specifically to the vinegared rice (sushi-meshi). While often accompanied by raw seafood, the defining ingredient of all sushi is the seasoned rice."
  },
  {
    title: "Which organ in the human body is responsible for pumping blood?",
    options: ["Lungs", "Brain", "Liver", "Heart"],
    correct_option: 3,
    hint: "It is located in the chest cavity.",
    explanation: "The heart is a muscular organ that pumps blood through the blood vessels of the circulatory system, providing oxygen and nutrients to the body."
  },
  {
    title: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correct_option: 2,
    hint: "He was an Italian polymath of the High Renaissance.",
    explanation: "The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci, considered an archetypal masterpiece of the Italian Renaissance."
  },
  {
    title: "What is the smallest continent by land area?",
    options: ["Europe", "Antarctica", "Australia", "South America"],
    correct_option: 2,
    hint: "It is also a single country.",
    explanation: "Australia is the smallest continent by land area, though it is the sixth-largest country in the world."
  },
  {
    title: "Which language is the most spoken native language in the world?",
    options: ["English", "Spanish", "Hindi", "Mandarin Chinese"],
    correct_option: 3,
    hint: "It is the official language of the most populous country.",
    explanation: "Mandarin Chinese has the most native speakers in the world, primarily due to the vast population of China."
  },
  {
    title: "What does the acronym 'NASA' stand for?",
    options: ["National Aeronautics and Space Administration", "National Aerospace and Science Administration", "North American Space Agency", "National Aviation and Space Association"],
    correct_option: 0,
    hint: "It is an independent agency of the U.S. federal government.",
    explanation: "NASA stands for National Aeronautics and Space Administration, responsible for the civilian space program, as well as aeronautics and space research."
  }
];

async function seed() {
  let successCount = 0;
  for (const q of questions) {
    const payload = {
      created_by: TEACHER_ID,
      title: q.title,
      body: "",
      subject: "G.K", // User specified subject as "G.K"
      class_grade: "All", // Set to All
      points: 2,
      time_limit: 1,
      difficulty: "moderate",
      options: q.options,
      correct_option: q.correct_option,
      question_type: "mcq",
      hint: q.hint,
      explanation: q.explanation
    };

    const { data, error } = await supabase.from('questions').insert(payload);
    if (error) {
      console.error("Error inserting:", error);
    } else {
      successCount++;
    }
  }
  console.log(`Successfully inserted ${successCount} out of ${questions.length} unique general knowledge questions.`);
}

seed();
