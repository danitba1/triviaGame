'use client';

import { type FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RevealCountdownProps {
  /** Seconds to count down */
  seconds: number;
  /** Callback when countdown finishes */
  onComplete: () => void;
  /** Callback on each tick (for sound effects) */
  onTick?: () => void;
}

/**
 * RevealCountdown - Animated countdown before revealing the answer
 */
export const RevealCountdown: FC<RevealCountdownProps> = ({
  seconds,
  onComplete,
  onTick,
}) => {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    // Play tick sound
    onTick?.();

    const timer = setTimeout(() => {
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete, onTick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <motion.div
        className="bg-white rounded-3xl p-8 shadow-2xl text-center"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        <motion.p
          className="text-xl text-[var(--text-secondary)] mb-4"
        >
          כולם ענו! מגלים את התשובה בעוד...
        </motion.p>
        
        <motion.div
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative"
        >
          {/* Animated ring */}
          <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={283}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 283 }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            />
          </svg>
          
          {/* Number */}
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-[var(--color-primary)]">
            {count}
          </span>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="mt-4 text-4xl"
        >
          🥁
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

