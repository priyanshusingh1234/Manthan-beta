"use client";

import { motion } from "framer-motion";

export default function CharacterDemoPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4 lowercase">
            New <span className="text-indigo-600">Learning</span> Buddies
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            These two cool characters are ready to help students from class 1-5 master their lessons with fun and energy.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-12">
          {/* Character 1 */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-8 bg-orange-50/50 rounded-3xl border border-orange-100"
          >
            <div className="w-64 h-64">
               <img src="/gemini-svg.svg#boy1" className="w-full h-full" alt="Boy 1" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-orange-600">Vivaan</h2>
            <span className="text-sm font-semibold text-orange-400 uppercase tracking-widest">The Leader</span>
          </motion.div>

          {/* Character 2 */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-8 bg-teal-50/50 rounded-3xl border border-teal-100"
          >
            <div className="w-64 h-64">
               <img src="/gemini-svg.svg#boy2" className="w-full h-full" alt="Boy 2" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-teal-700">Aarav</h2>
            <span className="text-sm font-semibold text-teal-400 uppercase tracking-widest">The Scholar</span>
          </motion.div>
        </div>

        <div className="bg-indigo-600 text-white p-8 rounded-3xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">SVG Ready for Animation</h3>
            <p className="text-indigo-100 text-sm">Clean nodes, layered components, and ready to wave!</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-neutral-100 transition-colors"
          >
            Animate Now
          </motion.button>
        </div>
      </motion.div>

      <div className="mt-8 text-center text-gray-400 text-xs tracking-widest uppercase">
        Designed for Students • Clean Vector Art
      </div>
    </div>
  );
}
