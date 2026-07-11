const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

const questions = [
  {
    title: "The Rowlatt Act of 1919 gave the British government the power to:",
    options: [
      "Grant Indians the right to vote",
      "Imprison any person without trial for up to two years",
      "Divide Bengal into two provinces",
      "Establish the Indian National Congress"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "The Rowlatt Act allowed the British government to detain any person suspected of terrorism without trial for up to two years. It was widely opposed and sparked nationwide protests led by Gandhi."
  },
  {
    title: "The Jallianwala Bagh massacre occurred on which date?",
    options: [
      "April 6, 1919",
      "April 13, 1919",
      "March 30, 1919",
      "August 15, 1919"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "On April 13, 1919 (Baisakhi Day), General Dyer ordered troops to open fire on a peaceful crowd gathered at Jallianwala Bagh in Amritsar, killing hundreds and wounding thousands."
  },
  {
    title: "The Non-Cooperation Movement was launched by Gandhi in:",
    options: [
      "1919",
      "1920",
      "1921",
      "1922"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "The Non-Cooperation Movement was formally launched by Mahatma Gandhi in September 1920, asking Indians to boycott British institutions, goods, courts, and councils."
  },
  {
    title: "Why was the Non-Cooperation Movement suddenly withdrawn by Gandhi in February 1922?",
    options: [
      "Due to the arrest of Gandhi by the British",
      "Because the Khilafat issue was resolved",
      "Due to the violent incident at Chauri Chaura where a police station was burned",
      "Because the British agreed to grant self-rule"
    ],
    correct_option: 2,
    subject: "History",
    explanation: "At Chauri Chaura in February 1922, a crowd of protesters turned violent and burnt a police station, killing 22 policemen. Gandhi, committed to non-violence, immediately withdrew the movement."
  },
  {
    title: "The Simon Commission was boycotted by Indians because:",
    options: [
      "It proposed the partition of India",
      "It had no Indian members — all members were British",
      "It wanted to abolish the Indian National Congress",
      "It recommended the Rowlatt Act be made permanent"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "The Simon Commission, sent to India in 1928 to review constitutional reforms, had no Indian members. Indians across parties boycotted it with the slogan 'Simon Go Back' as it was seen as deeply insulting."
  },
  {
    title: "The Civil Disobedience Movement began with Gandhi's famous:",
    options: [
      "Quit India Movement",
      "Non-Cooperation Movement",
      "Dandi March (Salt March)",
      "Khilafat Movement"
    ],
    correct_option: 2,
    subject: "History",
    explanation: "Gandhi launched the Civil Disobedience Movement on March 12, 1930 with the historic Dandi March, walking 240 miles from Sabarmati Ashram to Dandi to make salt and defy the British salt tax law."
  },
  {
    title: "Which agreement ended the Civil Disobedience Movement in 1931, with Gandhi agreeing to attend the Round Table Conference?",
    options: [
      "The Lucknow Pact",
      "The Poona Pact",
      "The Gandhi-Irwin Pact",
      "The Minto-Morley Reforms"
    ],
    correct_option: 2,
    subject: "History",
    explanation: "The Gandhi-Irwin Pact (also called Delhi Pact) of March 1931 was signed between Gandhi and Viceroy Lord Irwin. Gandhi agreed to suspend the movement and attend the Second Round Table Conference in London."
  },
  {
    title: "Who organised the tribal peasants in Andhra Pradesh to participate in the Non-Cooperation Movement?",
    options: [
      "Alluri Sitarama Raju",
      "Baba Ramchandra",
      "C. Rajagopalachari",
      "Motilal Nehru"
    ],
    correct_option: 0,
    subject: "History",
    explanation: "Alluri Sitarama Raju was a tribal leader who convinced tribal peasants of Andhra Pradesh to join the Non-Cooperation Movement. He later led the Rampa Revolt in 1922-24 against the British."
  },
  {
    title: "The Khilafat Movement was started to protest against:",
    options: [
      "The partition of Bengal",
      "The Rowlatt Act",
      "The humiliating treatment of the Ottoman Emperor (Khalifa) by the British after WWI",
      "The Simon Commission"
    ],
    correct_option: 2,
    subject: "History",
    explanation: "The Khilafat Movement (1919-1922) was led by Mohammed Ali and Shaukat Ali to protest the harsh treatment of the Ottoman Caliph (Khalifa) by the British after World War I. Gandhi supported it to build Hindu-Muslim unity."
  },
  {
    title: "The concept of 'Swaraj' for Dalits was championed by Ambedkar, who founded which organization?",
    options: [
      "Depressed Classes Association",
      "Bahishkrit Hitakarini Sabha",
      "Harijan Sevak Sangh",
      "Scheduled Castes Federation"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "Dr. B.R. Ambedkar founded the Bahishkrit Hitakarini Sabha in 1924 to promote education and socio-economic improvement among Dalits (depressed classes) and to challenge caste discrimination."
  },
  {
    title: "In which session of the Indian National Congress was 'Purna Swaraj' (Complete Independence) declared as the goal?",
    options: [
      "Surat Session, 1907",
      "Lahore Session, 1929",
      "Calcutta Session, 1920",
      "Nagpur Session, 1920"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "At the Lahore Session of the INC in December 1929, under the presidency of Jawaharlal Nehru, 'Purna Swaraj' (Complete Independence) was declared as the goal. January 26, 1930 was declared Independence Day."
  },
  {
    title: "What was the main demand of the peasant movements in Awadh, led by Baba Ramchandra?",
    options: [
      "Reduction of land revenue and abolition of forced labour (begar)",
      "Right to vote in elections",
      "Cancellation of the Rowlatt Act",
      "Free education for farmers' children"
    ],
    correct_option: 0,
    subject: "History",
    explanation: "The peasant movement in Awadh (1920) led by Baba Ramchandra demanded reduction of exorbitant rents, abolition of forced labour (begar), and redistribution of land taken by the British-backed landlords (talukdars)."
  },
  {
    title: "The idea of 'Satyagraha' emphasises:",
    options: [
      "Armed resistance against colonial rule",
      "The power of truth and non-violence to bring about change",
      "Boycott of all foreign goods only",
      "Civil war as a tool of independence"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "Satyagraha (soul force/truth force) is Gandhi's philosophy of non-violent resistance. It holds that if the cause is true, non-violent resistance can conquer an oppressor without hatred. The fight is against the evil, not the person."
  },
  {
    title: "Which women's group took a leading role in the Civil Disobedience Movement by making salt and picketing liquor shops?",
    options: [
      "All India Women's Conference",
      "Women's Indian Association",
      "Groups of urban women led by the Congress",
      "Theosophical Society of India"
    ],
    correct_option: 2,
    subject: "History",
    explanation: "During the Civil Disobedience Movement, large numbers of urban women came out of their homes for the first time. Organized by Congress, they participated in making salt, picketing liquor shops, and joining protest marches."
  },
  {
    title: "Why did the Indian National Congress decide NOT to attend the First Round Table Conference in 1930?",
    options: [
      "Because Nehru was attending a different conference",
      "Because Gandhi was in prison and the Civil Disobedience Movement was in full swing",
      "Because the British refused to invite them",
      "Because the conference was held in Pakistan"
    ],
    correct_option: 1,
    subject: "History",
    explanation: "The INC boycotted the First Round Table Conference (November 1930) because the Civil Disobedience Movement was at its peak and Gandhi was in jail. The conference failed without the Congress, forcing the British to negotiate via the Gandhi-Irwin Pact."
  }
];

async function run() {
  try {
    const gauntletData = {
      slug: 'nationalism-india-arena-battle',
      title: 'Nationalism in India — Arena Battle',
      description: 'From the Rowlatt Act to Dandi March! 15 elite questions on the Indian Independence Movement. Score ≥80% to earn the Freedom Fighter title and 25 Bonus Points!',
      subject: 'History',
      class_grade: '10',
      difficulty: 'hard',
      question_count: 15,
      time_minutes: 18,
      color: 'from-amber-500 to-orange-600',
      reward: 'Freedom Fighter Title + 25 Bonus Points',
      is_active: true,
      reward_points: 25,
      reward_threshold_percent: 80,
      custom_questions: questions
    };

    // Check if it already exists and delete it first
    await supabase.from('gauntlets').delete().eq('slug', gauntletData.slug);

    const { data, error } = await supabase
      .from('gauntlets')
      .insert(gauntletData)
      .select('id');

    if (error) {
      console.error('Error inserting arena battle:', error);
    } else {
      console.log('✅ Successfully created Nationalism in India Arena Battle!');
      console.log('Battle ID:', data?.[0]?.id);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

run();
