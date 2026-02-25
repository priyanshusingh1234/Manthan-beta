'use client';

import { Search } from 'lucide-react';
import React from 'react';

const HeroSearch: React.FC = () => {
    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = formData.get('search');
        // TODO: Implement search logic
        console.log('Search query:', query);
    };

    return (
        <div className="p-8 my-8 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/50 dark:border-slate-800">
            <div className="flex flex-col items-center text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
                    Search for Knowledge
                </h1>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-lg">
                    Find questions, topics, and discussions to sharpen your mind.
                </p>
            </div>
            <form className="relative max-w-xl mx-auto" onSubmit={handleSearch}>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md border border-transparent hover:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <input
                        id="search"
                        name="search"
                        type="text"
                        placeholder="What do you want to learn today?"
                        className="w-full bg-transparent border-0 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 pl-6"
                    />
                    <button type="submit" className="relative inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-white font-bold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    )
}

export default HeroSearch;