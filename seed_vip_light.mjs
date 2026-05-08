import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const EMAIL    = 'kpk22128@gmail.com';
const PASSWORD = '123456789';

const VIP_QUESTION = {
  subject: 'Science',
  chapter: 'Light – Reflection and Refraction',
  title: 'A point object is placed on the principal axis at a distance of 30 cm from a convex lens of focal length 20 cm. A convex mirror of radius of curvature 40 cm is placed coaxially on the other side of the lens. At what distance from the lens should the convex mirror be placed such that the final image formed by the system coincides exactly with the object itself?',
  body: 'Use the lens formula (1/v - 1/u = 1/f) to locate the image through the lens. Then apply the condition for the final image to coincide with the object — rays must retrace their path after reflection from the convex mirror.',
  options: [
    '10 cm',
    '20 cm',
    '40 cm',
    '60 cm',
  ],
  correctOption: 1,  // 20 cm — lens image at 60 cm; rays retrace when image is at C of convex mirror (R=40 cm behind it): 60 - d = 40 → d = 20 cm
};

async function run() {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !authData.session) {
    console.error('❌ Login failed:', authError);
    return;
  }

  const teacherId = authData.session.user.id;
  console.log(`✅ Logged in as teacher: ${teacherId}`);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Check for duplicate
  const { data: existing } = await adminClient
    .from('questions')
    .select('id')
    .eq('title', VIP_QUESTION.title)
    .eq('created_by', teacherId)
    .maybeSingle();

  if (existing) {
    console.log('⏭️  Question already exists — skipping.');
    return;
  }

  const { data, error } = await adminClient.from('questions').insert({
    created_by:    teacherId,
    title:         VIP_QUESTION.title,
    body:          VIP_QUESTION.body,
    subject:       VIP_QUESTION.subject,
    class_grade:   '10',
    chapter:       VIP_QUESTION.chapter,
    points:        10,
    time_limit:    2,           // 2 min — enough for a calculation but still a challenge
    difficulty:    'hard',
    options:       VIP_QUESTION.options,
    correct_option: VIP_QUESTION.correctOption,
    is_vip:        true,
    image_path:    null,
    image_url:     null,
  }).select('id').single();

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log(`\n👑 VIP question created!`);
    console.log(`   ID      : ${data.id}`);
    console.log(`   Subject : ${VIP_QUESTION.subject}`);
    console.log(`   Chapter : ${VIP_QUESTION.chapter}`);
    console.log(`   Points  : 10  |  Difficulty: hard  |  VIP: true`);
    console.log(`   Title   : ${VIP_QUESTION.title.slice(0, 80)}…`);
  }
}

run();
