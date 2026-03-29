require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const questionsData = [
    { title: "Q1. The Fun They Had", q: "Analyze the contrast between the highly mechanized educational system of 2157 and the human-centric schools of the past as depicted in the story. Evaluate the potential emotional and social consequences on a child isolated with a mechanical teacher. (16 Marks)" },
    { title: "Q2. The Road Not Taken", q: "'The Road Not Taken' is often misinterpreted as a celebration of non-conformity. Critically examine the tone and the element of self-deception in the speaker's narrative. How does the poem reflect the human tendency to retroactively assign profound meaning to arbitrary choices? (16 Marks)" },
    { title: "Q3. The Sound of Music", q: "Evelyn Glennie’s journey is not just about overcoming a physical disability but also about redefining the perception of music itself. Discuss how she cultivated a unique 'listening' mechanism that transcended auditory senses. (16 Marks)" },
    { title: "Q4. Wind", q: "Analyze the dual nature of wind in Subramania Bharati’s poem. How does the poet use this natural force as a metaphor for life's adversities, and what psychological fortitude does he advocate to 'make friends' with it? (16 Marks)" },
    { title: "Q5. The Little Girl", q: "Trace the psychological evolution in Kezia’s perception of her father from a terrifying, authoritarian figure to a vulnerable, exhausted human being. What does this reveal about emotional communication within a family? (16 Marks)" },
    { title: "Q6. A Truly Beautiful Mind", q: "Albert Einstein is universally celebrated for his scientific genius, but the chapter equally emphasizes his humanistic endeavors. Evaluate Einstein’s transformation from a theoretical physicist to a global advocate for peace. (16 Marks)" },
    { title: "Q7. The Legend of the Northland", q: "Analyze the characterization of Saint Peter and the old lady in the poem. How does the poem employ the metaphor of baking and physical transformation to underscore the consequences of extreme selfishness? (16 Marks)" },
    { title: "Q8. My Childhood", q: "How does Abdul Kalam’s childhood narrative demonstrate that deeply rooted moral values and communal harmony can supersede religious and social boundaries? Provide examples from the text. (16 Marks)" },
    { title: "Q9. No Men Are Foreign", q: "James Kirkup’s poem is a poignant anti-war manifesto. Deconstruct the imagery the poet uses to establish the biological and emotional universality of mankind. (16 Marks)" },
    { title: "Q10. The Beggar", q: "In 'The Beggar,' the true catalyst for Lushkoff’s redemption is not Sergei’s employment, but Olga’s empathy. Critically examine how harsh scolding coupled with genuine compassion leads to the character's profound transformation. (16 Marks)" }
];

const matchKeywords = ["fun_they_had", "road_not_taken", "sound_of_music", "wind", "little_girl", "beautiful_mind", "northland", "childhood", "no_men_foreign", "beggar"];

async function seed() {
    const dir = path.join(__dirname, 'public', 'english_class9');
    const files = fs.readdirSync(dir);
    
    // Create a dummy admin UUID for the teacher_solutions table (since teacher_id is NOT NULL but doesn't reference auth.users strictly)
    const crypto = require('crypto');
    const dummyTeacherId = crypto.randomUUID();

    for (let i = 0; i < questionsData.length; i++) {
        const item = questionsData[i];
        const keyword = matchKeywords[i];
        
        // Find illustration and answer
        const illusFile = files.find(f => f.startsWith('illus_') && f.includes(keyword));
        const ansFile = files.find(f => f.startsWith(`answer_${i+1}.`));
        
        console.log(`Processing: ${item.title}`);
        
        const qInsert = {
            title: item.title,
            body: item.q,
            subject: 'English Literature',
            class_grade: "9",
            points: 16,
            time_limit: 600,
            difficulty: 'hard',
            image_url: illusFile ? `/english_class9/${illusFile}` : null,
            status: 'published'
        };

        const { data: qData, error: qError } = await supabase
            .from('questions')
            .insert(qInsert)
            .select('*')
            .single();

        if (qError) {
            console.error('Error inserting question:', qError);
            continue;
        }

        console.log(`Inserted question ID: ${qData.id}`);

        if (ansFile) {
            const { error: tError } = await supabase
                .from('teacher_solutions')
                .insert({
                    question_id: qData.id,
                    teacher_id: dummyTeacherId,
                    solution_path: `/english_class9/${ansFile}`,
                    solution_url: `/english_class9/${ansFile}`
                });
            if (tError) {
                console.error('Error inserting teacher solution:', tError);
            } else {
                console.log(`Inserted teacher solution for ${qData.id}`);
            }
        }
    }
    console.log('Seeding complete.');
}

seed().catch(console.error);
