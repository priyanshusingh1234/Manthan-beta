import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivkrupsksxibaibmiibk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjM4ODQsImV4cCI6MjA4NDk5OTg4NH0.7HeGWdSNN2UbYkpCbxawc_pWcjTJ3jQpNC1qCRb4C8o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const questions = [
  { title: 'In "A Question of Trust", how does the author create an irony in the characterization of Horace Danby?', options: ['By portraying a thief as an otherwise respectable and honest citizen', 'By making a poor man steal from the rich', 'By showing a locksmith who gets locked in a room', 'By making him allergic to flowers'], correctOption: 0 },
  { title: 'Why is Horace Danby considered "good and respectable" but not "completely honest"?', options: ['He pays his taxes but cheats on his profession', 'He robs a safe once a year to fund his passion for rare books', 'He is a philanthropist who steals from the poor', 'He lies about his identity to everyone'], correctOption: 1 },
  { title: 'What specific piece of information from the magazine article proved to be a double-edged sword for Horace?', options: ['The layout of the rooms and the location of the safe', 'The times the servants went out', 'The presence of the dog in the house', 'The alarm system details'], correctOption: 0 },
  { title: 'How does the lady in red exploit Horace\'s psychological state to her advantage?', options: ['She tricks him into feeling empathy for her', 'She uses his fear of prison to coerce him into opening the safe without gloves', 'She blackmails him with evidence', 'She pretends to call the police immediately'], correctOption: 1 },
  { title: 'What subtle clue did Horace miss that should have warned him about the lady in red\'s true identity?', options: ['Her lack of knowledge about the house\'s layout', 'Her calmness in the presence of a burglar and her manipulation of the dog', 'Her expensive clothing and jewelry', 'Her British accent'], correctOption: 1 },
  { title: 'Which statement best describes the thematic significance of Horace\'s hay fever in the narrative?', options: ['It highlights the physical weakness of criminals', 'It symbolizes his vulnerability and ultimately becomes the catalyst for his downfall', 'It shows that nature is against him', 'It emphasizes the poor sanitary conditions of the time'], correctOption: 1 },
  { title: 'How does the title "A Question of Trust" encapsulate the central conflict of the story?', options: ['It refers to the trust between Horace and his society', 'It questions the reliability of the police force', 'It ironically reflects how a thief was outwitted by blindly trusting another thief', 'It highlights the trust the house owners had in their servants'], correctOption: 2 },
  { title: 'What does Horace\'s meticulous planning reveal about his character?', options: ['He is an amateur who overcompensates with planning', 'He is a professional who takes pride in his "work" and minimizes risks', 'He is paranoid and anxious', 'He considers stealing a chaotic art form'], correctOption: 1 },
  { title: 'How does the lady in red justify needing the safe opened?', options: ['She claims to have forgotten the combination and needs the jewels for a party', 'She left her keys inside the safe', 'Her husband locked her out of it', 'The safe\'s mechanism is jammed and she needs a locksmith'], correctOption: 0 },
  { title: 'Why does Horace ultimately agree to open the safe for the lady?', options: ['He wants a share of the jewels', 'He is smitten by her beauty', 'He believes doing so will prevent her from calling the police and allow him to escape', 'He wants to show off his skills'], correctOption: 2 },
  { title: 'What is the ultimate irony regarding Horace\'s fate at the end of the story?', options: ['He is arrested for a robbery he actually committed', 'He is arrested on the basis of fingerprints for a robbery from which he took nothing', 'He escapes justice but lives in constant fear', 'He is praised for helping a lady'], correctOption: 1 },
  { title: 'In the context of the story, what does "honor among thieves" signify to Horace?', options: ['A sacred code that all criminals naturally follow', 'A romanticized concept that was brutally shattered by his experience', 'A legal defense he tries to use in court', 'The understanding he thought he had with the police'], correctOption: 1 },
  { title: 'What role does Sherry, the dog, play in characterizing both Horace and the lady in red?', options: ['It shows that both are animal lovers', 'It highlights their differing physical strengths', 'It demonstrates that both possess a calm, authoritative demeanor required to handle guard dogs', 'It acts as an unbiased judge of character'], correctOption: 2 },
  { title: 'What fatal error does Horace make in his eagerness to please the lady in red?', options: ['He drops his lock-picking tools', 'He forgets to wear his gloves while opening the safe', 'He gives her his real name', 'He leaves the front door open'], correctOption: 1 },
  { title: 'What does Horace\'s reliance on the magazine article suggest about the narrative\'s commentary on wealth?', options: ['That rich people flaunt their wealth and inadvertently invite danger', 'That magazines are generally unreliable', 'That wealth is a well-kept secret', 'That journalists are often accomplices to burglaries'], correctOption: 0 },
  { title: 'How does the author build suspense leading up to the entrance of the lady in red?', options: ['By describing Horace\'s gradual onset of hay fever amidst the silent house', 'By having the police sirens wail in the distance', 'By describing the angry barking of the dog', 'By showing Horace struggling with a complicated lock'], correctOption: 0 },
  { title: 'What distinguishes Horace\'s approach to crime from that of a stereotypical burglar?', options: ['He steals relentlessly and indiscriminately', 'He steals only once a year purely to finance his intellectual hobby', 'He steals to donate to charity', 'He uses violent methods to gain entry'], correctOption: 1 },
  { title: 'What makes the lady\'s disguise so effective against someone as observant as Horace?', options: ['She carried a weapon that intimidated him', 'She presented an aura of authority and entitlement matching the setting', 'She showed him a fake identification card', 'She cried and played the victim'], correctOption: 1 },
  { title: 'Why does nobody believe Horace\'s claim that the owner\'s wife asked him to open the safe?', options: ['Because the actual wife was a sharp-tongued, sixty-year-old woman', 'Because he had a long criminal record of lying', 'Because the police had video evidence against him', 'Because the lady in red testified against him'], correctOption: 0 },
  { title: 'Which of the following best describes the tone of the story\'s conclusion?', options: ['Tragic and melancholic', 'Humorous and deeply ironic', 'Triumphant and satisfying', 'Dark and cynical'], correctOption: 1 },
];

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'kpk22128@gmail.com',
    password: '123456789'
  });

  if (error || !data.session) {
    console.error("Login failed:", error);
    return;
  }

  const token = data.session.access_token;
  console.log("Logged in successfully. Token fetched.");

  for (const q of questions) {
    const payload = {
        title: q.title,
        body: "",
        subject: "English",
        classGrade: "10",
        points: 4,
        timeLimit: 2,
        difficulty: "moderate", // Set to moderate to match app format
        options: q.options,
        correctOption: q.correctOption,
        imagePath: null,
        imageUrl: null
    };

    console.log(`Adding: ${q.title}`);
    
    let success = false;
    // Try the production deployed app's API first because local might not be running
    try {
        const res = await fetch('https://dheeyudhha.vercel.app/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            console.log(`Successfully added to prod API!`);
            success = true;
        } else {
            console.log(`Prod API failed: ${res.status}`);
        }
    } catch(err) {
        console.error("Prod API fetch failed:", err.message);
    }

    // Try localhost if prod failed
    if (!success) {
      try {
          const res = await fetch('http://localhost:3000/api/questions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });
          const resBody = await res.json();
          if(res.ok) {
              console.log(`Successfully added to local API!`);
          } else {
              console.error(`Error adding to local API:`, resBody);
          }
      } catch(err) {
          console.error("Local API fetch failed:", err.message);
      }
    }
  }
}

run();
