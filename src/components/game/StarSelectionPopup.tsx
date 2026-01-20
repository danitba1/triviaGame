'use client';

import { type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type StarState, type Player } from '@/types/game.types';

interface StarSelectionPopupProps {
  /** Whether the popup is visible */
  isOpen: boolean;
  /** Available stars to choose from */
  availableStars: StarState[];
  /** The player who is selecting */
  player: Player;
  /** Player's color */
  playerColor: string;
  /** Callback when a star is selected */
  onSelectStar: (star: StarState) => void;
}

/**
 * StarSelectionPopup - Modal for selecting a star when passing through a gate
 */
export const StarSelectionPopup: FC<StarSelectionPopupProps> = ({
  isOpen,
  availableStars,
  player,
  playerColor,
  onSelectStar,
}) => {
  // Get star color based on point value
  const getStarColor = (pointValue: number): string => {
    if (pointValue === 0) return '#9CA3AF';      // Gray
    if (pointValue === 50) return '#FCD34D';     // Yellow
    if (pointValue === 100) return '#FB923C';    // Orange
    if (pointValue === 150) return '#F472B6';    // Pink
    if (pointValue === 200) return '#A855F7';    // Purple
    if (pointValue === 250) return '#3B82F6';    // Blue
    return '#FFE66D';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div 
              className="p-6 text-center text-white"
              style={{ backgroundColor: playerColor }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-5xl block mb-2"
              >
                🚪⭐
              </motion.span>
              <h2 className="text-2xl font-bold">עברת שער!</h2>
              <p className="text-lg opacity-90 mt-1">
                {player.name}, בחר/י כוכב!
              </p>
            </div>

            {/* Stars grid */}
            <div className="p-6">
              <p className="text-center text-[var(--text-secondary)] mb-4">
                לחץ על כוכב כדי לזכות בנקודות שלו
              </p>

              <div className="grid grid-cols-5 gap-3">
                {availableStars.map((star, index) => (
                  <motion.button
                    key={star.id}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring' }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onSelectStar(star)}
                    className="relative aspect-square"
                  >
                    {/* Star SVG */}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-full h-full drop-shadow-lg"
                    >
                      <defs>
                        <linearGradient id={`starSelect-${star.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: getStarColor(star.pointValue), stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: getStarColor(star.pointValue), stopOpacity: 0.7 }} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill={`url(#starSelect-${star.id})`}
                        stroke="#FFF"
                        strokeWidth="0.5"
                      />
                    </svg>

                    {/* Point value */}
                    <span 
                      className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {star.pointValue}
                    </span>
                  </motion.button>
                ))}
              </div>

              {availableStars.length === 0 && (
                <p className="text-center text-[var(--text-secondary)] py-8">
                  אין כוכבים זמינים
                </p>
              )}
            </div>

            {/* Points legend */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-[var(--text-secondary)]">
                <p className="font-medium mb-1">🎯 ערך הכוכבים:</p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <span>⭐ 0</span>
                  <span>⭐ 50</span>
                  <span>⭐ 100</span>
                  <span>⭐ 150</span>
                  <span>⭐ 200</span>
                  <span>⭐ 250</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

