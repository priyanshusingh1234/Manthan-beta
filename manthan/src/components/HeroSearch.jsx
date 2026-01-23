import { Search } from 'lucide-react'

export default function HeroSearch() {
  return (
    <section className="relative -mt-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5">
        <label htmlFor="doubt" className="sr-only">Type your doubt here</label>
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            id="doubt"
            type="text"
            placeholder="Type your doubt here (Maths, Science, SST)..."
            className="w-full rounded-full border-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700">
            Ask Now
          </button>
        </div>
      </div>
    </section>
  )
}
