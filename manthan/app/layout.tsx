import type { Metadata } from 'next'
import './globals.css'

import Header from '@/components/Header'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const BottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false })

export const metadata: Metadata = {
  title: 'Manthan - Join the Knowledge Battle',
  description: 'Compete, learn, and conquer challenges with students from across schools!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Detect Android/mobile device
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsAndroid(/android|mobile|iphone|ipad|ipod/.test(ua));
    }
  }, []);

  return (
    <html lang="en">
      <body>
        <Header isAndroid={isAndroid} />
        {children}
        {isAndroid && <BottomNav />}
      </body>
    </html>
  )
}
