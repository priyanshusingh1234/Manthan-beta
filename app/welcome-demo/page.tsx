"use client";

import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useState, useEffect } from "react";

export default function WelcomeDemoPage() {
  const [show, setShow] = useState(true);

  return (
    <div className="min-h-screen">
      {show ? (
        <WelcomeScreen name="Aadi" />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">Demo Replay</h1>
          <button 
            onClick={() => setShow(true)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 text-lg uppercase tracking-wider italic"
          >
            Show Welcome Again
          </button>
        </div>
      )}
      
      {/* Temporary button to simulate "feed loading done" */}
      {show && (
        <button 
          onClick={() => setShow(false)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-gray-900 px-6 py-2 rounded-full font-bold shadow-xl border border-gray-200 hover:bg-gray-50 transition-all opacity-40 hover:opacity-100"
        >
          Skip Welcome
        </button>
      )}
    </div>
  );
}
