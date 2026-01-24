import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Manthan - Join the Knowledge Battle',
  description: 'Compete, learn, and conquer challenges with students from across schools!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
