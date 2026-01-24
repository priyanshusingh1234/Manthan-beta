'use client';

import { Trophy, Flame } from 'lucide-react'

const topBrains = [
  { rank: 1, name: 'Ananya', school: 'DPS', points: 1200, streak: 5, schoolColor: 'bg-blue-500' },
  { rank: 2, name: 'Rahul', school: 'KV', points: 1100, streak: 3, schoolColor: 'bg-green-500' },
  { rank: 3, name: 'Priya', school: 'DPS', points: 980, streak: 0, schoolColor: 'bg-blue-500' },
  { rank: 4, name: 'Aman', school: 'St. Joseph', points: 870, streak: 2, schoolColor: 'bg-purple-500' },
  { rank: 5, name: 'Neha', school: 'GDS', points: 820, streak: 0, schoolColor: 'bg-orange-500' },
]

const getMedalEmoji = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

const getMedalColor = (rank) => {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
  return 'bg-blue-50 text-blue-600'
}

export default function TopBrains() {
  const topScore = topBrains[0].points

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5 animate-slideUp">
      <h3 className="mb-3 text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500 animate-float" />
        Top Brains This Week
      </h3>
      <ul className="divide-y divide-gray-100">
        {topBrains.map((u) => {
          const medal = getMedalEmoji(u.rank)
          const percentage = (u.points / topScore) * 100
          const gap = topScore - u.points

          return (
            <li 
              key={u.rank} 
              className="flex flex-col gap-2 py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-all duration-300 hover:shadow-md overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-md ${getMedalColor(u.rank)}`}>
                  {medal || u.rank}
                </span>
                <img
                  src={`/avatars/${u.name.toLowerCase()}.png`}
                  onError={(e) => (e.currentTarget.src = 'https://placehold.co/32')}
                  alt={`${u.name} avatar`}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-gray-900">{u.name}</div>
                    {u.streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs">
                        <Flame className="h-3 w-3 text-orange-500 animate-pulse-soft" />
                        <span className="font-semibold text-orange-600">{u.streak}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${u.schoolColor}`}></span>
                    <span className="truncate text-xs text-gray-500">{u.school}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{u.points.toLocaleString()}</div>
                  {u.rank > 1 && (
                    <div className="text-xs text-gray-400">-{gap}</div>
                  )}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="ml-11 h-1.5 max-w-full overflow-hidden rounded-full bg-gray-100">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="ml-11 text-xs text-gray-500">
                {percentage.toFixed(0)}% of top score
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
