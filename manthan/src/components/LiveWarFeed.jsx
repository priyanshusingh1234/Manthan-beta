import { Flame, TrendingUp, Trophy, Zap } from 'lucide-react'

const feed = [
  {
    id: 1,
    type: 'solve',
    user: 'Rahul',
    school: 'DPS Noida',
    text: 'solved a Trigonometry doubt.',
    badge: '+20 Pts',
    heat: 'high',
  },
  {
    id: 2,
    type: 'urgent',
    user: 'Priya',
    school: 'KV Sec-12',
    text: 'needs help with Physics.',
    urgent: true,
    heat: 'critical',
  },
  {
    id: 3,
    type: 'solve',
    user: 'Ananya',
    school: 'DPS Noida',
    text: 'solved a Chemistry doubt.',
    badge: '+15 Pts',
    heat: 'medium',
  },
]

export default function LiveWarFeed() {
  return (
    <section className="animate-fadeIn">
      {/* Battle Statistics Banner */}
      <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 shadow-lg animate-gradient" style={{ backgroundSize: '200% 200%' }}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 animate-float" />
            <span className="text-sm font-semibold">Live War Stats</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="text-center rounded-xl bg-white/20 backdrop-blur-sm p-3">
            <div className="text-xs font-medium text-white/90">DPS Noida</div>
            <div className="text-2xl font-bold text-white">2,340</div>
            <div className="text-xs text-white/80">Points</div>
          </div>
          <div className="text-center rounded-xl bg-white/20 backdrop-blur-sm p-3">
            <div className="text-xs font-medium text-white/90">KV Sec-12</div>
            <div className="text-2xl font-bold text-white">2,180</div>
            <div className="text-xs text-white/80">Points</div>
          </div>
        </div>
        {/* Battle Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '52%' }}></div>
        </div>
        <div className="mt-1 flex justify-between text-xs text-white/90">
          <span>DPS Leading</span>
          <span>Gap: 160 pts</span>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500 animate-pulse-soft" />
          Live War Feed
        </h2>
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Show All</a>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {feed.map((item) => (
          <article 
            key={item.id} 
            className="snap-start min-w-[280px] rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-popIn"
          >
            {/* Battle Heat Indicator */}
            {item.heat && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {item.heat === 'critical' && <Flame className="h-4 w-4 text-red-600 animate-pulse-soft" />}
                {item.heat === 'high' && <Flame className="h-4 w-4 text-orange-500" />}
                {item.heat === 'medium' && <TrendingUp className="h-4 w-4 text-yellow-500" />}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <img
                src={`/avatars/${item.user.toLowerCase()}.png`}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/50')}
                alt={`${item.user} avatar`}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
              />
              <div className="leading-tight">
                <div className="font-semibold text-gray-900">{item.user}</div>
                <div className="text-xs text-gray-500">{item.school}</div>
              </div>
              {item.urgent && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 animate-pulse-soft">
                  <Flame className="h-3.5 w-3.5" /> Urgent
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-800">
              <span className="font-medium">{item.user}</span> {item.text}
            </p>
            {item.badge && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600 animate-popIn">
                <Trophy className="h-3.5 w-3.5" />
                {item.badge}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
