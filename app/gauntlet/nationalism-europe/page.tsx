'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { X, Star, Heart, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

const TEACHER_LOTTIE_URL = 'https://assets3.lottiefiles.com/packages/lf20_1hpexdke.json';

// Types
type ChatMsg = { speaker?: string; text: string; type?: 'narrative' | 'dialogue' | 'list' };

// ── EPIC NARRATIVE MAP DATA ────────────────────────────────────────────────────────
const MAP_LEVELS = [
  {
    id: 1,
    title: 'The Rain & The French Spark',
    icon: '🌧️',
    color: '#0ea5e9',
    chats: [
      { type: 'narrative', text: 'The rain was still drumming against the window, but inside, the vibe had shifted. Kabir slid his chair closer to the center of the room, looking at his three friends—Sohan, Aryan, and Rohan. They looked stressed, drowning in their history notes.' },
      { speaker: 'Kabir', text: "Okay, guys, reset. Stop reading this like a telephone directory. History isn't just a bunch of dead people and random years. It’s the greatest movie ever made. It’s about power, betrayal, secret societies, and epic downfalls. Let me tell you the story properly." },
      { speaker: 'Kabir', text: "Scene 1: 1789. Imagine you are a peasant. You work all day, and some king takes all your money just because God supposedly put him there. That was absolute monarchy." },
      { speaker: 'Kabir', text: "But in 1789, the French people snapped. The French Revolution happened, and power shifted from the monarchy to the citizens." },
      { speaker: 'Aryan', text: "But wait... How do you just convince millions of random villagers that they are suddenly one big team called 'France'?" },
      { speaker: 'Kabir', text: "Brilliant question. You use psychology. You create a sense of collective identity:" },
      { type: 'list', text: '• La Patrie (Fatherland) & Le Citoyen (Citizen)\n• A new French tricolour flag\n• French promoted as the common language\n• The elected National Assembly' }
    ],
    questions: [
      { q: "What was used to create a sense of collective identity among the French people?", opts: ["Forcing everyone to join the army", "Concepts like La Patrie and the Tricolour flag", "Giving everyone free bread", "Banning all religions"], ans: 1, explain: "La Patrie (the fatherland), the Tricolour flag, and a common language built a united French identity." }
    ]
  },
  {
    id: 2,
    title: 'Enter Napoleon',
    icon: '👑',
    color: '#3b82f6',
    chats: [
      { speaker: 'Sohan', text: "So, democracy wins, right?" },
      { speaker: 'Kabir', text: "Nope. Democracies are messy. By 1799, a military genius named Napoleon Bonaparte takes over and destroys the democracy they just fought for. He crowns himself Emperor." },
      { speaker: 'Sohan', text: "Wait, so he was just a villain? But my textbook talks about some 'code' he made that people actually liked?" },
      { speaker: 'Kabir', text: "Exactly! You nailed it. Napoleon was a dictator, but an incredibly smart and efficient one. In 1804, he introduced the Napoleonic Code." },
      { type: 'list', text: '• ESTABLISHED equality before the law\n• ABOLISHED the feudal system (freed peasants)\n• REMOVED guild restrictions in towns\n• IMPROVED transport and communication' }
    ],
    questions: [
      { q: "The Napoleonic Code (1804) did NOT do which of the following?", opts: ["Establish equality before the law", "Abolish the feudal system", "Restore the absolute monarchy of the Bourbon kings", "Remove guild restrictions"], ans: 2, explain: "Napoleon crowned HIMSELF emperor; he did not restore the old Bourbon kings (that happened later)." }
    ]
  },
  {
    id: 3,
    title: 'The Messy Map',
    icon: '🗺️',
    color: '#8b5cf6',
    chats: [
      { speaker: 'Kabir', text: "But Napoleon got greedy. He wanted to conquer everything. Eventually, Britain, Russia, Prussia, and Austria teamed up, and in 1815, they crushed Napoleon at the epic Battle of Waterloo." },
      { speaker: 'Aryan', text: "Good riddance?" },
      { speaker: 'Kabir', text: "Well, it gets complicated. Because mid-18th century Europe didn't have 'countries' like we do today. There was no 'Germany' or 'Italy'. It was ruled by autocratic kings." },
      { speaker: 'Kabir', text: "Take the Habsburg Empire. It wasn't a nation; it was a patchwork. You had the Alpine regions, the Tyrol, the Sudetenland. You had people speaking German, Italian, Polish. They had nothing in common except their loyalty to the Emperor." }
    ],
    questions: [
      { q: "Before modern nations, what was the Habsburg Empire?", opts: ["A united German-speaking country", "A patchwork of different regions and languages loyal to an Emperor", "A democratic republic", "A colony of Britain"], ans: 1, explain: "It was a patchwork of German, Italian, and Polish speakers united only by their loyalty to the Habsburg Emperor." }
    ]
  },
  {
    id: 4,
    title: 'Clash of Classes',
    icon: '⚖️',
    color: '#eab308',
    chats: [
      { speaker: 'Kabir', text: "Society back then was split into two extremes: The rich Aristocracy (who spoke French to show off) and the massive, dirt-poor Peasantry." },
      { speaker: 'Kabir', text: "But because of the industrial revolution, a new player enters: The Middle Class (businessmen, doctors). They look at the rich aristocrats and say, 'Why do you get special treatment just because of your bloodline?'" },
      { speaker: 'Sohan', text: "So what did they want?" },
      { speaker: 'Kabir', text: "They wanted Liberal Nationalism. Politically: Freedom for the individual and a government by consent. Economically: Freedom of markets and ending state restrictions on goods." }
    ],
    questions: [
      { q: "What did the new Middle Class demand economically under Liberal Nationalism?", opts: ["Total state control of factories", "Freedom of markets and removal of trade restrictions", "Higher taxes on peasants", "Banning all imports"], ans: 1, explain: "They wanted free markets and the removal of state-imposed restrictions on the movement of goods and capital." }
    ]
  },
  {
    id: 5,
    title: 'The Empire Strikes Back',
    icon: '🏰',
    color: '#dc2626',
    chats: [
      { speaker: 'Kabir', text: "But remember the guys who defeated Napoleon in 1815? The Conservatives. They hated these new liberal ideas. They held a massive meeting called the Treaty of Vienna." },
      { speaker: 'Kabir', text: "Hosted by the ultimate mastermind, Austrian Chancellor Duke Metternich. Their goal: undo everything Napoleon did." },
      { type: 'list', text: '• Restored the Bourbon dynasty in France\n• Created buffer states on French borders to stop expansion\n• Gave Prussia and Russia massive new territories' }
    ],
    questions: [
      { q: "What was the main goal of the Treaty of Vienna (1815)?", opts: ["To establish democracies across Europe", "To undo everything Napoleon did and restore old monarchies", "To make Duke Metternich the Emperor of Europe", "To declare war on Britain"], ans: 1, explain: "The conservatives wanted to restore the pre-Napoleonic order and put the old kings back in power." }
    ]
  },
  {
    id: 6,
    title: 'The Underground',
    icon: '🤫',
    color: '#10b981',
    chats: [
      { speaker: 'Rohan', text: "So the kings won, and everyone went home?" },
      { speaker: 'Kabir', text: "Never. When you crush freedom, it just goes underground. The conservatives started censoring the press. So, the liberals formed Secret Societies." },
      { speaker: 'Kabir', text: "Enter our rebel hero: Giuseppe Mazzini! Exiled in 1831, he secretly founded 'Young Italy' and 'Young Europe'. Metternich was terrified of him, calling him 'the most dangerous enemy of our social order.'" },
      { speaker: 'Kabir', text: "All this pressure finally exploded starting with the July Revolution of 1830 in France, and the Greek War of Independence in 1832." }
    ],
    questions: [
      { q: "Who did Duke Metternich describe as 'the most dangerous enemy of our social order'?", opts: ["Napoleon Bonaparte", "King Louis Philippe", "Giuseppe Mazzini", "Otto von Bismarck"], ans: 2, explain: "Mazzini's relentless drive to create unified republics through secret societies terrified the conservative Metternich." }
    ]
  },
  {
    id: 7,
    title: 'The Polish Defiance',
    icon: '🎵',
    color: '#f43f5e',
    chats: [
      { type: 'narrative', text: 'The rain had not let up. Kabir cracked his knuckles.' },
      { speaker: 'Kabir', text: "How do you build a nation when half the people can't read? You don't use a sword. You use a song." },
      { speaker: 'Aryan', text: "A song? How is a song going to defeat an empire?" },
      { speaker: 'Kabir', text: "Romanticism. Think of it as a cultural weapon. Philosophers like Herder said true German culture was found among common people (das volk) through folk songs." },
      { speaker: 'Kabir', text: "Look at Poland. It was wiped off the map by Russia. Russia forced the Polish language out of schools. So what did the Polish clergy do? They used Polish for church gatherings." },
      { speaker: 'Kabir', text: "The Russians sent thousands of priests to Siberian prisons for it, but the message was clear: speaking Polish was an act of hardcore rebellion." }
    ],
    questions: [
      { q: "How did Poland resist Russian dominance after their armed rebellion failed in 1831?", opts: ["By invading Russia", "By using the Polish language in church and religious instruction", "By creating a new currency", "By writing letters to the King of England"], ans: 1, explain: "When physical rebellion failed, language and culture (Romanticism) became their weapon of resistance." }
    ]
  },
  {
    id: 8,
    title: "Weavers' Revolt",
    icon: '🔥',
    color: '#d946ef',
    chats: [
      { speaker: 'Kabir', text: "But culture alone doesn't start a massive fire. You need desperation. The 1830s brought massive population booms, filthy slums, and cheap machine goods destroying local jobs." },
      { speaker: 'Kabir', text: "This leads to the Silesian Weavers' Revolt in 1845. Contractors brutally exploited weavers, slashing their pay." },
      { speaker: 'Kabir', text: "On June 4th, a crowd marched to the contractor's mansion. When threatened, they smashed the elegant furniture and destroyed cloth storehouses! The army came, and eleven weavers were shot dead." },
      { speaker: 'Kabir', text: "Things got so bad in France by 1848 that people barricaded Paris. The king fled, and France became a Republic with voting rights for adult males." }
    ],
    questions: [
      { q: "What triggered the Silesian Weavers' Revolt in 1845?", opts: ["They wanted the right to vote", "Contractors drastically reduced their payments", "The Polish language was banned", "A bread tax was introduced"], ans: 1, explain: "Extreme economic hardship and brutal exploitation by contractors who slashed their payments drove the weavers to revolt." }
    ]
  },
  {
    id: 9,
    title: 'Frankfurt Heartbreak',
    icon: '💔',
    color: '#6366f1',
    chats: [
      { speaker: 'Rohan', text: "So France got freedom. Did Germany get theirs?" },
      { speaker: 'Kabir', text: "They tried. 1848 was the year of the Liberal Revolution. 831 elected representatives marched to the Frankfurt Parliament inside the Church of St. Paul." },
      { speaker: 'Kabir', text: "They drafted a constitution and offered the crown to Friedrich Wilhelm IV, King of Prussia. He basically laughed, rejected it, and called in the military to crush the assembly." },
      { speaker: 'Kabir', text: "And the tragic part? Women had fought hard in the struggle, but at Frankfurt, they were denied voting rights and only allowed to stand in the visitor's gallery as mere observers." }
    ],
    questions: [
      { q: "What was the result of the Frankfurt Parliament of 1848?", opts: ["Germany successfully united as a Republic", "The Prussian King accepted the crown", "The Prussian King rejected the crown and the military crushed the assembly", "Women were given full political rights"], ans: 2, explain: "Friedrich Wilhelm IV rejected the crown from an elected assembly and used military force to disband them." }
    ]
  },
  {
    id: 10,
    title: 'Blood and Iron',
    icon: '⚔️',
    color: '#0f766e',
    chats: [
      { speaker: 'Kabir', text: "Liberals failed. Democracy failed. Now, the big guns take over. Prussia unites Germany, but not with speeches—with weapons." },
      { speaker: 'Kabir', text: "Enter Otto von Bismarck. His strategy was literal 'Blood and Iron'. He engineered three wars over seven years against Denmark, Austria, and France." },
      { speaker: 'Kabir', text: "Prussia won them all. On a freezing morning—January 18, 1871—in the Hall of Mirrors at Versailles, Kaiser William I was proclaimed Emperor of the new German Empire." }
    ],
    questions: [
      { q: "Who was the chief architect of German Unification using the policy of 'Blood and Iron'?", opts: ["Duke Metternich", "Kaiser William I", "Otto von Bismarck", "Giuseppe Garibaldi"], ans: 2, explain: "Bismarck, the Chief Minister of Prussia, engineered wars using the military and bureaucracy to unite Germany." }
    ]
  },
  {
    id: 11,
    title: 'The Italian Puzzle',
    icon: '🧩',
    color: '#14b8a6',
    chats: [
      { speaker: 'Aryan', text: "But what about Mazzini and Italy?" },
      { speaker: 'Kabir', text: "Italy was a mess—divided into seven states. Its unification is a massive team-up movie featuring three heroes:" },
      { type: 'list', text: '1. The Heart (Mazzini): Planted the dream with Young Italy.\n2. The Brain (Cavour): A brilliant diplomat who allied with France to defeat Austria.\n3. The Sword (Garibaldi): Led an army of "Red Shirts" to conquer South Italy.' },
      { speaker: 'Kabir', text: "In 1861, Victor Emmanuel II was proclaimed King. Fun fact: the illiterate peasants had never heard of 'Italia'. They thought 'La Talia' was the King’s wife!" }
    ],
    questions: [
      { q: "Which Italian leader marched with armed volunteers known as the 'Red Shirts'?", opts: ["Cavour", "Victor Emmanuel II", "Giuseppe Garibaldi", "Giuseppe Mazzini"], ans: 2, explain: "Garibaldi (The Sword) led the Red Shirts to conquer the southern Kingdom of the Two Sicilies." }
    ]
  },
  {
    id: 12,
    title: 'BOSS: The British Empire',
    icon: '💂',
    color: '#b91c1c',
    chats: [
      { speaker: 'Kabir', text: "Finally, Britain. The weird one. No sudden, bloody revolution. Just slow, calculated dominance." },
      { speaker: 'Sohan', text: "Then how did they unite?" },
      { speaker: 'Kabir', text: "The English parliament seized power in 1688. Then they swallowed Scotland in the 1707 Act of Union (suppressing Scottish culture). Then they divided Catholics and Protestants in Ireland, crushing resistance and forcing Ireland into the UK in 1801." },
      { speaker: 'Kabir', text: "They built the 'British nation' through heavy propaganda: the Union Jack, 'God Save the King', and the English language." },
      { type: 'narrative', text: 'Kabir clapped his hands together, breaking the trance in the room.' },
      { speaker: 'Kabir', text: '"And there you have it. That is how the map of Europe was drawn in blood, poetry, and iron. Now, who\'s ready to ace this board exam?"' }
    ],
    questions: [
      { q: "How did the United Kingdom of Great Britain primarily form?", opts: ["Through a massive revolution in 1789", "By slowly and forcefully incorporating Scotland and Ireland while suppressing their cultures", "By signing a peaceful treaty with France in 1815", "Through the actions of the Red Shirts"], ans: 1, explain: "Britain used the Act of Union (1707) on Scotland and suppressed Irish revolts (1801) to forcefully build the UK." },
      { q: "Which of the following was NOT used as propaganda to build the new 'British nation'?", opts: ["The Union Jack flag", "The promotion of the Gaelic language", "The English language", "The anthem 'God Save Our Noble King'"], ans: 1, explain: "They promoted English and heavily suppressed local cultures like Scottish Gaelic." }
    ]
  }
];

export default function EpicNarrativeGauntlet() {
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
    <div className="min-h-[100dvh] bg-[#f8fafc] text-slate-800 font-sans overflow-hidden flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full max-w-md bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] px-4 py-3 sticky top-0 z-10 flex items-center justify-between border-b border-slate-200">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-black text-slate-800 text-lg">Nationalism in Europe</div>
          <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest leading-none">Class 10 History</div>
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
          <path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
          <path d="M 200,1700 C 50,1500 350,1300 200,1100 C 50,900 350,700 200,500 C 50,300 350,150 200,50" fill="none" stroke="#f1f5f9" strokeWidth="16" strokeLinecap="round" />
        </svg>

        {MAP_LEVELS.map((level, index) => {
          const isUnlocked = unlockedLevel >= level.id;
          const isCurrent = unlockedLevel === level.id;
          const isCompleted = unlockedLevel > level.id;

          // Alternate left, center, right curve
          const offsets = ['-50px', '20px', '50px', '-20px'];
          const xOffset = offsets[index % 4];

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              style={{ transform: `translateX(${xOffset})`, zIndex: 5 }}
              className="relative group"
            >
              {/* Tooltip for Title */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl text-xs font-black text-slate-700 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100">
                {level.title}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-100"></div>
              </div>

              {/* Node Button */}
              <button
                onClick={() => { if (isUnlocked) setActiveLevel(level.id); }}
                disabled={!isUnlocked}
                className={`
                  w-[84px] h-[84px] rounded-full flex flex-col items-center justify-center text-3xl shadow-xl transition-all relative
                  ${isUnlocked ? 'active:scale-95 active:translate-y-1 cursor-pointer' : 'grayscale opacity-60 cursor-not-allowed'}
                  ${isCurrent ? 'ring-4 ring-offset-4 ring-sky-400 animate-bounce-slow' : ''}
                `}
                style={{ 
                  background: isCompleted ? '#22c55e' : (isUnlocked ? level.color : '#cbd5e1'),
                  borderBottom: `8px solid ${isCompleted ? '#16a34a' : (isUnlocked ? level.color + 'aa' : '#94a3b8')}`,
                  borderTop: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                {isCompleted ? '⭐' : level.icon}
                <span className="text-[10px] font-black text-white/90 mt-1 drop-shadow-sm">Scene {level.id}</span>
                
                {/* Checkmark for completed */}
                {isCompleted && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full text-green-500 shadow-md p-0.5">
                    <CheckCircle2 className="w-6 h-6" />
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
          <LevelModal
            level={MAP_LEVELS.find(l => l.id === activeLevel)!}
            onClose={() => setActiveLevel(null)}
            onWin={() => handleWin(activeLevel)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ── The Modal UI (Chat Story + Battle) ────────────────────────────────────────────────────────
function LevelModal({ level, onClose, onWin }: { level: typeof MAP_LEVELS[0]; onClose: () => void; onWin: () => void; }) {
  const [phase, setPhase] = useState<'story' | 'battle' | 'feedback'>('story');
  const [chatIdx, setChatIdx] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll story
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatIdx]);

  const q = level.questions[qIndex];

  const handleNextStory = () => {
    if (chatIdx + 1 < level.chats.length) setChatIdx(i => i + 1);
    else setPhase('battle');
  };

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setPhase('feedback');
  };

  const handleNextBattle = () => {
    const isCorrect = selected === q.ans;
    if (isCorrect) {
      if (qIndex + 1 < level.questions.length) {
        setQIndex(i => i + 1);
        setSelected(null);
        setPhase('battle');
      } else {
        onWin();
      }
    } else {
      setLives(l => l - 1);
      if (lives - 1 <= 0) onClose(); // Game over, close modal
      else {
        setSelected(null);
        setPhase('battle');
      }
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scene {level.id}</span>
          <span className="font-black text-base text-slate-800 leading-none">{level.title}</span>
        </div>
        <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          <span className="font-black text-red-600">{lives}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* ── STORY PHASE (Chat bubbles) ── */}
        {phase === 'story' && (
          <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4 pb-32 space-y-4">
            {level.chats.slice(0, chatIdx + 1).map((chat, i) => {
              const isKabir = chat.speaker === 'Kabir';
              const isNarrative = chat.type === 'narrative';
              const isList = chat.type === 'list';

              if (isNarrative || isList) {
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-6">
                    <div className={`px-5 py-3 rounded-2xl text-sm font-medium border shadow-sm max-w-[90%]
                      ${isList ? 'bg-indigo-50 border-indigo-100 text-indigo-900 font-bold whitespace-pre-wrap leading-relaxed' : 'bg-white border-slate-200 text-slate-500 italic text-center'}`}>
                      {chat.text}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isKabir ? 'justify-start' : 'justify-end'} gap-2 w-full`}>
                  
                  {isKabir && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xs shrink-0 self-end mb-1 shadow-sm border-2 border-white">
                      K
                    </div>
                  )}

                  <div className={`relative px-5 py-3.5 rounded-[24px] max-w-[80%] shadow-sm whitespace-pre-wrap leading-relaxed text-[15px]
                    ${isKabir 
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm' 
                      : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border border-indigo-400 rounded-br-sm'}`}>
                    {/* Speaker name for non-Kabir */}
                    {!isKabir && <span className="block text-[10px] font-black uppercase text-indigo-200 mb-0.5">{chat.speaker}</span>}
                    {chat.text}
                  </div>

                  {!isKabir && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 self-end mb-1 shadow-sm border-2 border-white">
                      {chat.speaker?.charAt(0)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── BATTLE PHASE ── */}
        {phase === 'battle' && (
          <div className="absolute inset-0 overflow-y-auto p-6 flex flex-col justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 text-center">
              <div className="inline-block bg-sky-100 text-sky-600 font-black text-xs uppercase px-3 py-1 rounded-full mb-4 border border-sky-200">
                Question {qIndex + 1} of {level.questions.length}
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-snug">
                {q.q}
              </h3>
            </motion.div>

            <div className="space-y-3 mt-4">
              {q.opts.map((opt, i) => (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left p-5 rounded-3xl border-2 border-slate-200 bg-white font-bold text-slate-700 hover:border-sky-400 hover:bg-sky-50 shadow-sm transition-all"
                >
                  <span className="text-sky-400 font-black mr-3">{['A','B','C','D'][i]}</span>
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === 'feedback' && (
          <div className={`absolute inset-0 flex flex-col justify-center p-6 ${selected === q.ans ? 'bg-green-50' : 'bg-red-50'}`}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-[100px] mb-6 drop-shadow-md">
                {selected === q.ans ? '🥳' : '🧐'}
              </div>
              <h3 className={`text-4xl font-black mb-6 ${selected === q.ans ? 'text-green-600' : 'text-red-600'}`}>
                {selected === q.ans ? 'Awesome!' : 'Oops!'}
              </h3>
              <div className={`p-6 rounded-3xl border-2 ${selected === q.ans ? 'bg-white border-green-200 shadow-xl shadow-green-900/5' : 'bg-white border-red-200 shadow-xl shadow-red-900/5'}`}>
                <p className="font-bold text-lg text-slate-700 leading-relaxed">{q.explain}</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Area */}
      <div className={`p-4 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] z-20`}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={phase === 'story' ? handleNextStory : handleNextBattle}
          disabled={phase === 'battle'}
          className={`
            w-full py-4 rounded-2xl font-black text-[17px] flex justify-center items-center gap-2 shadow-sm text-white transition-all
            ${phase === 'story' && chatIdx + 1 < level.chats.length ? 'bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-700' : ''}
            ${phase === 'story' && chatIdx + 1 >= level.chats.length ? 'bg-sky-500 hover:bg-sky-600 border-b-4 border-sky-700' : ''}
            ${phase === 'feedback' && selected === q.ans ? 'bg-green-500 hover:bg-green-600 border-b-4 border-green-700' : ''}
            ${phase === 'feedback' && selected !== q.ans ? 'bg-red-500 hover:bg-red-600 border-b-4 border-red-700' : ''}
            ${phase === 'battle' ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none' : ''}
          `}
        >
          {phase === 'story' ? (chatIdx + 1 < level.chats.length ? 'Tap to continue' : 'Enter Battle ⚔️') : 
           phase === 'battle' ? 'Select an answer' : 
           'Continue'}
          {(phase !== 'battle') && <ChevronRight className="w-6 h-6" />}
        </motion.button>
      </div>

    </motion.div>
  );
}
