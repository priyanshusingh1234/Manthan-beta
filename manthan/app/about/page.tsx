import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      
      <main className="mx-auto mt-6 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto animate-fadeIn">
          {/* Page heading */}
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
            About Manthan
          </h1>
          
          {/* Description section */}
          <div className="space-y-6 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white p-8 animate-slideUp">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Manthan is an innovative educational platform that transforms learning into an exciting 
                competitive experience. We bring students from different schools together in knowledge 
                battles, creating a vibrant community of learners who challenge each other to grow and excel.
              </p>
            </div>

            <div>
              <p className="text-gray-600 leading-relaxed">
                Our mission is to make education engaging and fun while fostering healthy competition 
                and collaboration. Through Manthan, students don&apos;t just learn—they compete, conquer 
                challenges, and celebrate victories together.
              </p>
            </div>

            {/* Features list */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Key Features
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Inter-School Competitions</h3>
                    <p className="text-gray-600 text-sm">
                      Compete with students from various schools in real-time knowledge battles
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Leaderboards</h3>
                    <p className="text-gray-600 text-sm">
                      Track your progress and see how you rank against peers in real-time
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Diverse Subjects</h3>
                    <p className="text-gray-600 text-sm">
                      Challenge yourself across multiple subjects and discover your strengths
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Achievement System</h3>
                    <p className="text-gray-600 text-sm">
                      Earn badges, trophies, and recognition for your accomplishments
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Community Learning</h3>
                    <p className="text-gray-600 text-sm">
                      Connect with like-minded students and grow together in a supportive environment
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Call to action */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-700 text-lg">
                Join thousands of students already competing on Manthan!
              </p>
              <div className="mt-4 flex justify-center">
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Get Started Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
