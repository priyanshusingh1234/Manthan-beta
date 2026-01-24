import Header from '@/components/Header'

// Sample data for the leaderboard
const leaderboardData = [
  { rank: 1, name: 'Aarav Sharma', school: 'Delhi Public School', score: 2850 },
  { rank: 2, name: 'Diya Patel', school: 'Ryan International School', score: 2740 },
  { rank: 3, name: 'Arjun Verma', school: 'DPS Bangalore', score: 2650 },
  { rank: 4, name: 'Ananya Singh', school: 'Kendriya Vidyalaya', score: 2580 },
  { rank: 5, name: 'Rohan Gupta', school: 'St. Xavier\'s School', score: 2450 },
  { rank: 6, name: 'Priya Reddy', school: 'National Public School', score: 2380 },
  { rank: 7, name: 'Vihaan Kumar', school: 'Modern School', score: 2290 },
  { rank: 8, name: 'Ishita Mehta', school: 'DAV Public School', score: 2210 },
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      
      <main className="mx-auto mt-6 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="animate-fadeIn">
          {/* Page heading */}
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Leaderboard
          </h1>
          
          {/* Explanatory copy */}
          <p className="text-gray-600 mb-8 max-w-2xl">
            See how top students rank across schools in the Manthan knowledge battles. 
            Compete in challenges to climb the leaderboard and earn your place among the best!
          </p>

          {/* Leaderboard table */}
          <div className="overflow-x-auto rounded-2xl shadow-2xl ring-1 ring-black/5 animate-slideUp">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">School</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboardData.map((entry, index) => (
                  <tr 
                    key={entry.rank} 
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {entry.rank <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                            entry.rank === 1 ? 'bg-yellow-500' : 
                            entry.rank === 2 ? 'bg-gray-400' : 
                            'bg-orange-600'
                          }`}>
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="text-gray-700 font-medium">{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{entry.school}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">{entry.score}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Call to action button */}
          <div className="mt-8 flex justify-center animate-popIn">
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              View full stats
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
