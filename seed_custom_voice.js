const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const voiceQuestions = [
    { title: "Identify the passive form of: 'She is writing a letter.'", options: ["A letter was written by her.", "A letter is being written by her.", "A letter was being written by her.", "A letter is written by her."], correct_option: 1 },
    { title: "Change to active: 'The work will be finished by them tomorrow.'", options: ["They will finish the work tomorrow.", "They would finish the work tomorrow.", "They will be finishing the work tomorrow.", "They finished the work tomorrow."], correct_option: 0 },
    { title: "Passive voice of: 'Someone has stolen my pen.'", options: ["My pen was stolen by someone.", "My pen is stolen.", "My pen has been stolen.", "Someone's pen have been stolen."], correct_option: 2 },
    { title: "Identify correctly: 'He was seen leaving the building.'", options: ["They see him leaving.", "We saw him lead.", "They saw him leaving the building.", "The building was left by him."], correct_option: 2 },
    { title: "Active: 'Let the door be shut.'", options: ["Shut the door.", "You shut the door.", "Door must be shut.", "He shut the door."], correct_option: 0 },
    { title: "Passive form: 'Does he like tea?'", options: ["Is tea liked by him?", "Has tea liked by him?", "Was tea liked by him?", "Is tea being liked by him?"], correct_option: 0 },
    { title: "Convert to active: 'The room was cleaned by her.'", options: ["She had cleaned the room.", "She cleans the room.", "She is cleaning the room.", "She cleaned the room."], correct_option: 3 },
    { title: "Change to passive: 'The cat killed the mouse.'", options: ["The mouse is killed by the cat.", "The mouse was being killed by the cat.", "The mouse was killed by the cat.", "The mouse had been killed by the cat."], correct_option: 2 },
    { title: "Passive of: 'People speak English all over the world.'", options: ["English being spoken all over.", "English is spoken all over the world.", "English was spoken by people.", "The world speaks English."], correct_option: 1 },
    { title: "Active: 'By whom was this book written?'", options: ["Who wrote this book?", "Who writes this book?", "Who has written this book?", "Who had written this book?"], correct_option: 0 },
    { title: "Passive of: 'Open the gate.'", options: ["The gate is opened.", "Let the gate be opened.", "The gate must be opened.", "Gate should be open."], correct_option: 1 },
    { title: "Active: 'The match is being played by them.'", options: ["They play the match.", "They played the match.", "They are playing the match.", "They have played the match."], correct_option: 2 },
    { title: "Passive form: 'Do not touch the wire.'", options: ["The wire must not be touched.", "The wire was not touched.", "The wire is not touched.", "Let the wire not be touched."], correct_option: 3 },
    { title: "Change to passive: 'Has he complete his work?'", options: ["Has his work been completed by him?", "Was his work completed by him?", "Has his work completed by him?", "Had his work been completed by him?"], correct_option: 0 },
    { title: "Active: 'I was taught English by Mr. Sharma.'", options: ["Mr. Sharma teach me English.", "Mr. Sharma was teaching me English.", "Mr. Sharma taught me English.", "Mr. Sharma has taught me English."], correct_option: 2 }
];

async function seed() {
    const slug = `english-voice-nightmare-${Date.now()}`;
    const { data, error } = await supabase
        .from('gauntlets')
        .insert({
            slug,
            title: 'English Voice Gauntlet',
            description: '15 extreme Active & Passive Voice questions. No random bank questions here—this is hand-curated by admin.',
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
        console.error('Error:', error.message);
        return;
    }
    console.log('✅ English Voice Gauntlet with CUSTOM questions created!');
    console.log('   URL:  /arena/' + data.slug);
}

seed();
