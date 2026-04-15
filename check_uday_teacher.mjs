import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const { data: profile } = await supabase.from('profiles').select('id, username, is_teacher').eq('username','udaypratap').single();
const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
const meta = authUser.user?.user_metadata || {};
console.log("profiles.is_teacher:", profile.is_teacher);
console.log("auth meta.isTeacher:", meta.isTeacher);
console.log("auth meta.is_teacher:", meta.is_teacher);
