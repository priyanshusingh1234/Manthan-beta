import HeroSearch from '@/components/HeroSearch'
import LiveWarFeed from '@/components/LiveWarFeed'
import TopBrains from '@/components/TopBrains'
import BottomBanner from '@/components/BottomBanner'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero/Search */}
      <HeroSearch />

      {/* Main content grid */}
      <main className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <LiveWarFeed />
        </div>
        <div className="lg:col-span-1">
          <TopBrains />
        </div>
      </main>

      {/* Sticky bottom banner */}
      <BottomBanner />
    </div>
  )
}
