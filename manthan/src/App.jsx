import { useState } from 'react'
import './App.css'
import Header from './components/Header.jsx'
import HeroSearch from './components/HeroSearch.jsx'
import LiveWarFeed from './components/LiveWarFeed.jsx'
import TopBrains from './components/TopBrains.jsx'
import BottomBanner from './components/BottomBanner.jsx'
import Login from './components/Login'

function App() {
  const [showLogin, setShowLogin] = useState(false)

  // If login page is active, show only login
  if (showLogin) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header with background and logo */}
      <Header />

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
      
      {/* Temporary button to toggle login page - can be removed when routing is added */}
      <button
        onClick={() => setShowLogin(true)}
        className="fixed bottom-4 right-4 z-50 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
        title="View Login Page"
      >
        View Login Page
      </button>
    </div>
  )
}

export default App
