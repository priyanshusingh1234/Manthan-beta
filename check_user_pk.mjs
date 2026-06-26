import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const userId = '60ac847a-7bb1-484d-896c-941319c7c105';
    
    const profileData = {
        id: userId,
        full_name: 'PK Ahluwalia',
        username: 'pkahluwalia',
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocKT_P5zEvEg8p9D5E25-UoVhfO2PRlL8IcPuKEF9azTNDqaIkU=s96-c',
        updated_at: new Date().toISOString()
    };

    console.log("Upserting profile for PK Ahluwalia...");
    const { data, error } = await supabase.from('profiles').upsert(profileData).select();
    
    if (error) {
        console.error("Error upserting profile:", error);
    } else {
        console.log("Successfully created/updated profile:", data);
        
        // Also update auth.users metadata just to be sure
        const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          { user_metadata: { username: 'pkahluwalia', full_name: 'PK Ahluwalia' } }
        );
        if (authError) {
             console.error("Error updating auth metadata:", authError);
        } else {
             console.log("Successfully updated auth metadata as well.");
        }
    }
}
run();
