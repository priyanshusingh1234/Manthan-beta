const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const questions = [
  {
    title: "Which of the following is a characteristic of a chemical change?",
    options: [
      "It is mostly reversible.",
      "No new substance is formed.",
      "The change is temporary.",
      "Energy is either absorbed or evolved."
    ],
    correct_option: 3,
    subject: "Chemistry",
    explanation: "A chemical change is a permanent change in which a new substance is formed, and it is usually accompanied by the absorption or evolution of energy (heat, light, etc.)."
  },
  {
    title: "When iron and sulfur are heated together, they form iron(II) sulfide. This is an example of:",
    options: [
      "Decomposition reaction",
      "Direct combination (synthesis) reaction",
      "Displacement reaction",
      "Double decomposition reaction"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "A direct combination reaction is one in which two or more elements or compounds combine to form a single new compound. Fe + S → FeS."
  },
  {
    title: "The breaking down of a compound into two or more simpler substances by the action of heat is known as:",
    options: [
      "Thermal dissociation",
      "Thermal decomposition",
      "Electrolytic decomposition",
      "Photochemical decomposition"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Thermal decomposition is a chemical reaction where a single compound breaks down into two or more simpler substances upon heating. It is an irreversible process."
  },
  {
    title: "Which type of reaction occurs when silver nitrate solution is added to sodium chloride solution?",
    options: [
      "Displacement reaction",
      "Neutralization reaction",
      "Double decomposition (precipitation) reaction",
      "Direct combination reaction"
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "AgNO3 + NaCl → AgCl(precipitate) + NaNO3. The ions are exchanged between the two reactants forming a solid precipitate, which is a double decomposition reaction."
  },
  {
    title: "Reactions that proceed with the absorption of heat are called:",
    options: [
      "Exothermic reactions",
      "Endothermic reactions",
      "Photochemical reactions",
      "Catalytic reactions"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Endothermic reactions are chemical reactions that absorb heat energy from the surroundings, causing a drop in temperature."
  },
  {
    title: "A more reactive metal displaces a less reactive metal from its salt solution. This is known as:",
    options: [
      "Double displacement reaction",
      "Displacement reaction",
      "Decomposition reaction",
      "Synthesis reaction"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "In a displacement reaction, a more reactive element displaces a less reactive element from its compound. For example, Zn + CuSO4 → ZnSO4 + Cu."
  },
  {
    title: "Which of the following is an example of an exothermic reaction?",
    options: [
      "Melting of ice",
      "Photosynthesis",
      "Respiration",
      "Thermal decomposition of calcium carbonate"
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "Respiration is an exothermic reaction because it breaks down glucose to release energy (heat), which is used by living organisms."
  },
  {
    title: "Photosynthesis in plants is an example of a:",
    options: [
      "Photochemical reaction",
      "Electrochemical reaction",
      "Exothermic reaction",
      "Thermal decomposition"
    ],
    correct_option: 0,
    subject: "Chemistry",
    explanation: "Photosynthesis requires light energy to convert carbon dioxide and water into glucose. Therefore, it is a photochemical reaction."
  },
  {
    title: "What is the catalyst used in the Haber process for the manufacture of ammonia?",
    options: [
      "Finely divided iron",
      "Platinum",
      "Manganese dioxide",
      "Vanadium pentoxide"
    ],
    correct_option: 0,
    subject: "Chemistry",
    explanation: "In the Haber process (N2 + 3H2 ⇌ 2NH3), finely divided iron is used as a catalyst to increase the rate of reaction, along with molybdenum as a promoter."
  },
  {
    title: "A chemical reaction in which heat is given out is called:",
    options: [
      "Endothermic reaction",
      "Exothermic reaction",
      "Isothermic reaction",
      "Photochemical reaction"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Exothermic reactions release energy in the form of heat, leading to an increase in the temperature of the surroundings."
  },
  {
    title: "Which of the following describes a double decomposition reaction (neutralization)?",
    options: [
      "Acid + Base → Salt + Water",
      "Metal + Acid → Salt + Hydrogen",
      "Metal + Oxygen → Metal Oxide",
      "Compound A → Compound B + Compound C"
    ],
    correct_option: 0,
    subject: "Chemistry",
    explanation: "Neutralization is a specific type of double decomposition reaction where an acid and a base react to form salt and water only."
  },
  {
    title: "When an electric current is passed through acidulated water, it breaks down into hydrogen and oxygen. This is:",
    options: [
      "Thermal decomposition",
      "Photochemical decomposition",
      "Electrolytic decomposition",
      "Catalytic decomposition"
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "The breaking down of a compound into its components by the passage of electricity is called electrolytic decomposition or electrolysis."
  },
  {
    title: "What is the primary condition required for the reaction between hydrogen and chlorine to form hydrogen chloride gas?",
    options: [
      "High temperature",
      "High pressure",
      "Presence of a catalyst",
      "Diffused sunlight"
    ],
    correct_option: 3,
    subject: "Chemistry",
    explanation: "Hydrogen and chlorine react explosively in direct sunlight, but in diffused sunlight, they combine smoothly to form hydrogen chloride. It is a photochemical reaction."
  },
  {
    title: "Thermal dissociation differs from thermal decomposition because thermal dissociation is:",
    options: [
      "An irreversible reaction",
      "A reversible reaction",
      "Requires electricity instead of heat",
      "Forms a precipitate"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Thermal dissociation is a reversible breakdown of a compound into simpler substances upon heating. When cooled, the substances recombine. Decomposition is irreversible."
  },
  {
    title: "When copper carbonate is heated strongly, it turns from green to black. The black substance is:",
    options: [
      "Copper metal",
      "Copper(I) oxide",
      "Copper(II) oxide",
      "Carbon"
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "CuCO3 (green) decomposes on heating to form CuO (black) and CO2. This is a thermal decomposition reaction."
  }
];

async function run() {
  try {
    const gauntletData = {
      slug: 'class-9-chem-ch2-reactions-battle',
      title: 'Chemical Changes & Reactions [ICSE]',
      description: 'Test your mastery of chemical reactions! 15 questions on decomposition, displacement, and energy changes to boost your Class 9 ICSE prep. Score ≥80% for 20 Bonus Points!',
      subject: 'Chemistry',
      class_grade: '9',
      difficulty: 'medium',
      question_count: 15,
      time_minutes: 15,
      color: 'from-fuchsia-500 to-purple-600',
      reward: 'Reaction Master + 20 Bonus Points',
      is_active: true,
      reward_points: 20,
      reward_threshold_percent: 80,
      custom_questions: questions
    };

    const { data, error } = await supabase
      .from('gauntlets')
      .insert(gauntletData)
      .select('id');

    if (error) {
      console.error('Error inserting arena battle:', error);
    } else {
      console.log(`Successfully created Arena Battle for Class 9 Chemistry Chapter 2!`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();
