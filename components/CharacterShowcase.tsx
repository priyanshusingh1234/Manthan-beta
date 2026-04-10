"use client";

import { motion } from "framer-motion";

export const CharacterShowcase = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-around p-12 gap-12 bg-white rounded-[3rem] border border-gray-100 shadow-2xl">
      {/* Boy 1: Vivaan (Red Shirt + Orange Hair) */}
      <div className="flex flex-col items-center">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           className="relative"
        >
          <svg width="240" height="300" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(60, 40) scale(1.5)">
              <motion.g animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                {/* Legs */}
                <g id="b1-legs">
                  <rect x="15" y="160" width="18" height="40" rx="4" fill="#3A86FF" />
                  <rect x="10" y="195" width="28" height="15" rx="7" fill="#FFD166" />
                  <rect x="45" y="160" width="18" height="40" rx="4" fill="#4A90E2" />
                  <rect x="45" y="195" width="28" height="15" rx="7" fill="#FFBE0B" />
                </g>
                
                {/* Torso */}
                <rect x="15" y="95" width="50" height="70" rx="20" fill="#FF7B7B" />
                <path d="M 15 130 L 65 130 L 65 165 C 65 175, 15 175, 15 165 Z" fill="#4A90E2" />
                
                {/* Arms */}
                <motion.g animate={{ rotate: [0, 10, 0] }} style={{ originX: "10px", originY: "110px" }}>
                  <rect x="-5" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
                  <circle cx="3" cy="150" r="10" fill="#FFDFC4" />
                </motion.g>
                <motion.g animate={{ rotate: [0, -10, 0] }} style={{ originX: "70px", originY: "110px" }}>
                  <rect x="65" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
                  <circle cx="73" cy="150" r="10" fill="#FFDFC4" />
                </motion.g>
              </motion.g>

              {/* Head */}
              <motion.g 
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ originX: "40px", originY: "95px" }}
              >
                <rect x="33" y="85" width="14" height="15" fill="#FFDFC4" />
                <rect x="0" y="10" width="80" height="75" rx="35" fill="#FFDFC4" />
                <path d="M 0 45 C -10 -10, 90 -10, 80 45 Z" fill="#FFB347" />
                <motion.g animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}>
                  <circle cx="22" cy="50" r="7" fill="#333" />
                  <circle cx="58" cy="50" r="7" fill="#333" />
                </motion.g>
                <path d="M 32 62 Q 40 75 48 62 Z" fill="#FF7B7B" stroke="#333" stroke-width="2" />
                <path d="M -5 35 Q 20 0 45 25 Q 60 5 85 30 Q 60 -15 20 -10 Z" fill="#FF9F1C" />
              </motion.g>
            </g>
          </svg>
        </motion.div>
        <h3 className="text-3xl font-black mt-6 text-red-500 uppercase italic tracking-tighter">Vivaan</h3>
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Class Guide • Fun Level 100</p>
      </div>

      {/* Boy 2: Aarav (Green Shirt + Orange Hat) */}
      <div className="flex flex-col items-center">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="relative"
        >
          <svg width="240" height="300" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(60, 40) scale(1.5)">
              <motion.g animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                {/* Legs */}
                <g id="b2-legs">
                  <rect x="15" y="160" width="16" height="40" rx="4" fill="#2C3E50" />
                  <path d="M 10 200 L 35 200 C 35 190, 10 190, 10 200 Z" fill="#ECF0F1" />
                  <rect x="45" y="160" width="16" height="40" rx="4" fill="#34495E" />
                  <path d="M 40 200 L 65 200 C 65 190, 40 190, 40 200 Z" fill="#FFF" />
                </g>
                
                {/* Torso */}
                <rect x="10" y="100" width="60" height="65" rx="25" fill="#48C9B0" />
                <rect x="25" y="95" width="30" height="15" rx="7" fill="#38B09D" />
                
                {/* Arms */}
                <motion.g animate={{ rotate: [0, -5, 0] }} style={{ originX: "5px", originY: "115px" }}>
                  <rect x="-10" y="105" width="22" height="60" rx="11" fill="#38B09D" />
                </motion.g>
                <motion.g animate={{ rotate: [0, 5, 0] }} style={{ originX: "75px", originY: "115px" }}>
                  <rect x="68" y="105" width="22" height="60" rx="11" fill="#48C9B0" />
                </motion.g>
              </motion.g>

              {/* Head */}
              <motion.g 
                animate={{ rotate: [1, -1, 1] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
                style={{ originX: "40px", originY: "95px" }}
              >
                <rect x="33" y="85" width="14" height="15" fill="#E8B89C" />
                <rect x="0" y="15" width="80" height="75" rx="35" fill="#E8B89C" />
                <motion.g animate={{ scaleY: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                   <path d="M 18 52 Q 24 48 30 52" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />
                   <path d="M 50 52 Q 56 48 62 52" stroke="#333" stroke-width="3" stroke-linecap="round" fill="none" />
                </motion.g>
                <path d="M -5 30 C 5 60, 20 60, 25 30 Z" fill="#2C3E50" />
                <path d="M 85 30 C 75 60, 60 60, 55 30 Z" fill="#2C3E50" />
                <path d="M -5 35 Q 40 -30 85 35 Z" fill="#F39C12" />
                <rect x="-8" y="30" width="96" height="12" rx="6" fill="#E67E22" />
              </motion.g>
            </g>
          </svg>
        </motion.div>
        <h3 className="text-3xl font-black mt-6 text-teal-600 uppercase italic tracking-tighter">Aarav</h3>
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Smart Buddy • Level Up</p>
      </div>
    </div>
  );
};
