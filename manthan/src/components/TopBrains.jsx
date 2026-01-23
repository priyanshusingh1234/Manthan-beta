const topBrains = [
  { rank: 1, name: 'Ananya', school: 'DPS', points: 1200 },
  { rank: 2, name: 'Rahul', school: 'KV', points: 1100 },
  { rank: 3, name: 'Priya', school: 'DPS', points: 980 },
  { rank: 4, name: 'Aman', school: 'St. Joseph', points: 870 },
  { rank: 5, name: 'Neha', school: 'GDS', points: 820 },
]

export default function TopBrains() {
  return (
    <aside className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Top Brains This Week</h3>
      <ul className="divide-y divide-gray-100">
        {topBrains.map((u) => (
          <li key={u.rank} className="flex items-center gap-3 py-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">{u.rank}</span>
            <img
              src={`/avatars/${u.name.toLowerCase()}.png`}
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/32')}
              alt={`${u.name} avatar`}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">{u.name}</div>
              <div className="truncate text-xs text-gray-500">{u.school}</div>
            </div>
            <div className="text-sm font-semibold text-gray-900">{u.points.toLocaleString()} Pts</div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
