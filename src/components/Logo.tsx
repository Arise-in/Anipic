"use client";

import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-2xl" },
    lg: { icon: "h-12 w-12", text: "text-4xl" },
    xl: { icon: "h-20 w-20", text: "text-6xl" },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none group ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        className={`${currentSize.icon} relative flex items-center justify-center`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)] to-[#be123c] rounded-lg sm:rounded-xl rotate-3 opacity-20 group-hover:rotate-6 transition-transform" />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/10" />
        
        <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] z-10 drop-shadow-[0_0_8px_rgba(255,0,64,0.4)]">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-color)" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          <rect 
            x="12" y="12" 
            width="76" height="76" 
            rx="8" ry="8"
            fill="none" 
            stroke="url(#frameGradient)" 
            strokeWidth="3"
          />
          
          <rect 
            x="22" y="22" 
            width="56" height="56" 
            rx="4" ry="4"
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          
          <line x1="50" y1="12" x2="50" y2="22" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
          <line x1="50" y1="78" x2="50" y2="88" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
          <line x1="12" y1="50" x2="22" y2="50" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
          <line x1="78" y1="50" x2="88" y2="50" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
          
          <g>
            <circle cx="35" cy="38" r="6" fill="var(--accent-color)" opacity="0.9" />
            <circle cx="35" cy="38" r="2.5" fill="white" opacity="0.8" />
          </g>
          
          <path 
            d="M26 68 L40 50 L52 60 L74 32" 
            fill="none" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.9"
          />
          
          <path 
            d="M26 68 L40 50 L52 60 L74 32 L74 68 Z" 
            fill="var(--accent-color)" 
            opacity="0.25"
          />
        </svg>
      </motion.div>

      {showText && (
        <div className={`${currentSize.text} font-display uppercase tracking-wider flex items-center`}>
          <span className="text-[var(--accent-color)] font-black">ANI</span>
          <span className="text-white font-light">PIC</span>
        </div>
      )}
    </div>
  );
}
