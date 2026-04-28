'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Star, Heart, CheckCircle2, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';

// ── STUDY NOTES DATA (Structured for Premium Reading Experience) ──────────────────────────────
const MAP_LEVELS = [
  {
    id: 1,
    title: 'The French Spark',
    icon: '🔥',
    color: '#0ea5e9',
    notes: [
      { type: 'narrative', content: 'The rain was still drumming against the window, but inside, the vibe had shifted. Kabir slid his chair closer to the center of the room, looking at his three friends. "Stop reading this like a telephone directory," Kabir said. "History isn\'t just a bunch of dead people and random years. It’s the greatest movie ever made."' },
      { type: 'heading', content: 'Scene 1: The French Spark (1789)' },
      { type: 'paragraph', content: 'Imagine it’s the late 1700s. You are a peasant. You work all day, and some king sitting in a palace takes all your money just because God supposedly put him there. That was absolute monarchy. But in 1789, the French people snapped. The French Revolution happened, and power shifted from the monarchy to the citizens.' },
      { type: 'quote', content: '"But wait... How do you just convince millions of random villagers that they are suddenly one big team called France?" — Aryan' },
      { type: 'paragraph', content: 'Brilliant question. You use psychology. The revolutionaries introduced specific measures to create a sense of collective identity:' },
      { type: 'bullet', title: 'The Ideas of Belonging', content: 'They pushed the concepts of La Patrie (the fatherland) and Le Citoyen (the citizen), emphasizing a united community with equal rights.' },
      { type: 'bullet', title: 'New Symbols', content: 'They replaced the old royal standard with a new French tricolour flag.' },
      { type: 'bullet', title: 'One Voice', content: 'They discouraged regional dialects and promoted French as the common, national language.' },
      { type: 'bullet', title: 'The Estates General', content: 'They renamed it the National Assembly and made it elected by active citizens.' }
    ],
    questions: [
      { q: "What concepts were used to create a collective French identity?", opts: ["Dictatorship and Kingship", "La Patrie and Le Citoyen", "Feudalism and Serfdom", "Conservatism and Monarchy"], ans: 1, explain: "La Patrie (fatherland) and Le Citoyen (citizen) were pushed to emphasize equal rights." }
    ]
  },
  {
    id: 2,
    title: 'Enter Napoleon',
    icon: '👑',
    color: '#3b82f6',
    notes: [
      { type: 'quote', content: '"So, democracy wins, right?" — Sohan' },
      { type: 'paragraph', content: 'Nope. Democracies are messy. By 1799, a military genius named Napoleon Bonaparte takes over and destroys the democracy they just fought for. He crowns himself Emperor.' },
      { type: 'heading', content: 'Scene 2: The Boss Character - Napoleon' },
      { type: 'paragraph', content: 'Napoleon was a dictator, but an incredibly smart and efficient one. In 1804, he introduced the Civil Code—famous as the Napoleonic Code. He used his armies to spread these new rules all over Europe. Here is what the code did in depth:' },
      { type: 'bullet', title: 'Equality', content: 'It established equality before the law and secured the right to property.' },
      { type: 'bullet', title: 'Feudalism Destroyed', content: 'It abolished the feudal system and freed peasants from serfdom and heavy dues.' },
      { type: 'bullet', title: 'Business Boom', content: 'In towns, guild restrictions were removed.' },
      { type: 'bullet', title: 'Infrastructure', content: 'Transport and communication systems were massively improved, and a uniform system of weights and measures was introduced.' }
    ],
    questions: [
      { q: "What major socioeconomic system did the Napoleonic Code abolish?", opts: ["The Republic", "The Feudal System", "The Church", "The Monarchy"], ans: 1, explain: "It abolished the feudal system and freed peasants from serfdom." }
    ]
  },
  {
    id: 3,
    title: 'The Messy Map',
    icon: '🗺️',
    color: '#8b5cf6',
    notes: [
      { type: 'heading', content: 'Scene 3: The Epic Defeat and The Messy Map' },
      { type: 'paragraph', content: 'But Napoleon got greedy. He wanted to conquer everything. Eventually, the other big powers—Britain, Russia, Prussia, and Austria—had enough. They teamed up, and in 1815, they finally crushed Napoleon at the epic Battle of Waterloo.' },
      { type: 'paragraph', content: 'Because mid-18th century Europe didn’t have "countries" like we do today. There was no "Germany" or "Italy". It was ruled by autocratic kings.' },
      { type: 'highlight', content: 'Case Study: The Habsburg Empire' },
      { type: 'paragraph', content: 'It ruled Austria-Hungary. It wasn’t a nation; it was a patchwork. You had the Alpine regions, the Tyrol, the Sudetenland. You had people speaking German, Italian, Polish. They had nothing in common except their loyalty to the Emperor.' }
    ],
    questions: [
      { q: "What was the Habsburg Empire primarily composed of?", opts: ["A united German-speaking country", "A patchwork of regions with different languages united only by loyalty to the Emperor", "A pure democracy", "A colony of Britain"], ans: 1, explain: "It was highly fragmented with German, Italian, and Polish speakers." }
    ]
  },
  {
    id: 4,
    title: 'Clash of Classes',
    icon: '⚖️',
    color: '#eab308',
    notes: [
      { type: 'heading', content: 'Scene 4: The Clash of Classes' },
      { type: 'paragraph', content: 'Society back then was split into two extremes:' },
      { type: 'bullet', title: 'The Aristocracy', content: 'The rich elite. They owned all the estates, spoke French just to show off, and were a tiny group united by marriage.' },
      { type: 'bullet', title: 'The Peasantry', content: 'The massive majority of the population who were dirt poor and worked the land.' },
      { type: 'highlight', content: 'The Rise of the Middle Class' },
      { type: 'paragraph', content: 'Because of the industrial revolution, a new player enters the game. The Middle Class—businessmen, doctors, factory owners. They look at the rich aristocrats and ask, "Why do you get special treatment just because of your bloodline?"' },
      { type: 'paragraph', content: 'They wanted Liberal Nationalism, which meant:' },
      { type: 'bullet', title: 'Politically', content: 'Freedom for the individual, equality before the law, and a government by consent (though women and men without property still could not vote).' },
      { type: 'bullet', title: 'Economically', content: 'They wanted the freedom of markets and the removal of state-imposed restrictions on the movement of goods and capital.' }
    ],
    questions: [
      { q: "Economically, what did the new Middle Class demand under Liberal Nationalism?", opts: ["Total state control of resources", "Freedom of markets and removal of trade restrictions", "Higher taxes on peasants", "Censorship of the press"], ans: 1, explain: "They wanted free markets and to end state restrictions on goods and capital." }
    ]
  },
  {
    id: 5,
    title: 'The Empire Strikes Back',
    icon: '🏰',
    color: '#dc2626',
    notes: [
      { type: 'heading', content: 'Scene 5: The Empire Strikes Back (1815)' },
      { type: 'paragraph', content: 'Remember the guys who defeated Napoleon in 1815? The Conservatives. They hated these new liberal ideas. They wanted the old kings and the old social hierarchy back.' },
      { type: 'highlight', content: 'The Treaty of Vienna (1815)' },
      { type: 'paragraph', content: 'Hosted by the ultimate mastermind, Austrian Chancellor Duke Metternich. Their goal was simple: undo everything Napoleon did.' },
      { type: 'bullet', title: 'The Restoration', content: 'The Bourbon dynasty, which was overthrown in the French Revolution, was put back into power.' },
      { type: 'bullet', title: 'The Buffer Zone', content: 'They created new states on France\'s borders to stop it from ever expanding again (e.g., Genoa was added to Piedmont).' },
      { type: 'bullet', title: 'The Spoils', content: 'Prussia and Russia were given massive new territories as a reward.' }
    ],
    questions: [
      { q: "What was the main outcome of the Treaty of Vienna (1815)?", opts: ["To establish democracies across Europe", "To undo everything Napoleon did and restore old monarchies", "To make Duke Metternich the Emperor of Europe", "To declare war on Britain"], ans: 1, explain: "The conservatives aimed to restore the pre-Napoleonic conservative order." }
    ]
  },
  {
    id: 6,
    title: 'The Underground',
    icon: '🤫',
    color: '#10b981',
    notes: [
      { type: 'heading', content: 'Scene 6: The Underground Resistance' },
      { type: 'paragraph', content: 'When you crush freedom, it just goes underground. The conservatives started censoring the press and locking people up. So, the liberal nationalists formed Secret Societies.' },
      { type: 'highlight', content: 'The Rebel Hero: Giuseppe Mazzini' },
      { type: 'paragraph', content: 'Born in Genoa in 1807, this guy was a relentless Italian revolutionary. Exiled in 1831, he secretly founded two massive underground groups: Young Italy in Marseilles and Young Europe in Berne.' },
      { type: 'quote', content: '"He is the most dangerous enemy of our social order." — Duke Metternich (speaking about Mazzini)' },
      { type: 'heading', content: 'The Finale: The Age of Revolutions (1830-1848)' },
      { type: 'paragraph', content: 'All that pressure finally exploded. The July Revolution of 1830 in France overthrew the restored Bourbon kings. Then, the Greek War of Independence happened, leading to the Treaty of Constantinople (1832) declaring Greece an independent nation.' }
    ],
    questions: [
      { q: "Who did Duke Metternich describe as 'the most dangerous enemy of our social order'?", opts: ["Napoleon Bonaparte", "Giuseppe Mazzini", "Otto von Bismarck", "King Louis Philippe"], ans: 1, explain: "Mazzini's relentless drive to create unified republics through secret societies terrified Metternich." }
    ]
  },
  {
    id: 7,
    title: 'The Polish Defiance',
    icon: '🎵',
    color: '#f43f5e',
    notes: [
      { type: 'narrative', content: '"How do you actually build a nation when half the people can\'t even read? You don\'t use a sword. You use a song." — Kabir' },
      { type: 'heading', content: 'Scene 7: The Power of Culture and Romanticism' },
      { type: 'paragraph', content: 'Think of Romanticism as a cultural weapon. Artists rejected cold, hard science and focused on emotions, folklore, and local language. German philosopher Johann Gottfried Herder claimed the true spirit of the nation (volksgeist) was kept alive through folk songs and dances of the common people (das volk).' },
      { type: 'highlight', content: 'Case Study: The Polish Defiance' },
      { type: 'paragraph', content: 'Poland had been wiped off the map, partitioned by Russia, Prussia, and Austria.' },
      { type: 'bullet', title: 'The Russian Wipeout', content: 'Russia forced the Polish language out of schools and imposed Russian everywhere.' },
      { type: 'bullet', title: 'The Resistance', content: 'After an armed rebellion was crushed in 1831, the clergy started using Polish for church gatherings and religious instruction.' },
      { type: 'bullet', title: 'The Consequence', content: 'Russians sent thousands of Polish priests to Siberian prisons for refusing to preach in Russian. But the message was clear: speaking Polish was an act of hardcore rebellion.' }
    ],
    questions: [
      { q: "How did Poland resist Russian dominance after their armed rebellion failed?", opts: ["By invading Russia", "By using the Polish language in church and religious instruction", "By creating a new currency", "By writing letters to the King"], ans: 1, explain: "When physical rebellion failed, language (Romanticism) became their weapon of resistance." }
    ]
  },
  {
    id: 8,
    title: "Weavers' Revolt",
    icon: '🌪️',
    color: '#d946ef',
    notes: [
      { type: 'heading', content: 'Scene 8: Hunger, Despair, and the Weavers\' Revolt' },
      { type: 'paragraph', content: 'But culture alone doesn\'t start a massive fire. You need desperation. The 1830s brought the Great Economic Hardship to Europe. A massive demographic disaster led to severe unemployment. Plus, cheap machine-made goods from England were destroying local businesses.' },
      { type: 'highlight', content: 'The Silesian Weavers\' Revolt (1845)' },
      { type: 'bullet', title: 'The Setup', content: 'Weavers in Silesia were being brutally exploited by contractors who drastically reduced their payments.' },
      { type: 'bullet', title: 'The Eruption', content: 'On June 4th, a crowd marched to the contractor\'s mansion, demanding higher wages.' },
      { type: 'bullet', title: 'The Climax', content: 'They smashed into the house, destroying elegant furniture and cloth storehouses. The army was called, and eleven weavers were shot dead.' },
      { type: 'paragraph', content: 'By 1848, things were so bad in France (food shortages, extreme unemployment) that the people barricaded Paris. The National Assembly declared France a Republic again and granted voting rights to all adult males above 21.' }
    ],
    questions: [
      { q: "What triggered the Silesian Weavers' Revolt in 1845?", opts: ["They wanted the right to vote", "Contractors drastically reduced their payments", "The Polish language was banned", "A bread tax was introduced"], ans: 1, explain: "Extreme economic hardship and exploitation by contractors drove them to revolt." }
    ]
  },
  {
    id: 9,
    title: 'Frankfurt Heartbreak',
    icon: '💔',
    color: '#6366f1',
    notes: [
      { type: 'heading', content: 'Scene 9: The Heartbreak at Frankfurt (1848)' },
      { type: 'paragraph', content: 'If France got its freedom, what about Germany? 1848 was the year of the Liberal Revolution. Middle-class professionals decided to unite the German regions.' },
      { type: 'highlight', content: 'The Gathering' },
      { type: 'paragraph', content: 'On May 18, 1848, 831 elected representatives marched to the Frankfurt Parliament, convened inside the Church of St. Paul. They drafted a constitution for a German nation headed by a monarchy subject to a parliament.' },
      { type: 'bullet', title: 'The Rejection', content: 'They offered the crown to Friedrich Wilhelm IV, King of Prussia. He basically looked at them, laughed, rejected it, and joined other monarchs to crush the elected assembly.' },
      { type: 'bullet', title: 'The Tragedy of Women', content: 'Women had formed political associations and fought in the struggle. But at Frankfurt, they were denied suffrage rights and only allowed to stand in the visitor\'s gallery as mere observers.' }
    ],
    questions: [
      { q: "What was the outcome of the Frankfurt Parliament?", opts: ["Germany successfully united as a Republic", "The Prussian King accepted the crown", "The Prussian King rejected the crown and the military crushed the assembly", "Women were given full political rights"], ans: 2, explain: "Friedrich Wilhelm IV rejected the crown and used military force to disband them." }
    ]
  },
  {
    id: 10,
    title: 'Blood and Iron',
    icon: '⚔️',
    color: '#0f766e',
    notes: [
      { type: 'heading', content: 'Scene 10: Blood, Iron, and the Iron Chancellor' },
      { type: 'paragraph', content: 'The liberals failed. Democracy failed. Now, the big guns take over. Prussia decides to unite Germany, but not with speeches and votes. With weapons.' },
      { type: 'highlight', content: 'Enter Otto von Bismarck' },
      { type: 'paragraph', content: 'The Chief Minister of Prussia and the ultimate architect of German Unification. He didn\'t care about parliament; he relied on the Prussian army and the bureaucracy. His strategy was literal "Blood and Iron".' },
      { type: 'bullet', title: 'The Wars', content: 'Bismarck engineered three wars over seven years against Denmark, Austria, and France.' },
      { type: 'bullet', title: 'The Result', content: 'Prussia won every single one, completing the unification.' },
      { type: 'paragraph', content: 'On a bitterly cold morning—January 18, 1871—in the unheated Hall of Mirrors at the Palace of Versailles, Kaiser William I was proclaimed Emperor of the new German Empire.' }
    ],
    questions: [
      { q: "Who was the chief architect of German Unification using the policy of 'Blood and Iron'?", opts: ["Duke Metternich", "Kaiser William I", "Otto von Bismarck", "Giuseppe Garibaldi"], ans: 2, explain: "Bismarck engineered wars using the military to unite Germany." }
    ]
  },
  {
    id: 11,
    title: 'The Italian Puzzle',
    icon: '🧩',
    color: '#14b8a6',
    notes: [
      { type: 'heading', content: 'Scene 11: The Italian Puzzle' },
      { type: 'paragraph', content: 'Italy was a mess. It was divided into seven states, and only one (Sardinia-Piedmont) was ruled by an actual Italian princely house.' },
      { type: 'highlight', content: 'The Three Heroes of Unification:' },
      { type: 'bullet', title: '1. The Heart (Mazzini)', content: 'He planted the dream of a united Republic with his secret society, Young Italy.' },
      { type: 'bullet', title: '2. The Brain (Cavour)', content: 'A wealthy, tactful diplomat. Through a brilliant alliance with France, he defeated the Austrian forces in the North.' },
      { type: 'bullet', title: '3. The Sword (Garibaldi)', content: 'He led a massive army of armed volunteers known as the "Red Shirts" into South Italy, winning peasant support to drive out the Spanish rulers.' },
      { type: 'quote', content: 'Fun Fact: Much of the peasant population was illiterate. When Victor Emmanuel II became king, many thought "La Talia" (Italia) was his wife!' }
    ],
    questions: [
      { q: "Which Italian leader marched with armed volunteers known as the 'Red Shirts'?", opts: ["Cavour", "Victor Emmanuel II", "Giuseppe Garibaldi", "Giuseppe Mazzini"], ans: 2, explain: "Garibaldi led the Red Shirts to conquer the southern Kingdom." }
    ]
  },
  {
    id: 12,
    title: 'BOSS: The British Empire',
    icon: '💂',
    color: '#b91c1c',
    notes: [
      { type: 'heading', content: 'Scene 12: The Strange Case of Britain' },
      { type: 'paragraph', content: 'Britain is the weird one. There was no sudden, bloody revolution. Just slow, calculated dominance. The English parliament seized power from the monarchy in 1688.' },
      { type: 'bullet', title: 'Swallowing Scotland (1707)', content: 'The Act of Union combined England and Scotland into "Great Britain". In reality, England just dominated Scotland, suppressing the Scottish Highlanders\' culture and language.' },
      { type: 'bullet', title: 'Crushing Ireland (1801)', content: 'Ireland was deeply divided (Catholics vs. Protestants). The English helped Protestants establish dominance. After a failed Catholic revolt, Ireland was forcibly incorporated into the UK.' },
      { type: 'highlight', content: 'The Ultimate Branding' },
      { type: 'paragraph', content: 'They built a new "British nation" through heavy propaganda—the British flag (Union Jack), the national anthem (God Save Our Noble King), and promoting the English language.' },
      { type: 'narrative', content: 'Kabir clapped his hands together. "And there you have it. That is how the map of Europe was drawn in blood, poetry, and iron. Now, who\'s ready to ace this board exam?"' }
    ],
    questions: [
      { q: "How did the United Kingdom of Great Britain primarily form?", opts: ["Through a massive revolution in 1789", "By slow, forceful incorporation of Scotland and Ireland, suppressing their cultures", "By a peaceful treaty with France", "Through the actions of the Red Shirts"], ans: 1, explain: "Britain used the Act of Union (1707) on Scotland and suppressed Ireland (1801) to build the UK." },
      { q: "Which of the following was NOT used as propaganda to build the new 'British nation'?", opts: ["The Union Jack flag", "The promotion of the Gaelic language", "The English language", "The anthem 'God Save Our Noble King'"], ans: 1, explain: "They heavily suppressed local cultures like Scottish Gaelic." }
    ]
  }
];

export default function StudyNotesGauntlet() {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  const handleWin = (id: number) => {
    setActiveLevel(null);
    if (unlockedLevel <= id) {
      setUnlockedLevel(id + 1);
      confetti({ particleCount: 150, zIndex: 10000, spread: 90, colors: ['#4f46e5', '#ec4899', '#f59e0b'] });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] text-slate-800 font-sans overflow-hidden flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full max-w-md bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] px-4 py-3 sticky top-0 z-10 flex items-center justify-between border-b border-slate-200">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-extrabold text-slate-800 text-lg">Nationalism in Europe</div>
          <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest leading-none">Class 10 History · Notes</div>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-black text-amber-600">{(unlockedLevel - 1) * 20}</span>
        </div>
      </div>

      {/* The Map */}
      <div className="flex-1 w-full max-w-md relative overflow-y-auto pb-32 pt-12 flex flex-col-reverse items-center justify-start gap-14" 
           style={{ backgroundImage: 'radial-gradient(#e2e8f0 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
        
        {/* Draw curving path behind nodes */}
        <svg className="absolute inset-0 w-full h-[1800px] pointer-events-none" preserveAspectRatio="none" style={{ top: 'auto', bottom: 0 }}>
          <path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" />
          <path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
        </svg>

        {MAP_LEVELS.map((level, index) => {
          const isUnlocked = unlockedLevel >= level.id;
          const isCurrent = unlockedLevel === level.id;
          const isCompleted = unlockedLevel > level.id;

          const offsets = ['-50px', '20px', '50px', '-20px'];
          const xOffset = offsets[index % 4];

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              style={{ transform: `translateX(${xOffset})`, zIndex: 5 }}
              className="relative group block"
            >
              {/* Tooltip for Title */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-slate-200">
                {level.title}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-200"></div>
              </div>

              {/* Node Button */}
              <button
                onClick={() => { if (isUnlocked) setActiveLevel(level.id); }}
                disabled={!isUnlocked}
                className={`
                  w-[80px] h-[80px] rounded-2xl flex flex-col items-center justify-center text-3xl shadow-lg transition-transform relative
                  ${isUnlocked ? 'active:scale-95 cursor-pointer' : 'grayscale opacity-60 cursor-not-allowed'}
                  ${isCurrent ? 'ring-4 ring-offset-4 ring-sky-300 animate-pulse' : ''}
                `}
                style={{ 
                  background: isCompleted ? '#10b981' : (isUnlocked ? level.color : '#cbd5e1'),
                  borderBottom: `6px solid ${isCompleted ? '#059669' : (isUnlocked ? level.color + 'aa' : '#94a3b8')}`,
                }}
              >
                {isCompleted ? '📖' : level.icon}
                <span className="text-[9px] font-black uppercase text-white/90 mt-1.5 tracking-wider">Level {level.id}</span>
                
                {/* Checkmark for completed */}
                {isCompleted && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full text-emerald-500 shadow-md p-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeLevel && (
          <StudyNotesModal
            level={MAP_LEVELS.find(l => l.id === activeLevel)!}
            onClose={() => setActiveLevel(null)}
            onWin={() => handleWin(activeLevel)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ── Notes Modal UI ────────────────────────────────────────────────────────
function StudyNotesModal({ level, onClose, onWin }: { level: typeof MAP_LEVELS[0]; onClose: () => void; onWin: () => void; }) {
  const [phase, setPhase] = useState<'study' | 'quiz' | 'feedback'>('study');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  
  const q = level.questions[qIndex];

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setPhase('feedback');
  };

  const handleNextQuiz = () => {
    const isCorrect = selected === q.ans;
    if (isCorrect) {
      if (qIndex + 1 < level.questions.length) {
        setQIndex(i => i + 1);
        setSelected(null);
        setPhase('quiz');
      } else {
        onWin();
      }
    } else {
      setLives(l => l - 1);
      if (lives - 1 <= 0) onClose(); // Game over
      else {
        setSelected(null);
        setPhase('quiz');
      }
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F9FAFB] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full mb-0.5">Study Notes</span>
          <span className="font-extrabold text-base text-slate-800 leading-none">{level.title}</span>
        </div>
        <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span className="font-black text-rose-600">{lives}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">

        {/* ── STUDY PHASE ── */}
        {phase === 'study' && (
          <div className="absolute inset-0 overflow-y-auto p-6 lg:px-12 pb-32">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Note Builder Renderer */}
              {level.notes.map((note, i) => {
                if (note.type === 'heading') {
                  return <h2 key={i} className="text-2xl font-black text-slate-800 mt-8 mb-2 leading-tight font-serif">{note.content}</h2>;
                }
                if (note.type === 'subheading') {
                  return <h3 key={i} className="text-lg font-bold text-slate-700 mt-6 mb-1">{note.content}</h3>;
                }
                if (note.type === 'paragraph') {
                  return <p key={i} className="text-slate-600 leading-relaxed text-[15px]">{note.content}</p>;
                }
                if (note.type === 'highlight') {
                  return (
                    <div key={i} className="inline-block bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded text-sm mb-1 mt-4">
                      {note.content}
                    </div>
                  );
                }
                if (note.type === 'quote') {
                  return (
                    <blockquote key={i} className="border-l-4 border-indigo-400 bg-indigo-50/50 pl-4 py-3 pr-4 rounded-r-xl italic text-slate-600 my-4 text-sm font-medium">
                      {note.content}
                    </blockquote>
                  );
                }
                if (note.type === 'bullet') {
                  return (
                    <div key={i} className="flex gap-3 my-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm shadow-slate-200/40">
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-sm" />
                      <div>
                        {note.title && <span className="font-bold text-slate-800 mr-2">{note.title}:</span>}
                        <span className="text-slate-600 text-[15px] leading-relaxed">{note.content}</span>
                      </div>
                    </div>
                  );
                }
                if (note.type === 'narrative') {
                  return (
                    <div key={i} className="text-center italic text-slate-400 text-sm my-8 font-serif px-8">
                      {note.content}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* ── QUIZ PHASE ── */}
        {phase === 'quiz' && (
          <div className="absolute inset-0 overflow-y-auto p-6 flex flex-col justify-center bg-slate-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 max-w-2xl mx-auto w-full">
              <div className="inline-block bg-sky-100 text-sky-700 font-black text-xs uppercase px-3 py-1 rounded-full mb-4 border border-sky-200">
                Knowledge Check • {qIndex + 1}/{level.questions.length}
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-snug font-serif">
                {q.q}
              </h3>
            </motion.div>

            <div className="space-y-3 max-w-2xl mx-auto w-full">
              {q.opts.map((opt, i) => (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left p-5 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 hover:border-sky-400 hover:bg-sky-50 hover:shadow-md transition-all flex items-start gap-4"
                >
                  <span className="bg-slate-100 text-slate-400 font-bold px-3 py-1 rounded-lg text-sm shrink-0">{['A','B','C','D'][i]}</span>
                  <span className="mt-0.5 leading-snug">{opt}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === 'feedback' && (
          <div className={`absolute inset-0 flex flex-col justify-center p-6 ${selected === q.ans ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mx-auto">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-white shadow-xl">
                {selected === q.ans ? <CheckCircle2 className="w-12 h-12 text-emerald-500" /> : <X className="w-12 h-12 text-rose-500" />}
              </div>
              <h3 className={`text-4xl font-black mb-6 font-serif ${selected === q.ans ? 'text-emerald-700' : 'text-rose-700'}`}>
                {selected === q.ans ? 'Correct!' : 'Incorrect'}
              </h3>
              <div className={`p-6 rounded-2xl border ${selected === q.ans ? 'bg-white border-emerald-200 shadow-xl shadow-emerald-900/5' : 'bg-white border-rose-200 shadow-xl shadow-rose-900/5'}`}>
                <p className="font-medium text-lg text-slate-700 leading-relaxed"><span className="font-black text-slate-800">Explanation:</span> {q.explain}</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Area */}
      <div className={`p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20`}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={phase === 'study' ? () => setPhase('quiz') : handleNextQuiz}
          disabled={phase === 'quiz'}
          className={`
            w-full max-w-md mx-auto py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 shadow-sm text-white transition-all
            ${phase === 'study' ? 'bg-indigo-600 hover:bg-indigo-700 border-b-4 border-indigo-800' : ''}
            ${phase === 'feedback' && selected === q.ans ? 'bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800' : ''}
            ${phase === 'feedback' && selected !== q.ans ? 'bg-rose-600 hover:bg-rose-700 border-b-4 border-rose-800' : ''}
            ${phase === 'quiz' ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-none shadow-none' : ''}
          `}
        >
          {phase === 'study' ? (
            <><BookOpen className="w-5 h-5" /> Take the Knowledge Check</>
          ) : phase === 'quiz' ? 'Select an answer' : 'Continue'}
        </motion.button>
      </div>

    </motion.div>
  );
}
