import HeroSearch from '@/components/HeroSearch'
import LiveWarFeed from '@/components/LiveWarFeed'
import TopBrains from '@/components/TopBrains'
import BottomBanner from '@/components/BottomBanner'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero/Search */}
      <HeroSearch />
        <div className="mx-auto max-w-3xl px-4 mt-6">
          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-md text-center">
            <h3 className="text-lg font-semibold">Welcome to Manthan</h3>
            <p className="mt-2 text-sm text-slate-600">Sign in or sign up to participate in challenges and see leaderboards.</p>
            <div className="mt-4">
              <a href="/login" className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow">Sign in / Sign up</a>
            </div>
          </div>
        </div>

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
