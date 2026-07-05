const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://ivkrupsksxibaibmiibk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a3J1cHNrc3hpYmFpYm1paWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMzg4NCwiZXhwIjoyMDg0OTk5ODg0fQ.XSeD6sjamOlE7m6l84aFN8iXDRfi2D9vZ7nqLeaA5PE'
);

async function run() {
  try {
    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#333">Test Image</text>
      </svg>
    `;
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    
    const fileName = `test_${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('images') // let's try 'images' or 'explanation_images'
      .upload(`chemistry/${fileName}`, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (error) {
      console.error('Upload Error:', error);
      return;
    }
    
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(`chemistry/${fileName}`);
    console.log('Success URL:', urlData.publicUrl);
  } catch (err) {
    console.error('Fatal:', err);
  }
}

run();
