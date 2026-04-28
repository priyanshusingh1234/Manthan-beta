export interface Q { q: string; opts: string[]; ans: number; explain: string; }
export interface Panel { bg: string; icon: string; scene: string; title: string; text: string; bullets: string[]; color: string; }

export const Q_SOLDIER: Q[] = [
  { q: "In what year did the French Revolution begin?", opts: ["1776", "1789", "1804", "1815"], ans: 1, explain: "1789 — The French people overthrew the absolute monarchy, shifting power to citizens." },
  { q: "What does 'La Patrie' mean?", opts: ["The Citizen", "The Fatherland", "The Republic", "The Senate"], ans: 1, explain: "La Patrie = 'The Fatherland'. It was used to build a sense of collective French identity." },
  { q: "What flag replaced the royal standard after 1789?", opts: ["Red Banner", "Black Eagle", "French Tricolour", "White Cross"], ans: 2, explain: "The French Tricolour replaced the royal standard as a powerful new national symbol." },
];

export const Q_GENERAL: Q[] = [
  { q: "The Napoleonic Code (1804) abolished which system?", opts: ["The Republic", "The Feudal System", "The Church", "The Monarchy"], ans: 1, explain: "The Napoleonic Code abolished the feudal system, freeing peasants from serfdom." },
  { q: "Who hosted the Treaty of Vienna in 1815?", opts: ["Napoleon", "Duke Metternich", "Giuseppe Mazzini", "Friedrich Wilhelm IV"], ans: 1, explain: "Duke Metternich, Austrian Chancellor, hosted the Treaty of Vienna to restore monarchies." },
  { q: "Where did Mazzini secretly found 'Young Italy' after exile?", opts: ["Rome", "Vienna", "Marseilles", "Berne"], ans: 2, explain: "After being exiled in 1831, Mazzini secretly founded Young Italy in Marseilles, France." },
];

export const Q_BOSS: Q[] = [
  { q: "Frankfurt Parliament was convened on which date in 1848?", opts: ["January 18", "May 18", "July 4", "March 15"], ans: 1, explain: "On May 18, 1848, 831 elected representatives marched to the Church of St. Paul." },
  { q: "What was Otto von Bismarck's famous strategy called?", opts: ["Liberty or Death", "Blood and Iron", "Bread and Roses", "Fire and Sword"], ans: 1, explain: "Bismarck's strategy was 'Blood and Iron' — relying on the Prussian army, not speeches." },
  { q: "The THREE heroes of Italian unification were:", opts: ["Napoleon, Cavour, Mazzini", "Mazzini, Cavour, Garibaldi", "Garibaldi, Bismarck, Cavour", "Victor Emmanuel, Wellington, Mazzini"], ans: 1, explain: "Mazzini (the Heart), Cavour (the Brain), and Garibaldi (the Sword) united Italy." },
  { q: "Act of Union (1707): England united with which country?", opts: ["Ireland", "Wales", "Scotland", "France"], ans: 2, explain: "The Act of Union in 1707 united England and Scotland, creating 'Great Britain'." },
  { q: "Where was Kaiser Wilhelm I proclaimed German Emperor in 1871?", opts: ["Berlin Cathedral", "Church of St. Paul, Frankfurt", "Hall of Mirrors, Versailles", "Buckingham Palace"], ans: 2, explain: "On Jan 18, 1871, in the Hall of Mirrors at Versailles — the German Empire was born." },
];

export const PANELS_ACT1: Panel[] = [
  {
    bg: "radial-gradient(ellipse at top, #7f1d1d 0%, #1c1917 60%)",
    icon: "🔥", scene: "Scene 1 · 1789", title: "The French Spark",
    text: "Imagine it's the late 1700s. You are a PEASANT. You work all day, and some king in a palace takes all your money just because God supposedly put him there. That was absolute monarchy. But in 1789, the French people SNAPPED. The French Revolution happened — power shifted from the monarchy to the citizens.",
    bullets: ["🏛️ La Patrie (Fatherland) + Le Citoyen (Citizen) — united the people", "🚩 New French Tricolour replaced the royal flag", "🗣️ French promoted as the one national language", "📜 Estates General renamed the National Assembly"],
    color: "#fb923c",
  },
  {
    bg: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%)",
    icon: "👑", scene: "Scene 2 · 1799–1804", title: "Enter Napoleon Bonaparte",
    text: "By 1799, a military genius named Napoleon takes over and crowns himself Emperor. He was a dictator — but an incredibly SMART one. In 1804, he introduced the Napoleonic Code, spreading it across all of Europe with his armies.",
    bullets: ["⚖️ Equality before the law for all citizens", "🏚️ Feudal system ABOLISHED — peasants freed!", "🏭 Guild restrictions removed in towns", "🛣️ Transport & communication massively improved"],
    color: "#818cf8",
  },
  {
    bg: "radial-gradient(ellipse at top, #3b0764 0%, #0f172a 60%)",
    icon: "🗺️", scene: "Scene 3 · 1815", title: "Napoleon Falls — Europe is a Mess",
    text: "Napoleon got greedy. By 1815, Britain, Russia, Prussia, and Austria teamed up and crushed him at the BATTLE OF WATERLOO. But the Europe they were left with had no 'Germany', no 'Italy' — just kingdoms ruled by autocratic kings.",
    bullets: ["⚔️ No unified Germany, no unified Italy — just kingdoms!", "🏔️ Habsburg Empire: patchwork of German, Italian, Polish speakers", "👑 Two extremes: Rich Aristocracy vs. Mass Peasantry", "💡 A new player rises: The Middle Class (liberals)"],
    color: "#c084fc",
  },
];

export const PANELS_ACT2: Panel[] = [
  {
    bg: "radial-gradient(ellipse at top, #064e3b 0%, #0f172a 60%)",
    icon: "📜", scene: "Scene 4 · 1815", title: "The Treaty of Vienna",
    text: "The conservatives held a massive power meeting: the Treaty of Vienna. Hosted by the ultimate mastermind, Austrian Chancellor Duke Metternich. Their single goal? Undo EVERYTHING Napoleon did and restore the old kings.",
    bullets: ["👑 Bourbon dynasty restored to power in France", "🛡️ New buffer states created on France's borders", "🗺️ Prussia & Russia rewarded with massive new territories", "🔇 Press censored — liberals locked up"],
    color: "#34d399",
  },
  {
    bg: "radial-gradient(ellipse at top, #500724 0%, #0f172a 60%)",
    icon: "🗡️", scene: "Scene 5 · 1831", title: "The Underground Resistance",
    text: "When you crush freedom, it goes UNDERGROUND. Enter our rebel hero: Giuseppe Mazzini — exiled from Italy but relentlessly building secret revolutionary networks. Metternich called him 'the most dangerous enemy of our social order.'",
    bullets: ["🤫 Exiled from Italy in 1831", "🇮🇹 Founded Young Italy in Marseilles, France", "🌍 Founded Young Europe in Berne, Switzerland", "💬 Believed God intended nations as the natural units of mankind"],
    color: "#fb7185",
  },
  {
    bg: "radial-gradient(ellipse at top, #451a03 0%, #0f172a 60%)",
    icon: "🎵", scene: "Scene 6 · 1830s", title: "Culture as a Weapon",
    text: "You can't defeat an empire with swords alone — you use a SONG. The Romantic movement used poetry, art, and folk music to build emotional national identity. In Poland, simply speaking your own language became an act of hardcore political rebellion.",
    bullets: ["📚 Russia wiped Polish language from ALL schools", "✝️ Clergy used Polish for church gatherings", "🚂 Thousands of Polish priests sent to Siberian prisons!", "🗣️ Speaking Polish = an act of rebellion against the Russian Empire"],
    color: "#fbbf24",
  },
];

export const PANELS_ACT3: Panel[] = [
  {
    bg: "radial-gradient(ellipse at top, #0c4a6e 0%, #0f172a 60%)",
    icon: "🏭", scene: "Scene 7 · 1845", title: "Weavers' Revolt — Desperation Ignites",
    text: "A population boom + cheap English machine goods were destroying local livelihoods. Silesian Weavers had enough. June 4th, 1845: they marched to the contractor's mansion demanding higher wages. He refused. They smashed the place.",
    bullets: ["😠 Weavers exploited: wages slashed by contractors", "🚶 Marched to mansion demanding fair pay", "💥 Smashed furniture and destroyed stored cloth", "💀 Army called in — ELEVEN weavers shot dead"],
    color: "#22d3ee",
  },
  {
    bg: "radial-gradient(ellipse at top, #3b0764 0%, #0f172a 60%)",
    icon: "🏛️", scene: "Scene 8 · 1848", title: "The Frankfurt Heartbreak",
    text: "1848 was the year of Liberal Revolution. Middle classes across Europe rose up. In Germany, 831 elected representatives marched to the Frankfurt Parliament, drafted a constitution, and offered the German crown to the King of Prussia. He laughed in their faces and rejected it.",
    bullets: ["🏛️ Frankfurt Parliament, Church of St. Paul — May 18, 1848", "👑 Crown offered to Friedrich Wilhelm IV — REJECTED!", "⚔️ Military crushed the elected assembly", "👩 Women could only stand in the VISITOR'S GALLERY!"],
    color: "#a78bfa",
  },
  {
    bg: "radial-gradient(ellipse at top, #1c1917 0%, #0a0a0a 60%)",
    icon: "⚔️", scene: "Scene 9 · 1860–1871", title: "Blood, Iron & Red Shirts",
    text: "Liberals failed. Democracy failed. Now the BIG GUNS take over. Bismarck uses real armies. Garibaldi's Red Shirts march through Italy. The modern map of Europe is being drawn in blood.",
    bullets: ["⚔️ Bismarck won 3 wars vs Denmark, Austria, France", "🇩🇪 Jan 18, 1871 — German Empire proclaimed at Hall of Mirrors, Versailles!", "🔴 Garibaldi's Red Shirts marched into South Italy (1860)", "🇮🇹 Victor Emmanuel II — King of united Italy (1861)"],
    color: "#94a3b8",
  },
];
