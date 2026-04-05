const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    // First run the column migration
    console.log('Adding reward columns to gauntlets table...');
    
    // Note: Run this SQL in Supabase dashboard first if columns don't exist:
    // ALTER TABLE public.gauntlets ADD COLUMN IF NOT EXISTS reward_points int default 0;
    // ALTER TABLE public.gauntlets ADD COLUMN IF NOT EXISTS reward_threshold_percent int default 0;

    const slug = `english-voice-hard-${Date.now()}`;

    const { data, error } = await supabase
        .from('gauntlets')
        .insert({
            slug,
            title: 'English Voice Gauntlet',
            description: '15 brutal Active & Passive Voice questions. Master the transformation rules and prove your grammar dominance.',
            subject: 'english',
            class_grade: null,
            difficulty: 'hard',
            question_count: 15,
            time_minutes: 30,
            color: 'from-emerald-600 to-teal-700',
            reward: 'Grammar Mastery + 20 Bonus Points',
            reward_points: 20,
            reward_threshold_percent: 50,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating gauntlet:', error.message);
        console.error('If reward_points column missing, run in Supabase SQL editor:');
        console.error('ALTER TABLE public.gauntlets ADD COLUMN IF NOT EXISTS reward_points int default 0;');
        console.error('ALTER TABLE public.gauntlets ADD COLUMN IF NOT EXISTS reward_threshold_percent int default 0;');
        return;
    }

    console.log('✅ English Voice Gauntlet created!');
    console.log('   Slug:', data.slug);
    console.log('   URL:  /arena/' + data.slug);
    console.log('   Reward: +20 points for scoring ≥50%');
}

seed().catch(console.error);
