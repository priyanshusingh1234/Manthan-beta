import { Menu, User, Brain } from 'lucide-react'

export default function Header() {
  return (
    <header className="relative isolate">
      {/* Blue base background */}
      <div className="absolute inset-0 bg-blue-700" aria-hidden="true" />
      {/* Orange curved shape top-right */}
      <div
        className="absolute right-0 top-0 h-40 w-2/3 bg-orange-400"
        style={{
          clipPath: 'path("M0,0 C120,0 220,40 320,90 L320,0 Z")',
          WebkitClipPath: 'path("M0,0 C120,0 220,40 320,90 L320,0 Z")',
          opacity: 0.95,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Top nav */}
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:px-8">
          <button className="inline-flex items-center justify-center rounded-xl p-2 text-white/90 hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </button>
          <button className="inline-flex items-center justify-center rounded-full p-1">
            <img
              src="/avatar.png"
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/32')}
              alt="User avatar"
              className="h-8 w-8 rounded-full border-2 border-white/80 object-cover"
            />
          </button>
        </div>

        {/* Centered logo */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9">
              {/* Left half white stroke */}
              <Brain className="absolute inset-0 h-9 w-9 text-white" style={{ clipPath: 'inset(0 50% 0 0)' }} />
              {/* Right half orange stroke */}
              <Brain className="absolute inset-0 h-9 w-9 text-orange-300" style={{ clipPath: 'inset(0 0 0 50%)' }} />
            </div>
            <span className="text-2xl font-extrabold tracking-wide text-white">MANTHAN</span>
          </div>
        </div>
      </div>

      {/* spacer height for header */}
      <div className="h-44" />
    </header>
  )
}
