const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const voiceQuestions = [
    {
        title: "Choose the correct passive form of: 'She is writing a letter.'",
        options: ["A letter was written by her.", "A letter is being written by her.", "A letter was being written by her.", "A letter is written by her."],
        correct_option: 1, subject: "english"
    },
    {
        title: "Change to active voice: 'The work will be finished by them tomorrow.'",
        options: ["They will finish the work tomorrow.", "They would finish the work tomorrow.", "They will be finishing the work.", "They finished the work."],
        correct_option: 0, subject: "english"
    },
    {
        title: "Passive voice of: 'Someone has stolen my pen.'",
        options: ["My pen was stolen by someone.", "My pen is stolen.", "My pen has been stolen.", "My pen was being stolen."],
        correct_option: 2, subject: "english"
    },
    {
        title: "Convert to active: 'The room was cleaned by her.'",
        options: ["She had cleaned the room.", "She cleans the room.", "She is cleaning the room.", "She cleaned the room."],
        correct_option: 3, subject: "english"
    },
    {
        title: "Change to passive: 'The cat killed the mouse.'",
        options: ["The mouse is killed by the cat.", "The mouse was being killed by the cat.", "The mouse was killed by the cat.", "The mouse had been killed by the cat."],
        correct_option: 2, subject: "english"
    },
    {
        title: "Passive of: 'Does he like tea?'",
        options: ["Is tea liked by him?", "Has tea liked by him?", "Was tea liked by him?", "Is tea being liked by him?"],
        correct_option: 0, subject: "english"
    },
    {
        title: "Active: 'Let the door be shut.'",
        options: ["Shut the door.", "You shut the door.", "Door must be shut.", "He shut the door."],
        correct_option: 0, subject: "english"
    },
    {
        title: "Passive of: 'People speak English all over the world.'",
        options: ["English being spoken all over.", "English is spoken all over the world.", "English was spoken by people.", "The world speaks English."],
        correct_option: 1, subject: "english"
    },
    {
        title: "Active: 'By whom was this letter written?'",
        options: ["Who writes this letter?", "Who wrote this letter?", "Who has written this letter?", "Who had written this letter?"],
        correct_option: 1, subject: "english"
    },
    {
        title: "Passive of: 'Open the gate.'",
        options: ["The gate is opened.", "Let the gate be opened.", "The gate must be opened.", "Gate should be open."],
        correct_option: 1, subject: "english"
    },
    {
        title: "Active: 'The match is being played by them.'",
        options: ["They play the match.", "They played the match.", "They are playing the match.", "They have played the match."],
        correct_option: 2, subject: "english"
    },
    {
        title: "Passive form of: 'Do not touch the wire.'",
        options: ["The wire must not be touched.", "The wire was not touched.", "The wire is not touched.", "Let the wire not be touched."],
        correct_option: 3, subject: "english"
    },
    {
        title: "Active: 'I was taught English by Mr. Sharma.'",
        options: ["Mr. Sharma teach me English.", "Mr. Sharma was teaching me English.", "Mr. Sharma taught me English.", "Mr. Sharma has taught me English."],
        correct_option: 2, subject: "english"
    },
    {
        title: "Passive of: 'She had finished the homework.'",
        options: ["The homework had been finished by her.", "The homework was finished by her.", "The homework has been finished by her.", "The homework is finished by her."],
        correct_option: 0, subject: "english"
    },
    {
        title: "Which is the correct passive of: 'He loves her.'",
        options: ["She is loved by him.", "She was loved by him.", "She loved by him.", "She has been loved by him."],
        correct_option: 0, subject: "english"
    }
];

async function run() {
    // Step 1: Delete ALL existing voice gauntlets
    const { data: existing } = await supabase
        .from('gauntlets')
        .select('id, slug, title')
        .ilike('slug', '%voice%');

    if (existing && existing.length > 0) {
        console.log(`Deleting ${existing.length} old voice gauntlet(s)...`);
        for (const g of existing) {
            await supabase.from('gauntlets').delete().eq('id', g.id);
            console.log(`  ✗ Deleted: ${g.title} (${g.slug})`);
        }
    }

    // Step 2: Create the single clean one
    const slug = 'english-voice-hard';
    const { data, error } = await supabase
        .from('gauntlets')
        .insert({
            slug,
            title: 'English Voice Gauntlet',
            description: '15 hand-crafted Active & Passive Voice questions. Score ≥50% to earn 20 bonus points.',
            subject: 'english',
            difficulty: 'hard',
            question_count: 15,
            time_minutes: 30,
            color: 'from-emerald-600 to-teal-700',
            reward: 'Grammar Mastery + 20 Bonus Points',
            reward_points: 20,
            reward_threshold_percent: 50,
            custom_questions: voiceQuestions,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating gauntlet:', error.message);
        return;
    }

    console.log('\n✅ English Voice Gauntlet created cleanly!');
    console.log('   URL:  /arena/' + data.slug);
    console.log('   Questions:', voiceQuestions.length);
    console.log('   Reward: +20 pts for ≥50%');
}

run();
