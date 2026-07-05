const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const questions = [
  {
    title: "According to the kinetic theory of matter, what happens to the kinetic energy of particles when a solid is heated?",
    options: [
      "It decreases, causing particles to move closer.",
      "It remains constant until the solid melts.",
      "It increases, causing particles to vibrate more vigorously.",
      "It converts completely into potential energy."
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "Heating a solid supplies thermal energy, which is converted into the kinetic energy of the particles. This causes them to vibrate more vigorously about their mean positions.",
    hint: "Think about what heat does to the movement of particles."
  },
  {
    title: "Which of the following phenomena best proves that particles of matter have spaces between them?",
    options: [
      "Sublimation of iodine crystals",
      "Dissolving sugar in water without an increase in volume",
      "Expansion of a metal ring on heating",
      "Condensation of water vapor on a cold glass"
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "When sugar dissolves in water, its particles occupy the intermolecular spaces between the water molecules, resulting in no significant increase in the overall volume of the liquid.",
    hint: "Why doesn't a glass overflow immediately when you stir a spoon of salt into it?"
  },
  {
    title: "During the process of boiling, the temperature of a liquid:",
    options: [
      "Increases continuously",
      "Decreases gradually",
      "Remains constant until all liquid turns to gas",
      "Fluctuates depending on the heat supplied"
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "During a change of state (like boiling), the temperature remains constant. The heat supplied (latent heat) is used entirely to overcome the intermolecular forces of attraction.",
    hint: "What happens to the thermometer reading while water is boiling actively?"
  },
  {
    title: "A substance 'X' has a definite volume but no definite shape. It is highly incompressible. What is the most likely state of 'X'?",
    options: ["Solid", "Liquid", "Gas", "Plasma"],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Liquids have a definite volume but take the shape of their container. Because their particles are still quite close together, they are almost incompressible.",
    hint: "It can flow, but you can't easily squeeze it into a smaller space."
  },
  {
    title: "Why does a gas exert pressure on the walls of its container?",
    options: [
      "Because gas molecules are heavy.",
      "Due to the continuous, random collisions of high-kinetic-energy particles against the walls.",
      "Because of the strong intermolecular forces pulling the walls inward.",
      "Because gases have a fixed volume."
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Gas particles are in constant, rapid, random motion. They continuously collide with each other and the walls of the container, exerting a force per unit area, which is pressure.",
    hint: "Think about millions of tiny balls bouncing against a wall."
  },
  {
    title: "Which of the following substances undergoes sublimation at room temperature?",
    options: ["Sodium chloride", "Ice", "Naphthalene", "Wax"],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "Naphthalene (used in mothballs), camphor, dry ice, and iodine undergo sublimation—changing directly from a solid to a gas without passing through the liquid state.",
    hint: "Think about mothballs disappearing in your closet over time."
  },
  {
    title: "As intermolecular space increases, the intermolecular force of attraction generally:",
    options: ["Increases", "Decreases", "Remains unaffected", "Becomes repulsive"],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Intermolecular forces are inversely related to intermolecular spaces. As particles move further apart (e.g., from solid to liquid to gas), the force of attraction between them weakens.",
    hint: "Are magnets stronger when they are close together or far apart?"
  },
  {
    title: "Evaporation causes cooling. This is because:",
    options: [
      "The liquid absorbs cold air from the surroundings.",
      "Particles with the lowest kinetic energy escape, leaving the liquid hotter.",
      "Particles with the highest kinetic energy escape, lowering the average kinetic energy of the remaining liquid.",
      "The liquid releases heat into the atmosphere to freeze."
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "Evaporation is a surface phenomenon where the most energetic particles escape. This leaves behind particles with lower average kinetic energy, which translates to a lower temperature (cooling effect).",
    hint: "If the fastest runners leave the group, what happens to the average speed of the group?"
  },
  {
    title: "The direct conversion of a gas into a solid without passing through the liquid state is called:",
    options: ["Condensation", "Sublimation", "Deposition", "Vaporization"],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "While sublimation is solid to gas, the reverse process (gas directly to solid) is specifically called deposition or desublimation (e.g., frost forming on a cold window).",
    hint: "Also known as desublimation. Think of frost depositing on a leaf."
  },
  {
    title: "Which state of matter possesses the highest intermolecular force of attraction and the lowest kinetic energy?",
    options: ["Solid", "Liquid", "Gas", "Vapor"],
    correct_option: 0,
    subject: "Chemistry",
    explanation: "In solids, particles are tightly packed due to very strong intermolecular forces. Because they are held rigidly, they only vibrate and possess the lowest kinetic energy.",
    hint: "Which state is the hardest to break or compress?"
  },
  {
    title: "When a gas is compressed into a smaller volume, what happens to its intermolecular space?",
    options: ["It increases", "It decreases", "It remains the same", "It becomes zero"],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Gases are highly compressible because they have large intermolecular spaces. When compressed, the particles are forced closer together, decreasing the space between them.",
    hint: "If you push things closer together, what happens to the gap between them?"
  },
  {
    title: "What differentiates evaporation from boiling?",
    options: [
      "Evaporation requires an external heat source; boiling does not.",
      "Evaporation occurs only at the surface at any temperature; boiling occurs throughout the liquid at a specific temperature.",
      "Boiling is a slow process; evaporation is rapid.",
      "Evaporation produces vapor; boiling produces plasma."
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Evaporation is a slow, surface phenomenon that happens at any temperature. Boiling is a rapid, bulk phenomenon that only occurs at a specific temperature (the boiling point).",
    hint: "Does a puddle need to reach 100°C to dry up?"
  },
  {
    title: "If the temperature of a gas is increased while keeping the container volume constant, the pressure will:",
    options: ["Decrease", "Increase", "Remain constant", "Become zero"],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Heating a gas increases the kinetic energy of its particles. They will collide with the container walls more frequently and with greater force, increasing the pressure.",
    hint: "Hotter particles move faster. What happens when they hit the walls?"
  },
  {
    title: "In which state of matter can particles only vibrate about their mean positions?",
    options: ["Liquids", "Gases", "Solids", "Both solids and liquids"],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "Due to the strong cohesive forces in solids, particles are fixed in their positions and cannot translate or rotate; they can only vibrate.",
    hint: "Think of a state where shape is completely fixed."
  },
  {
    title: "Which process is responsible for the spreading of the fragrance of an incense stick across a room?",
    options: ["Osmosis", "Diffusion", "Sublimation", "Effusion"],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Diffusion is the movement of particles from an area of higher concentration to lower concentration. Gas particles have high kinetic energy, allowing them to mix rapidly with air.",
    hint: "The natural mixing of particles due to their random motion."
  },
  {
    title: "Which of the following statements about liquids is FALSE?",
    options: [
      "They have a definite volume.",
      "They take the shape of their container.",
      "Their intermolecular forces are stronger than in solids.",
      "They can flow from a higher level to a lower level."
    ],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "The intermolecular forces in liquids are weaker than in solids (which allows them to flow) but stronger than in gases.",
    hint: "Compare the rigidity of ice (solid) to water (liquid)."
  },
  {
    title: "What is the term for the temperature at which a solid changes into a liquid at normal atmospheric pressure?",
    options: ["Boiling point", "Freezing point", "Melting point", "Condensation point"],
    correct_option: 2,
    subject: "Chemistry",
    explanation: "The melting point is the specific temperature at which the solid state and liquid state of a substance exist in equilibrium.",
    hint: "The point where ice turns to water."
  },
  {
    title: "Matter is anything that:",
    options: [
      "Can be seen and touched.",
      "Has mass and occupies space.",
      "Has a fixed shape and volume.",
      "Exists only on Earth."
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "The fundamental scientific definition of matter is anything that has mass (weight) and occupies space (has volume). Gases are matter, even if they can't be seen.",
    hint: "Even invisible air fits this definition."
  },
  {
    title: "Why are gases highly compressible compared to solids and liquids?",
    options: [
      "Their particles are extremely small.",
      "They have very weak intermolecular forces and large intermolecular spaces.",
      "They do not have mass.",
      "Their particles are stationary."
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "The large empty spaces between gas molecules allow them to be pushed closer together (compressed) when pressure is applied.",
    hint: "Think about the empty space between the particles."
  },
  {
    title: "When water freezes to form ice, it shows an anomalous (unusual) behavior. What is it?",
    options: [
      "It absorbs heat instead of releasing it.",
      "Its volume increases instead of decreasing.",
      "Its intermolecular spaces become zero.",
      "It turns blue."
    ],
    correct_option: 1,
    subject: "Chemistry",
    explanation: "Most substances contract upon freezing, but water expands. The intermolecular structure of ice is a cage-like hexagonal lattice that occupies more volume than liquid water, making ice less dense (which is why it floats).",
    hint: "Why does a glass bottle full of water burst if left in the freezer?"
  }
];

async function run() {
  try {
    const gauntletData = {
      slug: 'class-7-chem-ch1-matter-battle',
      title: 'Matter & Composition [ICSE]',
      description: '20 high-level analytical questions on Matter, Kinetic Theory, and Change of State to prep you for your exams. Score ≥80% for 60 Arena Points!',
      subject: 'Chemistry',
      class_grade: '7',
      difficulty: 'hard',
      question_count: 20,
      time_minutes: 20,
      color: 'from-orange-500 to-rose-600',
      reward: 'Matter Analyst + 60 Bonus Points',
      is_active: true,
      reward_points: 60,
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
      console.log(`Successfully created Arena Battle for Chemistry Chapter 1!`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();
