"use client";

import { motion } from "framer-motion";

export function HeroWordmark() {
  return (
    <div className="relative select-none py-12 md:py-24 flex items-center justify-center overflow-visible">
      {/* Background "FREE" Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span className="text-[clamp(150px,40vw,800px)] font-black text-white leading-none tracking-tighter uppercase select-none">
          FREE
        </span>
      </motion.div>

      {/* Foreground "IMAGE HOSTING" Text */}
      <h1 className="relative z-10 flex flex-col items-center justify-center font-display uppercase leading-[0.8] tracking-tighter">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row items-center gap-0 md:gap-8 scale-y-[1.6] origin-center"
        >
          <span className="text-white text-[clamp(60px,12vw,240px)] font-black drop-shadow-[0_0_50px_rgba(255,255,255,0.15)]">
            IMAGE
          </span>
          <span className="group">
            <span 
              className="text-transparent text-[clamp(60px,12vw,240px)] font-black hosting-outline cursor-pointer"
            >
              HOSTING
            </span>
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="h-1 sm:h-2 w-full mt-6 sm:mt-10 bg-gradient-to-r from-transparent via-[#ff0040] to-transparent rounded-full opacity-50"
        />
      </h1>
    </div>
  );
}
