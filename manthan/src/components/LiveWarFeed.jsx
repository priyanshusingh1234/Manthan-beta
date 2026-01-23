import { Flame } from 'lucide-react'

const feed = [
  {
    id: 1,
    type: 'solve',
    user: 'Rahul',
    school: 'DPS Noida',
    text: 'solved a Trigonometry doubt.',
    badge: '+20 Pts',
  },
  {
    id: 2,
    type: 'urgent',
    user: 'Priya',
    school: 'KV Sec-12',
    text: 'needs help with Physics.',
    urgent: true,
  },
]

export default function LiveWarFeed() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live War Feed</h2>
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Show All</a>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {feed.map((item) => (
          <article key={item.id} className="snap-start min-w-[280px] rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <img
                src={`/avatars/${item.user.toLowerCase()}.png`}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/50')}
                alt={`${item.user} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="leading-tight">
                <div className="font-semibold text-gray-900">{item.user}</div>
                <div className="text-xs text-gray-500">{item.school}</div>
              </div>
              {item.urgent && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  <Flame className="h-3.5 w-3.5" /> Urgent
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-800">
              <span className="font-medium">{item.user}</span> {item.text}
            </p>
            {item.badge && (
              <div className="mt-3 text-sm font-semibold text-green-600">{item.badge}</div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
