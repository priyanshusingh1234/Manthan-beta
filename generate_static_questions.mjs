import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const SYLLABUS = [
  'The Road Not Taken',
  'The Sound of Music',
  'Wind',
  'The Little Girl',
  'A Truly Beautiful Mind',
  'The Legend of the Northland',
  'My Childhood',
  'No Men Are Foreign',
  'The Beggar',
];

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title:         { type: SchemaType.STRING },
          options:       { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctOption: { type: SchemaType.INTEGER },
        },
        required: ['title', 'options', 'correctOption'],
      },
    },
  },
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  let allQuestions = [];

  for (const chapterName of SYLLABUS) {
    console.log(`Generating 50 questions for: ${chapterName}...`);
    const prompt = `Generate 50 high-quality, academic multiple-choice questions for Class 9 English, specifically focusing on the chapter "${chapterName}". Each question must have exactly 4 options and indicate the correct option index (0 to 3). Make the questions varied in difficulty (easy, moderate, hard) and ensure they are accurate.`;

    let success = false;
    let retries = 0;
    while (!success && retries < 3) {
      try {
        const result = await model.generateContent(prompt);
        const questions = JSON.parse(result.response.text());
        console.log(`✅ Generated ${questions.length} questions for ${chapterName}.`);
        
        // Add chapter info
        for (let q of questions) {
            q.subject = 'English';
            q.class_grade = '9';
            q.chapter = chapterName;
            allQuestions.push(q);
        }
        success = true;
      } catch (err) {
        console.error(`❌ Error generating ${chapterName}: ${err.message}`);
        retries++;
        await delay(5000);
      }
    }
    // Wait before next chapter
    await delay(5000);
  }

  fs.writeFileSync('english_class9_questions.json', JSON.stringify(allQuestions, null, 2));
  console.log('✅ Saved all questions to english_class9_questions.json');
}

run();
