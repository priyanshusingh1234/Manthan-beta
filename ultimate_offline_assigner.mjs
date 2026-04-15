import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const keywordMap = [
  // Class 6 Science
  { k: ["food", "food: where does it come from", "components of food", "diet", "nutrient", "vitamin", "protein", "carbohydrate", "fat", "malnutrition"], c: "Components of Food", s: "Science" },
  { k: ["fibre to fabric", "fabric", "cotton", "jute", "spinning", "weaving", "yarn", "fleece", "silk", "wool", "cocoon"], c: "Fibre to Fabric", s: "Science" },
  { k: ["sorting materials", "lustre", "hardness", "soluble", "transparent", "translucent", "opaque"], c: "Sorting Materials into Groups", s: "Science" },
  { k: ["separation of substances", "handpicking", "threshing", "winnowing", "sieving", "sedimentation", "decantation", "filtration", "evaporation"], c: "Separation of Substances", s: "Science" },
  { k: ["changes around us", "reversible", "irreversible change"], c: "Changes Around Us", s: "Science" },
  { k: ["getting to know plants", "herb", "shrub", "tree", "stem", "leaf", "vein", "taproot", "fibrous", "flower", "pistil", "stamen", "stomata", "transpiration", "photosynthesis"], c: "Getting to Know Plants", s: "Science" },
  { k: ["body movements", "joint", "ball and socket", "pivotal", "hinge", "fixed joint", "skeleton", "rib cage", "backbone", "cartilage", "muscle", "gait"], c: "Body Movements", s: "Science" },
  { k: ["living organisms and their surroundings", "habitat", "adaptation", "terrestrial", "aquatic", "biotic", "abiotic", "acclimatisation", "excretion", "stimuli"], c: "The Living Organisms and their Surroundings", s: "Science" },
  { k: ["motion and measurement", "measurement", "metric system", "si units", "rectilinear", "circular motion", "periodic motion", "pendulum", "oscillation"], c: "Motion and Measurement of Distances", s: "Science" },
  { k: ["light shadows and reflections", "luminous", "shadow", "pinhole camera", "mirror", "reflection", "transparent", "opaque"], c: "Light, Shadows and Reflections", s: "Science" },
  { k: ["electricity and circuits", "electric cell", "terminal", "circuit", "switch", "conductor", "insulator", "filament"], c: "Electricity and Circuits", s: "Science" },
  { k: ["fun with magnets", "magnetite", "magnetic", "poles", "compass", "attraction", "repulsion"], c: "Fun with Magnets", s: "Science" },
  { k: ["water", "evaporation", "condensation", "water cycle", "clouds", "drought", "rainwater harvesting"], c: "Water", s: "Science" },
  { k: ["air around us", "atmosphere", "oxygen", "nitrogen", "carbon dioxide", "propeller", "windmill"], c: "Air Around Us", s: "Science" },
  { k: ["garbage in garbage out", "landfill", "compost", "vermicomposting", "recycling", "plastic"], c: "Garbage In, Garbage Out", s: "Science" },
  
  // Class 7 Science
  { k: ["nutrition in plants", "autotrophic", "heterotrophic", "chlorophyll", "photosynthesis", "parasite", "saprotroph", "insectivorous", "symbiotic"], c: "Nutrition in Plants", s: "Science" },
  { k: ["nutrition in animals", "digestion", "alimentary canal", "buccal cavity", "oesophagus", "stomach", "small intestine", "large intestine", "villi", "rumination", "ruminant", "amoeba", "pseudopodia"], c: "Nutrition in Animals", s: "Science" },
  { k: ["heat", "temperature", "thermometer", "clinical thermometer", "laboratory thermometer", "conduction", "convection", "radiation", "insulator", "sea breeze", "land breeze"], c: "Heat", s: "Science" },
  { k: ["acids bases and salts", "acidic", "basic", "indicator", "litmus", "turmeric", "phenolphthalein", "neutralisation", "baking soda", "antacid"], c: "Acids, Bases and Salts", s: "Science" },
  { k: ["physical and chemical changes", "physical change", "chemical change", "rusting", "galvanisation", "crystallisation", "magnesium ribbon", "copper sulphate"], c: "Physical and Chemical Changes", s: "Science" },
  { k: ["weather climate and adaptations", "weather", "climate", "adaptation", "polar region", "tropical rainforest", "migration", "penguin", "polar bear", "blubber"], c: "Weather, Climate and Adaptations", s: "Science" },
  { k: ["winds storms and cyclones", "wind", "air pressure", "anemometer", "cyclone", "hurricane", "typhoon", "tornado", "thunderstorm", "monsoon"], c: "Winds, Storms and Cyclones", s: "Science" },
  { k: ["soil", "weathering", "soil profile", "horizon", "humus", "sandy soil", "clayey soil", "loamy soil", "percolation", "moisture"], c: "Soil", s: "Science" },
  { k: ["respiration in organisms", "cellular respiration", "aerobic", "anaerobic", "breathing", "inhalation", "exhalation", "spiracle", "trachea", "gills", "diaphragm"], c: "Respiration in Organisms", s: "Science" },
  { k: ["transportation in animals", "circulatory system", "blood", "plasma", "red blood cell", "white blood cell", "platelet", "blood vessel", "artery", "vein", "capillary", "heart", "pulse", "excretory system", "kidney", "urine", "xylem", "phloem", "transpiration"], c: "Transportation in Animals and Plants", s: "Science" },
  { k: ["reproduction in plants", "asexual reproduction", "vegetative propagation", "budding", "fragmentation", "spore", "sexual reproduction", "flower", "stamen", "pistil", "pollination", "fertilisation", "zygote", "seed dispersal"], c: "Reproduction in Plants", s: "Science" },
  { k: ["motion and time", "speed", "uniform motion", "non-uniform motion", "simple pendulum", "time period", "oscillation", "speedometer", "odometer", "distance-time graph"], c: "Motion and Time", s: "Science" },
  { k: ["electric current and its effects", "symbol", "circuit diagram", "battery", "heating effect", "filament", "fuse", "mcb", "magnetic effect", "electromagnet", "electric bell"], c: "Electric Current and its Effects", s: "Science" },
  { k: ["light", "rectilinear propagation", "reflection", "real image", "virtual image", "plane mirror", "spherical mirror", "concave mirror", "convex mirror", "lens", "concave lens", "convex lens", "dispersion", "spectrum", "prism"], c: "Light", s: "Science" },
  { k: ["water: a precious resource", "water cycle", "groundwater", "water table", "aquifer", "depletion", "water management", "rainwater harvesting", "drip irrigation", "scarcity"], c: "Water: A Precious Resource", s: "Science" },
  { k: ["forests: our lifeline", "canopy", "understorey", "crown", "deforestation", "humus", "food chain", "food web", "decomposer", "regeneration"], c: "Forests: Our Lifeline", s: "Science" },
  { k: ["wastewater story", "sewage", "wastewater", "contaminant", "sewer", "sewerage", "wastewater treatment plant", "wwtp", "clarifier", "sludge", "biogas", "sanitation"], c: "Wastewater Story", s: "Science" },
  
  // Class 8 Science (adding a few more specific ones)
  { k: ["crop production", "kharif", "rabi", "sowing", "irrigation", "weeding", "harvesting"], c: "Crop Production and Management", s: "Science" },
  { k: ["microorganisms", "friend and foe", "bacteria", "fungi", "protozoa", "algae", "virus", "vaccine", "antibiotic", "fermentation", "pasteurisation", "nitrogen fixation"], c: "Microorganisms: Friend and Foe", s: "Science" },
  { k: ["synthetic fibres", "plastics", "rayon", "nylon", "polyester", "acrylic", "pet", "thermoplastic", "thermosetting", "biodegradable"], c: "Synthetic Fibres and Plastics", s: "Science" },
  { k: ["metals and non-metals", "malleability", "ductility", "sonorous", "displacement reaction"], c: "Materials: Metals and Non-Metals", s: "Science" },
  { k: ["coal and petroleum", "fossil fuel", "exhaustible", "inexhaustible", "carbonisation", "coke", "coal tar", "coal gas", "refining", "petrochemical"], c: "Coal and Petroleum", s: "Science" },
  { k: ["combustion and flame", "combustible", "ignition temperature", "inflammable", "fire extinguisher", "calorific value", "global warming", "acid rain"], c: "Combustion and Flame", s: "Science" },
  { k: ["conservation of plants", "biodiversity", "biosphere reserve", "flora", "fauna", "endemic species", "endangered species", "red data book", "migration", "reforestation"], c: "Conservation of Plants and Animals", s: "Science" },
  { k: ["cell: structure and functions", "cell theory", "membrane", "cytoplasm", "nucleus", "prokaryotic", "eukaryotic", "vacuole", "plastid", "chloroplast", "organelle"], c: "Cell: Structure and Functions", s: "Science" },
  { k: ["reproduction in animals", "sexual reproduction", "testis", "sperm", "ovary", "egg", "fertilisation", "zygote", "embryo", "foetus", "viviparous", "oviparous", "metamorphosis", "asexual reproduction", "budding", "binary fission"], c: "Reproduction in Animals", s: "Science" },
  { k: ["reaching the age of adolescence", "puberty", "hormone", "endocrine gland", "testosterone", "estrogen", "adam's apple", "menstruation", "menarche", "menopause", "sex chromosome"], c: "Reaching the Age of Adolescence", s: "Science" },
  { k: ["force and pressure", "push", "pull", "contact force", "muscular force", "friction", "non-contact force", "magnetic force", "electrostatic force", "gravitational force", "pressure", "atmospheric pressure", "buoyant"], c: "Force and Pressure", s: "Science" },
  { k: ["friction", "static friction", "sliding friction", "rolling friction", "drag", "lubricant", "ball bearing", "fluid friction"], c: "Friction", s: "Science" },
  { k: ["sound", "vibration", "vocal cord", "larynx", "amplitude", "time period", "frequency", "hertz", "pitch", "loudness", "noise", "music", "noise pollution"], c: "Sound", s: "Science" },
  { k: ["chemical effects of electric current", "good conductor", "poor conductor", "led", "electrolyte", "electrode", "electroplating"], c: "Chemical Effects of Electric Current", s: "Science" },
  { k: ["some natural phenomena", "lightning", "static electricity", "charge", "electroscope", "earthing", "lightning conductor", "earthquake", "seismic zone", "fault zone", "richter scale", "seismograph"], c: "Some Natural Phenomena", s: "Science" },
  { k: ["light", "reflection", "incident ray", "reflected ray", "normal", "angle of incidence", "angle of reflection", "regular reflection", "diffused reflection", "multiple reflection", "kaleidoscope", "dispersion", "cornea", "iris", "pupil", "retina", "blind spot", "braille"], c: "Light", s: "Science" },
  { k: ["stars and the solar system", "moon", "phases of the moon", "star", "light year", "constellation", "urasa major", "orion", "solar system", "planet", "asteroid", "comet", "meteor", "meteorite", "artificial satellite"], c: "Stars and the Solar System", s: "Science" },
  { k: ["pollution of air and water", "air pollution", "pollutant", "smog", "cfc", "greenhouse effect", "global warming", "water pollution", "potable water", "eutrophication"], c: "Pollution of Air and Water", s: "Science" },
  
  // Class 9 Science
  { k: ["molecules", "atoms and molecules", "avogadro", "law of conservation", "law of constant proportions", "dalton", "atomic mass", "molecular mass", "valency", "chemical formula", "mole concept"], c: "Atoms and Molecules", s: "Science" },
  { k: ["structure of the atom", "electron", "proton", "neutron", "thomson", "rutherford", "bohr", "orbit", "atomic number", "mass number", "isotope", "isobar", "valency"], c: "Structure of the Atom", s: "Science" },
  { k: ["fundamental unit of life", "cell membrane", "plasma membrane", "diffusion", "osmosis", "cell wall", "nucleus", "cytoplasm", "endoplasmic reticulum", "golgi apparatus", "lysosome", "mitochondria", "plastid", "vacuole"], c: "The Fundamental Unit of Life", s: "Science" },
  { k: ["tissues", "meristematic", "permanent tissue", "parenchyma", "collenchyma", "sclerenchyma", "epidermis", "xylem", "phloem", "epithelial", "connective tissue", "muscular tissue", "nervous tissue", "neuron"], c: "Tissues", s: "Science" },
  { k: ["diversity in living organisms", "classification", "taxonomy", "monera", "protista", "fungi", "plantae", "animalia", "vertebrata", "invertebrata", "gymnosperm", "angiosperm", "binomial nomenclature"], c: "Diversity in Living Organisms", s: "Science" },
  { k: ["motion", "distance", "displacement", "uniform motion", "non-uniform motion", "speed", "velocity", "acceleration", "distance-time graph", "velocity-time graph", "equations of motion", "circular motion"], c: "Motion", s: "Science" },
  { k: ["force and laws of motion", "balanced force", "unbalanced force", "first law of motion", "inertia", "mass", "second law of motion", "momentum", "third law of motion", "conservation of momentum"], c: "Force and Laws of Motion", s: "Science" },
  { k: ["gravitation", "universal law of gravitation", "free fall", "acceleration due to gravity", "mass", "weight", "thrust", "pressure", "buoyancy", "archimedes' principle", "relative density"], c: "Gravitation", s: "Science" },
  { k: ["work and energy", "work done", "kinetic energy", "potential energy", "mechanical energy", "law of conservation of energy", "power", "commercial unit of energy"], c: "Work and Energy", s: "Science" },
  { k: ["sound", "production of sound", "propagation of sound", "longitudinal wave", "transverse wave", "compression", "rarefaction", "wavelength", "frequency", "amplitude", "speed of sound", "reflection of sound", "echo", "reverberation", "ultrasound", "sonar", "human ear"], c: "Sound", s: "Science" },
  { k: ["why do we fall ill", "health", "disease", "acute", "chronic", "infectious", "non-infectious", "pathogen", "vector", "antibiotic", "immune system", "immunisation", "vaccine", "prevention"], c: "Why Do We Fall Ill?", s: "Science" },
  { k: ["natural resources", "biosphere", "atmosphere", "lithosphere", "hydrosphere", "air pollution", "water cycle", "nitrogen cycle", "carbon cycle", "greenhouse effect", "ozone layer"], c: "Natural Resources", s: "Science" },
  { k: ["improvement in food resources", "yield", "crop variety improvement", "crop production management", "manure", "fertilizer", "irrigation", "cropping pattern", "crop protection", "animal husbandry", "cattle farming", "poultry", "fish production", "bee-keeping"], c: "Improvement in Food Resources", s: "Science" },

  // Add highly explicit Math 6,7,8 Chapter fallbacks here
  { k: ["knowing our numbers", "roman numeral", "estimation", "place value"], c: "Knowing our Numbers", s: "Mathematics" },
  { k: ["whole numbers", "predecessor", "successor", "number line"], c: "Whole Numbers", s: "Mathematics" },
  { k: ["playing with numbers", "factor", "multiple", "prime", "composite", "divisibility", "hcf", "lcm"], c: "Playing with Numbers", s: "Mathematics" },
  { k: ["basic geometrical ideas", "point", "line", "ray", "segment", "curve", "polygon", "angle", "triangle", "quadrilateral", "circle"], c: "Basic Geometrical Ideas", s: "Mathematics" },
  { k: ["understanding elementary shapes", "right angle", "straight angle", "acute", "obtuse", "reflex", "perpendicular", "triangle types", "quadrilateral types", "3d shapes"], c: "Understanding Elementary Shapes", s: "Mathematics" },
  { k: ["integers", "negative number", "positive number", "addition of integers", "subtraction of integers"], c: "Integers", s: "Mathematics" },
  { k: ["fractions", "proper fraction", "improper fraction", "mixed fraction", "equivalent fraction", "simplest form", "like fraction", "unlike fraction", "addition of fraction", "subtraction of fraction"], c: "Fractions", s: "Mathematics" },
  { k: ["decimals", "tenths", "hundredths", "addition of decimal", "subtraction of decimal"], c: "Decimals", s: "Mathematics" },
  { k: ["data handling", "recording data", "organisation of data", "pictograph", "bar graph"], c: "Data Handling", s: "Mathematics" },
  { k: ["mensuration", "perimeter", "area", "rectangle", "square"], c: "Mensuration", s: "Mathematics" },
  { k: ["algebra", "matchstick pattern", "variable", "expression", "equation", "solution"], c: "Algebra", s: "Mathematics" },
  { k: ["ratio and proportion", "ratio", "proportion", "unitary method"], c: "Ratio and Proportion", s: "Mathematics" },
  { k: ["symmetry", "line of symmetry", "reflection symmetry"], c: "Symmetry", s: "Mathematics" },
  { k: ["simple equations", "setting up an equation", "solving an equation", "application of simple equation"], c: "Simple Equations", s: "Mathematics" },
  { k: ["lines and angles", "complementary", "supplementary", "adjacent", "linear pair", "vertically opposite", "intersecting lines", "transversal", "parallel lines"], c: "Lines and Angles", s: "Mathematics" },
  { k: ["triangle and its properties", "median", "altitude", "exterior angle", "angle sum property", "equilateral", "isosceles", "pythagoras property"], c: "The Triangle and its Properties", s: "Mathematics" },
  { k: ["congruence of triangles", "sss", "sas", "asa", "rhs"], c: "Congruence of Triangles", s: "Mathematics" },
  { k: ["comparing quantities", "percentage", "profit", "loss", "simple interest", "compound interest", "discount", "sales tax", "vat", "gst"], c: "Comparing Quantities", s: "Mathematics" },
  { k: ["rational numbers", "positive rational", "negative rational", "standard form", "number line", "comparison", "addition", "subtraction", "multiplication", "division"], c: "Rational Numbers", s: "Mathematics" },
  { k: ["algebraic expressions", "term", "factor", "coefficient", "like term", "unlike term", "monomial", "binomial", "trinomial", "polynomial", "addition of algebraic", "subtraction of algebraic", "value of expression"], c: "Algebraic Expressions", s: "Mathematics" },
  { k: ["exponents and powers", "base", "exponent", "laws of exponents", "standard form"], c: "Exponents and Powers", s: "Mathematics" },
  { k: ["linear equations in one variable", "solving equation", "application"], c: "Linear Equations in One Variable", s: "Mathematics" },
  { k: ["understanding quadrilaterals", "polygon", "convex", "concave", "regular polygon", "irregular polygon", "angle sum property", "parallelogram", "rhombus", "rectangle", "square", "kite"], c: "Understanding Quadrilaterals", s: "Mathematics" },
  { k: ["squares and square roots", "perfect square", "pythagorean triplet", "square root", "prime factorisation", "division method"], c: "Squares and Square Roots", s: "Mathematics" },
  { k: ["cubes and cube roots", "perfect cube", "hardy-ramanujan", "cube root"], c: "Cubes and Cube Roots", s: "Mathematics" },
  { k: ["algebraic expressions and identities", "multiplication of algebraic", "identity", "standard identity"], c: "Algebraic Expressions and Identities", s: "Mathematics" },
  { k: ["direct and inverse proportions", "direct proportion", "inverse proportion"], c: "Direct and Inverse Proportions", s: "Mathematics" },
  { k: ["factorisation", "common factor", "regrouping", "identity", "division of algebraic"], c: "Factorisation", s: "Mathematics" },

  // Fallback explicit chapters for English / Vocab
  { k: ["synonym", "antonym", "spelling", "spelled", "vocabulary", "definition of", "closest meaning"], c: "Vocabulary", s: "English" },
  { k: ["fill in the blank", "grammar", "error", "adverb", "adjective", "pronoun", "verb", "tense", "punctuation", "apostrophe", "conjunction", "preposition"], c: "Grammar", s: "English" },
  { k: ["how does the author", "why did the character", "identify the literary device", "passage", "comprehension", "theme"], c: "Literature Comprehension", s: "English" }
];

async function assignOffline() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, title, body, subject, class_grade, chapter')
    .not('subject', 'eq', 'G.K')
    .not('subject', 'eq', 'GK');
    
  if (error || !questions) return console.error(error);

  let successCount = 0;

  for (const q of questions) {
      let newChapter = null;
      let content = `${q.title} ${q.body || ''}`.toLowerCase();
      let titleStr = q.title.toLowerCase();
      
      // Phase 1: Try structured title extraction (for Class 6-9)
      const parts = q.title.split('-');
      const firstPart = parts[0].trim();
      if (firstPart.includes(':') && !titleStr.includes('error:')) {
          const splitCols = firstPart.split(':');
          if (splitCols.length > 1) {
              const possibleChapter = splitCols[1].trim(); 
              let clean = possibleChapter.replace(/\[a-r\]/ig, '').trim();
              if (clean.length > 3) {
                  newChapter = clean;
              }
          }
      }

      // Phase 2: If Phase 1 failed, or extracted something generic like 'Error', deeply scan
      if (!newChapter || newChapter.toLowerCase().includes('error')) {
          for (const m of keywordMap) {
             if (m.s === q.subject || (m.s === 'Mathematics' && q.subject === 'Maths')) {
                 for (const keyword of m.k) {
                     if (content.includes(keyword)) {
                         newChapter = m.c;
                         break;
                     }
                 }
                 if (newChapter && !newChapter.toLowerCase().includes('error')) break;
             }
          }
      }
      
      // Phase 3: Global English fallback
      if (!newChapter && (q.subject === 'English' || titleStr.includes('error'))) {
          if (titleStr.includes('synonym') || titleStr.includes('antonym') || titleStr.includes('spelled')) {
              newChapter = "Vocabulary";
          } else {
              newChapter = "Grammar";
          }
      }

      // Update if we've successfully synthesized a definitive chapter name different from "General Science", etc.
      if (newChapter) {
          newChapter = newChapter.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          if (q.chapter !== newChapter && 
              // Don't overwrite perfectly good Class 10 chapters defined previously (like "Carbon and its Compounds")
              // unless the current explicitly says "General" or it's clearly better.
              (!q.chapter || q.chapter.includes('General') || q.chapter.includes('Basic') || q.chapter.includes('Vocabulary') || titleStr.includes(newChapter.toLowerCase()))
             ) {
              
              await supabase.from('questions').update({ chapter: newChapter }).eq('id', q.id);
              console.log(`✅ [Class ${q.class_grade}] "${q.title.slice(0, 30)}..." -> ${newChapter}`);
              successCount++;
          }
      }
  }
  
  console.log(`\n🎉 Done! Offline Categorizer completely fixed ${successCount} irregular questions.`);
}

assignOffline();
