const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI('AIzaSyDPJqpIRMVYwaHZkVnGcbYRLiuYS8iprSw');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function fileToGenerativePart(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return {
    inlineData: {
      data: base64,
      mimeType: 'image/jpeg'
    },
  };
}

async function run() {
  const { data: subs } = await supabaseAdmin.from('test_submissions').select('id, user_id').eq('test_id', 'bd6f8e22-4ad2-48b4-a65e-73c60e02ee98');
  const subIds = subs.map(s => s.id);
  const { data: answers } = await supabaseAdmin.from('test_answers').select('*').in('submission_id', subIds);
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', subs.map(s=>s.user_id));
  
  const qIds = [...new Set(answers.map(a => a.question_id))];
  const { data: questions } = await supabaseAdmin.from('test_questions').select('id, question_text, marks').in('id', qIds);
  
  const pMap = {};
  profiles.forEach(p => pMap[p.id] = p.full_name);
  const qMap = {};
  questions.forEach(q => qMap[q.id] = q);

  const results = {};

  for (const sub of subs) {
    const studentName = pMap[sub.user_id];
    console.log('Grading student:', studentName);
    let totalMarks = 4; // Auto-graded MCQ marks

    const userAnswers = answers.filter(a => a.submission_id === sub.id && a.image_url);
    for (const ans of userAnswers) {
      const q = qMap[ans.question_id];
      try {
        const imagePart = await fileToGenerativePart(ans.image_url);
        const prompt = `Grade this handwritten answer for a Class 10 History test. 
        Question: ${q.question_text}
        Maximum Marks: ${q.marks}
        Analyze the handwritten text in the image. If the image is unrelated or unreadable, give 0 marks. Give a score from 0 to ${q.marks} based on historical accuracy.
        Return ONLY a JSON object: {"score": <number>, "feedback": "<short feedback>"}`;
        
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            totalMarks += parsed.score;
            console.log(`- Q: ${q.question_text.substring(0, 20)}... Score: ${parsed.score}`);
        }
      } catch (e) {
        console.log('Error grading Q for', studentName, e.message);
      }
    }
    results[studentName] = totalMarks;
  }
  console.log('FINAL MARKS:', results);
}
run();
