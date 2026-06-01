import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL    = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const questions = [
  // Chemical Reactions and Equations
  {
    chapter: "Chemical Reactions and Equations",
    title: "When 2g of silver chloride is exposed to sunlight, it turns grey. What type of reaction is this and what is the grey product?",
    options: ["Decomposition; Silver", "Combination; Silver", "Displacement; Chlorine", "Double Displacement; Silver"],
    correct_option: 0,
    hint: "Sunlight provides energy to break down the compound.",
    description: "Photolytic decomposition occurs, breaking AgCl into silver (grey) and chlorine gas."
  },
  {
    chapter: "Chemical Reactions and Equations",
    title: "Which of the following represents a balanced chemical equation for the reaction between lead(II) nitrate and potassium iodide?",
    options: ["Pb(NO3)2 + KI -> PbI2 + KNO3", "Pb(NO3)2 + 2KI -> PbI2 + 2KNO3", "2Pb(NO3)2 + KI -> 2PbI2 + KNO3", "Pb(NO3)2 + 2KI -> 2PbI2 + 2KNO3"],
    correct_option: 1,
    hint: "Ensure the number of atoms for each element is equal on both sides.",
    description: "The balanced equation is Pb(NO3)2(aq) + 2KI(aq) -> PbI2(s) + 2KNO3(aq)."
  },
  {
    chapter: "Chemical Reactions and Equations",
    title: "In the reaction: CuO + H2 -> Cu + H2O, which substance is oxidized and which is reduced?",
    options: ["H2 is oxidized, CuO is reduced", "CuO is oxidized, H2 is reduced", "Cu is oxidized, H2O is reduced", "H2O is oxidized, Cu is reduced"],
    correct_option: 0,
    hint: "Oxidation is the gain of oxygen; reduction is the loss of oxygen.",
    description: "H2 gains oxygen to become H2O (oxidized), and CuO loses oxygen to become Cu (reduced)."
  },
  // Acids, Bases and Salts
  {
    chapter: "Acids, Bases and Salts",
    title: "What happens when a solution of an acid is mixed with a solution of a base in a test tube?",
    options: ["Temperature decreases and salt is formed", "Temperature increases and salt is formed", "Temperature remains same and salt is formed", "Temperature increases and gas is evolved"],
    correct_option: 1,
    hint: "Neutralization is generally an exothermic process.",
    description: "Neutralization between an acid and a base is exothermic, releasing heat, and results in the formation of salt and water."
  },
  {
    chapter: "Acids, Bases and Salts",
    title: "Tooth enamel is made of calcium phosphate. What is its nature?",
    options: ["Basic", "Acidic", "Neutral", "Amphoteric"],
    correct_option: 0,
    hint: "Calcium is a metal, and phosphates of metals tend to neutralize acids.",
    description: "Calcium phosphate is basic in nature. It corrodes when the pH in the mouth falls below 5.5 due to acid-producing bacteria."
  },
  {
    chapter: "Acids, Bases and Salts",
    title: "An aqueous solution turns red litmus solution blue. Excess addition of which of the following solution would reverse the change?",
    options: ["Baking powder", "Lime", "Ammonium hydroxide solution", "Hydrochloric acid"],
    correct_option: 3,
    hint: "You need to neutralize a basic solution.",
    description: "The solution is basic (turns red litmus blue). To reverse this, an acid like HCl must be added."
  },
  // Metals and Non-Metals
  {
    chapter: "Metals and Non-Metals",
    title: "Which of the following pairs will give displacement reactions?",
    options: ["NaCl solution and copper metal", "MgCl2 solution and aluminium metal", "FeSO4 solution and silver metal", "AgNO3 solution and copper metal"],
    correct_option: 3,
    hint: "A more reactive metal displaces a less reactive metal from its salt solution.",
    description: "Copper is more reactive than silver, so it can displace silver from silver nitrate solution."
  },
  {
    chapter: "Metals and Non-Metals",
    title: "Aluminium is used for making cooking utensils. Which of the following properties of aluminium are responsible for the same? (i) Good thermal conductivity (ii) Good electrical conductivity (iii) Ductility (iv) High melting point",
    options: ["(i) and (ii)", "(i) and (iii)", "(ii) and (iii)", "(i) and (iv)"],
    correct_option: 3,
    hint: "Cooking utensils require materials that can withstand heat and transfer it efficiently.",
    description: "For cooking utensils, good thermal conductivity ensures even heating, and a high melting point prevents melting over a stove."
  },
  {
    chapter: "Metals and Non-Metals",
    title: "Which of the following non-metals is a liquid at room temperature?",
    options: ["Carbon", "Bromine", "Phosphorus", "Sulphur"],
    correct_option: 1,
    hint: "It is a halogen.",
    description: "Bromine is the only non-metal that is liquid at room temperature."
  },
  {
    chapter: "Metals and Non-Metals",
    title: "When calcium is treated with water, it: (i) does not react (ii) reacts violently (iii) reacts less violently (iv) bubbles of hydrogen gas formed stick to its surface",
    options: ["(i) and (iv)", "(ii) and (iii)", "(i) and (ii)", "(iii) and (iv)"],
    correct_option: 3,
    hint: "Calcium floats on water after reacting with it.",
    description: "Calcium reacts less violently with water than sodium/potassium, and the hydrogen gas bubbles stick to the metal, causing it to float."
  },
  // Carbon and its Compounds
  {
    chapter: "Carbon and its Compounds",
    title: "The soap molecule has a:",
    options: ["Hydrophilic head and a hydrophobic tail", "Hydrophobic head and a hydrophilic tail", "Hydrophobic head and a hydrophobic tail", "Hydrophilic head and a hydrophilic tail"],
    correct_option: 0,
    hint: "The head loves water, the tail loves oil.",
    description: "Soap molecules are sodium or potassium salts of long-chain carboxylic acids. The ionic group is the hydrophilic head, and the hydrocarbon chain is the hydrophobic tail."
  },
  {
    chapter: "Carbon and its Compounds",
    title: "Which of the following belongs to the homologous series of alkynes? C6H6, C2H6, C2H4, C3H4",
    options: ["C6H6", "C2H4", "C2H6", "C3H4"],
    correct_option: 3,
    hint: "Alkynes follow the general formula CnH2n-2.",
    description: "Propyne (C3H4) fits the formula CnH2n-2 where n=3 (2(3)-2 = 4)."
  },
  {
    chapter: "Carbon and its Compounds",
    title: "Identify the functional group present in CH3-CO-CH2-CH2-CH3.",
    options: ["Aldehyde", "Ketone", "Carboxylic Acid", "Alcohol"],
    correct_option: 1,
    hint: "Look at the -CO- group located in the middle of the carbon chain.",
    description: "The >C=O group situated between two alkyl groups indicates a ketone (Pentan-2-one)."
  },
  // Periodic Classification of Elements
  {
    chapter: "Periodic Classification of Elements",
    title: "Which of the following statements about the Modern Periodic Table is correct?",
    options: ["It has 18 horizontal rows known as Periods.", "It has 7 vertical columns known as Periods.", "It has 18 vertical columns known as Groups.", "It has 7 horizontal rows known as Groups."],
    correct_option: 2,
    hint: "Groups are vertical, periods are horizontal.",
    description: "The modern periodic table consists of 18 vertical columns called Groups and 7 horizontal rows called Periods."
  },
  {
    chapter: "Periodic Classification of Elements",
    title: "An element X forms a chloride with the formula XCl2, which is a solid with a high melting point. X would most likely be in the same group of the Periodic Table as:",
    options: ["Na", "Mg", "Al", "Si"],
    correct_option: 1,
    hint: "The formula XCl2 means X has a valency of 2.",
    description: "Since X forms XCl2, its valency is +2. Magnesium (Mg) belongs to Group 2 and has a valency of +2, forming MgCl2."
  },
  {
    chapter: "Periodic Classification of Elements",
    title: "As we move from left to right in a period, the atomic radius:",
    options: ["Increases", "Decreases", "First increases then decreases", "Does not change"],
    correct_option: 1,
    hint: "Effective nuclear charge plays a role.",
    description: "Atomic radius decreases across a period because the effective nuclear charge increases, pulling the electron cloud closer to the nucleus."
  },
  // Life Processes
  {
    chapter: "Life Processes",
    title: "In which part of the alimentary canal is food finally digested?",
    options: ["Stomach", "Mouth cavity", "Large intestine", "Small intestine"],
    correct_option: 3,
    hint: "It is the longest part of the alimentary canal.",
    description: "The small intestine is the site of complete digestion of carbohydrates, proteins, and fats."
  },
  {
    chapter: "Life Processes",
    title: "Oxygen liberated during photosynthesis comes from:",
    options: ["Water", "Chlorophyll", "Carbon dioxide", "Glucose"],
    correct_option: 0,
    hint: "Photolysis occurs during the light reaction.",
    description: "Oxygen is released from the photolysis (splitting) of water molecules during the light-dependent reactions of photosynthesis."
  },
  {
    chapter: "Life Processes",
    title: "The breakdown of pyruvate to give carbon dioxide, water and energy takes place in:",
    options: ["Cytoplasm", "Mitochondria", "Chloroplast", "Nucleus"],
    correct_option: 1,
    hint: "This process requires oxygen and occurs in the 'powerhouse' of the cell.",
    description: "Aerobic respiration breaks down pyruvate in the mitochondria to produce CO2, water, and a large amount of ATP."
  },
  // Control and Coordination
  {
    chapter: "Control and Coordination",
    title: "Which of the following is a plant hormone?",
    options: ["Insulin", "Thyroxin", "Oestrogen", "Cytokinin"],
    correct_option: 3,
    hint: "It promotes cell division.",
    description: "Cytokinin is a plant hormone that promotes cell division, especially in roots and shoots."
  },
  {
    chapter: "Control and Coordination",
    title: "The gap between two neurons is called a:",
    options: ["Dendrite", "Synapse", "Axon", "Impulse"],
    correct_option: 1,
    hint: "Chemicals cross this gap to transmit signals.",
    description: "The synapse is the microscopic gap between the axon terminal of one neuron and the dendrite of another."
  },
  {
    chapter: "Control and Coordination",
    title: "Involuntary actions in the body are controlled by:",
    options: ["Medulla in forebrain", "Medulla in midbrain", "Medulla in hindbrain", "Medulla in spinal cord"],
    correct_option: 2,
    hint: "The lower part of the brain controls breathing and heart rate.",
    description: "The medulla oblongata is located in the hindbrain and controls involuntary actions like blood pressure, salivation, and vomiting."
  },
  // How do Organisms Reproduce?
  {
    chapter: "How do Organisms Reproduce?",
    title: "Which of the following is not a part of the female reproductive system in human beings?",
    options: ["Ovary", "Uterus", "Vas deferens", "Fallopian tube"],
    correct_option: 2,
    hint: "This part is responsible for carrying sperm.",
    description: "The vas deferens is part of the male reproductive system, transporting sperm from the epididymis to the ejaculatory duct."
  },
  {
    chapter: "How do Organisms Reproduce?",
    title: "The anther contains:",
    options: ["Sepals", "Ovules", "Carpel", "Pollen grains"],
    correct_option: 3,
    hint: "These are the male gametophytes of a plant.",
    description: "The anther is the pollen-bearing part of a stamen, where pollen grains are produced."
  },
  {
    chapter: "How do Organisms Reproduce?",
    title: "In a flower, the parts that produce male and female gametes (germ cells) are:",
    options: ["Stamen and anther", "Filament and stigma", "Anther and ovary", "Stamen and style"],
    correct_option: 2,
    hint: "Look for the specific pollen-producing and egg-producing structures.",
    description: "The anther produces male gametes (pollen), and the ovary produces female gametes (ovules)."
  },
  // Heredity and Evolution
  {
    chapter: "Heredity and Evolution",
    title: "A Mendelian experiment consisted of breeding tall pea plants bearing violet flowers with short pea plants bearing white flowers. The progeny all bore violet flowers, but almost half of them were short. This suggests that the genetic make-up of the tall parent can be depicted as:",
    options: ["TTWW", "TTww", "TtWW", "TtWw"],
    correct_option: 2,
    hint: "Since all progeny had violet flowers, the parent must be homozygous dominant for color. Since half were short, it must be heterozygous for height.",
    description: "Tallness is heterozygous (Tt) to produce short offspring (tt) when crossed with short. Flower color is homozygous dominant (WW) since all offspring are violet."
  },
  {
    chapter: "Heredity and Evolution",
    title: "In humans, if an egg is fertilized by a sperm bearing a Y-chromosome, what will be the sex of the child?",
    options: ["Female", "Male", "Cannot be determined", "Hermaphrodite"],
    correct_option: 1,
    hint: "Females are XX and males are XY.",
    description: "The egg always carries an X chromosome. If the sperm carries a Y, the resulting zygote is XY, which develops into a male."
  },
  {
    chapter: "Heredity and Evolution",
    title: "The two versions of a trait (character) which are brought in by the male and female gametes are situated on:",
    options: ["Copies of the same chromosome", "Two different chromosomes", "Sex chromosomes", "Any chromosome"],
    correct_option: 0,
    hint: "These are called homologous chromosomes.",
    description: "Alleles for a specific trait are located at the same locus on homologous chromosomes (copies of the same chromosome from each parent)."
  },
  // Light - Reflection and Refraction
  {
    chapter: "Light - Reflection and Refraction",
    title: "Where should an object be placed in front of a convex lens to get a real image of the size of the object?",
    options: ["At the principal focus of the lens", "At twice the focal length", "At infinity", "Between the optical centre of the lens and its principal focus"],
    correct_option: 1,
    hint: "Think about the center of curvature equivalent for lenses.",
    description: "When an object is placed at 2F1 (twice the focal length), the convex lens forms a real, inverted image of the same size at 2F2."
  },
  {
    chapter: "Light - Reflection and Refraction",
    title: "No matter how far you stand from a mirror, your image appears erect. The mirror is likely to be:",
    options: ["Plane", "Concave", "Convex", "Either plane or convex"],
    correct_option: 3,
    hint: "Which mirrors never form an inverted real image regardless of distance?",
    description: "Both plane mirrors and convex mirrors always form virtual and erect images of objects, regardless of the distance."
  },
  {
    chapter: "Light - Reflection and Refraction",
    title: "A spherical mirror and a thin spherical lens have each a focal length of -15 cm. The mirror and the lens are likely to be:",
    options: ["Both concave", "Both convex", "the mirror is concave, but the lens is convex", "the mirror is convex, but the lens is concave"],
    correct_option: 0,
    hint: "According to the new Cartesian sign convention, negative focal lengths belong to diverging/converging specific shapes.",
    description: "Both concave mirrors and concave lenses have negative focal lengths according to the sign convention."
  },
  {
    chapter: "Light - Reflection and Refraction",
    title: "The refractive index of water is 1.33. The speed of light in water will be:",
    options: ["1.33 x 10^8 m/s", "3 x 10^8 m/s", "2.26 x 10^8 m/s", "2.66 x 10^8 m/s"],
    correct_option: 2,
    hint: "Speed in medium = Speed in vacuum / Refractive Index.",
    description: "v = c / n = (3 * 10^8) / 1.33 ≈ 2.256 * 10^8 m/s."
  },
  // Human Eye and Colourful World
  {
    chapter: "Human Eye and Colourful World",
    title: "The human eye forms the image of an object at its:",
    options: ["Cornea", "Iris", "Pupil", "Retina"],
    correct_option: 3,
    hint: "It acts like the screen of a camera.",
    description: "The retina is the light-sensitive layer at the back of the eye where the image is formed."
  },
  {
    chapter: "Human Eye and Colourful World",
    title: "The change in focal length of an eye lens is caused by the action of the:",
    options: ["Pupil", "Retina", "Ciliary muscles", "Iris"],
    correct_option: 2,
    hint: "These muscles change the curvature of the lens.",
    description: "The ciliary muscles adjust the curvature, and thus the focal length, of the eye lens to focus on objects at various distances."
  },
  {
    chapter: "Human Eye and Colourful World",
    title: "A person cannot see distinctly objects kept beyond 2m. This defect can be corrected by using a lens of power:",
    options: ["+0.5 D", "-0.5 D", "+0.2 D", "-0.2 D"],
    correct_option: 1,
    hint: "The person is myopic, so they need a concave lens. P = 1/f.",
    description: "For myopia, far point = 2m. Therefore, f = -2m. Power P = 1/f = 1/(-2) = -0.5 Dioptres."
  },
  {
    chapter: "Human Eye and Colourful World",
    title: "Which of the following phenomena of light are involved in the formation of a rainbow?",
    options: ["Reflection, refraction and dispersion", "Refraction, dispersion and total internal reflection", "Refraction, dispersion and internal reflection", "Dispersion, scattering and total internal reflection"],
    correct_option: 2,
    hint: "Water droplets act as tiny prisms.",
    description: "A rainbow is formed by refraction, dispersion, and internal reflection of sunlight by tiny water droplets."
  },
  // Electricity
  {
    chapter: "Electricity",
    title: "When a 12V battery is connected across an unknown resistor, there is a current of 2.5 mA in the circuit. The value of the resistance of the resistor is:",
    options: ["4.8 Ω", "4800 Ω", "0.48 Ω", "480 Ω"],
    correct_option: 1,
    hint: "Convert mA to A. R = V / I.",
    description: "I = 2.5 mA = 0.0025 A. R = V / I = 12 / 0.0025 = 4800 Ω."
  },
  {
    chapter: "Electricity",
    title: "Two conducting wires of the same material and of equal lengths and equal diameters are first connected in series and then parallel in a circuit across the same potential difference. The ratio of heat produced in series and parallel combinations would be:",
    options: ["1:2", "2:1", "1:4", "4:1"],
    correct_option: 2,
    hint: "Heat produced H = (V^2 / R_eq) * t.",
    description: "Rs = 2R, Rp = R/2. Ratio of heat = (V^2/Rs) / (V^2/Rp) = Rp/Rs = (R/2)/(2R) = 1/4 or 1:4."
  },
  {
    chapter: "Electricity",
    title: "Which of the following represents electrical power in a circuit?",
    options: ["I^2R", "IR^2", "V^2/R", "Both I^2R and V^2/R"],
    correct_option: 3,
    hint: "Power can be expressed using V, I, and R.",
    description: "P = VI. Substituting V = IR gives P = I^2R. Substituting I = V/R gives P = V^2/R. Both are correct."
  },
  {
    chapter: "Electricity",
    title: "An electric bulb is rated 220 V and 100 W. When it is operated on 110 V, the power consumed will be:",
    options: ["100 W", "75 W", "50 W", "25 W"],
    correct_option: 3,
    hint: "Resistance remains constant. Power is proportional to the square of the voltage.",
    description: "R = V^2/P = 220^2/100 = 484 Ω. At 110V, P = V^2/R = 110^2/484 = 25 W."
  },
  // Magnetic Effects of Electric Current
  {
    chapter: "Magnetic Effects of Electric Current",
    title: "Which of the following correctly describes the magnetic field near a long straight wire?",
    options: ["The field consists of straight lines perpendicular to the wire.", "The field consists of straight lines parallel to the wire.", "The field consists of radial lines originating from the wire.", "The field consists of concentric circles centred on the wire."],
    correct_option: 3,
    hint: "Use the right-hand thumb rule.",
    description: "According to the right-hand thumb rule, the magnetic field lines around a straight current-carrying wire form concentric circles."
  },
  {
    chapter: "Magnetic Effects of Electric Current",
    title: "The phenomenon of electromagnetic induction is:",
    options: ["the process of charging a body.", "the process of generating magnetic field due to a current passing through a coil.", "producing induced current in a coil due to relative motion between a magnet and the coil.", "the process of rotating a coil of an electric motor."],
    correct_option: 2,
    hint: "Think of Faraday's experiments.",
    description: "Electromagnetic induction is the production of an induced emf (and current) by a changing magnetic field."
  },
  {
    chapter: "Magnetic Effects of Electric Current",
    title: "To convert an AC generator into a DC generator:",
    options: ["split-ring type commutator must be used.", "slip rings and brushes must be used.", "a stronger magnetic field has to be used.", "a rectangular wire loop has to be used."],
    correct_option: 0,
    hint: "This device reverses the current direction every half rotation.",
    description: "A split-ring commutator acts as a reversing switch, ensuring the current in the external circuit flows in one direction."
  },
  {
    chapter: "Magnetic Effects of Electric Current",
    title: "At the time of short circuit, the current in the circuit:",
    options: ["reduces substantially.", "does not change.", "increases heavily.", "varies continuously."],
    correct_option: 2,
    hint: "Short circuit happens when live and neutral wires touch.",
    description: "A short circuit reduces the resistance drastically, causing a massive surge in current, which can lead to fires."
  },
  // Sources of Energy
  {
    chapter: "Sources of Energy",
    title: "Which of the following is a non-renewable source of energy?",
    options: ["Wood", "Sun", "Fossil fuels", "Wind"],
    correct_option: 2,
    hint: "Takes millions of years to form.",
    description: "Fossil fuels like coal and petroleum are non-renewable as they are depleted much faster than they are formed."
  },
  {
    chapter: "Sources of Energy",
    title: "Acid rain happens because:",
    options: ["Sun heats up the upper layer of atmosphere", "burning of fossil fuels releases oxides of carbon, nitrogen and sulphur in the atmosphere", "electrical charges are produced due to friction amongst clouds", "earth atmosphere contains acids"],
    correct_option: 1,
    hint: "It is a consequence of pollution from burning certain fuels.",
    description: "Oxides of nitrogen and sulphur react with water vapor to form nitric and sulphuric acids, causing acid rain."
  },
  {
    chapter: "Sources of Energy",
    title: "Ocean thermal energy is due to:",
    options: ["energy stored by waves in the ocean.", "temperature difference at different levels in the ocean.", "pressure difference at different levels in the ocean.", "tides arising out in the ocean."],
    correct_option: 1,
    hint: "The word 'thermal' relates to temperature.",
    description: "Ocean Thermal Energy Conversion (OTEC) uses the temperature difference between the warm surface water and cold deep water to generate electricity."
  },
  // Our Environment
  {
    chapter: "Our Environment",
    title: "Which of the following constitute a food-chain?",
    options: ["Grass, wheat and mango", "Grass, goat and human", "Goat, cow and elephant", "Grass, fish and goat"],
    correct_option: 1,
    hint: "Look for a sequence where one organism eats the previous one.",
    description: "Grass is the producer, goat is the primary consumer (herbivore), and human is the secondary consumer."
  },
  {
    chapter: "Our Environment",
    title: "Which of the following are environment-friendly practices?",
    options: ["Carrying cloth-bags to put purchases in while shopping", "Switching off unnecessary lights and fans", "Walking to school instead of getting your mother to drop you on her scooter", "All of the above"],
    correct_option: 3,
    hint: "Practices that reduce waste and energy consumption.",
    description: "All these actions reduce resource usage and pollution, contributing to environmental conservation."
  },
  {
    chapter: "Our Environment",
    title: "Depletion of ozone is mainly due to:",
    options: ["Chlorofluorocarbon compounds", "Carbon monoxide", "Methane", "Pesticides"],
    correct_option: 0,
    hint: "Found in older refrigerants.",
    description: "CFCs are synthetic chemicals that rise to the stratosphere and break down ozone molecules."
  }
];

async function run() {
  console.log('Logging in to Supabase...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error('Login failed:', authError); return; }
  const teacherId = authData.session.user.id;
  console.log('Logged in as teacher:', teacherId);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  console.log('Uploading 50 manually crafted hard questions for Class 10 Science...');

  let ok = 0, fail = 0;
  for (const q of questions) {
    const { error } = await adminClient.from('questions').insert({
      created_by:    teacherId,
      title:         q.title,
      body:          '',
      subject:       'Science',
      class_grade:   '10',
      chapter:       q.chapter,
      points:        3, // As requested: 3 points each
      time_limit:    2,
      difficulty:    'hard',
      options:       q.options,
      correct_option: q.correct_option,
      explanation:   q.description, // Correct column name
      hint:          q.hint,
      image_path:    null,
      image_url:     null,
    });
    if (error) { 
      console.error(`Failed: ${q.title?.slice(0, 60)} - ${error.message}`); 
      fail++; 
    } else {
      ok++;
      console.log(`Inserted question ${ok}/${questions.length}: ${q.title?.slice(0, 40)}...`);
    }
    await delay(50);
  }
  console.log(`Done! ${ok} added, ${fail} failed.`);
}

run();
