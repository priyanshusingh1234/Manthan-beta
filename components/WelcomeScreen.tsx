"use client";

import { motion } from "framer-motion";
import { Vivaan } from "./characters/Vivaan";
import { Aarav } from "./characters/Aarav";
import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  name: string;
}

export const WelcomeScreen = ({ name }: WelcomeScreenProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6 overflow-hidden">
      {/* Decorative Circles */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-60" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-60" 
      />

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Character Duo */}
        <div className="flex items-end justify-center gap-4 mb-12">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
          >
            <Vivaan isWaving={true} className="w-32 md:w-48" />
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }}
          >
            <Aarav isWaving={true} className="w-32 md:w-48" />
          </motion.div>
        </div>

        {/* Welcome Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Hey <span className="text-blue-600 drop-shadow-sm">{name}</span>!
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700">
            Welcome to <span className="text-indigo-600">Dheeyudha</span>!
          </h2>
        </motion.div>

        {/* Loading/Feed Prep Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-16 flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-3 text-gray-500 font-medium text-lg">
            <span>Wait while we make your feed like this</span>
            <span className="w-8 text-left">{dots}</span>
          </div>

          <div className="w-64 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="h-full w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"
            />
          </div>
        </motion.div>
      </div>

      {/* Background Floating Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 text-4xl opacity-20"
      >
        🎓
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 text-4xl opacity-20"
      >
        ✏️
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 text-5xl opacity-20"
      >
        ✨
      </motion.div>
    </div>
  );
};
