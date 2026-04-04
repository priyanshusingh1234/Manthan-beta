import type { Metadata, Viewport } from 'next'
import './globals.css'

import ClientLayout from '@/components/ClientLayout'
import { APP_URL } from '@/lib/appUrl'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  title: 'Dheeyudha | Join the Knowledge Battle',
  description: 'Compete, learn, and conquer challenges with students from across schools. Test your knowledge, climb the ranks, and prove you are the best!',
  keywords: 'education, quizzing, competition, students, learning, dheeyudha, game, edtech, knowledge battle',
  authors: [{ name: 'Dheeyudha Team' }],
  creator: 'Dheeyudha',
  publisher: 'Dheeyudha',
  openGraph: {
    title: 'Dheeyudha | Join the Knowledge Battle',
    description: 'Compete, learn, and conquer challenges with students from across schools.',
    url: APP_URL,
    siteName: 'Dheeyudha',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: `${APP_URL}/og-social.png`,
        width: 1200,
        height: 630,
        alt: 'Dheeyudha - Brain Battle',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dheeyudha | Join the Knowledge Battle',
    description: 'Compete, learn, and conquer challenges with students from across schools.',
    images: [`${APP_URL}/og-social.png`],
    creator: '@dheeyudha',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
