"use client";

import { motion } from "framer-motion";

export const Aarav = ({ className = "", isWaving = false }: { className?: string; isWaving?: boolean }) => {
  return (
    <div className={`relative ${className}`}>
      <svg width="240" height="300" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(60, 40) scale(1.5)">
          <motion.g animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
            <g id="b2-legs">
              <rect x="15" y="160" width="16" height="40" rx="4" fill="#2C3E50" />
              <path d="M 10 200 L 35 200 C 35 190, 10 190, 10 200 Z" fill="#ECF0F1" />
              <rect x="45" y="160" width="16" height="40" rx="4" fill="#34495E" />
              <path d="M 40 200 L 65 200 C 65 190, 40 190, 40 200 Z" fill="#FFF" />
            </g>
            <rect x="10" y="100" width="60" height="65" rx="25" fill="#48C9B0" />
            <rect x="25" y="95" width="30" height="15" rx="7" fill="#38B09D" />
            <motion.g 
              animate={isWaving ? { rotate: [0, -20, 20, -20, 20, 0] } : { rotate: [0, -5, 0] }} 
              transition={isWaving ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              style={{ originX: "5px", originY: "115px" }}
            >
              <rect x="-10" y="105" width="22" height="60" rx="11" fill="#38B09D" />
            </motion.g>
            <motion.g animate={{ rotate: [0, 5, 0] }} style={{ originX: "75px", originY: "115px" }}>
              <rect x="68" y="105" width="22" height="60" rx="11" fill="#48C9B0" />
            </motion.g>
          </motion.g>
          <motion.g animate={{ rotate: [1, -1, 1] }} transition={{ repeat: Infinity, duration: 3.5 }} style={{ originX: "40px", originY: "95px" }}>
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
    </div>
  );
};
