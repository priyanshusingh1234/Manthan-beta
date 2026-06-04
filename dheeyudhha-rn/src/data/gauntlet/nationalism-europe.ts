// Dheeyudha App - History Module Payload: Rise of Nationalism in Europe
export type NoteBlock = {
  type: 'heading' | 'subheading' | 'paragraph' | 'highlight' | 'quote' | 'bullet' | 'narrative';
  content?: string;
  title?: string;
};

export type Question = {
  q: string;
  opts: string[];
  ans: number;
  explain: string;
};

export type MapLevel = {
  id: number;
  title: string;
  icon: string;
  color: string;
  notes: NoteBlock[];
  questions: Question[];
};

export const LEVEL_1: MapLevel = {
  id: 1,
  title: 'The French Spark (1789)',
  icon: '🔥',
  color: '#0ea5e9',
  notes: [
    { type: 'narrative', content: 'Kabir opened his heavily annotated history journal. "You want to clear your boards? Then you can\'t just memorize dates. You have to understand the socio-economic tectonic plates that crushed the Bourbon monarchy," he said.' },
    { type: 'heading', content: 'Scene 1: The French Revolution and the Idea of the Nation' },
    { type: 'highlight', content: 'Core Concept: The Shift of Sovereignty' },
    { type: 'paragraph', content: 'The first clear expression of nationalism came with the French Revolution in 1789. France was a full-fledged territorial state under the rule of an absolute monarch (King Louis XVI of the Bourbon dynasty). The political and constitutional changes that came in the wake of the French Revolution led to the transfer of sovereignty from the monarchy to a body of French citizens.' },
    { type: 'quote', content: '"Sovereignty resides essentially in the Nation. No body, no individual can exercise authority that does not expressly emanate from it." — Declaration of the Rights of Man and of the Citizen (1789)' },
    { type: 'subheading', content: 'Creating a Collective Identity (Psychological Warfare)' },
    { type: 'paragraph', content: 'A nation isn\'t built on borders alone; it is built on a shared consciousness. The French revolutionaries introduced various measures and practices that could create a sense of collective identity among the French people:' },
    { type: 'bullet', title: '1. La Patrie and Le Citoyen', content: 'The ideas of la patrie (the fatherland) and le citoyen (the citizen) emphasized the notion of a united community enjoying equal rights under a constitution. This actively dismantled the old feudal hierarchy of estates.' },
    { type: 'bullet', title: '2. The Tricolour Flag', content: 'A new French flag, the tricolour, was chosen to replace the former royal standard. Visual symbols bypass literacy barriers and unite illiterate peasant masses.' },
    { type: 'bullet', title: '3. The National Assembly', content: 'The Estates General was elected by the body of active citizens and renamed the National Assembly. Note for exams: Only men above 25 who paid equal to 3 days of a labourer\'s wage in taxes were "active citizens".' },
    { type: 'bullet', title: '4. Centralized Administration', content: 'New hymns were composed, oaths taken, and martyrs commemorated, all in the name of the nation. A centralized administrative system formulated uniform laws for all citizens.' },
    { type: 'bullet', title: '5. Linguistic Unification', content: 'Regional dialects were discouraged, and French, as it was spoken in Paris, became the common language of the nation.' }
  ],
  questions: [
    {
      q: "Under the new constitution of 1789, who were legally defined as 'active citizens'?",
      opts: ["All adult men and women in France", "Only the Clergy and Nobility", "Men above 25 paying taxes equal to at least 3 days of a labourer's wage", "Anyone who actively fought in the revolution"],
      ans: 2,
      explain: "The right to vote was restricted. Only tax-paying men over 25 were 'active citizens', showing the bourgeois nature of the early revolution."
    },
    {
      q: "How did the French revolutionaries deal with internal economics and trade barriers?",
      opts: ["They doubled internal customs to fund the war", "They abolished internal customs duties and standardized weights and measures", "They banned all domestic trade outside of Paris", "They returned all trade control to the guilds"],
      ans: 1,
      explain: "To unify the nation economically, they abolished internal tariffs and adopted uniform weights and measures."
    },
    {
      q: "What was the international consequence of the formation of Jacobin clubs across European cities?",
      opts: ["They invited the British to invade France", "They paved the way for French revolutionary armies to enter European countries", "They restored local monarchs to power", "They forced the Pope to excommunicate France"],
      ans: 1,
      explain: "Educated middle classes setting up Jacobin clubs essentially prepared their countries to welcome the French armies."
    }
  ]
};

export const LEVEL_2: MapLevel = {
  id: 2,
  title: 'Napoleon & The Civil Code',
  icon: '👑',
  color: '#3b82f6',
  notes: [
    { type: 'heading', content: 'Scene 2: The Ambiguous Legacy of Napoleon (1799 - 1815)' },
    { type: 'paragraph', content: 'Through a return to monarchy, Napoleon had destroyed democracy in France, but in the administrative field, he had incorporated revolutionary principles to make the whole system more rational and efficient.' },
    { type: 'highlight', content: 'The Napoleonic Code (Civil Code of 1804)' },
    { type: 'paragraph', content: 'This code is Napoleon\'s most lasting legacy. For competitive exams, remember the exact pillars of this code:' },
    { type: 'bullet', title: '1. Privileges Abolished', content: 'It did away with all privileges based on birth.' },
    { type: 'bullet', title: '2. Equality Before the Law', content: 'It established equality before the law and secured the right to property. (However, it reduced women to the status of a minor, subject to the authority of fathers and husbands).' },
    { type: 'bullet', title: '3. Feudalism Destroyed Abroad', content: 'In the Dutch Republic, Switzerland, Italy and Germany, Napoleon abolished the feudal system and freed peasants from serfdom.' },
    { type: 'bullet', title: '4. Urban Modernization', content: 'Guild restrictions were removed. Transport and communication systems were improved.' },
    { type: 'subheading', content: 'The Double-Edged Sword of French Conquest' },
    { type: 'paragraph', content: 'Initially, French armies were welcomed as harbingers of liberty. Businessmen realized that uniform laws and a common national currency would facilitate the movement of goods.' },
    { type: 'paragraph', content: 'However, the enthusiasm turned to hostility. Why? Because the new administrative arrangements did not go hand in hand with political freedom.' },
    { type: 'bullet', title: 'Increased Taxation', content: 'Running a massive continental empire requires deep pockets. Napoleon heavily taxed conquered territories.' },
    { type: 'bullet', title: 'Censorship', content: 'Political freedom was crushed. The press was highly restricted.' },
    { type: 'bullet', title: 'Forced Conscription', content: 'Napoleon forced men from conquered regions into the French armies to conquer the rest of Europe.' }
  ],
  questions: [
    {
      q: "What was a major regressive feature of the otherwise modern Napoleonic Code (1804)?",
      opts: ["It restored the privileges of the clergy", "It reintroduced the feudal system in Italy", "It reduced women to the status of a minor, subject to fathers and husbands", "It banned all forms of private property"],
      ans: 2,
      explain: "Despite making men equal before the law, the Code actively stripped women of rights, treating them as legal minors."
    },
    {
      q: "Why did the initial European enthusiasm for French armies quickly turn into hostility?",
      opts: ["Because the French forced everyone to speak English", "Due to increased taxation, censorship, and forced conscription into French armies", "Because Napoleon gave away conquered lands to Britain", "Because they disbanded all local businesses"],
      ans: 1,
      explain: "Administrative efficiency was outweighed by heavy taxes, strict censorship, and the forced drafting of locals into fighting French wars."
    },
    {
      q: "Which specific groups in conquered European towns benefited the MOST initially from Napoleon's reforms?",
      opts: ["Aristocrats and the Clergy", "Businessmen, artisans, and small-scale producers", "The Bourbon monarchy supporters", "British spies"],
      ans: 1,
      explain: "The removal of guild restrictions, common currency, and standardized weights immensely benefited small-scale business owners."
    }
  ]
};

export const LEVEL_3: MapLevel = {
  id: 3,
  title: 'The Making of Nationalism',
  icon: '🌍',
  color: '#8b5cf6',
  notes: [
    { type: 'heading', content: 'Scene 3: Pre-Revolutionary Europe & The Clash of Classes' },
    { type: 'paragraph', content: 'In mid-18th-century Europe, "nation-states" didn\'t exist. Places like Germany, Italy and Switzerland were divided into kingdoms and duchies.' },
    { type: 'highlight', content: 'Case Study: The Habsburg Empire' },
    { type: 'paragraph', content: 'The Habsburg Empire ruled over Austria-Hungary. It was a patchwork. It included the Alpine regions — the Tyrol, Austria and the Sudetenland — as well as Bohemia. You had German, Italian, and Polish speakers. The ONLY tie binding these diverse groups together was a common allegiance to the emperor.' },
    { type: 'subheading', content: 'The Dominant Aristocracy vs The New Middle Class' },
    { type: 'bullet', title: 'The Aristocrats', content: 'They were politically dominant, spoke French for diplomacy, and were connected by marriage. However, they were numerically a very small group.' },
    { type: 'bullet', title: 'The New Middle Class', content: 'Born out of the Industrial Revolution which created commercial classes (factory owners, businessmen, professionals). It was among these educated, liberal middle classes that ideas of national unity gained popularity.' },
    { type: 'subheading', content: 'What did Liberal Nationalism Stand for?' },
    { type: 'paragraph', content: 'The term "liberalism" derives from the Latin root *liber*, meaning free.' },
    { type: 'bullet', title: 'Political Liberalism', content: 'Stood for freedom for the individual, government by consent, end of autocracy, and a constitution.' },
    { type: 'bullet', title: 'Economic Liberalism', content: 'Stood for the freedom of markets and the abolition of state-imposed restrictions on trade.' },
    { type: 'highlight', content: 'The Zollverein (1834)' },
    { type: 'paragraph', content: 'To solve the chaos of different currencies and weights across German states, a customs union or Zollverein was formed at the initiative of Prussia. The union abolished tariff barriers and reduced currencies from over 30 to just 2. A wave of economic nationalism strengthened wider nationalist sentiments.' }
  ],
  questions: [
    {
      q: "Culturally, how did the powerful Aristocracy across divided European kingdoms maintain a unified identity?",
      opts: ["By all serving in the military together", "By speaking French, owning estates, and connecting through marriage", "By forcing the peasants to adopt their religion", "By attending the same universities in London"],
      ans: 1,
      explain: "Despite fragmented borders, Aristocrats formed a unified elite network by speaking French and intermarrying."
    },
    {
      q: "What was the primary purpose of the 'Zollverein' formed in 1834?",
      opts: ["To declare war on France", "To establish a German Parliament", "To abolish tariff barriers and reduce currencies for economic unification", "To enforce strict press censorship"],
      ans: 2,
      explain: "The Zollverein was a customs union that unified German states economically, speeding up trade."
    },
    {
      q: "What does the Latin root 'liber' in Liberal Nationalism mean?",
      opts: ["Free", "King", "Nation", "Law"],
      ans: 0,
      explain: "Liber means 'free', underscoring the middle-class desire for freedom of the individual and free markets."
    }
  ]
};

export const LEVEL_4: MapLevel = {
  id: 4,
  title: 'Conservatism & Secret Societies',
  icon: '🏰',
  color: '#dc2626',
  notes: [
    { type: 'heading', content: 'Scene 4: A New Conservatism after 1815' },
    { type: 'paragraph', content: 'In 1815, European powers (Britain, Russia, Prussia, and Austria) who had collectively defeated Napoleon, met at Vienna to draw up a settlement for Europe.' },
    { type: 'highlight', content: 'The Congress of Vienna (1815)' },
    { type: 'paragraph', content: 'Hosted by the brilliant, deeply traditional Austrian Chancellor, Duke Metternich. The conservative philosophy was simple: We must revert to traditional institutions like the monarchy, the Church, social hierarchies, and property. However, modern armies and bureaucracies created by Napoleon could actually be kept to strengthen their autocratic monarchies.' },
    { type: 'subheading', content: 'Key Outcomes of the Treaty of Vienna:' },
    { type: 'bullet', title: '1. The Bourbon Restoration', content: 'The Bourbon dynasty, overthrown during the French Revolution, was violently restored to power.' },
    { type: 'bullet', title: '2. French Containment', content: 'A series of states were set up on the boundaries of France to prevent French expansion in future. (e.g. Kingdom of the Netherlands was set up in the north, Genoa was added to Piedmont in the south).' },
    { type: 'bullet', title: '3. Division of Spoils', content: 'Prussia was given new territories on its western frontiers, while Austria was given control of northern Italy. Russia was given part of Poland.' },
    { type: 'subheading', content: 'The Revolutionaries Go Underground' },
    { type: 'paragraph', content: 'Conservative regimes set up in 1815 were autocratic. They did not tolerate criticism and heavily censored the press. This lack of freedom pushed liberal-nationalists underground into secret societies.' },
    { type: 'highlight', content: 'Giuseppe Mazzini: The Terror of Metternich' },
    { type: 'paragraph', content: 'An Italian revolutionary born in Genoa (1807). Exiled at 24 years old for attempting a revolution in Liguria. What made him a legend was his organization:' },
    { type: 'bullet', title: 'Secret Societies', content: 'He founded "Young Italy" in Marseilles, and "Young Europe" in Berne, whose members were like-minded young men from Poland, France, Italy, and the German states.' },
    { type: 'bullet', title: 'His Philosophy', content: 'Mazzini believed that God had intended nations to be the natural units of mankind. So Italy could not continue to be a patchwork of small states and kingdoms. It had to be forged into a single unified republic.' },
    { type: 'quote', content: '"Mazzini is the most dangerous enemy of our social order." — Metternich.' }
  ],
  questions: [
    {
      q: "Who hosted the Congress of Vienna in 1815?",
      opts: ["Napoleon Bonaparte", "Giuseppe Mazzini", "Duke Metternich", "Kaiser William I"],
      ans: 2,
      explain: "Austrian Chancellor Duke Metternich hosted it to undo Napoleon's changes and restore conservative monarchies."
    },
    {
      q: "What was an important containment strategy enacted by the Treaty of Vienna against France?",
      opts: ["They forced France to adopt English as its national language", "They set up buffer states along France's borders to prevent future expansion", "They banned all French citizens from owning property", "They gave all French territories to the Pope"],
      ans: 1,
      explain: "They created a 'buffer zone' (like adding Genoa to Piedmont) to permanently block France from expanding its borders again."
    },
    {
      q: "What was Giuseppe Mazzini's core belief regarding the formation of Italy?",
      opts: ["Italy should be sold to the British Empire", "Italy should be ruled by the Pope", "God intended nations to be the natural units of mankind, requiring a single unified Italian Republic", "Italy should revert to the Bourbon dynasty"],
      ans: 2,
      explain: "Mazzini vehemently opposed the patchwork of kingdoms and fought for a single, unified Italian Republic."
    }
  ]
};

export const LEVEL_5: MapLevel = {
  id: 5,
  title: 'The Age of Revolutions',
  icon: '🌊',
  color: '#f59e0b',
  notes: [
    { type: 'heading', content: 'Scene 5: The Age of Revolutions 1830-1848' },
    { type: 'paragraph', content: 'As conservative regimes tried to consolidate their power, liberalism and nationalism became increasingly associated with revolution in many regions of Europe such as the Italian and German states, the provinces of the Ottoman Empire, Ireland, and Poland.' },
    { type: 'highlight', content: 'The July Revolution (France, 1830)' },
    { type: 'paragraph', content: 'The first upheaval took place in France in July 1830. The Bourbon kings who had been restored to power in 1815 were now overthrown by liberal revolutionaries who installed a constitutional monarchy with Louis Philippe at its head.' },
    { type: 'quote', content: '"When France sneezes, the rest of Europe catches cold." — Metternich.' },
    { type: 'paragraph', content: 'True to Metternich’s iconic quote, the July Revolution sparked an uprising in Brussels which led to Belgium breaking away from the United Kingdom of the Netherlands.' },
    { type: 'subheading', content: 'The Greek War of Independence' },
    { type: 'paragraph', content: 'Greece had been part of the Muslim Ottoman Empire since the 15th century. Inspired by revolutionary nationalism, the Greeks began a struggle for independence in 1821.' },
    { type: 'bullet', title: 'Support for Greece', content: 'Nationalists in Greece got massive support from other Greeks living in exile and also from many West Europeans who had sympathies for ancient Greek culture.' },
    { type: 'bullet', title: 'The Treaty of Constantinople (1832)', content: 'After years of fighting and massive cultural support completely isolating the Ottomans, this treaty officially recognized Greece as an independent nation.' },
    { type: 'subheading', content: 'The Romantic Imagination and National Feeling' },
    { type: 'paragraph', content: 'The development of nationalism did not come about only through wars. Culture played an equally important role in creating the idea of the nation: art and poetry, stories and music.' },
    { type: 'bullet', title: 'Johann Gottfried Herder', content: 'A German philosopher who claimed that true German culture was to be discovered among the common people / peasants (das volk). It was through folk songs, folk poetry and folk dances that the true spirit of the nation (volksgeist) was popularized.' },
    { type: 'bullet', title: 'The Polish Language Rebellion', content: 'Poland had been partitioned by Russia, Prussia, and Austria. After an armed rebellion in 1831 was crushed by Russia, Polish citizens weaponized language. Russia forced Polish out of schools, so Polish clergy used Polish exclusively for church gatherings. Thousands of priests were thrown into Siberian prisons, but using Polish became a massive symbol of resistance.' }
  ],
  questions: [
    {
      q: "What did Metternich mean when he said 'When France sneezes, the rest of Europe catches cold'?",
      opts: ["France was responsible for spreading the bubonic plague", "Changes in French leadership frequently spread flu viruses through royal courts", "Political revolutions and uprisings starting in France quickly inspire similar rebellions across all of Europe", "It was a critique of the French medical system"],
      ans: 2,
      explain: "Events in France (like the 1789 Revolution and the 1830 July Revolution) consistently triggered chain reactions of rebellions throughout Europe."
    },
    {
      q: "Which empire was Greece attempting to break away from during the Greek War of Independence (1821-1832)?",
      opts: ["The British Empire", "The Habsburg Empire", "The Ottoman Empire", "The Russian Empire"],
      ans: 2,
      explain: "Greece had been ruled by the Muslim Ottoman Empire since the 15th century before finally achieving independence."
    },
    {
      q: "How did Romantic philosophers like Johann Gottfried Herder view the creation of a nation?",
      opts: ["It can only be achieved through massive military conquest and 'Blood and Iron'", "The true spirit of a nation (volksgeist) is found in the common people through folk songs and dances", "It requires the absolute power of a monarch to enforce a united culture", "Nations are artificial constructs and should not exist"],
      ans: 1,
      explain: "Romanticism rejected cold logic and heavily emphasized emotion, peasant folklore, and local language to discover the true spirit of a nation."
    }
  ]
};

export const LEVEL_6: MapLevel = {
  id: 6,
  title: 'Hunger & 1848 Heartbreak',
  icon: '💔',
  color: '#ec4899',
  notes: [
    { type: 'heading', content: 'Scene 6: Hunger, Hardship, and Popular Revolt' },
    { type: 'paragraph', content: 'The 1830s were years of great economic hardship in Europe. There was a massive increase in population all over Europe, leading to more seekers of jobs than employment.' },
    { type: 'bullet', title: 'Rural Migration to Slums', content: 'Population from rural areas migrated to the cities to live in overcrowded slums.' },
    { type: 'bullet', title: 'English Machine Competition', content: 'Small producers in towns were often faced with stiff competition from imports of cheap machine-made goods from England.' },
    { type: 'bullet', title: 'Peasant Hardships', content: 'In regions of Europe where the aristocracy still enjoyed power, peasants struggled under the burden of feudal dues and obligations.' },
    { type: 'highlight', content: 'The Silesian Weavers\' Uprising (1845)' },
    { type: 'paragraph', content: 'In Silesia, weavers led a desperate revolt against contractors who supplied them raw material and gave them orders for finished textiles but drastically reduced their payments. On 4 June, a large crowd of weavers marched to the mansion of their contractor demanding higher wages. They smashed his elegant window panes and destroyed cloth. The contractor fled, returned with the army, and eleven weavers were shot dead. It showed the extreme desperation of the working class.' },
    { type: 'subheading', content: '1848: The Revolution of the Liberals' },
    { type: 'paragraph', content: 'In 1848, parallel to the revolts of the starving peasants, a revolution led by the educated middle classes was under way.' },
    { type: 'bullet', title: 'The Frankfurt Parliament', content: 'In the German regions, a large number of political associations (whose members were middle-class professionals, businessmen, and prosperous artisans) decided to vote for an all-German National Assembly. On May 18, 1848, 831 elected representatives marched to take their places in the Frankfurt parliament convened in the Church of St Paul.' },
    { type: 'bullet', title: 'The Great Betrayal', content: 'They drafted a constitution for a German nation to be headed by a monarchy subject to a parliament. When the deputies offered the crown on these terms to Friedrich Wilhelm IV, King of Prussia, he rejected it and joined other monarchs to oppose the elected assembly.' },
    { type: 'bullet', title: 'The Collapse', content: 'By losing the support of the aristocracy AND failing to help the lower classes, the parliament lacked a power base. Troops were called in, and the assembly was violently disbanded.' },
    { type: 'highlight', content: 'The Status of Women' },
    { type: 'paragraph', content: 'The issue of extending political rights to women was a controversial one within the liberal movement, in which large numbers of women had participated actively over the years. Despite their sacrifices, when the Frankfurt parliament convened, women were admitted only as observers to stand in the visitors’ gallery. They were completely denied suffrage rights.' }
  ],
  questions: [
    {
      q: "What were the primary socio-economic causes of the Silesian Weavers' revolt in 1845?",
      opts: ["The weavers wanted the right to form a national assembly", "Contractors were drastically reducing their payments down to unlivable wages", "They were protesting against the use of the German language", "The weavers wanted to overthrow the Prussian king"],
      ans: 1,
      explain: "The revolt was purely driven by economic exploitation; the contractors slashed payments down to starvation levels."
    },
    {
      q: "What fatal mistake led to the ultimate failure and disbandment of the Frankfurt Parliament of 1848?",
      opts: ["They elected a French King to lead them", "They offered the crown to Friedrich Wilhelm IV who immediately rejected a democratic crown, and then the parliament was crushed by the military", "They successfully formed a republic but ran out of money", "They banned women from entering the city entirely"],
      ans: 1,
      explain: "Friedrich Wilhelm IV rejected the crown because it was offered by an elected body rather than 'divine right', and he subsequently crushed the parliament using troops."
    },
    {
      q: "Despite forming their own political associations and newspapers, what was the status of women at the Frankfurt Parliament?",
      opts: ["They were granted half of the voting rights of men", "They were elected directly into the National Assembly", "They were denied all voting rights and admitted only as mere observers in the visitor's gallery", "They were placed in charge of the military strategy"],
      ans: 2,
      explain: "Liberal men hypocritically denied women suffrage rights; women could only watch the parliament strictly from the visitor's gallery."
    }
  ]
};

export const LEVEL_7: MapLevel = {
  id: 7,
  title: 'Germany: Blood and Iron',
  icon: '⚔️',
  color: '#4f46e5',
  notes: [
    { type: 'narrative', content: 'Kabir tapped the desk. "The liberals failed in 1848. Speeches and parliaments couldn\'t unite Germany. So, Prussia decided to do it the hard way. Not with poetry, but with weapons."' },
    { type: 'heading', content: 'Scene 7: The Unification of Germany (1866-1871)' },
    { type: 'paragraph', content: 'After the failure of the 1848 Frankfurt Parliament, nationalism in Europe moved away from its association with democracy and revolution. Nation-building was now hijacked by conservatives to promote state power. Prussia took on the leadership of the movement for national unification.' },
    { type: 'highlight', content: 'The Architect: Otto von Bismarck' },
    { type: 'paragraph', content: 'Bismarck was the Chief Minister of Prussia. He is considered the ultimate architect of German unification. He didn\'t believe in democratic votes; he relied entirely on the Prussian army and the bureaucracy. His legendary strategy was known as "Blood and Iron".' },
    { type: 'bullet', title: 'The Three Wars', content: 'Bismarck engineered three wars over seven years against Denmark, Austria, and France. Prussia\'s highly disciplined army won every single one, completely securing Prussian dominance and finishing the process of unification.' },
    { type: 'subheading', content: 'The Proclamation at Versailles' },
    { type: 'paragraph', content: 'On a bitterly cold morning—January 18, 1871—an assembly comprising the princes of the German states, representatives of the army, and key Prussian ministers including Bismarck gathered in the unheated Hall of Mirrors at the Palace of Versailles.' },
    { type: 'bullet', title: 'The New Emperor', content: 'They proclaimed the Prussian king, Kaiser William I, as the Emperor of a newly unified German Empire.' },
    { type: 'paragraph', content: 'Bismarck became the first Chancellor of this unified empire, establishing a powerful executive role that continues to lead Germany today under modern Chancellors like Friedrich Merz. The new German state placed a massive emphasis on modernizing the currency, banking, legal, and judicial systems in Germany.' }
  ],
  questions: [
    {
      q: "Who was the chief architect of the unification of Germany?",
      opts: ["Kaiser William I", "Duke Metternich", "Otto von Bismarck", "Giuseppe Mazzini"],
      ans: 2,
      explain: "Otto von Bismarck, the Chief Minister of Prussia, engineered the unification using the Prussian army and bureaucracy."
    },
    {
      q: "Which three countries did Prussia defeat over seven years to unify Germany?",
      opts: ["Britain, Russia, and Spain", "Denmark, Austria, and France", "Italy, Greece, and the Ottoman Empire", "Poland, Switzerland, and Belgium"],
      ans: 1,
      explain: "Bismarck strategically fought and defeated Denmark, Austria, and France to secure complete dominance for Prussia."
    },
    {
      q: "Where was Kaiser William I proclaimed the Emperor of the new German Empire in 1871?",
      opts: ["The Frankfurt Parliament", "The Palace of Versailles (Hall of Mirrors)", "The Vatican in Rome", "The Austrian Chancellor's estate"],
      ans: 1,
      explain: "To humiliate the recently defeated French, the Germans declared their new Empire inside the famous Palace of Versailles in France."
    }
  ]
};

export const LEVEL_8: MapLevel = {
  id: 8,
  title: 'The Italian Puzzle',
  icon: '🧩',
  color: '#10b981',
  notes: [
    { type: 'heading', content: 'Scene 8: The Unification of Italy' },
    { type: 'paragraph', content: 'Like Germany, Italy had a long history of political fragmentation. Italians were scattered over several dynastic states as well as the multi-national Habsburg Empire. During the middle of the nineteenth century, Italy was divided into seven states.' },
    { type: 'highlight', content: 'The Fragmented Map' },
    { type: 'bullet', title: 'The North', content: 'Under the control of the Austrian Habsburgs.' },
    { type: 'bullet', title: 'The Center', content: 'Ruled directly by the Pope.' },
    { type: 'bullet', title: 'The South', content: 'Dominated by the Bourbon kings of Spain.' },
    { type: 'bullet', title: 'The Only Exception', content: 'Only one state, Sardinia-Piedmont, was ruled by an actual Italian princely house (King Victor Emmanuel II).' },
    { type: 'subheading', content: 'The Three Heroes of Unification' },
    { type: 'paragraph', content: 'The unification of Italy was achieved through the combined efforts of three incredibly different leaders:' },
    { type: 'bullet', title: '1. Giuseppe Mazzini (The Heart)', content: 'During the 1830s, he formulated a visionary program for a unitary Italian Republic and formed the secret society "Young Italy". Though his uprisings in 1831 and 1848 failed, he planted the seed of unity.' },
    { type: 'bullet', title: '2. Chief Minister Cavour (The Brain)', content: 'Cavour led the movement to unify the regions of Italy, but he was neither a revolutionary nor a democrat. He was a tactful diplomat who spoke French much better than he did Italian. Through a brilliant diplomatic alliance with France, Cavour succeeded in defeating the Austrian forces in 1859.' },
    { type: 'bullet', title: '3. Giuseppe Garibaldi (The Sword)', content: 'A legendary guerrilla fighter. In 1860, he led a massive army of armed volunteers (known as the Red Shirts) into South Italy and the Kingdom of the Two Sicilies. They successfully won the support of the local peasants to drive out the Spanish rulers.' },
    { type: 'highlight', content: 'The Final Victory (1861)' },
    { type: 'paragraph', content: 'In 1861, Victor Emmanuel II was proclaimed king of united Italy. However, much of the Italian peasant population was completely illiterate and remained blissfully unaware of liberal-nationalist ideology. Many peasants who supported Garibaldi in southern Italy had never heard of "Italia", and believed that "La Talia" was Victor Emmanuel’s wife!' }
  ],
  questions: [
    {
      q: "Before unification, which was the ONLY Italian state ruled by a native Italian princely house?",
      opts: ["The Papal States", "The Kingdom of the Two Sicilies", "Sardinia-Piedmont", "Venetia"],
      ans: 2,
      explain: "Sardinia-Piedmont was ruled by King Victor Emmanuel II, making it the natural center for the unification movement."
    },
    {
      q: "Who used a tactful diplomatic alliance with France to defeat the Austrian forces in northern Italy in 1859?",
      opts: ["Giuseppe Mazzini", "Chief Minister Cavour", "Giuseppe Garibaldi", "King Victor Emmanuel II"],
      ans: 1,
      explain: "Cavour was a master diplomat (not a revolutionary) who used strategic alliances to push Austria out of the north."
    },
    {
      q: "Who were the 'Red Shirts' in the context of Italian unification?",
      opts: ["Austrian soldiers occupying the north", "Peasants who opposed the King", "Armed volunteers led by Giuseppe Garibaldi who liberated the South", "The Pope's personal guards"],
      ans: 2,
      explain: "Garibaldi led his volunteer army, the Red Shirts, to drive the Spanish Bourbon kings out of southern Italy."
    }
  ]
};

export const LEVEL_9: MapLevel = {
  id: 9,
  title: 'The Strange Case of Britain',
  icon: '🎩',
  color: '#6366f1',
  notes: [
    { type: 'heading', content: 'Scene 9: Nation-Building in Britain' },
    { type: 'paragraph', content: 'Unlike the rest of Europe, the model of the nation in Britain was not the result of a sudden upheaval or bloody revolution. It was the result of a long, calculated, and drawn-out process of dominance by the English.' },
    { type: 'highlight', content: 'The Rise of the English Parliament' },
    { type: 'paragraph', content: 'Prior to the 18th century, there was no "British nation". The primary identities of the people inhabiting the British Isles were ethnic: English, Welsh, Scot, or Irish. In 1688, the English parliament successfully seized power from the monarchy in a bloodless conflict. This parliament became the instrument through which a nation-state, with England at its center, was forged.' },
    { type: 'subheading', content: 'Swallowing Scotland (1707)' },
    { type: 'bullet', title: 'The Act of Union', content: 'Signed in 1707 between England and Scotland, this act created the "United Kingdom of Great Britain".' },
    { type: 'bullet', title: 'Cultural Suppression', content: 'In reality, this meant England could impose its influence on Scotland. The Scottish Highlanders were forbidden to speak their Gaelic language or wear their national dress, and large numbers were forcibly driven out of their homeland.' },
    { type: 'subheading', content: 'The Tragedy of Ireland (1801)' },
    { type: 'paragraph', content: 'Ireland suffered a similar, but far bloodier fate. The country was deeply divided between Catholics and Protestants. The English actively helped the Protestants of Ireland to establish dominance over a largely Catholic country.' },
    { type: 'bullet', title: 'Failed Revolts', content: 'Catholic revolts against British dominance were brutally suppressed. Following a failed revolt led by Wolfe Tone and his United Irishmen in 1798, Ireland was forcibly incorporated into the UK in 1801.' },
    { type: 'highlight', content: 'Forging the British Identity' },
    { type: 'paragraph', content: 'To ensure the diverse populations accepted this new reality, a new "British nation" was heavily marketed and promoted through powerful symbols:' },
    { type: 'bullet', title: 'The Flag', content: 'The Union Jack was promoted everywhere.' },
    { type: 'bullet', title: 'The Anthem', content: '"God Save Our Noble King" became the standard.' },
    { type: 'bullet', title: 'The Language', content: 'The English language was heavily pushed over Celtic, Welsh, and Gaelic.' }
  ],
  questions: [
    {
      q: "How did the formation of the nation-state in Britain fundamentally differ from France or Germany?",
      opts: ["It was formed by a rapid, bloody revolution within a single year", "It was formed through a long, gradual process of the English parliament seizing power and dominating its neighbors", "It was created by a decree from the Pope", "Britain was unified after being conquered by Napoleon"],
      ans: 1,
      explain: "Britain didn't have a sudden nationalist revolution; it was a slow, centuries-long political expansion by the English."
    },
    {
      q: "What was the result of the Act of Union (1707)?",
      opts: ["It freed Ireland from British control", "It united France and England into a single empire", "It created the United Kingdom of Great Britain by binding England and Scotland", "It dissolved the English monarchy completely"],
      ans: 2,
      explain: "The Act of Union officially joined England and Scotland, though it practically led to the suppression of Scottish Highland culture."
    },
    {
      q: "How did the English establish dominance over Ireland before forcibly incorporating it in 1801?",
      opts: ["By funding Catholic missionaries", "By supporting the Protestant minority to establish dominance over the Catholic majority", "By paying the Irish leaders to move to London", "By splitting Ireland into seven different states"],
      ans: 1,
      explain: "The English exploited religious divisions, backing the Protestant minority to suppress Catholic revolts."
    }
  ]
};

export const LEVEL_10: MapLevel = {
  id: 10,
  title: 'BOSS: The Gauntlet Exam',
  icon: '💀',
  color: '#000000',
  notes: [
    { type: 'heading', content: 'Final Boss: The Nationalist Gauntlet' },
    { type: 'narrative', content: 'Kabir closed his book. "That’s it. That’s the movie. But watching the movie isn’t enough. You have to pass the ultimate test. 20 questions. The hardest details from the entire chapter. One mistake could cost you your rank. Let’s see what you’re made of."' },
    { type: 'paragraph', content: 'This is the final trial. You must answer 20 consecutive questions covering all 9 levels of the Rise of Nationalism in Europe. Defeating this boss will grant you immense XP, points, and signify your absolute mastery of this chapter.' },
    { type: 'highlight', content: 'REWARDS: 10 Points + 5 Bonus XP for victory.' }
  ],
  questions: [
    { q: "Under the new constitution of 1789, who were legally defined as 'active citizens'?", opts: ["All adult men/women", "Only Clergy/Nobility", "Men > 25 paying 3 days wage in taxes", "Revolutionary fighters"], ans: 2, explain: "Only tax-paying men over 25 were active citizens." },
    { q: "What regressive feature existed in the Napoleonic Code?", opts: ["Reintroduced feudalism", "Stripped women of rights, treating them as minors", "Restored Clergy privileges", "Banned property"], ans: 1, explain: "Women lost rights and were subjected to fathers/husbands." },
    { q: "Why did initial European enthusiasm for French armies turn hostile?", opts: ["Language suppression", "Increased taxation, censorship, forced conscription", "British alliances", "Banned business"], ans: 1, explain: "Heavy taxes and forced drafting of locals turned them against Napoleon." },
    { q: "Who were the 'Red Shirts'?", opts: ["Austrian snipers", "Pope's guard", "Garibaldi's armed volunteers", "Prussian merchants"], ans: 2, explain: "Garibaldi led his volunteer army, the Red Shirts, to drive the Spanish Bourbon kings out of southern Italy." },
    { q: "What was the purpose of the Zollverein (1834)?", opts: ["War pact", "German Parliament", "Abolish tariffs for economic unification", "Press censorship"], ans: 2, explain: "The customs union unified German states economically." },
    { q: "What did Metternich mean when he said 'When France sneezes, Europe catches cold'?", opts: ["Disease spreading", "Revolutions starting in France inspire rebellions across Europe", "Economic inflation", "Weather patterns"], ans: 1, explain: "French rebellions triggered chain reactions across Europe." },
    { q: "How did Romanticism view nation-building?", opts: ["Through Blood & Iron", "Through the 'volksgeist' found in peasant folk songs/culture", "Through royal decrees", "Through industrialization"], ans: 1, explain: "Romanticism emphasized emotion, peasant folklore, and poetry." },
    { q: "Who hosted the Congress of Vienna (1815)?", opts: ["Napoleon", "Mazzini", "Duke Metternich", "Kaiser William I"], ans: 2, explain: "Austrian Chancellor Metternich hosted it to restore conservative rule." },
    { q: "Which empire did Greece break away from (1821-1832)?", opts: ["British", "Habsburg", "Ottoman", "Russian"], ans: 2, explain: "Greece was ruled by the Muslim Ottoman Empire since the 15th century." },
    { q: "What was Mazzini's core belief?", opts: ["Italy should sell territories", "Papal rule", "God intended nations to be natural units, requiring a single unified republic", "Return to Bourbon kings"], ans: 2, explain: "Mazzini fought for a single, unified Italian Republic." },
    { q: "What caused the Silesian Weavers' revolt (1845)?", opts: ["Voting rights", "Contractors slashing payments to unlivable wages", "Banning German language", "Protesting the King"], ans: 1, explain: "Contractors slashed payments down to starvation levels." },
    { q: "Why did the Frankfurt Parliament (1848) fail?", opts: ["French invasion", "Friedrich Wilhelm IV rejected a democratic crown & crushed them", "Ran out of money", "Banned women"], ans: 1, explain: "The Prussian king rejected it and crushed the parliament with troops." },
    { q: "What was women's status at the Frankfurt Parliament?", opts: ["Half-votes", "Elected MPs", "Denied voting rights, admitted only as observers", "Military strategists"], ans: 2, explain: "Liberal men hypocritically denied women suffrage rights." },
    { q: "Who engineered German Unification with 'Blood and Iron'?", opts: ["William I", "Metternich", "Bismarck", "Cavour"], ans: 2, explain: "Otto von Bismarck unified Germany through military might." },
    { q: "Which 3 countries did Prussia defeat to unify Germany?", opts: ["Britain/Russia/Spain", "Denmark/Austria/France", "Italy/Greece/Ottomans", "Poland/Swiss/Belgium"], ans: 1, explain: "Prussia defeated Denmark, Austria, and France." },
    { q: "Where was the German Empire proclaimed in 1871?", opts: ["Frankfurt", "Palace of Versailles", "Vatican", "Vienna"], ans: 1, explain: "Declared inside the Palace of Versailles to humiliate the French." },
    { q: "Which was the ONLY Italian state ruled by a native Italian prince before unification?", opts: ["Papal States", "Sicilies", "Sardinia-Piedmont", "Venetia"], ans: 2, explain: "King Victor Emmanuel II ruled Sardinia-Piedmont." },
    { q: "Who used an alliance with France to defeat Austria in northern Italy (1859)?", opts: ["Mazzini", "Cavour", "Garibaldi", "Victor Emmanuel"], ans: 1, explain: "Chief Minister Cavour used brilliant diplomacy over revolution." },
    { q: "How was the British nation formed?", opts: ["Bloody 1-year revolution", "Long gradual process of English parliament dominating neighbors", "Papal decree", "Napoleonic conquest"], ans: 1, explain: "England slowly assimilated Wales, Scotland, and Ireland." },
    { q: "What happened to Ireland in 1801?", opts: ["Freed", "English backed Protestants to crush Catholics, absorbing Ireland into the UK", "Split in two", "Sold to France"], ans: 1, explain: "The English exploited religious divisions and forcibly absorbed Ireland." }
  ]
};

// We export an array of all levels (Now containing 1 through 10)
export const ALL_LEVELS: MapLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10];
