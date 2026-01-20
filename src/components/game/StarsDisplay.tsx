'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { GameStar } from './GameStar';
import { type StarState } from '@/types/game.types';

interface StarsDisplayProps {
  /** Array of star states */
  stars: StarState[];
  /** Map of player IDs to their colors */
  playerColors?: Record<string, string>;
}

/**
 * StarsDisplay - Shows all 10 stars at the top of the game screen
 */
export const StarsDisplay: FC<StarsDisplayProps> = ({
  stars,
  playerColors = {},
}) => {
  // Calculate total available points
  const totalAvailablePoints = stars
    .filter(s => !s.isEarned)
    .reduce((sum, s) => sum + s.pointValue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          ⭐ כוכבים לזכייה ⭐
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          נותרו {totalAvailablePoints} נקודות לחלוקה
        </p>
      </div>

      {/* Stars container */}
      <div className="bg-gradient-to-b from-indigo-900/10 to-purple-900/10 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {stars.map((star, index) => (
            <GameStar
              key={star.id}
              pointValue={star.pointValue}
              isEarned={star.isEarned}
              playerColor={star.earnedByPlayerId ? playerColors[star.earnedByPlayerId] : undefined}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FCD34D]" />
          <span className="text-[var(--text-secondary)]">50 נק׳</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FB923C]" />
          <span className="text-[var(--text-secondary)]">100 נק׳</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#A855F7]" />
          <span className="text-[var(--text-secondary)]">200 נק׳</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
          <span className="text-[var(--text-secondary)]">250 נק׳</span>
        </div>
      </div>
    </motion.div>
  );
};

