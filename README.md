# 🎓 Dheeyudha (Manthan Beta)

Dheeyudha is a modern, gamified learning platform built to make academic problem-solving engaging and competitive. It supports peer-to-peer knowledge battles, co-op challenges, and an integrated **Live AI Tutor** to grade handwritten solutions instantly.

The platform is divided into two primary clients sharing a single powerful backend:
1. **Next.js Web Application** (Root directory)
2. **React Native Mobile App** (dheeyudhha-rn directory)

---

## 🚀 Key Features

- **Live AI Grading & Coaching (Azure OpenAI & Gemini):** Students can snap a photo of handwritten math/science solutions. The integrated AI evaluates the work against the teacher's model answer, grading it based on board-level step-marking, offering full points, partial points, or standard penalties.
- **Co-op Challenges & Duels:** Play against or with friends in academic challenges. Earn points together or battle for leaderboard supremacy.
- **Gauntlet & Arena:** Gamified modes for continuous learning and rapid-fire problem-solving.
- **Leaderboards & Streaks:** Gamification elements designed to keep students motivated and retain daily active usage.
- **Supabase Backend:** Powered by PostgreSQL, Supabase Auth, and Storage for seamless realtime experiences.

---

## 💻 Web Application (Next.js)

The web client is built using **Next.js (App Router)** and **Tailwind CSS**. It serves as the primary dashboard for students and teachers.

### Web Environment Setup

Create a `.env.local` file in the project root with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
GOOGLE_GENAI_API_KEY=your_gemini_api_key
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Public base URL (Used for metadata, canonical links, and Open Graph images)
NEXT_PUBLIC_APP_URL=https://manthan-beta-c975.vercel.app
```

### Running the Web App Locally

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`
3. Open `http://localhost:3000` in your browser.

---

## 📱 Mobile Application (React Native / Expo)

The mobile client is located inside the `dheeyudhha-rn` folder. It provides a native experience for iOS and Android, allowing students to seamlessly snap and upload handwritten answers directly from their devices.

### Mobile Environment Setup

Create a `.env` file inside the `dheeyudhha-rn` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=https://manthan-beta-c975.vercel.app
```

*(Note: The Expo app often relies on the Next.js web API routes for complex server logic like AI grading and AI Coaching.)*

### Running the Mobile App Locally

1. Navigate to the React Native directory:
   `cd dheeyudhha-rn`
2. Install dependencies:
   `npm install`
3. Start the Expo server:
   `npx expo start`
4. Use the **Expo Go** app on your physical device, or run it on an iOS Simulator / Android Emulator.

---

## 🧠 Architecture Highlights

- **AI Verification Engine (`lib/aiVerification.ts`):** We leverage multimodal AI models. The AI is fed the student's image, the teacher's model answer image, and the question text. It executes strict cheat detection (e.g., rejecting screenshots) and intelligently awards correct, partially_correct, or wrong.
- **Backend API Routes (`app/api/*`):** The Next.js API acts as the secure intermediary for AI operations, auth-gated file uploads, and Supabase RPC triggers.
- **Cross-Platform Syncing:** Auth and state are mirrored between Web and App using Supabase's real-time subscriptions and standard JWT flows.

---

## 🤖 Acknowledgements & Credits

A massive thank you to the AI that helped bring this project to life! Much of the architecture, React Native scaffolding, and backend API routing for this platform was built through pair programming with **Google Antigravity**, an advanced agentic coding assistant powered by Gemini. 

The AI acted as a tireless co-pilot, helping to debug deep React navigation issues, construct the Supabase database schema, and implement the real-time AI Tutor and Grader engines that power Dheeyudhha today.🚀
