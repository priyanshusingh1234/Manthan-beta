const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const TEACHER_ID = '83ea8424-f849-4773-b1fc-aaa987d33b2b';

// Helper to create beautiful equation SVGs
function createEquationSVG(equation, title) {
    return `
    <svg width="600" height="250" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="100%" height="100%" rx="20" fill="url(#bg)"/>
        
        <!-- Decoration -->
        <circle cx="50" cy="50" r="100" fill="#3b82f6" opacity="0.1" filter="url(#glow)"/>
        <circle cx="550" cy="200" r="80" fill="#10b981" opacity="0.1" filter="url(#glow)"/>
        
        <!-- Title -->
        <text x="300" y="60" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${title}</text>
        
        <!-- Equation -->
        <rect x="50" y="100" width="500" height="80" rx="15" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="300" y="152" font-family="'Courier New', Courier, monospace" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle" filter="url(#glow)">${equation}</text>
    </svg>
    `;
}

function createExplanationSVG(text1, text2) {
    return `
    <svg width="600" height="250" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#022c22"/>
                <stop offset="100%" stop-color="#064e3b"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="20" fill="url(#bg)"/>
        <text x="300" y="90" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#a7f3d0" text-anchor="middle">${text1}</text>
        <text x="300" y="150" font-family="Arial, sans-serif" font-size="20" fill="#ecfdf5" text-anchor="middle">${text2}</text>
    </svg>
    `;
}

async function svgToBase64Png(svgString) {
    const buffer = await sharp(Buffer.from(svgString)).png().toBuffer();
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

const rawQuestions = [
  {
    title: "1. Which of the following is a physical change?",
    options: ["Formation of curd from milk", "Ripening of fruits", "Melting of ice", "Rusting of iron"],
    correct_option: 2,
    explanation: "Melting of ice is a physical change because no new substance is formed. Water changes its state from solid to liquid, which is reversible.",
    hint: "Think about which process is easily reversible and forms no new substance.",
    eq: "H₂O(s) ⇌ H₂O(l)", eqTitle: "Physical Change",
    exp1: "Ice ➔ Water", exp2: "State changes, chemical composition remains H₂O"
  },
  {
    title: "2. The reaction H₂ + Cl₂ → 2HCl is an example of:",
    options: ["Decomposition reaction", "Combination reaction", "Double displacement reaction", "Displacement reaction"],
    correct_option: 1,
    explanation: "In this reaction, two elements (Hydrogen and Chlorine) combine to form a single product (Hydrogen chloride), making it a combination reaction.",
    hint: "Two reactants are combining to form a single product.",
    eq: "H₂ + Cl₂ → 2HCl", eqTitle: "Reaction Type",
    exp1: "A + B → AB", exp2: "Combination Reaction"
  },
  {
    title: "3. What type of chemical reaction is represented by: CaO(s) + H₂O(l) → Ca(OH)₂(aq) + Heat?",
    options: ["Endothermic and Combination", "Exothermic and Decomposition", "Exothermic and Combination", "Endothermic and Displacement"],
    correct_option: 2,
    explanation: "Quicklime reacts vigorously with water to form slaked lime, releasing a large amount of heat. This makes it an exothermic combination reaction.",
    hint: "Heat is produced as a product, and a single product is formed.",
    eq: "CaO + H₂O → Ca(OH)₂ + Heat", eqTitle: "Slaking of Lime",
    exp1: "Heat Released = Exothermic", exp2: "Two reactants, one product = Combination"
  },
  {
    title: "4. When AgCl is exposed to sunlight, it turns grey. This is due to the formation of:",
    options: ["Silver metal", "Chlorine gas", "Silver oxide", "Both Silver and Chlorine"],
    correct_option: 0,
    explanation: "Silver chloride undergoes photochemical decomposition in sunlight to form grey silver metal and chlorine gas.",
    hint: "The grey color is characteristic of a specific noble metal.",
    eq: "2AgCl(s) xrightarrow{Sunlight} 2Ag(s) + Cl₂(g)", eqTitle: "Photochemical Decomposition",
    exp1: "AgCl (White) ➔ Ag (Grey)", exp2: "Used in black and white photography"
  },
  {
    title: "5. Fe₂O₃ + 2Al → Al₂O₃ + 2Fe. This reaction is an example of a:",
    options: ["Combination reaction", "Double displacement reaction", "Decomposition reaction", "Displacement reaction"],
    correct_option: 3,
    explanation: "Aluminum is more reactive than iron, so it displaces iron from iron(III) oxide. This is the thermite reaction.",
    hint: "Aluminum takes the place of Iron.",
    eq: "Fe₂O₃ + 2Al → Al₂O₃ + 2Fe", eqTitle: "Thermite Reaction",
    exp1: "Al displaces Fe", exp2: "Highly exothermic displacement reaction"
  },
  {
    title: "6. Which gas is evolved when dilute hydrochloric acid is added to zinc granules?",
    options: ["Hydrogen", "Chlorine", "Oxygen", "Nitrogen"],
    correct_option: 0,
    explanation: "Metals above hydrogen in the reactivity series displace hydrogen gas from dilute acids. Zinc reacts with HCl to form zinc chloride and hydrogen gas.",
    hint: "This gas burns with a 'pop' sound.",
    eq: "Zn + 2HCl → ZnCl₂ + H₂↑", eqTitle: "Metal + Acid Reaction",
    exp1: "Zn displaces H from HCl", exp2: "H₂ gas evolves with effervescence"
  },
  {
    title: "7. A brown and bright element 'X', when heated in presence of air, becomes black. Name the element.",
    options: ["Iron (Fe)", "Copper (Cu)", "Silver (Ag)", "Aluminum (Al)"],
    correct_option: 1,
    explanation: "Copper (Cu) is a shiny brown metal. When heated in air, it reacts with oxygen to form copper(II) oxide (CuO), which is black in color.",
    hint: "This metal is widely used in electrical wiring.",
    eq: "2Cu + O₂ xrightarrow{Heat} 2CuO", eqTitle: "Oxidation of Copper",
    exp1: "Cu (Brown) ➔ CuO (Black)", exp2: "Surface oxidation"
  },
  {
    title: "8. In the reaction PbO + C → Pb + CO, which substance is oxidized?",
    options: ["PbO", "C", "Pb", "CO"],
    correct_option: 1,
    explanation: "Oxidation is the gain of oxygen. Here, Carbon (C) gains oxygen to form Carbon monoxide (CO), so C is oxidized.",
    hint: "Look for the substance that gains oxygen during the reaction.",
    eq: "PbO + C → Pb + CO", eqTitle: "Redox Reaction",
    exp1: "Carbon gains Oxygen (Oxidized)", exp2: "PbO loses Oxygen (Reduced)"
  },
  {
    title: "9. The process of respiration is a/an:",
    options: ["Endothermic reaction", "Exothermic reaction", "Decomposition reaction", "Both B and C"],
    correct_option: 1,
    explanation: "During respiration, glucose combines with oxygen in our cells to produce energy, carbon dioxide, and water. Since energy is released, it is exothermic.",
    hint: "Energy is released in our bodies during this process.",
    eq: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy", eqTitle: "Respiration",
    exp1: "Energy is released", exp2: "Therefore, it is Exothermic"
  },
  {
    title: "10. What is the chemical formula of rust?",
    options: ["Fe₂O₃", "Fe₃O₄", "Fe₂O₃.xH₂O", "Fe(OH)₃"],
    correct_option: 2,
    explanation: "Rust is hydrated iron(III) oxide, meaning it contains a variable amount of water molecules attached to it, represented by '.xH₂O'.",
    hint: "Rusting requires both oxygen and moisture.",
    eq: "4Fe + 3O₂ + 2xH₂O → 2Fe₂O₃.xH₂O", eqTitle: "Rusting of Iron",
    exp1: "Hydrated Iron(III) Oxide", exp2: "Reddish-brown flaky coating"
  },
  {
    title: "11. White silver chloride turns grey in sunlight. This is an example of:",
    options: ["Decomposition reaction", "Displacement reaction", "Combination reaction", "Double displacement reaction"],
    correct_option: 0,
    explanation: "Silver chloride breaks down into silver and chlorine gas in the presence of sunlight. Breakdown of a single reactant into simpler products is decomposition.",
    hint: "One compound breaks down into two elements.",
    eq: "2AgCl xrightarrow{Sunlight} 2Ag + Cl₂", eqTitle: "Photolysis",
    exp1: "Breakdown by light", exp2: "Decomposition Reaction"
  },
  {
    title: "12. When carbon dioxide is passed through lime water, it turns milky due to the formation of:",
    options: ["Calcium bicarbonate", "Calcium carbonate", "Calcium hydroxide", "Calcium oxide"],
    correct_option: 1,
    explanation: "CO₂ reacts with lime water (calcium hydroxide) to form a white precipitate of calcium carbonate (CaCO₃), making the solution milky.",
    hint: "An insoluble white salt of calcium is formed.",
    eq: "Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O", eqTitle: "Lime Water Test",
    exp1: "CaCO₃ is the white precipitate", exp2: "Causes milkiness"
  },
  {
    title: "13. Rancidity of oils and fats can be prevented by adding:",
    options: ["Oxidants", "Antioxidants", "Catalysts", "Water"],
    correct_option: 1,
    explanation: "Rancidity is the oxidation of fats and oils. Antioxidants are substances that prevent oxidation, thus preserving the food.",
    hint: "You need something that opposes oxidation.",
    eq: "Fats/Oils + O₂ → Rancid Products", eqTitle: "Rancidity",
    exp1: "Prevented by Antioxidants", exp2: "Like BHA or flushing with Nitrogen"
  },
  {
    title: "14. Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s) + 2NaCl(aq). This is an example of:",
    options: ["Displacement reaction", "Precipitation reaction", "Combination reaction", "Decomposition reaction"],
    correct_option: 1,
    explanation: "In this double displacement reaction, a white insoluble solid (precipitate) of Barium sulphate (BaSO₄) is formed. Hence, it is a precipitation reaction.",
    hint: "Look at the state symbol (s) for BaSO₄.",
    eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl", eqTitle: "Double Displacement",
    exp1: "BaSO₄ forms a white precipitate", exp2: "Ions exchange partners"
  },
  {
    title: "15. Which of the following gases can be used for storage of fresh sample of an oil for a long time?",
    options: ["Carbon dioxide or oxygen", "Nitrogen or oxygen", "Carbon dioxide or helium", "Helium or nitrogen"],
    correct_option: 3,
    explanation: "Helium and Nitrogen are unreactive (inert) gases that prevent the oxidation of oils and fats, preventing rancidity.",
    hint: "Oxygen causes rancidity, so avoid it. Choose unreactive gases.",
    eq: "Oil + Nitrogen/Helium ➔ Safe", eqTitle: "Preventing Oxidation",
    exp1: "Inert atmosphere", exp2: "Stops oxygen from reacting with oil"
  },
  {
    title: "16. In which of the following chemical equations, the abbreviations represent the correct states of the reactants and products involved at reaction temperature?",
    options: ["2H₂(l) + O₂(l) → 2H₂O(g)", "2H₂(g) + O₂(l) → 2H₂O(l)", "2H₂(g) + O₂(g) → 2H₂O(l)", "2H₂(g) + O₂(g) → 2H₂O(g)"],
    correct_option: 3,
    explanation: "At the high temperature of this reaction, hydrogen and oxygen are gases, and the water produced is in the form of steam (gas).",
    hint: "Consider the temperature required for this reaction to occur.",
    eq: "2H₂(g) + O₂(g) → 2H₂O(g)", eqTitle: "Combustion of Hydrogen",
    exp1: "All substances are in gaseous state", exp2: "at reaction temperature"
  },
  {
    title: "17. The condition produced by aerial oxidation of fats and oils in foods marked by unpleasant smell and taste is called:",
    options: ["Antioxidation", "Reduction", "Rancidity", "Corrosion"],
    correct_option: 2,
    explanation: "When fats and oils are oxidized, they become rancid and their smell and taste change. This phenomenon is called rancidity.",
    hint: "It's the reason why stale potato chips smell bad.",
    eq: "Fats + Aerial Oxygen ➔ Bad Smell", eqTitle: "Rancidity",
    exp1: "Oxidation of food", exp2: "Leads to spoilage"
  },
  {
    title: "18. Which information is not conveyed by a balanced chemical equation?",
    options: ["Physical states of reactants and products", "Symbols and formulae of all the substances involved", "Number of atoms/molecules of the reactants and products", "Whether a particular reaction is actually feasible or not"],
    correct_option: 3,
    explanation: "A balanced chemical equation tells us the stoichiometry, states, and formulas, but it does NOT tell us if the reaction will actually happen (feasibility/thermodynamics) under given conditions.",
    hint: "Can you write an equation for a reaction that never happens in real life?",
    eq: "A + B → C (Feasible?)", eqTitle: "Limitations of Equations",
    exp1: "Equations show \"What\" and \"How much\"", exp2: "Not \"If it will actually occur\""
  },
  {
    title: "19. The reaction between lead nitrate and potassium iodide aqueous solutions produces a precipitate of:",
    options: ["Lead iodide (Yellow)", "Lead iodide (White)", "Potassium nitrate (Yellow)", "Potassium nitrate (White)"],
    correct_option: 0,
    explanation: "When clear solutions of lead nitrate and potassium iodide mix, a bright yellow precipitate of lead(II) iodide is formed.",
    hint: "It's a classic bright yellow precipitate.",
    eq: "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃", eqTitle: "Precipitation Reaction",
    exp1: "PbI₂ is Yellow", exp2: "Insoluble solid formed"
  },
  {
    title: "20. Electrolysis of water is a decomposition reaction. The mole ratio of hydrogen and oxygen gases liberated during electrolysis of water is:",
    options: ["1:1", "2:1", "4:1", "1:2"],
    correct_option: 1,
    explanation: "The formula for water is H₂O. During electrolysis, 2H₂O → 2H₂ + O₂. For every 2 moles of Hydrogen gas, 1 mole of Oxygen gas is produced.",
    hint: "Look at the chemical formula of water.",
    eq: "2H₂O(l) xrightarrow{Electricity} 2H₂(g) + O₂(g)", eqTitle: "Electrolysis",
    exp1: "Volume of H₂ = 2x", exp2: "Volume of O₂ = 1x"
  }
];


async function run() {
  try {
    const finalQuestions = [];
    
    console.log('Generating images and processing questions...');
    for (const [index, q] of rawQuestions.entries()) {
      const qImageSvg = createEquationSVG(q.eq, q.eqTitle);
      const qImageUrl = await svgToBase64Png(qImageSvg);
      
      const expImageSvg = createExplanationSVG(q.exp1, q.exp2);
      const expImageUrl = await svgToBase64Png(expImageSvg);
      
      finalQuestions.push({
        title: q.title,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        hint: q.hint,
        image_url: qImageUrl,
        explanation_image_url: expImageUrl,
        question_type: 'mcq',
        subject: 'Science',
        chapter: 'Chemical Reactions and Equations',
        class_grade: 'Class 10',
        points: 2,
        time_limit: 2,
        created_by: TEACHER_ID,
        created_at: new Date().toISOString()
      });
      console.log(`Processed question ${index + 1}/20`);
    }
    
    console.log('Inserting into database...');
    const { data, error } = await supabase
      .from('questions')
      .insert(finalQuestions)
      .select('id');
      
    if (error) throw error;
    console.log(`Success! Inserted ${data.length} chemistry questions with PNG images.`);
    
  } catch (err) {
    console.error('Script Failed:', err);
  }
}

run();
