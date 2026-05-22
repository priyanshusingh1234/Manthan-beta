import supabaseAdmin from './lib/supabaseAdmin';

async function run() {
    const { data: posts } = await supabaseAdmin.from('posts').select('author_id, content').order('created_at', { ascending: false }).limit(20);
    
    if (!posts) {
        console.log("no posts");
        return;
    }
    
    const authorIds = [...new Set(posts.map(p => p.author_id))];
    console.log("Author IDs:", authorIds);
    
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*').in('id', authorIds);
    console.log("Profiles:");
    profiles?.forEach(p => console.log(p.id, p.full_name, p.username));
    
    const missing = authorIds.filter(id => !profiles?.some(p => p.id === id) || !profiles.find(p => p.id === id)?.full_name);
    console.log("Missing/Empty Name Authors:", missing);
    
    for (const id of missing) {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(id);
        console.log("Auth user for", id, ":", user?.user?.user_metadata, user?.user?.email);
    }
}

run();
