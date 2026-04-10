"use client";

import { Vivaan } from "./characters/Vivaan";
import { Aarav } from "./characters/Aarav";

export const CharacterShowcase = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-around p-12 gap-12 bg-white rounded-[3rem] border border-gray-100 shadow-2xl">
      {/* Vivaan */}
      <div className="flex flex-col items-center">
        <Vivaan />
        <h3 className="text-3xl font-black mt-6 text-red-500 uppercase italic tracking-tighter">Vivaan</h3>
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Class Guide • Fun Level 100</p>
      </div>

      {/* Aarav */}
      <div className="flex flex-col items-center">
        <Aarav />
        <h3 className="text-3xl font-black mt-6 text-teal-600 uppercase italic tracking-tighter">Aarav</h3>
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Smart Buddy • Level Up</p>
      </div>
    </div>
  );
};
