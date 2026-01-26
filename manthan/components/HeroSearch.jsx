'use client';

import { Search } from 'lucide-react'

export default function HeroSearch() {
  return (
    <section className="relative -mt-24 px-4 sm:px-6 lg:px-8 animate-slideUp">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
        <label htmlFor="doubt" className="sr-only">Type your doubt here</label>
        <div className="group relative flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-lg">
          {/* Gradient border on focus */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100"></div>
          
          <Search className="h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500 animate-pulse-soft" />
          <input
            id="doubt"
            type="text"
            placeholder="Find subject you are interested..."
            className="w-full rounded-full border-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 transition-all duration-300 active:scale-95">
            Ask Now
          </button>
        </div>
      </div>
    </section>
  )
}
