import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const chapterMappings = [
  // ── ENGLISH ──
  { keywords: ["lencho", "letter to god", "hailstones", "postmaster", "100 pesos"], chapter: "A Letter to God", subject: "English" },
  { keywords: ["nelson mandela", "apartheid", "inauguration", "freedom"], chapter: "Nelson Mandela: Long Walk to Freedom", subject: "English" },
  { keywords: ["trust", "horace danby", "lady in red", "shotover grange", "hay fever"], chapter: "A Question of Trust", subject: "English" },
  { keywords: ["anne frank", "diary", "mr keesing", "kitty"], chapter: "From the Diary of Anne Frank", subject: "English" },
  { keywords: ["bholi", "sulekha", "bishamber", "ramlal", "stammer"], chapter: "Bholi", subject: "English" },
  { keywords: ["the thief's story", "hari singh", "anil", "wrestling"], chapter: "The Thief's Story", subject: "English" },
  { keywords: ["triumph of surgery", "tricki", "mrs pumphrey", "veterinary"], chapter: "A Triumph of Surgery", subject: "English" },
  { keywords: ["necklace", "matilda", "guy de maupassant", "loisel"], chapter: "The Necklace", subject: "English" },
  { keywords: ["midnight visitor", "ausable", "max", "fowler"], chapter: "The Midnight Visitor", subject: "English" },
  { keywords: ["glimpses of india", "baker from goa", "coorg", "tea from assam"], chapter: "Glimpses of India", subject: "English" },
  { keywords: ["sermon at benares", "kisa gotami", "mustard seed", "buddha"], chapter: "The Sermon at Benares", subject: "English" },
  { keywords: ["madam rides the bus", "valli", "conductor", "town"], chapter: "Madam Rides the Bus", subject: "English" },
  { keywords: ["the proposal", "lomov", "natalya", "chubukov", "oxen meadows"], chapter: "The Proposal", subject: "English" },
  { keywords: ["footprints without feet", "griffin", "invisible man"], chapter: "Footprints without Feet", subject: "English" },
  { keywords: ["making of a scientist", "richard ebright", "butterflies"], chapter: "The Making of a Scientist", subject: "English" },
  { keywords: ["the hack driver", "lutkins", "oliver", "new mullion"], chapter: "The Hack Driver", subject: "English" },
  { keywords: ["the book that saved the earth", "think-tank", "martians", "mother goose"], chapter: "The Book That Saved the Earth", subject: "English" },
  
  // English Grammar
  { keywords: ["verb agreement", "subject-verb", "singular", "plural", "is vs are", "has vs have"], chapter: "Subject-Verb Agreement", subject: "English" },
  { keywords: ["tenses", "past tense", "future perfect", "continuous"], chapter: "Tenses", subject: "English" },
  { keywords: [" reported speech", "direct speech", "indirect speech"], chapter: "Reported Speech", subject: "English" },
  { keywords: ["modals", "can could", "shall should", "will would"], chapter: "Modals", subject: "English" },
  { keywords: ["determiners", "a vs an", "some vs any", "much vs many"], chapter: "Determiners", subject: "English" },
  { keywords: ["synonym", "antonym", "definition", "meaning of", "spotted the error", "fill in the blank", "error"], chapter: "Vocabulary & Grammar", subject: "English" },

  // ── MATHS ──
  { keywords: ["real numbers", "euclid", "hcf", "lcm of", "irrational"], chapter: "Real Numbers", subject: "Mathematics" },
  { keywords: ["polynomials", "zeroes of", "quadratic polynomial", "cubic polynomial", "alpha beta"], chapter: "Polynomials", subject: "Mathematics" },
  { keywords: ["linear equations", "consistent", "substitution method", "elimination"], chapter: "Pair of Linear Equations", subject: "Mathematics" },
  { keywords: ["quadratic equation", "roots of", "discriminant", "nature of roots", "x²"], chapter: "Quadratic Equations", subject: "Mathematics" },
  { keywords: ["arithmetic progression", "sum of", "nth term", "ap"], chapter: "Arithmetic Progressions", subject: "Mathematics" },
  { keywords: ["triangles", "similar triangles", "bpt", "pythagoras", "congruence"], chapter: "Triangles", subject: "Mathematics" },
  { keywords: ["coordinate geometry", "distance formula", "section formula", "collinear"], chapter: "Coordinate Geometry", subject: "Mathematics" },
  { keywords: ["trigonometry", "sinθ", "cosθ", "tanθ", "trigonometric ratio"], chapter: "Introduction to Trigonometry", subject: "Mathematics" },
  { keywords: ["applications of trigonometry", "angle of elevation", "angle of depression", "height of tower"], chapter: "Applications of Trigonometry", subject: "Mathematics" },
  { keywords: ["circles", "tangent", "secant", "point of contact"], chapter: "Circles", subject: "Mathematics" },
  { keywords: ["areas related to circles", "sector", "segment", "circumference"], chapter: "Areas Related to Circles", subject: "Mathematics" },
  { keywords: ["surface area", "volume", "cylinder", "cone mounted", "hemisphere", "frustum", "sphere"], chapter: "Surface Areas and Volumes", subject: "Mathematics" },
  { keywords: ["statistics", "mean", "median", "mode", "cumulative frequency"], chapter: "Statistics", subject: "Mathematics" },
  { keywords: ["probability", "dice", "cards", "coin", "random experiment"], chapter: "Probability", subject: "Mathematics" },

  // ── SCIENCE ──
  { keywords: ["chemical reaction", "oxidation", "reduction", "balancing equation", "decomposition"], chapter: "Chemical Reactions and Equations", subject: "Science" },
  { keywords: ["acids", "bases", "salts", "ph scale", "litmus", "neutralisation"], chapter: "Acids, Bases and Salts", subject: "Science" },
  { keywords: ["metals", "non-metals", "reactivity series", "ionic compounds", "corrosion"], chapter: "Metals and Non-metals", subject: "Science" },
  { keywords: ["carbon", "homologous series", "ethanol", "ethanoic acid", "covalent bond"], chapter: "Carbon and its Compounds", subject: "Science" },
  { keywords: ["periodic table", "mendeleev", "valency", "atomic radius"], chapter: "Periodic Classification of Elements", subject: "Science" },
  { keywords: ["life processes", "nutrition", "respiration", "transportation in", "excretion", "blood", "heart"], chapter: "Life Processes", subject: "Science" },
  { keywords: ["control and coordination", "brain", "hormone", "nervous system", "reflex action"], chapter: "Control and Coordination", subject: "Science" },
  { keywords: ["reproduce", "reproduction", "fertilisation", "pollination", "flower", "ovary"], chapter: "How do Organisms Reproduce", subject: "Science" },
  { keywords: ["heredity", "evolution", "mendel", "genetics", "fossil", "darwin"], chapter: "Heredity and Evolution", subject: "Science" },
  { keywords: ["light", "reflection", "refraction", "mirror", "lens", "focal length"], chapter: "Light: Reflection and Refraction", subject: "Science" },
  { keywords: ["human eye", "colourful world", "myopia", "hypermetropia", "dispersion", "prism"], chapter: "The Human Eye and the Colourful World", subject: "Science" },
  { keywords: ["electricity", "ohm's law", "resistance", "electric current", "resistors", "circuits", "heating effect"], chapter: "Electricity", subject: "Science" },
  { keywords: ["magnetic effect", "magnetic field", "motor", "generator", "electromagnet", "magnets"], chapter: "Magnetic Effects of Electric Current", subject: "Science" },
  { keywords: ["sources of energy", "solar", "biogas", "wind energy"], chapter: "Sources of Energy", subject: "Science" },
  { keywords: ["our environment", "ecosystem", "food chain", "ozone", "biodegradable"], chapter: "Our Environment", subject: "Science" },
  { keywords: ["natural resources", "conservation", "dams", "coal", "petroleum", "forests", "water and its", "soil"], chapter: "Management of Natural Resources", subject: "Science" },
  { keywords: ["fibre to fabric"], chapter: "Fibre to Fabric", subject: "Science" },
  { keywords: ["sorting materials"], chapter: "Sorting Materials", subject: "Science" },
  { heat: ["heat transfer", "combustion and flame"], chapter: "Heat and Combustion", subject: "Science" },
  { keywords: ["nutrition in plants"], chapter: "Nutrition in Plants", subject: "Science" },
  { keywords: ["physical and chemical changes", "components of food", "air and its components", "wind, storms"], chapter: "General Science Concepts", subject: "Science" },

  // ── SST (Social Studies) ──
  { keywords: ["nationalism in europe", "french revolution", "germany", "italy", "unification"], chapter: "The Rise of Nationalism in Europe", subject: "SST" },
  { keywords: ["nationalism in india", "gandhi", "non-cooperation", "civil disobedience", "satyagraha"], chapter: "Nationalism in India", subject: "SST" },
  { keywords: ["global world", "silk routes", "great depression", "trade"], chapter: "The Making of a Global World", subject: "SST" },
  { keywords: ["industrialisation", "factories", "spinners", "weavers"], chapter: "The Age of Industrialisation", subject: "SST" },
  { keywords: ["print culture", "gutenberg", "press", "books"], chapter: "Print Culture and the Modern World", subject: "SST" },
  { keywords: ["resources", "development", "soil erosion", "land degradation"], chapter: "Resources and Development", subject: "SST" },
  { keywords: ["forest and wildlife", "flora", "fauna", "tiger project"], chapter: "Forest and Wildlife Resources", subject: "SST" },
  { keywords: ["water resources", "multipurpose river", "dam"], chapter: "Water Resources", subject: "SST" },
  { keywords: ["agriculture", "farming", "crops", "kharif", "rabi"], chapter: "Agriculture", subject: "SST" },
  { keywords: ["minerals", "energy resources", "iron ore", "coal mines"], chapter: "Minerals and Energy Resources", subject: "SST" },
  { keywords: ["manufacturing industries", "textile", "iron and steel"], chapter: "Manufacturing Industries", subject: "SST" },
  { keywords: ["lifelines", "national economy", "transport", "railways", "roadways"], chapter: "Lifelines of National Economy", subject: "SST" },
  { keywords: ["power sharing", "belgium", "sri lanka", "majoritarianism"], chapter: "Power Sharing", subject: "SST" },
  { keywords: ["federalism", "decentralisation", "panchayati raj", "union list"], chapter: "Federalism", subject: "SST" },
  { keywords: ["gender", "religion", "caste", "communalism"], chapter: "Gender, Religion and Caste", subject: "SST" },
  { keywords: ["political parties", "national party", "regional party", "election commission"], chapter: "Political Parties", subject: "SST" },
  { keywords: ["outcomes of democracy", "accountable", "legitimate government"], chapter: "Outcomes of Democracy", subject: "SST" },
  { keywords: ["development", "per capita income", "infant mortality", "hdi", "gdp"], chapter: "Development", subject: "SST" },
  { keywords: ["sectors", "primary sector", "secondary sector", "tertiary sector", "employment"], chapter: "Sectors of the Indian Economy", subject: "SST" },
  { keywords: ["money and credit", "rbi", "banks", "loans", "shg", "debt"], chapter: "Money and Credit", subject: "SST" },
  { keywords: ["globalisation", "mncs", "wto", "foreign trade", "investment"], chapter: "Globalisation and the Indian Economy", subject: "SST" },
  { keywords: ["consumer rights", "copra", "exploitation"], chapter: "Consumer Rights", subject: "SST" }
];

function determineChapterSync(title, subject, body = "") {
  if (!title) return null;
  const content = (title + " " + body).toLowerCase();
  
  // Filter mappings to only search for ones that generally match the subject (or try all if no match found initially)
  const relevantMappings = chapterMappings.filter(m => 
       m.subject.toLowerCase() === subject?.toLowerCase() 
    || subject?.toLowerCase()?.includes('math') && m.subject === "Mathematics"
    || subject?.toLowerCase()?.includes('science') && m.subject === "Science"
    || subject?.toLowerCase()?.includes('sst') && m.subject === "SST"
  );
  
  for (const m of relevantMappings) {
    if (m.keywords) {
        for (const kw of m.keywords) {
            if (content.includes(kw.toLowerCase())) {
                return m.chapter;
            }
        }
    } else if (m.heat) {
         for (const kw of m.heat) {
            if (content.includes(kw.toLowerCase())) {
                return m.chapter;
            }
        }
    }
  }

  // Fallback - broadly search outside subject bounds
  for (const m of chapterMappings) {
    if (m.keywords) {
        for (const kw of m.keywords) {
            if (content.includes(kw.toLowerCase())) {
                return m.chapter;
            }
        }
    }
  }

  return "Basic Concepts"; // default fallback
}

async function run() {
  console.log("Checking DB for questions without a chapter...");

  let { data: questions, error } = await supabase
    .from('questions')
    .select('id, title, body, subject, class_grade')
    .not('subject', 'eq', 'G.K')
    .not('subject', 'eq', 'GK')
    .is('chapter', null);

  if (!questions || questions.length === 0) {
    console.log("No questions found that need chapter categorization!");
    return;
  }

  console.log(`Found ${questions.length} questions to categorize. Starting static offline categorization...`);

  let successCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const chapter = determineChapterSync(q.title, q.subject, q.body);
    
    if (chapter) {
      const { error: updateErr } = await supabase
        .from('questions')
        .update({ chapter: chapter })
        .eq('id', q.id);
        
      if (!updateErr) {
        console.log(`[${i+1}/${questions.length}] ✅ Assigned '${chapter}' to: "${q.title.substring(0, 30)}..."`);
        successCount++;
      } else {
        console.error(`[${i+1}/${questions.length}] ❌ Failed to update '${q.title.substring(0, 30)}...'`, updateErr);
      }
    }
  }
  console.log(`Done! Successfully assigned chapters to ${successCount} out of ${questions.length} questions.`);
}

run();
