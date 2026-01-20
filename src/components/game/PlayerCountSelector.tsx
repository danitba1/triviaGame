'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';

interface PlayerCountSelectorProps {
  /** Label for the selector */
  label: string;
  /** Icon/emoji to display */
  icon: string;
  /** Current selected count */
  count: number;
  /** Minimum allowed value */
  minCount: number;
  /** Maximum allowed value */
  maxCount: number;
  /** Callback when count changes */
  onCountChange: (newCount: number) => void;
  /** Color theme for the selector */
  accentColor: string;
}

/**
 * PlayerCountSelector - A child-friendly number selector with +/- buttons
 */
export const PlayerCountSelector: FC<PlayerCountSelectorProps> = ({
  label,
  icon,
  count,
  minCount,
  maxCount,
  onCountChange,
  accentColor,
}) => {
  const handleDecrement = () => {
    if (count > minCount) {
      onCountChange(count - 1);
    }
  };

  const handleIncrement = () => {
    if (count < maxCount) {
      onCountChange(count + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
      <div className="flex items-center justify-between gap-4">
        {/* Label section */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            {label}
          </span>
        </div>

        {/* Counter controls */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDecrement}
            disabled={count <= minCount}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: count > minCount ? accentColor : '#E5E7EB',
              color: 'white'
            }}
            aria-label="הפחת"
          >
            −
          </motion.button>

          <motion.span
            key={count}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 text-center text-3xl font-bold"
            style={{ color: accentColor }}
          >
            {count}
          </motion.span>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleIncrement}
            disabled={count >= maxCount}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: count < maxCount ? accentColor : '#E5E7EB',
              color: 'white'
            }}
            aria-label="הוסף"
          >
            +
          </motion.button>
        </div>
      </div>
    </div>
  );
};

