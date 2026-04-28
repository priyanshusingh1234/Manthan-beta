// Advanced Competitive Notes for Levels 1 to 3
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
    { type: 'narrative', content: 'Kabir opened his heavily annotated history journal. "You want to clear NTSE? Boards? Then you can\'t just memorize dates. You have to understand the socio-economic tectonic plates that crushed the Bourbon monarchy," he said.' },
    { type: 'heading', content: 'Scene 1: The French Revolution and the Idea of the Nation' },
    { type: 'highlight', content: 'Core Concept: The Shift of Sovereignty' },
    { type: 'paragraph', content: 'The first clear expression of nationalism came with the French Revolution in 1789. France was a full-fledged territorial state under the rule of an absolute monarch (King Louis XVI of the Bourbon dynasty). The political and constitutional changes that came in the wake of the French Revolution led to the transfer of sovereignty from the monarchy to a body of French citizens.' },
    { type: 'quote', content: '"Sovereignty resides essentially in the Nation. No body, no individual can exercise authority that does not expressly emanate from it." — Declaration of the Rights of Man and of the Citizen (1789)' },
    { type: 'subheading', content: 'Creating a Collective Identity (Psychological Warfare)' },
    { type: 'paragraph', content: 'A nation isn\'t built on borders alone; it is built on a shared consciousness. The French revolutionaries introduced various measures and practices that could create a sense of collective identity among the French people:' },
    { type: 'bullet', title: '1. La Patrie and Le Citoyen', content: 'The ideas of la patrie (the fatherland) and le citoyen (the citizen) emphasized the notion of a united community enjoying equal rights under a constitution. This actively dismantled the old feudal hierarchy of estates (Clergy, Nobility, Commoners).' },
    { type: 'bullet', title: '2. The Tricolour Flag', content: 'A new French flag, the tricolour, was chosen to replace the former royal standard. Visual symbols bypass literacy barriers and unite illiterate peasant masses under one banner.' },
    { type: 'bullet', title: '3. The National Assembly', content: 'The Estates General (which was heavily rigged in favor of the rich) was elected by the body of active citizens and renamed the National Assembly. Note for exams: Only men above 25 who paid equal to 3 days of a labourer\'s wage in taxes were "active citizens".' },
    { type: 'bullet', title: '4. Centralized Administration', content: 'New hymns were composed, oaths taken, and martyrs commemorated, all in the name of the nation. A centralized administrative system was put in place and it formulated uniform laws for all citizens within its territory.' },
    { type: 'bullet', title: '5. Economic & Linguistic Unification', content: 'Internal customs duties and dues were abolished. A uniform system of weights and measures was adopted. Regional dialects were discouraged, and French, as it was spoken and written in Paris, became the common language of the nation.' },
    { type: 'highlight', content: 'The Mission to Liberate Europe' },
    { type: 'paragraph', content: 'The revolutionaries further declared that it was the mission and the destiny of the French nation to liberate the peoples of Europe from despotism. When the news of the events in France reached the different cities of Europe, students and other members of educated middle classes began setting up Jacobin clubs.' },
    { type: 'paragraph', content: 'Their activities and campaigns prepared the way for the French armies which moved into Holland, Belgium, Switzerland, and much of Italy in the 1790s. With the outbreak of the revolutionary wars, the French armies began to carry the idea of nationalism abroad.' }
  ],
  questions: [
    {
      q: "Under the new constitution of 1789, who were legally defined as 'active citizens'?",
      opts: ["All adult men and women in France", "Only the Clergy and Nobility", "Men above 25 paying taxes equal to at least 3 days of a labourer's wage", "Anyone who actively fought in the revolution"],
      ans: 2,
      explain: "The right to vote was restricted. Only tax-paying men over 25 were 'active citizens', showing the bourgeois (middle class) nature of the early revolution."
    },
    {
      q: "How did the French revolutionaries deal with internal economics and trade barriers?",
      opts: ["They doubled internal customs to fund the war", "They abolished internal customs duties and standardized weights and measures", "They banned all domestic trade outside of Paris", "They returned all trade control to the guilds"],
      ans: 1,
      explain: "To unify the nation economically, they abolished internal tariffs and adopted uniform weights and measures, promoting a unified national market."
    },
    {
      q: "What was the international consequence of the formation of Jacobin clubs across European cities?",
      opts: ["They invited the British to invade France", "They paved the way for French revolutionary armies to enter Holland, Belgium, and Italy", "They restored local monarchs to power", "They forced the Pope to excommunicate France"],
      ans: 1,
      explain: "Educated middle classes setting up Jacobin clubs essentially acted as a fifth column, preparing their countries to welcome the French armies carrying the idea of nationalism."
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
    { type: 'paragraph', content: 'Within the wide swathe of territory that came under his control, Napoleon set about introducing many of the reforms that he had already introduced in France. Through a return to monarchy, Napoleon had, no doubt, destroyed democracy in France, but in the administrative field, he had incorporated revolutionary principles.' },
    { type: 'highlight', content: 'The Napoleonic Code (Civil Code of 1804)' },
    { type: 'paragraph', content: 'This code is arguably Napoleon\'s most lasting legacy. It sought to rationalize the legal system and make it efficient. For competitive exams, remember the exact pillars of this code:' },
    { type: 'bullet', title: '1. Privileges Abolished', content: 'It did away with all privileges based on birth. The aristocracy could no longer command special courts or tax exemptions.' },
    { type: 'bullet', title: '2. Equality Before the Law', content: 'It established equality before the law and secured the right to property. (However, it reduced women to the status of a minor, subject to the authority of fathers and husbands).' },
    { type: 'bullet', title: '3. Feudalism Destroyed Abroad', content: 'In the Dutch Republic, in Switzerland, in Italy and Germany, Napoleon simplified administrative divisions, abolished the feudal system and freed peasants from serfdom and manorial dues.' },
    { type: 'bullet', title: '4. Urban Modernization', content: 'In the towns too, guild restrictions were removed. Transport and communication systems were improved. Artisans, peasants, workers and new businessmen enjoyed a new-found freedom.' },
    { type: 'subheading', content: 'The Double-Edged Sword of French Conquest' },
    { type: 'paragraph', content: 'Initially, in many places such as Holland and Switzerland, as well as in certain cities like Brussels, Mainz, Milan and Warsaw, the French armies were welcomed as harbingers of liberty. Businessmen and small-scale producers of goods, in particular, began to realize that uniform laws, standardized weights and measures, and a common national currency would facilitate the movement and exchange of goods and capital.' },
    { type: 'quote', content: '"Liberty is traded for efficiency." — Historians on Napoleon\'s rule.' },
    { type: 'paragraph', content: 'However, the initial enthusiasm soon turned to hostility, as it became clear that the new administrative arrangements did not go hand in hand with political freedom. Why did the Europeans turn against Napoleon?' },
    { type: 'bullet', title: 'Increased Taxation', content: 'Running a massive continental empire and fighting constant wars requires deep pockets. Napoleon heavily taxed the newly conquered territories.' },
    { type: 'bullet', title: 'Censorship', content: 'Political freedom was crushed. The press was highly restricted.' },
    { type: 'bullet', title: 'Forced Conscription', content: 'This was the fatal flaw. Napoleon forced men from conquered regions into the French armies to conquer the rest of Europe. The bloodshed turned the common folk against him.' }
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
      opts: ["Because the French forced everyone to speak English", "Due to increased taxation, censorship, and forced conscription", "Because Napoleon gave away conquered lands to Britain", "Because they disbanded all local businesses"],
      ans: 1,
      explain: "Administrative efficiency was outweighed by heavy taxes, strict censorship, and the forced drafting of locals into the French army."
    },
    {
      q: "Which specific groups in conquered European towns benefited the MOST initially from Napoleon's reforms?",
      opts: ["Aristocrats and the Clergy", "Businessmen, artisans, and small-scale producers", "The Bourbon monarchy supporters", "British spies"],
      ans: 1,
      explain: "The removal of guild restrictions, common currency, and standardized weights/measures massively benefited artisans and businessmen dealing in trade."
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
    { type: 'paragraph', content: 'If you look at the map of mid-eighteenth-century Europe, you will find that there were no "nation-states" as we know them today. What we know today as Germany, Italy and Switzerland were divided into kingdoms, duchies and cantons whose rulers had their autonomous territories.' },
    { type: 'highlight', content: 'The Habsburg Empire: A Case Study in Fragmentation' },
    { type: 'paragraph', content: 'The Habsburg Empire that ruled over Austria-Hungary was a patchwork of many different regions and peoples. It included the Alpine regions — the Tyrol, Austria and the Sudetenland — as well as Bohemia, where the aristocracy was predominantly German-speaking. It also included the Italian-speaking provinces of Lombardy and Venetia. In Hungary, half of the population spoke Magyar while the other half spoke a variety of dialects. The ONLY tie binding these diverse groups together was a common allegiance to the emperor.' },
    { type: 'subheading', content: 'The Aristocracy and the New Middle Class' },
    { type: 'paragraph', content: 'Socially and politically, a landed aristocracy was the dominant class on the continent.' },
    { type: 'bullet', title: 'The Aristocrats', content: 'They were united by a common way of life that cut across regional divisions. They owned estates in the countryside and town-houses. They spoke French for purposes of diplomacy and in high society. Their families were often connected by ties of marriage. However, this powerful aristocracy was numerically a very small group.' },
    { type: 'bullet', title: 'The Peasantry', content: 'The majority of the population was made up of the peasantry. To the west, the bulk of the land was farmed by tenants and small owners, while in Eastern and Central Europe the pattern of landholding was characterized by vast estates cultivated by serfs.' },
    { type: 'highlight', content: 'Industrialization Creates a New Player' },
    { type: 'paragraph', content: 'In Western and parts of Central Europe the growth of industrial production and trade meant the growth of towns and the emergence of commercial classes. Industrialization began in England in the second half of the 18th century, but in France and Germany, it occurred only during the 19th century.' },
    { type: 'paragraph', content: 'In its wake, new social groups came into being: a working-class population, and middle classes made up of industrialists, businessmen, and professionals. It was among the educated, liberal middle classes that ideas of national unity following the abolition of aristocratic privileges gained popularity.' },
    { type: 'subheading', content: 'What did Liberal Nationalism Stand for?' },
    { type: 'paragraph', content: 'The term "liberalism" derives from the Latin root *liber*, meaning free. For the new middle classes, liberalism stood for freedom for the individual and equality of all before the law.' },
    { type: 'bullet', title: 'Political Liberalism', content: 'It emphasized the concept of government by consent. Since the French Revolution, liberalism had stood for the end of autocracy and clerical privileges, a constitution and representative government through parliament.' },
    { type: 'bullet', title: 'Economic Liberalism', content: 'In the economic sphere, liberalism stood for the freedom of markets and the abolition of state-imposed restrictions on the movement of goods and capital.' },
    { type: 'quote', content: 'Example of Economic Chaos: In 1833, a merchant travelling from Hamburg to Nuremberg to sell his goods had to pass through 11 customs barriers and pay a customs duty of about 5% at each one of them! Duties were levied according to the weight or measurement of the goods. As each region had its own system of weights, this involved time-consuming calculations.' },
    { type: 'paragraph', content: 'To solve this, in 1834, a customs union or *Zollverein* was formed at the initiative of Prussia and joined by most of the German states. The union abolished tariff barriers and reduced the number of currencies from over thirty to two. A wave of economic nationalism strengthened the wider nationalist sentiments growing at the time.' }
  ],
  questions: [
    {
      q: "Culturally, how did the powerful Aristocracy across divided European kingdoms maintain a unified identity?",
      opts: ["By all serving in the military together", "By speaking French, owning countryside estates, and connecting through marriage", "By forcing the peasants to adopt their religion", "By attending the same universities in London"],
      ans: 1,
      explain: "Despite the fragmented borders, the Aristocrats formed a unified, elite network across Europe by speaking French and intermarrying."
    },
    {
      q: "What was the primary purpose of the 'Zollverein' formed in 1834?",
      opts: ["To declare war on France", "To establish a German Parliament", "To abolish tariff barriers and reduce currencies for economic unification", "To enforce strict press censorship"],
      ans: 2,
      explain: "The Zollverein was a customs union that unified the German states economically, speeding up trade and fostering a sense of national unity."
    },
    {
      q: "What does the Latin root 'liber' in the term 'Liberal Nationalism' mean?",
      opts: ["Free", "King", "Nation", "Law"],
      ans: 0,
      explain: "Liber means 'free', underscoring the middle-class desire for freedom of the individual and free markets."
    }
  ]
};

// We will export an array of all levels (Currently 1 to 3, but extensible)
export const ALL_LEVELS: MapLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3];
