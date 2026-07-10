import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixNewAniket() {
  const newUserId = '41ca5e28-8563-4838-ab16-a05ff8a03072';

  // 1. Fetch from profiles
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', newUserId)
    .maybeSingle();

  console.log('Profile exists:', !!profile);
  if (profile) console.log(profile);

  // 2. Fetch the user from auth
  const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(newUserId);
  if (!user) {
    console.error('Auth user not found!', authErr);
    return;
  }

  // 3. Update auth metadata
  const newMeta = { ...user.user_metadata, username: 'aniketpandey' };
  const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(newUserId, {
    user_metadata: newMeta
  });
  if (updateAuthErr) console.error('Failed to update auth metadata:', updateAuthErr);
  else console.log('Auth metadata updated to aniketpandey');

  // 4. Update or insert into profiles
  if (profile) {
    const { error: updateProfErr } = await supabase
      .from('profiles')
      .update({ username: 'aniketpandey' })
      .eq('id', newUserId);
    if (updateProfErr) console.error('Failed to update profile:', updateProfErr);
    else console.log('Profile updated to aniketpandey');
  } else {
    // Attempt to manually insert the profile since it failed earlier
    const { error: insertProfErr } = await supabase
      .from('profiles')
      .insert({
        id: newUserId,
        username: 'aniketpandey',
        full_name: newMeta.fullName || 'Aniket Pandey',
        avatar_url: newMeta.avatar_url || null,
        class_grade: newMeta.classGrade || '10',
        school: newMeta.school || null
      });
    if (insertProfErr) console.error('Failed to insert profile:', insertProfErr);
    else console.log('Profile successfully created for aniketpandey!');
  }
}

fixNewAniket();
