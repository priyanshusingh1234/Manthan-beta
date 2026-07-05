const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

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
        
        <circle cx="50" cy="50" r="100" fill="#3b82f6" opacity="0.1" filter="url(#glow)"/>
        <circle cx="550" cy="200" r="80" fill="#10b981" opacity="0.1" filter="url(#glow)"/>
        
        <text x="300" y="60" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${title}</text>
        
        <rect x="50" y="100" width="500" height="80" rx="15" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="300" y="152" font-family="'Courier New', Courier, monospace" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle" filter="url(#glow)">${equation}</text>
    </svg>
    `;
}

const rawQuestions = [
  {
    title: "1. Which of the following is a physical change?",
    eq: "H₂O(s) ⇌ H₂O(l)", eqTitle: "Physical Change"
  },
  {
    title: "2. The reaction H₂ + Cl₂ → 2HCl is an example of:",
    eq: "H₂ + Cl₂ → 2HCl", eqTitle: "Reaction Type"
  },
  {
    title: "3. What type of chemical reaction is represented by: CaO(s) + H₂O(l) → Ca(OH)₂(aq) + Heat?",
    eq: "CaO + H₂O → Ca(OH)₂ + Heat", eqTitle: "Slaking of Lime"
  },
  {
    title: "4. When AgCl is exposed to sunlight, it turns grey. This is due to the formation of:",
    eq: "AgCl(s) → ? + ?", eqTitle: "Photochemical Decomposition"
  },
  {
    title: "5. Fe₂O₃ + 2Al → Al₂O₃ + 2Fe. This reaction is an example of a:",
    eq: "Fe₂O₃ + 2Al → Al₂O₃ + 2Fe", eqTitle: "Thermite Reaction"
  },
  {
    title: "6. Which gas is evolved when dilute hydrochloric acid is added to zinc granules?",
    eq: "Zn + HCl → ? + Gas↑", eqTitle: "Metal + Acid Reaction"
  },
  {
    title: "7. A brown and bright element 'X', when heated in presence of air, becomes black. Name the element.",
    eq: "Element X + O₂ → Black Oxide", eqTitle: "Oxidation"
  },
  {
    title: "8. In the reaction PbO + C → Pb + CO, which substance is oxidized?",
    eq: "PbO + C → Pb + CO", eqTitle: "Redox Reaction"
  },
  {
    title: "9. The process of respiration is a/an:",
    eq: "Glucose + Oxygen → Products", eqTitle: "Respiration"
  },
  {
    title: "10. What is the chemical formula of rust?",
    eq: "Iron + Oxygen + Water → Rust", eqTitle: "Rusting of Iron"
  },
  {
    title: "11. White silver chloride turns grey in sunlight. This is an example of:",
    eq: "2AgCl → 2Ag + Cl₂", eqTitle: "Photolysis"
  },
  {
    title: "12. When carbon dioxide is passed through lime water, it turns milky due to the formation of:",
    eq: "Lime Water + CO₂ → White Precipitate", eqTitle: "Lime Water Test"
  },
  {
    title: "13. Rancidity of oils and fats can be prevented by adding:",
    eq: "Fats/Oils + O₂ → Rancid Products", eqTitle: "Rancidity"
  },
  {
    title: "14. Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s) + 2NaCl(aq). This is an example of:",
    eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl", eqTitle: "Double Displacement"
  },
  {
    title: "15. Which of the following gases can be used for storage of fresh sample of an oil for a long time?",
    eq: "Oil + Inert Gas → Safe Storage", eqTitle: "Preventing Oxidation"
  },
  {
    title: "16. In which of the following chemical equations, the abbreviations represent the correct states of the reactants and products involved at reaction temperature?",
    eq: "2H₂(g) + O₂(g) → 2H₂O(g)", eqTitle: "Combustion of Hydrogen"
  },
  {
    title: "17. The condition produced by aerial oxidation of fats and oils in foods marked by unpleasant smell and taste is called:",
    eq: "Fats + Aerial Oxygen → Bad Smell", eqTitle: "Rancidity"
  },
  {
    title: "18. Which information is not conveyed by a balanced chemical equation?",
    eq: "A + B → C (Feasible?)", eqTitle: "Limitations of Equations"
  },
  {
    title: "19. The reaction between lead nitrate and potassium iodide aqueous solutions produces a precipitate of:",
    eq: "Pb(NO₃)₂ + KI → Precipitate", eqTitle: "Precipitation Reaction"
  },
  {
    title: "20. Electrolysis of water is a decomposition reaction. The mole ratio of hydrogen and oxygen gases liberated during electrolysis of water is:",
    eq: "H₂O(l) → H₂(g) + O₂(g)", eqTitle: "Electrolysis"
  }
];

async function run() {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, title')
      .eq('chapter', 'Chemical Reactions and Equations')
      .eq('subject', 'Science');
      
    if (error) throw error;
    
    console.log(`Found ${questions.length} questions to update.`);
    
    for (const q of questions) {
        const match = rawQuestions.find(rq => rq.title === q.title);
        if (!match) continue;
        
        // Generate new SVG and upload to storage
        const svgString = createEquationSVG(match.eq, match.eqTitle);
        const buffer = await sharp(Buffer.from(svgString)).png().toBuffer();
        const fileName = `chem_main_${q.id}_v2.png`; // v2 to bypass CDN cache
        
        const { error: uploadErr } = await supabase.storage
          .from('question-images')
          .upload(fileName, buffer, { contentType: 'image/png', upsert: true });
          
        if (uploadErr) {
            console.error('Upload Error:', uploadErr);
        } else {
            await supabase.from('questions').update({ image_url: fileName }).eq('id', q.id);
            console.log(`Fixed image for ${q.title}`);
        }
    }
  } catch (err) {
      console.error(err);
  }
}
run();
