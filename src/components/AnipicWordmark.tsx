"use client";

import { motion } from "framer-motion";
import { useBattery } from "@/hooks/use-battery";

export function AnipicWordmark() {
  const { isLow } = useBattery();
  
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: "spring", duration: 2.5, bounce: 0 },
        opacity: { delay: 0.2, duration: 0.01 }
      }
    }
  };

  return (
    <div className="relative group select-none py-10">
      <h1 className="text-wordmark uppercase font-display relative z-10">
        ANIPIC
      </h1>
      
      {/* Animated SVG overlay for the drawing effect */}
      {!isLow && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 600 200"
          preserveAspectRatio="xMidYMid meet"
        >
          <motion.text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="font-display text-[150px] uppercase"
            variants={draw}
            initial="hidden"
            animate="visible"
          >
            ANIPIC
          </motion.text>
        </svg>
      )}
    </div>
  );
}
