require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const matchKeywords = ["fun_they_had", "road_not_taken", "sound_of_music", "wind", "little_girl", "beautiful_mind", "northland", "childhood", "no_men_foreign", "beggar"];

async function uploadFile(bucket, storagePath, localFilePath) {
    const fileData = fs.readFileSync(localFilePath);
    const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fileData, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadErr) {
        console.error(`Upload error for bucket ${bucket}:`, uploadErr);
        return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return { path: storagePath, url: data.publicUrl };
}

async function updateToSupabaseStorage() {
    const dir = path.join(__dirname, 'public', 'english_class9');
    const files = fs.readdirSync(dir);

    // Get current English Literature questions
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, title')
        .eq('subject', 'English Literature');

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    // Since title follows pattern "Q1. The Fun They Had", we can identify them
    for (const q of questions) {
        const qNum = parseInt(q.title.match(/Q(\d+)/)?.[1]);
        if (!qNum) continue;

        const keyword = matchKeywords[qNum - 1];
        const illusFile = files.find(f => f.startsWith('illus_') && f.includes(keyword));
        const ansFile = files.find(f => f.startsWith(`answer_${qNum}.`));

        console.log(`Updating Storage for: ${q.title}`);

        // Upload Illustration to question-images
        if (illusFile) {
            const localPath = path.join(dir, illusFile);
            const storagePath = `class9-english/${q.id}_illustration.png`;
            const result = await uploadFile('question-images', storagePath, localPath);
            if (result) {
                await supabase.from('questions').update({
                    image_path: result.path,
                    image_url: result.url
                }).eq('id', q.id);
                console.log(`  Uploaded Illustration: ${result.url}`);
            }
        }

        // Upload Answer to written-answers
        if (ansFile) {
            const localPath = path.join(dir, ansFile);
            const storagePath = `teacher-solutions/${q.id}/model_solution.png`;
            const result = await uploadFile('written-answers', storagePath, localPath);
            if (result) {
                await supabase.from('teacher_solutions').update({
                    solution_path: result.path,
                    solution_url: result.url
                }).eq('question_id', q.id);
                console.log(`  Uploaded Teacher Solution: ${result.url}`);
            }
        }
    }
    console.log('Update Complete.');
}

updateToSupabaseStorage().catch(console.error);
