import { MapLevel } from '@/components/GauntletEngine';

export const LEVEL_1: MapLevel = {
  id: 1,
  title: 'The First World War',
  icon: '🌍',
  color: '#0ea5e9',
  notes: [
    { type: 'heading', content: 'The First World War, Khilafat and Non-Cooperation' },
    { type: 'paragraph', content: 'In the years after 1919, the national movement spread to new areas, incorporating new social groups and developing new modes of struggle.' },
    { type: 'bullet', title: 'Economic Impact', content: 'The war created a new economic and political situation. It led to a huge increase in defense expenditure which was financed by war loans and increasing taxes: customs duties were raised and income tax introduced.' },
    { type: 'bullet', title: 'Forced Recruitment', content: 'Through the war years prices increased – doubling between 1913 and 1918 – leading to extreme hardship for the common people. Villages were called upon to supply soldiers, and the forced recruitment in rural areas caused widespread anger.' }
  ],
  questions: [
    {
      q: "What economic measure was introduced in India to finance defense expenditure during the First World War?",
      opts: ["Goods and Services Tax", "Income tax", "Wealth tax", "Corporate tax"],
      ans: 1,
      explain: "Income tax was introduced and customs duties were raised to finance the huge defense expenditure."
    }
  ]
};

export const LEVEL_2: MapLevel = {
  id: 2,
  title: 'The Idea of Satyagraha',
  icon: '🕊️',
  color: '#3b82f6',
  notes: [
    { type: 'heading', content: 'The Idea of Satyagraha' },
    { type: 'paragraph', content: 'Mahatma Gandhi returned to India in January 1915. He had come from South Africa where he had successfully fought the racist regime with a novel method of mass agitation, which he called satyagraha.' },
    { type: 'bullet', title: 'Philosophy', content: 'The idea of satyagraha emphasized the power of truth and the need to search for truth. It suggested that if the cause was true, if the struggle was against injustice, then physical force was not necessary to fight the oppressor.' },
    { type: 'bullet', title: 'Early Movements', content: 'In 1917 he travelled to Champaran in Bihar to inspire the peasants to struggle against the oppressive plantation system. Then in 1917, he organised a satyagraha to support the peasants of the Kheda district of Gujarat. In 1918, Mahatma Gandhi went to Ahmedabad to organise a satyagraha movement amongst cotton mill workers.' }
  ],
  questions: [
    {
      q: "Where did Mahatma Gandhi organise a satyagraha movement amongst cotton mill workers in 1918?",
      opts: ["Champaran", "Kheda", "Ahmedabad", "Surat"],
      ans: 2,
      explain: "He went to Ahmedabad in 1918 to organize a satyagraha for cotton mill workers."
    }
  ]
};

export const LEVEL_3: MapLevel = {
  id: 3,
  title: 'The Rowlatt Act',
  icon: '📜',
  color: '#8b5cf6',
  notes: [
    { type: 'heading', content: 'The Rowlatt Act (1919)' },
    { type: 'paragraph', content: 'Emboldened with this success, Gandhiji in 1919 decided to launch a nationwide satyagraha against the proposed Rowlatt Act. This Act had been hurriedly passed through the Imperial Legislative Council despite the united opposition of the Indian members.' },
    { type: 'bullet', title: 'Draconian Powers', content: 'It gave the government enormous powers to repress political activities, and allowed detention of political prisoners without trial for two years.' },
    { type: 'bullet', title: 'Jallianwala Bagh Massacre', content: 'On 13 April, the infamous Jallianwala Bagh incident took place. A large crowd gathered in the enclosed ground of Jallianwala Bagh. General Dyer entered the area, blocked the exit points, and opened fire on the crowd, killing hundreds.' }
  ],
  questions: [
    {
      q: "Under the Rowlatt Act, for how long could political prisoners be detained without trial?",
      opts: ["Six months", "One year", "Two years", "Three years"],
      ans: 2,
      explain: "The Act allowed detention of political prisoners without trial for two years."
    }
  ]
};

export const LEVEL_4: MapLevel = {
  id: 4,
  title: 'BOSS: The General of Hate',
  icon: '👿',
  color: '#dc2626',
  notes: [
    { type: 'heading', content: 'Boss Battle: The General of Hate' },
    { type: 'sketch', sketchType: 'demon', content: 'A monstrous representation of oppression and tyranny.' },
    { type: 'paragraph', content: 'You are facing the first major boss! The brutal colonial machinery is represented by a terrifying demon. Answer these questions correctly to defeat the oppression and move to the Khilafat movement!' }
  ],
  questions: [
    {
      q: "What was General Dyer's stated objective in ordering the firing at Jallianwala Bagh?",
      opts: ["To protect British citizens", "To produce a 'moral effect' and create a feeling of terror", "To disperse an armed rebellion", "To capture local leaders"],
      ans: 1,
      explain: "General Dyer declared later that his object was to 'produce a moral effect', to create in the minds of satyagrahis a feeling of terror and awe."
    }
  ]
};

export const LEVEL_5: MapLevel = {
  id: 5,
  title: 'Non-Cooperation',
  icon: '🚫',
  color: '#f59e0b',
  notes: [
    { type: 'heading', content: 'Why Non-Cooperation?' },
    { type: 'paragraph', content: 'In his famous book Hind Swaraj (1909) Mahatma Gandhi declared that British rule was established in India with the cooperation of Indians, and had survived only because of this cooperation. If Indians refused to cooperate, British rule in India would collapse within a year, and swaraj would come.' },
    { type: 'bullet', title: 'The Boycott', content: 'The movement was to unfold in stages. It should begin with the surrender of titles that the government awarded, and a boycott of civil services, army, police, courts and legislative councils, schools, and foreign goods.' }
  ],
  questions: [
    {
      q: "In which book did Mahatma Gandhi declare that British rule survived in India only because of Indian cooperation?",
      opts: ["My Experiments with Truth", "Hind Swaraj", "Discovery of India", "Glimpses of World History"],
      ans: 1,
      explain: "Gandhiji declared this in his famous book Hind Swaraj, written in 1909."
    }
  ]
};

export const LEVEL_6: MapLevel = {
  id: 6,
  title: 'Differing Strands',
  icon: '👥',
  color: '#ec4899',
  notes: [
    { type: 'heading', content: 'Differing Strands within the Movement' },
    { type: 'paragraph', content: 'The Non-Cooperation-Khilafat Movement began in January 1921. Various social groups participated in this movement, each with its own specific aspiration. All of them responded to the call of Swaraj, but the term meant different things to different people.' },
    { type: 'bullet', title: 'Rebellion in the Countryside', content: 'In Awadh, peasants were led by Baba Ramchandra – a sanyasi who had earlier been to Fiji as an indentured labourer. The movement here was against talukdars and landlords who demanded from peasants exorbitantly high rents and a variety of other cesses.' },
    { type: 'bullet', title: 'Tribal Revolt', content: 'In the Gudem Hills of Andhra Pradesh, a militant guerrilla movement spread in the early 1920s. The leader was Alluri Sitaram Raju, who claimed he had special astrological powers.' }
  ],
  questions: [
    {
      q: "Who led the peasant movement in Awadh against talukdars and landlords?",
      opts: ["Jawaharlal Nehru", "Alluri Sitaram Raju", "Baba Ramchandra", "Mahatma Gandhi"],
      ans: 2,
      explain: "Baba Ramchandra led the peasant movement in Awadh."
    }
  ]
};

export const LEVEL_7: MapLevel = {
  id: 7,
  title: 'BOSS: The Exploiter',
  icon: '👹',
  color: '#4f46e5',
  notes: [
    { type: 'heading', content: 'Boss Battle: The Exploiter' },
    { type: 'sketch', sketchType: 'demon', content: 'A demon holding bags of extorted peasant gold.' },
    { type: 'paragraph', content: 'The landlords and colonial exploiters stand in your way! Show them the power of peasant unity by passing this trial!' }
  ],
  questions: [
    {
      q: "What did the term 'begar' mean in the context of the Awadh peasant movement?",
      opts: ["A form of tax on crops", "Labour that villagers were forced to contribute without any payment", "A traditional festival", "A weapon used by tribal leaders"],
      ans: 1,
      explain: "Begar meant labour that villagers were forced to contribute without any payment to landlords."
    }
  ]
};

export const LEVEL_8: MapLevel = {
  id: 8,
  title: 'Civil Disobedience',
  icon: '🧂',
  color: '#10b981',
  notes: [
    { type: 'heading', content: 'Towards Civil Disobedience' },
    { type: 'paragraph', content: 'In February 1922, Mahatma Gandhi decided to withdraw the Non-Cooperation Movement because of the Chauri Chaura incident. By the late 1920s, Indian politics was shaped by two factors: the worldwide economic depression and the arrival of the Simon Commission.' },
    { type: 'bullet', title: 'The Salt March', content: 'Mahatma Gandhi found in salt a powerful symbol that could unite the nation. On 31 January 1930, he sent a letter to Viceroy Irwin stating eleven demands. The most stirring of all was the demand to abolish the salt tax.' },
    { type: 'bullet', title: 'Dandi March', content: 'Mahatma Gandhi started his famous salt march accompanied by 78 of his trusted volunteers. The march was over 240 miles, from Gandhiji\'s ashram in Sabarmati to the Gujarati coastal town of Dandi.' }
  ],
  questions: [
    {
      q: "Why was the Simon Commission greeted with the slogan 'Go back Simon'?",
      opts: ["It proposed partitioning India", "It had no Indian members", "It suggested doubling the salt tax", "It ordered the arrest of Gandhi"],
      ans: 1,
      explain: "The Commission did not have a single Indian member. They were all British, which outraged Indians."
    }
  ]
};

export const LEVEL_9: MapLevel = {
  id: 9,
  title: 'BOSS: The Salt Demon',
  icon: '👺',
  color: '#6366f1',
  notes: [
    { type: 'heading', content: 'Boss Battle: The Salt Demon' },
    { type: 'sketch', sketchType: 'demon', content: 'A colossal demon guarding the oceans.' },
    { type: 'paragraph', content: 'The British monopoly over salt is a monstrous injustice! Break the monopoly to advance!' }
  ],
  questions: [
    {
      q: "How many miles was the famous Dandi March?",
      opts: ["100 miles", "240 miles", "300 miles", "500 miles"],
      ans: 1,
      explain: "The march was over 240 miles from Sabarmati to Dandi."
    }
  ]
};

export const LEVEL_10: MapLevel = {
  id: 10,
  title: 'FINAL BOSS: Imperial Beast',
  icon: '💀',
  color: '#000000',
  notes: [
    { type: 'heading', content: 'Final Boss: The Imperial Beast' },
    { type: 'sketch', sketchType: 'demon', content: 'The ultimate symbol of British imperialism.' },
    { type: 'paragraph', content: 'This is the final test of your knowledge on Nationalism in India. Defeat the Imperial Beast to claim your victory!' }
  ],
  questions: [
    {
      q: "Who painted the famous image of Bharat Mata in 1905?",
      opts: ["Rabindranath Tagore", "Abanindranath Tagore", "Raja Ravi Varma", "Bankim Chandra Chattopadhyay"],
      ans: 1,
      explain: "The famous image of Bharat Mata was painted by Abanindranath Tagore in 1905."
    }
  ]
};

export const ALL_LEVELS: MapLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10];
