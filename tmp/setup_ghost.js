const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ivkrupsksxibaibmiibk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGhost() {
    try {
        console.log("Finding Ghost User (ghost@gmail.com)...");
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const ghostUser = users.find(u => u.email === 'ghost@gmail.com');
        if (!ghostUser) {
            console.log("Ghost user not found with email ghost@gmail.com. Checking meta...");
            // Maybe there is one with username 'TheUnknownSage'?
            const ghostByName = users.find(u => u.user_metadata?.username === 'theunknownsage');
            if (!ghostByName) return console.error("User not found.");
            await startSetup(ghostByName);
        } else {
            await startSetup(ghostUser);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

async function startSetup(user) {
    const userId = user.id;
    console.log("Found Ghost User ID:", userId);

    // 1. Update Auth Metadata
    console.log("Updating Auth Metadata...");
    await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { ...user.user_metadata, is_ghost: true }
    });

    // 2. Update profiles table
    console.log("Updating Profiles table...");
    await supabase
        .from('profiles')
        .upsert({
            id: userId,
            is_ghost: true,
            total_points: 9999,
            avatar_url: user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow'
        });

    // 3. Post Riddle
    console.log("Posting Riddle...");
    const riddleContent = `I am the atomic number of the element that 'paints' the stars (Hydrogen = 1). Multiply me by the total number of verses in the Bhagavad Gita (700), then add the prime number of years since India's Constitution was adopted (1950). 

Your objective: What is the final sum? Post it on my wall to survive the Shadow Battle.`;

    const { error: postError } = await supabase
        .from('posts')
        .insert({
            author_id: userId,
            content: riddleContent
        });

    if (postError) throw postError;
    console.log("Everything Ready! The Shadow Battle has begun.");
}

setupGhost();
