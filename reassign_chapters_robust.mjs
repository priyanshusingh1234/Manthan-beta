import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const regexBasedMappings = [
  // ── SCIENCE (Specific Priority) ── 
  // Put most specific chapters (e.g. Carbon) before broader ones (e.g. Metals)
  { regex: /\b(carbon|organic|hydrocarbon|alkane|alkene|alkyne|ethanol|ethanoic|covalent bond|homologous series)\b/i, chapter: "Carbon and its Compounds", subject: "Science" },
  { regex: /\b(metal|metals|non-metal|non-metals|metalloid|ionic bond|reactivity series|rusting|galvanisation)\b/i, chapter: "Metals and Non-metals", subject: "Science" },
  { regex: /\b(acid|base|salt|ph scale|litmus|neutralisation|neutralization|baking soda|washing soda|bleaching powder|plaster of paris)\b/i, chapter: "Acids, Bases and Salts", subject: "Science" },
  { regex: /\b(chemical reaction|oxidation|reduction|redox|balancing equation|decomposition|exothermic|endothermic)\b/i, chapter: "Chemical Reactions and Equations", subject: "Science" },
  { regex: /\b(periodic table|mendeleev|dobereiner|newlands|modern periodic|valency|atomic radius|metalloids)\b/i, chapter: "Periodic Classification of Elements", subject: "Science" },
  
  { regex: /\b(light|reflection|refraction|mirror|lens|focal length|optics)\b/i, chapter: "Light: Reflection and Refraction", subject: "Science" },
  { regex: /\b(eye|myopia|hypermetropia|presbyopia|prism|dispersion|scattering|rainbow|twinkling)\b/i, chapter: "The Human Eye and the Colourful World", subject: "Science" },
  { regex: /\b(electricity|ohm's law|resistance|resistor|voltage|current|heating effect)\b/i, chapter: "Electricity", subject: "Science" },
  { regex: /\b(magnet|magnetic field|motor|generator|electromagnet|fleming's|solenoid|induction)\b/i, chapter: "Magnetic Effects of Electric Current", subject: "Science" },
  
  { regex: /\b(nutrition|respiration|transportation|excretion|blood|heart|digestion|stomach|kidney)\b/i, chapter: "Life Processes", subject: "Science" },
  { regex: /\b(brain|hormone|nervous|reflex action|neuron|spinal cord|thyroid|insulin)\b/i, chapter: "Control and Coordination", subject: "Science" },
  { regex: /\b(reproduce|reproduction|fertilisation|pollination|flower|ovary|sperm|menstruation|contraception)\b/i, chapter: "How do Organisms Reproduce", subject: "Science" },
  { regex: /\b(heredity|evolution|mendel|genetics|fossil|darwin|speciation|trait)\b/i, chapter: "Heredity and Evolution", subject: "Science" },
  
  { regex: /\b(ecosystem|food chain|food web|ozone|biodegradable|environment)\b/i, chapter: "Our Environment", subject: "Science" },
  { regex: /\b(natural resource|conservation|dam|coal|petroleum|forest|water harvesting|chipko)\b/i, chapter: "Management of Natural Resources", subject: "Science" },
  { regex: /\b(source of energy|biogas|solar|wind energy|geothermal|nuclear)\b/i, chapter: "Sources of Energy", subject: "Science" },
  
  // ── MATHS ──
  { regex: /\b(trigonometry|sinθ|cosθ|tanθ|cosec|sec|cot|\bsin\b|\bcos\b|\btan\b|theta|trigonometric)\b/i, chapter: "Introduction to Trigonometry", subject: "Mathematics" },
  { regex: /\b(elevation|depression|height of tower|shadow)\b/i, chapter: "Applications of Trigonometry", subject: "Mathematics" },
  { regex: /\b(real numbers?|euclid|hcf|lcm|irrational|rational|prime factorization)\b/i, chapter: "Real Numbers", subject: "Mathematics" },
  { regex: /\b(polynomial|zeroes|quadratic polynomial|cubic polynomial|alpha beta|remainder theorem)\b/i, chapter: "Polynomials", subject: "Mathematics" },
  { regex: /\b(linear equation|substitution method|elimination method|cross-multiplication|intersecting lines)\b/i, chapter: "Pair of Linear Equations", subject: "Mathematics" },
  { regex: /\b(quadratic equation|discriminant|nature of roots|completing the square)\b/i, chapter: "Quadratic Equations", subject: "Mathematics" },
  { regex: /\b(arithmetic progression|sum of n terms|nth term|\bap\b)\b/i, chapter: "Arithmetic Progressions", subject: "Mathematics" },
  { regex: /\b(triangle|similar triangles?|bpt|pythagoras|congruenty?)\b/i, chapter: "Triangles", subject: "Mathematics" },
  { regex: /\b(coordinate geometry|distance formula|section formula|collinear|mid-point)\b/i, chapter: "Coordinate Geometry", subject: "Mathematics" },
  { regex: /\b(circle|tangent|secant|point of contact)\b/i, chapter: "Circles", subject: "Mathematics" },
  { regex: /\b(area related to circle|sector|segment|circumference)\b/i, chapter: "Areas Related to Circles", subject: "Mathematics" },
  { regex: /\b(surface area|volume|cylinder|cone|hemisphere|frustum|sphere|cuboid|cube)\b/i, chapter: "Surface Areas and Volumes", subject: "Mathematics" },
  { regex: /\b(statistics|mean|median|mode|cumulative frequency|ogive)\b/i, chapter: "Statistics", subject: "Mathematics" },
  { regex: /\b(probability|dice|card|coin|random experiment|sure event)\b/i, chapter: "Probability", subject: "Mathematics" },

  // ── ENGLISH LITERATURE ──
  { regex: /\b(lencho|letter to god|100 pesos|postmaster|hailstorm|hailstones)\b/i, chapter: "A Letter to God", subject: "English" },
  { regex: /\b(nelson mandela|apartheid|south africa|inauguration)\b/i, chapter: "Nelson Mandela: Long Walk to Freedom", subject: "English" },
  { regex: /\b(two stories about flying|young seagull|black aeroplane|dakota)\b/i, chapter: "Two Stories about Flying", subject: "English" },
  { regex: /\b(anne frank|mr keesing|chatterbox)\b/i, chapter: "From the Diary of Anne Frank", subject: "English" },
  { regex: /\b(glimpses of india|baker from goa|coorg|tea from assam|rajvir|pranjol)\b/i, chapter: "Glimpses of India", subject: "English" },
  { regex: /\b(mijbil|otter|maxwell)\b/i, chapter: "Mijbil the Otter", subject: "English" },
  { regex: /\b(madam rides the bus|valli|bus conductor)\b/i, chapter: "Madam Rides the Bus", subject: "English" },
  { regex: /\b(sermon at benares|kisa gotami|mustard seed|buddha)\b/i, chapter: "The Sermon at Benares", subject: "English" },
  { regex: /\b(the proposal|lomov|natalya|chubukov|oxen meadows)\b/i, chapter: "The Proposal", subject: "English" },
  { regex: /\b(triumph of surgery|tricki|mrs.? pumphrey)\b/i, chapter: "A Triumph of Surgery", subject: "English" },
  { regex: /\b(thief'?s story|hari singh|anil)\b/i, chapter: "The Thief's Story", subject: "English" },
  { regex: /\b(midnight visitor|ausable|max|fowler)\b/i, chapter: "The Midnight Visitor", subject: "English" },
  { regex: /\b(question of trust|horace danby|lady in red|shotover grange)\b/i, chapter: "A Question of Trust", subject: "English" },
  { regex: /\b(footprints without feet|griffin|invisible man)\b/i, chapter: "Footprints without Feet", subject: "English" },
  { regex: /\b(making of a scientist|richard ebright|monarch|butterflies)\b/i, chapter: "The Making of a Scientist", subject: "English" },
  { regex: /\b(necklace|matilda|guy de maupassant|loisel|mme forestier)\b/i, chapter: "The Necklace", subject: "English" },
  { regex: /\b(bholi|sulekha|bishamber|ramlal)\b/i, chapter: "Bholi", subject: "English" },
  { regex: /\b(the book that saved the earth|think-tank|martians|noodle)\b/i, chapter: "The Book That Saved the Earth", subject: "English" },

  // English Grammar
  { regex: /\b(verb agreement|subject-verb|is vs are|has vs have|subject verb)\b/i, chapter: "Subject-Verb Agreement", subject: "English" },
  { regex: /\b(tenses|past tense|future perfect|continuous tense)\b/i, chapter: "Tenses", subject: "English" },
  { regex: /\b(reported speech|direct speech|indirect speech)\b/i, chapter: "Reported Speech", subject: "English" },
  { regex: /\b(modals|can could|shall should|will would|ought to)\b/i, chapter: "Modals", subject: "English" },
  { regex: /\b(determiner|a vs an|some vs any|much vs many)\b/i, chapter: "Determiners", subject: "English" },
  { regex: /\b(synonym|antonym|spelling|grammar|meaning of|fill in the blank|error|spot)\b/i, chapter: "Vocabulary & Grammar", subject: "English" },

  // ── SST ──
  { regex: /\b(nationalism in europe|french revolution|balkans|unification|mazzini|bismarck)\b/i, chapter: "The Rise of Nationalism in Europe", subject: "SST" },
  { regex: /\b(nationalism in india|gandhi|non-cooperation|civil disobedience|satyagraha|simon commission|jallianwala|gandhiji)\b/i, chapter: "Nationalism in India", subject: "SST" },
  { regex: /\b(global world|silk route|great depression|bretton woods|rinderpest)\b/i, chapter: "The Making of a Global World", subject: "SST" },
  { regex: /\b(industrialisation|factories|spinners|weavers|fly shuttle|east india company)\b/i, chapter: "The Age of Industrialisation", subject: "SST" },
  { regex: /\b(print culture|gutenberg|printing press|vernacular press act)\b/i, chapter: "Print Culture and the Modern World", subject: "SST" },
  { regex: /\b(resource and development|soil erosion|land degradation|khadar|bangar)\b/i, chapter: "Resources and Development", subject: "SST" },
  { regex: /\b(forest and wildlife|flora|fauna|tiger project|extinct|endangered)\b/i, chapter: "Forest and Wildlife Resources", subject: "SST" },
  { regex: /\b(water resource|dam|multipurpose river project|rainwater harvesting)\b/i, chapter: "Water Resources", subject: "SST" },
  { regex: /\b(agriculture|farming|crop|kharif|rabi|zaid|green revolution|plantation)\b/i, chapter: "Agriculture", subject: "SST" },
  { regex: /\b(mineral|energy resource|iron ore|coal mine|petroleum|solar energy)\b/i, chapter: "Minerals and Energy Resources", subject: "SST" },
  { regex: /\b(manufacturing industr|textile|iron and steel|jute|sugar industry|agri-based)\b/i, chapter: "Manufacturing Industries", subject: "SST" },
  { regex: /\b(lifelines|national economy|transport|railway|roadway|golden quadrilateral|pipeline|seaport)\b/i, chapter: "Lifelines of National Economy", subject: "SST" },
  { regex: /\b(power sharing|belgium|sri lanka|majoritarianism|ethnic)\b/i, chapter: "Power Sharing", subject: "SST" },
  { regex: /\b(federalism|decentralisation|panchayat|union list|state list|concurrent list)\b/i, chapter: "Federalism", subject: "SST" },
  { regex: /\b(gender|religion|caste|communalism|patriarchy|secular)\b/i, chapter: "Gender, Religion and Caste", subject: "SST" },
  { regex: /\b(political part|national party|regional party|election commission|opposition)\b/i, chapter: "Political Parties", subject: "SST" },
  { regex: /\b(outcome of democracy|accountable|legitimate government|responsive)\b/i, chapter: "Outcomes of Democracy", subject: "SST" },
  { regex: /\b(development|per capita income|infant mortality|hdi|gdp|literacy rate|life expectancy)\b/i, chapter: "Development", subject: "SST" },
  { regex: /\b(sector|primary sector|secondary sector|tertiary sector|employment|nrega|organised sector)\b/i, chapter: "Sectors of the Indian Economy", subject: "SST" },
  { regex: /\b(money|credit|rbi|bank|loan|shg|debt|collateral|barter)\b/i, chapter: "Money and Credit", subject: "SST" },
  { regex: /\b(globalisation|mnc|wto|foreign trade|investment|sez|w.t.o)\b/i, chapter: "Globalisation and the Indian Economy", subject: "SST" },
  { regex: /\b(consumer right|copra|consumer protection|hallmark|agmark|rti)\b/i, chapter: "Consumer Rights", subject: "SST" }
];

function determineChapterSync(title, subject, body = "") {
  if (!title) return null;
  const content = (title + " " + body);
  let matchedChapter = null;

  // 1. First Pass: Try exact regex matching strictly within the given subject.
  const relevantMappings = regexBasedMappings.filter(m => 
       m.subject.toLowerCase() === subject?.toLowerCase() 
    || (subject?.toLowerCase()?.includes('math') && m.subject === "Mathematics")
    || (subject?.toLowerCase()?.includes('science') && m.subject === "Science")
    || (subject?.toLowerCase()?.includes('sst') && m.subject === "SST")
  );

  for (const m of relevantMappings) {
    if (m.regex.test(content)) {
      matchedChapter = m.chapter;
      break;
    }
  }

  // 2. Second Pass: If no match in subject strict loop, ignore subject constraints.
  if (!matchedChapter) {
    for (const m of regexBasedMappings) {
      if (m.regex.test(content)) {
        matchedChapter = m.chapter;
        break;
      }
    }
  }

  // Return the mapped chapter or a cleaner fallback
  if (matchedChapter) return matchedChapter;
  
  if (subject?.toLowerCase().includes('english')) return "Vocabulary & Grammar";
  if (subject?.toLowerCase().includes('science')) return "General Science";
  if (subject?.toLowerCase().includes('sst')) return "General SST";
  if (subject?.toLowerCase().includes('math')) return "Basic Numeracy";
  return "General Setup";
}

async function run() {
  console.log("Fetching ALL non-GK questions from DB to re-assign chapters accurately...");

  // Select all questions ignoring their current chapter assignation
  let { data: questions, error } = await supabase
    .from('questions')
    .select('id, title, body, subject, class_grade, chapter')
    .not('subject', 'eq', 'G.K')
    .not('subject', 'eq', 'GK');

  if (error || !questions) {
    console.error("Failed to query DB", error);
    return;
  }

  let successCount = 0;
  let reassignCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const newChapter = determineChapterSync(q.title, q.subject, q.body);
    
    // Only update if it actually resolved and differs from what's currently there
    if (newChapter && newChapter !== q.chapter) {
      const { error: updateErr } = await supabase
        .from('questions')
        .update({ chapter: newChapter })
        .eq('id', q.id);
        
      if (!updateErr) {
        successCount++;
        reassignCount++;
      } else {
        console.error(`❌ Failed: ${updateErr.message}`);
      }
    } else if (newChapter === q.chapter) {
       successCount++; // Confirmed valid
    }
  }
  
  console.log(`Re-analysis complete. Accurately reassigned ${reassignCount} questions out of ${questions.length} total assessed.`);
}

run();
