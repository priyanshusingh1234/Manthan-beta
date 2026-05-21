/**
 * seed_class8_questions.mjs
 *
 * Generates 700 Class 8 questions using Gemini AI and bulk-inserts into Supabase.
 *
 * Usage:
 *   node seed_class8_questions.mjs
 *
 * Requirements:
 *   GEMINI_API_KEY      in .env.local  (or GOOGLE_GENERATIVE_AI_API_KEY)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   Teacher email:      kpk22128@gmail.com  (adjust TEACHER_EMAIL below)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
    const env = readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx < 1) return;
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
        if (k && !process.env[k]) process.env[k] = v;
    });
} catch { /* fallback to system env */ }

// ── Config ───────────────────────────────────────────────────────────────────
const TEACHER_EMAIL    = 'kpk22128@gmail.com';
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_COUNT     = 700;
const BATCH_DB         = 50;   // rows per Supabase insert
const GEMINI_MODEL     = 'gemini-1.5-flash'; // fast + cheap

if (!GEMINI_API_KEY) { console.error('❌  GEMINI_API_KEY missing'); process.exit(1); }
if (!SUPABASE_URL)   { console.error('❌  NEXT_PUBLIC_SUPABASE_URL missing'); process.exit(1); }
if (!SERVICE_KEY)    { console.error('❌  SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── Class 8 subjects + question counts ───────────────────────────────────────
// Total = 700
const SUBJECTS = [
    { subject: 'Mathematics',          chapter: 'Rational Numbers, Linear Equations, Squares and Cubes, Mensuration, Exponents',               count: 120 },
    { subject: 'Science',              chapter: 'Crop Production, Microorganisms, Combustion, Cell, Force and Pressure, Light, Sound, Pollution', count: 130 },
    { subject: 'Social Science',       chapter: 'Indian Constitution, Agriculture, Industries, Resources, Nationalism, French Revolution',        count: 100 },
    { subject: 'English',              chapter: 'Grammar: Tenses, Prepositions, Articles, Voices; Comprehension; Vocabulary',                    count:  80 },
    { subject: 'Hindi',                chapter: 'व्याकरण, अपठित गद्यांश, पद्यांश, संज्ञा, सर्वनाम, क्रिया, समास, संधि',                         count:  80 },
    { subject: 'Computer Science',     chapter: 'MS Office, Internet Basics, Spreadsheets, HTML basics, Storage Devices',                        count:  60 },
    { subject: 'G.K',                  chapter: 'General Knowledge, India GK, Current Affairs, Science GK',                                      count:  70 },
    { subject: 'Sanskrit',             chapter: 'शब्द रूप, धातु रूप, कारक, समास, अव्यय',                                                        count:  60 },
];

// ── Gemini call ───────────────────────────────────────────────────────────────
async function generateQuestions(subject, chapter, count) {
    const prompt = `You are an expert Class 8 (CBSE/NCERT) question creator for India.

Generate exactly ${count} multiple-choice questions for:
Subject: ${subject}
Topics: ${chapter}

Rules:
- Each question MUST have exactly 4 options
- Questions must be appropriate for Class 8 (13-14 year olds)
- Mix easy (30%), medium (50%), hard (20%)
- No duplicate questions
- For Hindi/Sanskrit questions: use proper Devanagari script
- Return ONLY a valid JSON array, no markdown, no extra text

Format (return ONLY this JSON):
[
  {
    "title": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0
  }
]

Where "correct" is the 0-indexed position of the correct answer.
Generate ${count} questions now:`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json',
                }
            })
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        return parsed.filter(q =>
            q.title && Array.isArray(q.options) && q.options.length === 4 &&
            typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
        );
    } catch {
        // Try to extract JSON array from response
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Failed to parse Gemini response as JSON');
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🚀  Class 8 Question Seeder');
    console.log(`📚  Target: ${TARGET_COUNT} questions across ${SUBJECTS.length} subjects\n`);

    // Get teacher ID
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const teacher = users.find(u => u.email === TEACHER_EMAIL);
    if (!teacher) { console.error(`❌  Teacher ${TEACHER_EMAIL} not found`); process.exit(1); }
    console.log(`👤  Teacher: ${teacher.user_metadata?.fullName || teacher.email} (${teacher.id})\n`);

    let allRows = [];
    let totalGenerated = 0;

    for (const { subject, chapter, count } of SUBJECTS) {
        console.log(`⏳  Generating ${count} questions for ${subject}...`);
        try {
            const questions = await generateQuestions(subject, chapter, count);
            console.log(`   ✅  Got ${questions.length} questions`);

            const rows = questions.map(q => ({
                created_by:     teacher.id,
                title:          q.title.trim(),
                body:           '',
                subject:        subject,
                class_grade:    '8',
                points:         2,
                time_limit:     2,
                difficulty:     'moderate',
                options:        q.options.map(o => String(o).trim()),
                correct_option: q.correct,
                image_path:     null,
                image_url:      null,
            }));

            allRows = allRows.concat(rows);
            totalGenerated += rows.length;
            console.log(`   📊  Running total: ${totalGenerated} questions\n`);

            // Small delay between Gemini calls to avoid rate limiting
            await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
            console.error(`   ❌  Failed for ${subject}: ${err.message}`);
        }
    }

    console.log(`\n📥  Inserting ${allRows.length} questions into Supabase...\n`);

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < allRows.length; i += BATCH_DB) {
        const batch = allRows.slice(i, i + BATCH_DB);
        const { error } = await supabase.from('questions').insert(batch);
        if (error) {
            console.error(`   ❌  Batch ${Math.floor(i / BATCH_DB) + 1} failed: ${error.message}`);
            failed += batch.length;
        } else {
            inserted += batch.length;
            process.stdout.write(`   ✅  Inserted ${inserted}/${allRows.length}\r`);
        }
    }

    console.log(`\n\n🎉  Done!`);
    console.log(`   Inserted:  ${inserted}`);
    console.log(`   Failed:    ${failed}`);
    console.log(`   Total:     ${allRows.length}`);
    console.log('\n   Questions are now live on the app for Class 8 students!\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
