// Dheeyudha App - History Module Payload: The French Revolution (Class 9)
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
  title: 'The Old Regime',
  icon: '🏰',
  color: '#8b5cf6',
  notes: [
    { type: 'narrative', content: '"If you want to understand why empires fall," Kabir said, pointing at his worn-out history book, "you don\'t look at the king\'s crown. You look at the peasant\'s bread."' },
    { type: 'heading', content: 'Scene 1: French Society in the Late 18th Century' },
    { type: 'paragraph', content: 'In 1774, Louis XVI of the Bourbon family ascended the throne of France. He was just 20 years old and married to the Austrian princess Marie Antoinette. He inherited a kingdom that looked powerful on the outside but was rotting from within.' },
    { type: 'highlight', content: 'The Financial Crisis: An Empty Treasury' },
    { type: 'paragraph', content: 'Upon his accession, Louis XVI found an empty treasury. Why was the richest kingdom in Europe broke?' },
    { type: 'bullet', title: 'Years of War', content: 'Long years of war had drained the financial resources of France. Under Louis XVI, France helped the thirteen American colonies gain their independence from the common enemy, Britain. This added more than a billion livres (the currency of France) to a debt that had already risen to more than 2 billion livres.' },
    { type: 'bullet', title: 'Extravagance', content: 'The cost of maintaining an extravagant court at the immense, glittering palace of Versailles was astronomical.' },
    { type: 'bullet', title: 'High Interest', content: 'Lenders who gave the state credit began to charge 10% interest on loans. The government was forced to spend an increasing percentage of its budget purely on interest payments.' },
    { type: 'subheading', content: 'The Society of Estates: A System of Deep Inequality' },
    { type: 'paragraph', content: 'French society in the 18th century was divided into three estates. The term \'Old Regime\' is used to describe the society and institutions of France before 1789.' },
    { type: 'bullet', title: 'First Estate (Clergy)', content: 'Comprised the church officials. They owned 10% of the land, extracted a tax called \'tithes\' (one-tenth of agricultural produce) from peasants, and paid absolutely NO direct taxes to the state.' },
    { type: 'bullet', title: 'Second Estate (Nobility)', content: 'The aristocrats and royalty. They owned 25% of the land. Like the clergy, they were exempted from paying taxes to the state. Furthermore, they enjoyed feudal privileges, extracting feudal dues from the peasants.' },
    { type: 'bullet', title: 'Third Estate (The Commoners)', content: 'Made up 97% of the population. Included big businessmen, merchants, lawyers, peasants, artisans, and landless labourers. They bore the ENTIRE burden of financing the state.' },
    { type: 'highlight', content: 'The Crushing Burden of Taxes' },
    { type: 'paragraph', content: 'Members of the Third Estate had to pay a direct tax to the state called \'taille\'. They also paid numerous indirect taxes levied on everyday consumption items like salt or tobacco.' },
    { type: 'subheading', content: 'The Struggle to Survive (Subsistence Crisis)' },
    { type: 'paragraph', content: 'The population of France rose from about 23 million in 1715 to 28 million in 1789. This led to a rapid increase in the demand for foodgrains. Production of grains could not keep pace with the demand. So the price of bread (the staple diet) rose rapidly.' },
    { type: 'quote', content: 'When wages do not keep pace with rising prices, and bad harvests caused by drought or hail reduce the harvest, it leads to a "Subsistence Crisis" — an extreme situation where the basic means of livelihood are endangered.' },
    { type: 'subheading', content: 'A Growing Middle Class Envisages an End to Privileges' },
    { type: 'paragraph', content: 'The 18th century witnessed the emergence of social groups termed the \'middle class\'. They earned their wealth through expanding overseas trade and from the manufacture of goods (like woollen and silk textiles). All of these were educated and believed that no group in society should be privileged by birth.' },
    { type: 'bullet', title: 'John Locke', content: 'In his "Two Treatises of Government", he sought to refute the doctrine of the divine and absolute right of the monarch.' },
    { type: 'bullet', title: 'Jean-Jacques Rousseau', content: 'Carried the idea forward, proposing a form of government based on a social contract between people and their representatives.' },
    { type: 'bullet', title: 'Montesquieu', content: 'In "The Spirit of the Laws", he proposed a division of power within the government between the legislative, the executive, and the judiciary (a model later adopted by the USA).' }
  ],
  questions: [
    {
      q: "Which estate in French society owned about 10% of the land, extracted 'tithes', and was exempt from state taxes?",
      opts: ["First Estate", "Second Estate", "Third Estate", "The Monarchy"],
      ans: 0,
      explain: "The First Estate (the Clergy) enjoyed immense wealth and tax exemptions by birthright."
    },
    {
      q: "What term describes an extreme situation where the basic means of livelihood are endangered (common in France due to bad harvests)?",
      opts: ["Hyperinflation", "Subsistence Crisis", "Economic Depression", "Feudal Collapse"],
      ans: 1,
      explain: "A Subsistence Crisis occurs when bad harvests and rising prices outpace wages, making survival difficult."
    },
    {
      q: "Which philosopher proposed a division of power between the legislative, the executive, and the judiciary?",
      opts: ["John Locke", "Jean-Jacques Rousseau", "Montesquieu", "Voltaire"],
      ans: 2,
      explain: "Montesquieu wrote 'The Spirit of the Laws', heavily influencing modern democratic structures like the USA."
    }
  ]
};

export const LEVEL_2: MapLevel = {
  id: 2,
  title: 'Outbreak of Revolution',
  icon: '🔥',
  color: '#ef4444',
  notes: [
    { type: 'heading', content: 'Scene 2: The Spark of Rebellion' },
    { type: 'paragraph', content: 'To solve the crippling financial crisis, Louis XVI had to increase taxes. However, in France of the Old Regime, the monarch did not have the power to impose taxes according to his will alone. Rather, he had to call a meeting of the Estates General which would then pass his proposals for new taxes.' },
    { type: 'highlight', content: 'The Estates General (5 May 1789)' },
    { type: 'paragraph', content: 'The Estates General was a political body to which the three estates sent their representatives. Louis XVI called this assembly in a resplendent hall in Versailles.' },
    { type: 'bullet', title: 'The Seating Arrangement', content: 'The first and second estates sent 300 representatives each, who were seated in rows facing each other on two sides. The 600 members of the third estate (represented by its more prosperous and educated members) had to stand at the back.' },
    { type: 'bullet', title: 'The Excluded', content: 'Peasants, artisans, and women were denied entry to the assembly. However, their grievances and demands were listed in some 40,000 letters.' },
    { type: 'subheading', content: 'The Conflict Over Voting' },
    { type: 'paragraph', content: 'Voting in the Estates General in the past had been conducted according to the principle that each estate had one vote. This meant the Clergy and Nobility (2 votes) could always outvote the commoners (1 vote).' },
    { type: 'paragraph', content: 'The third estate demanded that voting now be conducted by the assembly as a whole, where each member would have one vote (inspired by Rousseau\'s "The Social Contract"). When the king rejected this proposal, members of the third estate walked out of the assembly in protest.' },
    { type: 'highlight', content: 'The Tennis Court Oath (20 June 1789)' },
    { type: 'paragraph', content: 'The representatives of the third estate viewed themselves as spokesmen for the whole French nation. On 20 June, they assembled in the hall of an indoor tennis court in the grounds of Versailles.' },
    { type: 'paragraph', content: 'They declared themselves a National Assembly and swore not to disperse till they had drafted a constitution for France that would limit the powers of the monarch. They were led by Mirabeau (a noble who believed in doing away with feudal privilege) and Abbé Sieyès (a priest who wrote the influential pamphlet "What is the Third Estate?").' },
    { type: 'subheading', content: 'The Storming of the Bastille (14 July 1789)' },
    { type: 'paragraph', content: 'While the National Assembly drafted a constitution, Paris was in turmoil. A severe winter led to a bad harvest, and bakers hoarded bread. After spending hours in long queues, crowds of angry women stormed into the shops.' },
    { type: 'paragraph', content: 'Simultaneously, the king ordered troops to move into Paris. Rumours spread that he would order the army to open fire on the citizens. In response, some 7,000 men and women formed a peoples\' militia and broke into government buildings in search of arms.' },
    { type: 'quote', content: 'Finally, on the morning of 14 July 1789, the agitated crowd stormed and destroyed the Bastille, a fortress prison. They hated the Bastille because it stood for the despotic power of the king. The commander was killed, and the prisoners (only seven of them) were released. The fortress was demolished, and its stone fragments were sold in markets as souvenirs of its destruction.' },
    { type: 'subheading', content: 'The Great Fear' },
    { type: 'paragraph', content: 'In the countryside, rumours spread from village to village that the lords of the manor had hired bands of brigands to destroy the ripe crops. Caught in a frenzy of fear, peasants armed themselves with pitchforks, attacked chateaux (castles), looted hoarded grain, and burnt down documents containing records of manorial dues. A large number of nobles fled their homes.' }
  ],
  questions: [
    {
      q: "What voting principle did the Third Estate demand during the Estates General meeting of 1789?",
      opts: ["One vote per estate", "One vote per member", "Only the Third Estate gets to vote", "Voting rights for women"],
      ans: 1,
      explain: "They demanded 'one member, one vote' so their 600 members could match the combined 600 members of the first two estates."
    },
    {
      q: "Who was the priest that joined the Third Estate and wrote the influential pamphlet 'What is the Third Estate?'",
      opts: ["Maximilien Robespierre", "John Locke", "Abbé Sieyès", "Mirabeau"],
      ans: 2,
      explain: "Abbé Sieyès, despite being originally a priest, became a massive advocate for the Third Estate."
    },
    {
      q: "Why did the people of Paris specifically target and storm the Bastille on 14 July 1789?",
      opts: ["To save the King from assassins", "It stood for the despotic power of the king and held ammunition", "It was the only place with large stores of grain", "To steal the crown jewels"],
      ans: 1,
      explain: "The Bastille was a symbol of royal tyranny, and the militia was desperately searching for hoarded weapons."
    }
  ]
};

export const LEVEL_3: MapLevel = {
  id: 3,
  title: 'Constitutional Monarchy',
  icon: '📜',
  color: '#3b82f6',
  notes: [
    { type: 'heading', content: 'Scene 3: France Becomes a Constitutional Monarchy' },
    { type: 'paragraph', content: 'Faced with the power of his revolting subjects, Louis XVI finally accorded recognition to the National Assembly and accepted the principle that his powers would from now on be checked by a constitution.' },
    { type: 'highlight', content: 'The Night of 4 August 1789' },
    { type: 'paragraph', content: 'The Assembly passed a decree abolishing the feudal system of obligations and taxes. Members of the clergy were forced to give up their privileges. Tithes were abolished, and lands owned by the Church were confiscated. As a result, the government acquired assets worth at least 2 billion livres.' },
    { type: 'subheading', content: 'The Constitution of 1791' },
    { type: 'paragraph', content: 'The National Assembly completed the draft of the constitution in 1791. Its main object was to limit the powers of the monarch.' },
    { type: 'bullet', title: 'Separation of Powers', content: 'Instead of being concentrated in the hands of one person, powers were now separated and assigned to different institutions – the legislature, executive, and judiciary. This made France a constitutional monarchy.' },
    { type: 'bullet', title: 'Indirect Elections', content: 'The Constitution vested the power to make laws in the National Assembly, which was indirectly elected. Citizens voted for a group of electors, who in turn chose the Assembly.' },
    { type: 'highlight', content: 'Active and Passive Citizens' },
    { type: 'paragraph', content: 'Not all citizens had the right to vote. The constitution created a strict division based on wealth and gender:' },
    { type: 'bullet', title: 'Active Citizens', content: 'Only men above 25 years of age who paid taxes equal to at least 3 days of a labourer’s wage. They were entitled to vote. (About 4 million out of 28 million people).' },
    { type: 'bullet', title: 'Passive Citizens', content: 'The remaining men and ALL women were classed as passive citizens. To qualify as an elector and then as a member of the Assembly, a man had to belong to the highest bracket of taxpayers.' },
    { type: 'subheading', content: 'Declaration of the Rights of Man and Citizen' },
    { type: 'paragraph', content: 'The Constitution began with this famous declaration. It established several rights as "natural and inalienable" rights (meaning they belong to each human being by birth and could not be taken away):' },
    { type: 'bullet', title: 'Right to life', content: 'Protection from arbitrary execution.' },
    { type: 'bullet', title: 'Freedom of speech and opinion', content: 'The abolition of censorship allowed newspapers and pamphlets to flood France.' },
    { type: 'bullet', title: 'Equality before law', content: 'No more special legal privileges for nobles.' },
    { type: 'paragraph', content: 'It was the duty of the state to protect each citizen’s natural rights.' }
  ],
  questions: [
    {
      q: "What major event happened on the night of 4 August 1789?",
      opts: ["The King was executed", "The Assembly abolished the feudal system and forced the clergy to give up privileges", "Napoleon seized power", "The women marched to Versailles"],
      ans: 1,
      explain: "In a single night, the Assembly stripped the First and Second Estates of their feudal dues and tax exemptions."
    },
    {
      q: "Under the 1791 constitution, who were considered 'active citizens'?",
      opts: ["All adult men and women", "Only members of the First and Second Estates", "Men above 25 paying taxes equal to at least 3 days of a labourer's wage", "Anyone who fought in the revolution"],
      ans: 2,
      explain: "Voting rights were tied strictly to tax contributions. Only wealthy men above 25 were 'active citizens'."
    },
    {
      q: "Which document did the Constitution of 1791 begin with, establishing natural and inalienable rights?",
      opts: ["The Declaration of Independence", "The Magna Carta", "The Declaration of the Rights of Man and Citizen", "The Communist Manifesto"],
      ans: 2,
      explain: "It laid out fundamental rights like freedom of speech and equality before the law."
    }
  ]
};

export const LEVEL_4: MapLevel = {
  id: 4,
  title: 'BOSS 1: Monarchy Falls',
  icon: '💀',
  color: '#000000',
  notes: [
    { type: 'heading', content: 'Mid-Boss: Test of the Constitutional Monarchy' },
    { type: 'narrative', content: 'The King’s powers have been limited, but the revolution is far from over. Prove your understanding of the early revolution before the chaos of the Terror begins.' },
    { type: 'paragraph', content: 'You must answer these questions perfectly to prove you have mastered the causes and the initial outbreak of the revolution.' },
    { type: 'highlight', content: 'REWARDS: 5 Points + 2 Bonus XP for victory.' }
  ],
  questions: [
    { q: "What tax was collected directly by the state from the Third Estate?", opts: ["Tithe", "Taille", "Livre", "Feudal due"], ans: 1, explain: "Taille was the direct state tax. Tithe was the church tax." },
    { q: "What event marked the beginning of the French Revolution on 14 July 1789?", opts: ["Tennis Court Oath", "Storming of the Bastille", "Execution of Louis XVI", "The Reign of Terror"], ans: 1, explain: "The violent storming of the Bastille fortress marked the true start." },
    { q: "Why did the Third Estate walk out of the Estates General?", opts: ["They were hungry", "The king rejected their demand for voting by individual members", "They were attacked by the guards", "They wanted to form their own country"], ans: 1, explain: "They demanded 'one member, one vote' and left to form the National Assembly when denied." },
    { q: "Which group of people comprised the 'Passive Citizens' in the 1791 Constitution?", opts: ["Only the nobility", "Men above 25 paying high taxes", "All women and men who didn't pay sufficient taxes", "Foreigners only"], ans: 2, explain: "Women and poorer men were completely denied voting rights." },
    { q: "What did the Bastille symbolize to the people of Paris?", opts: ["French wealth", "The despotic power of the king", "Religious freedom", "The power of the Third Estate"], ans: 1, explain: "The Bastille was a prison fortress that symbolized royal tyranny and oppression." }
  ]
};

export const LEVEL_5: MapLevel = {
  id: 5,
  title: 'The Reign of Terror',
  icon: '🩸',
  color: '#dc2626',
  notes: [
    { type: 'heading', content: 'Scene 4: The Radicalization of the Revolution' },
    { type: 'paragraph', content: 'Although Louis XVI had signed the Constitution, he entered into secret negotiations with the King of Prussia. Rulers of other neighbouring countries too were worried by the developments in France and made plans to send troops.' },
    { type: 'paragraph', content: 'Before this could happen, the National Assembly voted in April 1792 to declare war against Prussia and Austria. Thousands of volunteers thronged from the provinces to join the army, seeing it as a war of the people against kings and aristocracies.' },
    { type: 'bullet', title: 'La Marseillaise', content: 'Among the patriotic songs they sang was the Marseillaise, composed by the poet Roget de L’Isle. It is now the national anthem of France.' },
    { type: 'subheading', content: 'The Rise of the Jacobins' },
    { type: 'paragraph', content: 'Political clubs became important rallying points for people who wished to discuss government policies. The most successful was the Jacobin club. Its members belonged mainly to the less prosperous sections of society (small shopkeepers, artisans, shoemakers, watch-makers).' },
    { type: 'bullet', title: 'Maximilien Robespierre', content: 'The leader of the Jacobins. To set themselves apart from the fashionable nobility (who wore knee-breeches), Jacobins started wearing long striped trousers and came to be known as the "sans-culottes" (meaning: those without knee breeches).' },
    { type: 'highlight', content: 'The Fall of the Monarchy' },
    { type: 'paragraph', content: 'In August 1792, the Jacobins stormed the Palace of the Tuileries, massacred the king\'s guards and held the king himself as hostage. The newly elected assembly was called the Convention. In September 1792, it abolished the monarchy and declared France a republic.' },
    { type: 'paragraph', content: 'Louis XVI was sentenced to death by a court on the charge of treason. On 21 January 1793, he was executed publicly at the Place de la Concorde.' },
    { type: 'subheading', content: 'The Reign of Terror (1793-1794)' },
    { type: 'paragraph', content: 'Robespierre followed a policy of severe control and punishment. All those whom he saw as being "enemies" of the republic—ex-nobles, clergy, members of other political parties, and even members of his own party who did not agree with his extreme methods—were arrested, imprisoned, and tried by a revolutionary tribunal.' },
    { type: 'quote', content: 'If the court found them guilty, they were guillotined. The guillotine is a device consisting of two poles and a blade with which a person is beheaded (named after Dr. Guillotin).' },
    { type: 'bullet', title: 'Extreme Equality Laws', content: 'Robespierre’s government issued laws placing a maximum ceiling on wages and prices. Meat and bread were rationed. The use of more expensive white flour was forbidden; all citizens were required to eat the pain d’égalité (equality bread), a loaf made of wholewheat.' },
    { type: 'bullet', title: 'The Fall of Robespierre', content: 'Robespierre pursued his policies so relentlessly that even his supporters began to demand moderation. Finally, he was convicted by a court in July 1794, arrested, and sent to the guillotine.' },
    { type: 'subheading', content: 'A Directory Rules France' },
    { type: 'paragraph', content: 'The fall of the Jacobin government allowed the wealthier middle classes to seize power. A new constitution was introduced which denied the vote to non-propertied sections of society. It provided for two elected legislative councils, which then appointed a Directory (an executive made up of five members).' },
    { type: 'paragraph', content: 'The political instability of the Directory paved the way for the rise of a military dictator, Napoleon Bonaparte.' }
  ],
  questions: [
    {
      q: "Who were the 'sans-culottes'?",
      opts: ["The royal guards", "The Jacobins who wore long striped trousers instead of noble knee-breeches", "The Austrian spies", "The clergy who refused to pay taxes"],
      ans: 1,
      explain: "Sans-culottes literally means 'those without knee breeches', setting the radical Jacobins apart from fashionable nobles."
    },
    {
      q: "What was the national anthem of France composed by Roget de L’Isle during the wars against Prussia and Austria?",
      opts: ["God Save the King", "La Marseillaise", "Ode to Joy", "The Tricolour March"],
      ans: 1,
      explain: "Volunteers from Marseilles sang this song as they marched into Paris, giving it its name."
    },
    {
      q: "Why was the Directory (a 5-member executive) established after the fall of Robespierre?",
      opts: ["To bring back the King", "To prevent the concentration of power in a one-man executive like Robespierre", "To hand power to Napoleon", "To allow peasants to rule"],
      ans: 1,
      explain: "The new constitution created a 5-member Directory as a safeguard against the rise of another dictator like Robespierre."
    }
  ]
};

export const LEVEL_6: MapLevel = {
  id: 6,
  title: 'Women & Slavery',
  icon: '⚖️',
  color: '#f59e0b',
  notes: [
    { type: 'heading', content: 'Scene 5: Did Women have a Revolution?' },
    { type: 'paragraph', content: 'Women were active participants in the events which brought about the revolution. They hoped that their involvement would pressurize the revolutionary government to introduce measures to improve their lives. Most women of the third estate had to work for a living (seamstresses, selling flowers, domestic servants) and did not have access to education.' },
    { type: 'bullet', title: 'Political Clubs', content: 'To discuss and voice their interests, women started about 60 political clubs in different French cities. The "Society of Revolutionary and Republican Women" was the most famous.' },
    { type: 'bullet', title: 'The Great Disappointment', content: 'Women were massively disappointed that the Constitution of 1791 reduced them to passive citizens. They demanded the right to vote, to be elected to the Assembly, and to hold political office.' },
    { type: 'highlight', content: 'The Reign of Terror & Women' },
    { type: 'paragraph', content: 'During the Reign of Terror, the new government issued laws ordering the closure of women’s clubs and banning their political activities. Many prominent women (like Olympe de Gouges, who wrote a "Declaration of the Rights of Woman") were arrested and executed.' },
    { type: 'paragraph', content: 'It was finally in 1946 (over 150 years later) that women in France won the right to vote.' },
    { type: 'subheading', content: 'The Abolition of Slavery' },
    { type: 'paragraph', content: 'One of the most revolutionary social reforms of the Jacobin regime was the abolition of slavery in the French colonies. The Caribbean colonies (Martinique, Guadeloupe, and San Domingo) were critical suppliers of tobacco, indigo, sugar, and coffee.' },
    { type: 'bullet', title: 'The Triangular Slave Trade', content: 'Due to a shortage of labour on the plantations, a triangular slave trade operated between Europe, Africa, and the Americas. French merchants sailed to the African coast, bought slaves from local chieftains, branded them, packed them tightly into ships, and sold them to plantation owners in the Caribbean.' },
    { type: 'bullet', title: 'Port Cities', content: 'Port cities like Bordeaux and Nantes owed their economic prosperity solely to the flourishing slave trade.' },
    { type: 'highlight', content: 'The Brief Freedom' },
    { type: 'paragraph', content: 'The National Assembly debated whether the rights of man should be extended to all French subjects including those in the colonies, but it did not pass any laws, fearing opposition from businessmen whose incomes depended on the slave trade.' },
    { type: 'paragraph', content: 'It was finally the Convention which in 1794 legislated to free all slaves in the French overseas possessions. However, it turned out to be a short-term measure.' },
    { type: 'paragraph', content: 'Ten years later, Napoleon reintroduced slavery. Plantation owners understood their freedom as including the right to enslave African Negroes in pursuit of their economic interests. Slavery was finally abolished in French colonies in 1848.' }
  ],
  questions: [
    {
      q: "What was the most famous political club started by French women during the revolution?",
      opts: ["The Girondin Ladies", "The Society of Revolutionary and Republican Women", "The Sans-Culottes Sisterhood", "The Daughters of Liberty"],
      ans: 1,
      explain: "This club was prominent in demanding equal political rights and suffrage for women."
    },
    {
      q: "Which French port cities owed their massive economic prosperity to the transatlantic slave trade?",
      opts: ["Paris and Versailles", "Bordeaux and Nantes", "Lyon and Toulouse", "Marseilles and Nice"],
      ans: 1,
      explain: "Bordeaux and Nantes grew incredibly wealthy by acting as the main hubs for slave merchant ships."
    },
    {
      q: "Who reintroduced slavery in France ten years after it was abolished by the Convention in 1794?",
      opts: ["Louis XVIII", "Maximilien Robespierre", "Napoleon Bonaparte", "Olympe de Gouges"],
      ans: 2,
      explain: "Napoleon brought back slavery in 1804 to appease wealthy plantation owners and businessmen."
    }
  ]
};

export const LEVEL_7: MapLevel = {
  id: 7,
  title: 'Final BOSS: Revolution Master',
  icon: '☠️',
  color: '#000000',
  notes: [
    { type: 'heading', content: 'Final Boss: The French Revolution Exam' },
    { type: 'narrative', content: 'From the storming of the Bastille to the rise of Napoleon, you have seen the Old Regime fall, the Terror rise, and the struggle for genuine equality. Now, face the ultimate challenge.' },
    { type: 'paragraph', content: 'This is the final trial. You must answer 10 consecutive questions spanning the entire chapter. The questions cover dates, philosophers, social structures, and political outcomes. One mistake could cost you your streak.' },
    { type: 'highlight', content: 'REWARDS: 10 Points + 5 Bonus XP for victory.' }
  ],
  questions: [
    { q: "What was the 'Tithe'?", opts: ["A direct tax paid to the state", "A tax extracted by the Church equal to one-tenth of agricultural produce", "A tax on salt and tobacco", "A feudal due paid to nobles"], ans: 1, explain: "Tithes were extracted directly by the clergy from the peasants." },
    { q: "Which philosopher wrote 'The Spirit of the Laws' proposing a division of power in government?", opts: ["John Locke", "Rousseau", "Montesquieu", "Voltaire"], ans: 2, explain: "Montesquieu proposed the separation of legislative, executive, and judicial powers." },
    { q: "What date marks the Storming of the Bastille?", opts: ["5 May 1789", "20 June 1789", "14 July 1789", "4 August 1789"], ans: 2, explain: "14 July 1789 is the defining date of the start of the French Revolution." },
    { q: "In the Constitution of 1791, who had the right to vote (Active Citizens)?", opts: ["Men above 25 paying at least 3 days of a labourer's wage in taxes", "All men", "Men and Women", "Only the nobles"], ans: 0, explain: "Voting rights were strictly tied to gender, age, and wealth (taxes)." },
    { q: "Who led the Jacobin club and the Reign of Terror?", opts: ["Mirabeau", "Abbé Sieyès", "Napoleon", "Maximilien Robespierre"], ans: 3, explain: "Robespierre led the radical Jacobins and instituted the Reign of Terror." },
    { q: "What did the 'sans-culottes' wear to protest aristocratic fashion?", opts: ["Knee-breeches", "Long striped trousers", "Powdered wigs", "Silk robes"], ans: 1, explain: "They wore long striped trousers to distinguish themselves from nobles in knee-breeches." },
    { q: "What was the primary purpose of the newly formed Directory?", opts: ["To restore the monarchy", "To execute Robespierre", "To prevent power from concentrating in a single executive dictator", "To end the war with Britain"], ans: 2, explain: "The 5-member Directory was designed to stop another Robespierre from taking absolute power." },
    { q: "Who wrote the 'Declaration of the Rights of Woman and Citizen' and was later executed?", opts: ["Marie Antoinette", "Olympe de Gouges", "Joan of Arc", "Madame Tussaud"], ans: 1, explain: "Olympe de Gouges was a massive advocate for women's rights and was executed during the Terror." },
    { q: "Which group ultimately abolished slavery in the French colonies in 1794?", opts: ["The National Assembly", "The Estates General", "The Jacobin Convention", "The Directory"], ans: 2, explain: "The radical Jacobin Convention passed the law to free slaves." },
    { q: "In what year did women in France finally win the right to vote?", opts: ["1791", "1848", "1900", "1946"], ans: 3, explain: "Despite their massive role in the revolution, French women did not win suffrage until 1946." }
  ]
};

export const ALL_LEVELS: MapLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7];
