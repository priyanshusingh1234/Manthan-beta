const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const TEACHER_ID = '83ea8424-f849-4773-b1fc-aaa987d33b2b';

const questions = [
  {
    title: "A student performs a reaction in a sealed flask. They mix 10g of substance A and 15g of substance B. After the reaction, what will be the total mass inside the sealed flask?",
    options: ["25g", "Less than 25g because some gas escaped", "More than 25g because a new solid formed", "Cannot be determined without knowing the products"],
    correct_option: 0,
    hint: "Think about the Law of Conservation of Mass in a closed system.",
    explanation: "According to the Law of Conservation of Mass, matter cannot be created or destroyed. Because the flask is sealed, no gas can escape, meaning the total mass of the products must exactly equal the total mass of the reactants (10g + 15g = 25g)."
  },
  {
    title: "A sample of pure water from a river contains 88.89% oxygen and 11.11% hydrogen by mass. If a scientist creates water synthetically in a lab, what will be the percentage of oxygen in it?",
    options: ["It will vary depending on how much hydrogen was used.", "Exactly 88.89% oxygen.", "Exactly 11.11% oxygen.", "It depends on the temperature of the laboratory."],
    correct_option: 1,
    hint: "Recall the Law of Definite Proportions (Constant Proportions).",
    explanation: "The Law of Constant Proportions states that a chemical compound always contains exactly the same proportion of elements by mass, regardless of its source or method of preparation. Therefore, synthetic water will also have 88.89% oxygen."
  },
  {
    title: "If Dalton's Atomic Theory states that atoms of different elements have different masses, how does this explain the formation of compounds with constant proportions?",
    options: ["Atoms change their mass when they combine.", "Compounds are formed by atoms combining in simple, fixed, whole-number ratios.", "The mass of atoms fluctuates to maintain the proportion.", "Only atoms with the same mass can combine."],
    correct_option: 1,
    hint: "How do individual atoms form molecules according to Dalton?",
    explanation: "Dalton theorized that atoms of different elements combine in fixed, simple whole-number ratios to form compounds. Because each atom has a specific mass, a fixed ratio of atoms naturally results in a fixed ratio of mass (Law of Constant Proportions)."
  },
  {
    title: "You are given three samples: 1 mole of carbon (C), 1 mole of oxygen gas (O2), and 1 mole of water (H2O). Which sample contains the greatest number of particles (atoms/molecules)?",
    options: ["1 mole of water", "1 mole of oxygen gas", "1 mole of carbon", "All contain the exact same number of particles"],
    correct_option: 3,
    hint: "What is the definition of a 'mole'?",
    explanation: "By definition, one mole of any substance always contains exactly Avogadro's number (6.022 × 10^23) of representative particles (atoms for C, molecules for O2 and H2O). Therefore, they all contain the same number of particles."
  },
  {
    title: "Which of the following scenarios best demonstrates atomicity?",
    options: ["Sodium chloride dissolving in water to form Na+ and Cl- ions.", "Ozone existing as O3 while atmospheric oxygen exists as O2.", "Carbon isotopes having different atomic masses.", "Water boiling and turning into steam."],
    correct_option: 1,
    hint: "Atomicity refers to the number of atoms in a single molecule of an element.",
    explanation: "Atomicity is the total number of atoms that constitute a molecule of an element. Ozone being O3 (atomicity 3) and oxygen being O2 (atomicity 2) is a direct demonstration of this concept."
  },
  {
    title: "A chemist is given an unknown compound MX2. If M has a valency of +2, what must be the valency of X?",
    options: ["-1", "-2", "+1", "+2"],
    correct_option: 0,
    hint: "The overall compound must be electrically neutral.",
    explanation: "To balance the +2 charge of a single M atom, the two X atoms must provide a total charge of -2. Therefore, each X atom must have a valency (or oxidation state) of -1. (e.g., MgCl2)"
  },
  {
    title: "If 3 grams of carbon completely reacts with 8 grams of oxygen to form 11 grams of carbon dioxide, what mass of carbon dioxide will be formed if 3 grams of carbon reacts with 50 grams of oxygen?",
    options: ["53 grams", "11 grams", "14 grams", "47 grams"],
    correct_option: 1,
    hint: "The reaction follows the Law of Constant Proportions. What happens to the excess oxygen?",
    explanation: "Carbon and oxygen react in a fixed mass ratio of 3:8. Even if 50g of oxygen is present, only 8g will react with the 3g of carbon to form 11g of CO2. The remaining 42g of oxygen will be left unreacted."
  },
  {
    title: "Consider an ion of Aluminum (Al³⁺). How does it differ from a neutral Aluminum atom (Al)?",
    options: ["It has 3 more protons.", "It has 3 fewer protons.", "It has 3 fewer electrons.", "It has 3 more electrons."],
    correct_option: 2,
    hint: "Positive charges are formed by the loss of negative particles.",
    explanation: "Protons are located in the nucleus and cannot be easily added or removed. Ions are formed by the gain or loss of electrons. A +3 charge means the atom has lost 3 negatively charged electrons."
  },
  {
    title: "Why is the unified atomic mass unit (u) based on the Carbon-12 isotope rather than Hydrogen-1?",
    options: ["Hydrogen-1 is too unstable.", "Carbon-12 allows the atomic masses of most other elements to be closer to whole numbers.", "Carbon is more abundant than Hydrogen in the universe.", "Carbon-12 has exactly 12 electrons, making calculations easier."],
    correct_option: 1,
    hint: "Consider how atomic masses are used in practical calculations.",
    explanation: "In 1961, IUPAC adopted Carbon-12 as the standard because using exactly 1/12th the mass of a C-12 atom makes the relative atomic masses of most other elements very close to whole numbers, simplifying calculations."
  },
  {
    title: "A student writes the formula for Magnesium Phosphate as MgPO4. Is this correct? If not, why?",
    options: ["Yes, it is correct.", "No, Mg has valency +1, so it should be Mg3PO4.", "No, Mg has valency +2 and PO4 has valency -3, so it should be Mg3(PO4)2.", "No, Mg has valency +3 and PO4 has valency -2, so it should be Mg2(PO4)3."],
    correct_option: 2,
    hint: "Use the criss-cross method. Magnesium is Group 2.",
    explanation: "Magnesium (Mg) has a valency of +2. The phosphate polyatomic ion (PO4) has a valency of -3. Criss-crossing these valencies gives the correct formula: Mg3(PO4)2."
  },
  {
    title: "You have 10 grams of H2 gas and 10 grams of O2 gas. Which container has more molecules?",
    options: ["The H2 container", "The O2 container", "They have the same number of molecules", "Cannot be determined"],
    correct_option: 0,
    hint: "Convert mass to moles to compare the number of molecules. (Molar mass H2 = 2g, O2 = 32g)",
    explanation: "Moles of H2 = 10g / 2g/mol = 5 moles. Moles of O2 = 10g / 32g/mol = 0.3125 moles. Since 1 mole = 6.022x10^23 molecules, the container with more moles (H2) has significantly more molecules."
  },
  {
    title: "If a new element 'X' has atomic mass 24u and combines with Oxygen (16u) in a 3:2 mass ratio, what is the empirical formula of the compound formed?",
    options: ["XO", "X2O3", "XO2", "X3O2"],
    correct_option: 0,
    hint: "Find the mole ratio by dividing the mass ratio by the atomic masses.",
    explanation: "Moles of X = 3g / 24u = 1/8 mol. Moles of O = 2g / 16u = 1/8 mol. The ratio of moles of X to O is 1:1. Therefore, the empirical formula is XO."
  },
  {
    title: "How many atoms of Oxygen are present in 0.1 moles of Na2CO3·10H2O (Washing soda)?",
    options: ["1.3 × 6.022 × 10^23 atoms", "13 × 6.022 × 10^23 atoms", "0.3 × 6.022 × 10^23 atoms", "1.0 × 6.022 × 10^23 atoms"],
    correct_option: 0,
    hint: "Count the total oxygen atoms in one molecule, then multiply by 0.1 moles.",
    explanation: "One molecule of Na2CO3·10H2O contains 3 (from carbonate) + 10 (from water) = 13 oxygen atoms. 0.1 moles of the compound contains 1.3 moles of oxygen atoms. Total atoms = 1.3 × (6.022 × 10^23)."
  },
  {
    title: "Which of the following compounds contains both a polyatomic cation and a polyatomic anion?",
    options: ["Ammonium chloride (NH4Cl)", "Sodium sulfate (Na2SO4)", "Ammonium nitrate (NH4NO3)", "Calcium hydroxide (Ca(OH)2)"],
    correct_option: 2,
    hint: "Look for a compound where both the positive and negative parts consist of multiple atoms.",
    explanation: "In Ammonium nitrate, the cation is Ammonium (NH4+) which is polyatomic, and the anion is Nitrate (NO3-) which is also polyatomic. The others contain at least one monoatomic ion."
  },
  {
    title: "When writing the chemical formula for Calcium Chloride, why do we write CaCl2 instead of Ca2Cl?",
    options: ["Because calcium is diatomic.", "Because the valency of calcium is +2 and chlorine is -1.", "Because chlorine is heavier than calcium.", "Because calcium exists as a +1 ion in nature."],
    correct_option: 1,
    hint: "How many chlorine atoms are needed to balance one calcium atom?",
    explanation: "Calcium belongs to Group 2 and has a valency of +2. Chlorine is a halogen with a valency of -1. To create a neutral compound, two chloride ions (-1 each) are needed to balance one calcium ion (+2), resulting in CaCl2."
  },
  {
    title: "A sample of gas contains 3.011 × 10^23 molecules. If the mass of this sample is 14 grams, identify the gas.",
    options: ["O2", "N2", "CO2", "H2"],
    correct_option: 1,
    hint: "Find the molar mass. The sample is 0.5 moles.",
    explanation: "3.011 × 10^23 is exactly half of Avogadro's number, so the sample is 0.5 moles. If 0.5 moles = 14g, then 1 mole = 28g/mol. The molar mass of N2 is 14×2 = 28g/mol, so the gas is Nitrogen (N2)."
  },
  {
    title: "Why did John Dalton use symbols like circles with dots or crosses to represent elements, whereas we now use letters (e.g., C, H, O)?",
    options: ["Letters had not been invented yet.", "Berzelius later proposed using letters derived from the elements' names for simplicity and universal standardisation.", "Dalton's symbols were based on the actual physical shape of the atoms.", "Letters are only used for molecules, not atoms."],
    correct_option: 1,
    hint: "Who reformed the naming system to make it easier to write?",
    explanation: "Dalton originally created pictorial symbols. However, J.J. Berzelius suggested using one or two letters from the element's name (often Latin) because it was much easier to write, memorize, and standardize globally."
  },
  {
    title: "If you have 18g of liquid water, 18g of ice, and 18g of steam, how do the number of molecules in each state compare?",
    options: ["Steam has the most molecules because it occupies the most volume.", "Ice has the most molecules because it is a solid.", "Liquid water has the most molecules.", "All three have exactly the same number of molecules."],
    correct_option: 3,
    hint: "Does the state of matter affect the mass or molar mass?",
    explanation: "The molar mass of H2O is 18g/mol regardless of its physical state. 18g of H2O is always exactly 1 mole, meaning there are 6.022 × 10^23 molecules in all three samples. Volume and state do not change the number of particles for a given mass."
  },
  {
    title: "An element 'E' forms an oxide E2O3. What will be the formula of its chloride?",
    options: ["ECl", "ECl2", "ECl3", "E2Cl3"],
    correct_option: 2,
    hint: "Determine the valency of E from the oxide formula, then criss-cross with chlorine (valency 1).",
    explanation: "In E2O3, since oxygen has a valency of 2, element E must have a valency of 3. When E (valency 3) combines with Chlorine (valency 1), the resulting formula is ECl3."
  },
  {
    title: "Which of the following violates Dalton's atomic theory in modern science?",
    options: ["The existence of isotopes.", "The fact that compounds have fixed formulas.", "The Law of Conservation of Mass.", "The fact that elements combine to form molecules."],
    correct_option: 0,
    hint: "Dalton said atoms of the same element are identical in mass.",
    explanation: "Dalton stated that all atoms of a given element have identical mass and properties. The discovery of isotopes (e.g., Carbon-12 and Carbon-14) proved that atoms of the same element can actually have different masses, violating his postulate."
  },
  {
    title: "A doctor prescribes 0.5 moles of Calcium Carbonate (CaCO3) to a patient as an antacid. How many grams of CaCO3 is the patient consuming? (Ca=40, C=12, O=16)",
    options: ["50 g", "100 g", "150 g", "75 g"],
    correct_option: 0,
    hint: "First calculate the molar mass of CaCO3.",
    explanation: "Molar mass of CaCO3 = 40 + 12 + (16×3) = 100 g/mol. Since the patient needs 0.5 moles, Mass = 0.5 moles × 100 g/mol = 50 grams."
  },
  {
    title: "Why does 1 mole of Carbon-12 weigh exactly 12 grams, while 1 mole of Oxygen-16 weighs 16 grams?",
    options: ["Because oxygen gas is diatomic.", "Because a mole is defined as the number of atoms in exactly 12g of C-12, linking atomic mass (u) directly to molar mass (g/mol).", "Because carbon is a solid and oxygen is a gas.", "Because of experimental error in early chemistry."],
    correct_option: 1,
    hint: "How is the mole defined in relation to Avogadro's number?",
    explanation: "The mole is deliberately defined so that the numerical value of a substance's atomic/molecular mass in 'u' is exactly equal to its molar mass in grams. This bridges the microscopic (u) and macroscopic (grams) worlds."
  },
  {
    title: "Two elements, X (valency 4) and Y (valency 2), combine to form a compound. What is the simplest formula for this compound?",
    options: ["X4Y2", "X2Y4", "XY2", "X2Y"],
    correct_option: 2,
    hint: "Criss-cross the valencies and then simplify the ratio to the lowest whole numbers.",
    explanation: "Criss-crossing gives X2Y4. Chemical formulas for covalent/ionic compounds should usually be written in the simplest ratio. Dividing by 2 gives the empirical formula XY2 (e.g., CO2)."
  },
  {
    title: "If you want to extract the maximum amount of pure Iron (Fe) from 100g of ore, which ore would you choose based on chemical composition? (Fe=56, O=16, S=32)",
    options: ["Fe2O3 (Hematite)", "FeS2 (Pyrite)", "Fe3O4 (Magnetite)", "FeCO3 (Siderite)"],
    correct_option: 2,
    hint: "Calculate the mass percentage of Iron in each compound.",
    explanation: "Mass % = (Mass of Fe / Total Molar Mass) × 100. For Fe3O4: (3×56) / (168+64) = 168/232 ≈ 72.4%. This is the highest mass percentage of iron among the given common ores."
  },
  {
    title: "A chemical equation is balanced to satisfy which fundamental law?",
    options: ["Law of Constant Proportions", "Law of Multiple Proportions", "Law of Conservation of Mass", "Avogadro's Law"],
    correct_option: 2,
    hint: "Why must the number of atoms on the reactant side equal the product side?",
    explanation: "Balancing equations ensures that there are the same number of atoms of each element on both sides, satisfying the Law of Conservation of Mass (matter cannot be created or destroyed)."
  },
  {
    title: "An atom has a radius of roughly 10^-10 meters. If a typical apple has a radius of 10^-1 meters, the apple is larger than the atom by what factor?",
    options: ["10^9 times", "10^10 times", "10^11 times", "10^8 times"],
    correct_option: 0,
    hint: "Divide the radius of the apple by the radius of the atom.",
    explanation: "(10^-1) / (10^-10) = 10^(-1 - (-10)) = 10^9. An apple is one billion times larger than an atom."
  },
  {
    title: "Consider the formula for Ammonium Sulfate: (NH4)2SO4. How many individual atoms are present in one formula unit of this compound?",
    options: ["10", "12", "15", "14"],
    correct_option: 2,
    hint: "Count carefully: 2 Nitrogen, 8 Hydrogen, 1 Sulfur, 4 Oxygen.",
    explanation: "Nitrogen: 1×2 = 2. Hydrogen: 4×2 = 8. Sulfur: 1. Oxygen: 4. Total = 2 + 8 + 1 + 4 = 15 atoms."
  },
  {
    title: "How does the concept of a 'mole' make it possible for chemists to 'count' atoms?",
    options: ["By looking through a highly powerful electron microscope.", "By weighing a macroscopic sample and converting mass to moles, then to particles.", "By calculating the volume of the gas produced.", "By measuring the radioactivity of the element."],
    correct_option: 1,
    hint: "We cannot see atoms to count them individually.",
    explanation: "Because atoms are too small to count, the mole concept links mass (which we can measure on a scale) to the number of particles (using Avogadro's number). Weighing a specific mass allows us to calculate the exact number of atoms."
  },
  {
    title: "A 5g sample of Calcium Carbonate is heated in an open test tube. After complete decomposition, the residue weighs 2.8g. What does the missing 2.2g represent?",
    options: ["Experimental error.", "The mass of oxygen that was destroyed in the heat.", "The mass of Carbon Dioxide (CO2) gas that escaped into the atmosphere.", "The mass of Calcium that sublimated."],
    correct_option: 2,
    hint: "Think about the products of thermal decomposition of CaCO3.",
    explanation: "CaCO3 decomposes into solid CaO and gaseous CO2. Because the test tube was open, the CO2 gas escaped. The 2.2g difference precisely matches the mass of the escaped CO2 gas, confirming the Law of Conservation of Mass."
  },
  {
    title: "Which of the following best explains why noble gases (like Helium and Neon) are monoatomic, while halogens (like Chlorine) are diatomic?",
    options: ["Noble gases are lighter than halogens.", "Noble gases already have a complete outer electron shell, so they do not need to share electrons. Halogens share one electron to become stable.", "Halogens are magnetic and attract each other.", "Noble gases exist only at very high temperatures."],
    correct_option: 1,
    hint: "Look at their electron configurations and valency.",
    explanation: "Noble gases have a full valence shell (stable octet/duplet), so they do not form bonds (valency 0). Halogens have 7 valence electrons and must share one electron with another halogen atom to achieve a stable octet, forming a diatomic molecule (e.g., Cl2)."
  }
];

async function seed() {
  let successCount = 0;
  for (const q of questions) {
    const payload = {
      created_by: TEACHER_ID,
      title: q.title,
      body: "",
      subject: "Science",
      class_grade: "9",
      chapter: "Atoms and Molecules", // Chapter 3
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
  console.log(`Successfully inserted ${successCount} out of ${questions.length} competency-based questions.`);
}

seed();
