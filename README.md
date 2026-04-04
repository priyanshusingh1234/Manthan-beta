# Manthan Beta

A Next.js application for academic knowledge battles and quizzes.

## Environment Variables

Create a `.env.local` file in the project root (or set the variables in your deployment platform) with the following:

```env
# Public base URL used for metadata, canonical links, and social sharing.
# Defaults to https://manthan-beta-c975.vercel.app if not set.
NEXT_PUBLIC_APP_URL=https://your-deployment-url.vercel.app
```

> **Note:** `NEXT_PUBLIC_APP_URL` is used by `lib/appUrl.ts` to build canonical URLs, Open Graph images, and share links. Always set it to the canonical origin of your deployment so that social previews resolve to the correct domain.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.
