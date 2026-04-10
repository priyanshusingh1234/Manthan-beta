"use client";

import { motion } from "framer-motion";

export const Vivaan = ({ className = "", isWaving = false }: { className?: string; isWaving?: boolean }) => {
  return (
    <div className={`relative ${className}`}>
      <svg width="240" height="300" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(60, 40) scale(1.5)">
          <motion.g animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <g id="b1-legs">
              <rect x="15" y="160" width="18" height="40" rx="4" fill="#3A86FF" />
              <rect x="10" y="195" width="28" height="15" rx="7" fill="#FFD166" />
              <rect x="45" y="160" width="18" height="40" rx="4" fill="#4A90E2" />
              <rect x="45" y="195" width="28" height="15" rx="7" fill="#FFBE0B" />
            </g>
            <rect x="15" y="95" width="50" height="70" rx="20" fill="#FF7B7B" />
            <path d="M 15 130 L 65 130 L 65 165 C 65 175, 15 175, 15 165 Z" fill="#4A90E2" />
            <motion.g 
              animate={isWaving ? { rotate: [0, 20, -20, 20, -20, 0] } : { rotate: [0, 10, 0] }} 
              transition={isWaving ? { repeat: Infinity, duration: 1.5 } : { repeat: Infinity, duration: 2 }}
              style={{ originX: "10px", originY: "110px" }}
            >
              <rect x="-5" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
              <circle cx="3" cy="150" r="10" fill="#FFDFC4" />
            </motion.g>
            <motion.g animate={{ rotate: [0, -10, 0] }} style={{ originX: "70px", originY: "110px" }}>
              <rect x="65" y="100" width="16" height="50" rx="8" fill="#FF7B7B" />
              <circle cx="73" cy="150" r="10" fill="#FFDFC4" />
            </motion.g>
          </motion.g>
          <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 3 }} style={{ originX: "40px", originY: "95px" }}>
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
    </div>
  );
};
