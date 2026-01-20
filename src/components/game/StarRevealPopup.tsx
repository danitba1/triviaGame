'use client';

import { type FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type StarState, type Player } from '@/types/game.types';

interface StarRevealPopupProps {
  /** Whether the popup is visible */
  isOpen: boolean;
  /** The selected star */
  star: StarState | null;
  /** The player who selected */
  player: Player | null;
  /** Player's color */
  playerColor: string;
  /** Callback when reveal animation completes */
  onComplete: () => void;
}

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

// Get reaction based on points
const getReaction = (pointValue: number): { emoji: string; text: string } => {
  if (pointValue === 0) return { emoji: '😅', text: 'אוי! כוכב ריק!' };
  if (pointValue === 50) return { emoji: '😊', text: 'לא רע!' };
  if (pointValue === 100) return { emoji: '🎉', text: 'יופי!' };
  if (pointValue === 150) return { emoji: '🔥', text: 'מעולה!' };
  if (pointValue === 200) return { emoji: '🚀', text: 'וואו!' };
  if (pointValue === 250) return { emoji: '🏆', text: 'ג׳קפוט!' };
  return { emoji: '⭐', text: 'נהדר!' };
};

/**
 * StarRevealPopup - Animated reveal of star point value after selection
 */
export const StarRevealPopup: FC<StarRevealPopupProps> = ({
  isOpen,
  star,
  player,
  playerColor,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'spinning' | 'reveal' | 'done'>('spinning');

  useEffect(() => {
    if (isOpen && star) {
      setPhase('spinning');
      
      // Spinning phase
      const spinTimer = setTimeout(() => {
        setPhase('reveal');
      }, 1500);

      // Auto-close after reveal
      const closeTimer = setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 4000);

      return () => {
        clearTimeout(spinTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isOpen, star, onComplete]);

  if (!star || !player) return null;

  const starColor = getStarColor(star.pointValue);
  const reaction = getReaction(star.pointValue);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            {/* Background glow */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ backgroundColor: phase === 'reveal' ? starColor : '#FFD700' }}
              animate={{ 
                scale: phase === 'reveal' ? [1, 1.5, 1.2] : [1, 1.2, 1],
                opacity: phase === 'reveal' ? [0.5, 0.8, 0.6] : 0.4,
              }}
              transition={{ repeat: phase === 'spinning' ? Infinity : 0, duration: 0.5 }}
            />

            {/* Star container */}
            <motion.div
              className="relative bg-white rounded-3xl p-8 shadow-2xl min-w-[280px] text-center"
              animate={phase === 'spinning' ? { rotate: [0, 360] } : { rotate: 0 }}
              transition={phase === 'spinning' ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
            >
              {/* Player info */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: playerColor }}
                >
                  <span className="text-xl">{player.avatarEmoji}</span>
                </div>
                <span className="font-bold text-lg text-[var(--text-primary)]">{player.name}</span>
              </div>

              {/* Star with spinning or revealed value */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <motion.svg 
                  viewBox="0 0 24 24" 
                  className="w-full h-full drop-shadow-2xl"
                  animate={phase === 'spinning' ? { rotate: [0, 360] } : {}}
                  transition={phase === 'spinning' ? { repeat: Infinity, duration: 0.3 } : {}}
                >
                  <defs>
                    <linearGradient id="revealStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: phase === 'reveal' ? starColor : '#FFD700', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: phase === 'reveal' ? starColor : '#FFA500', stopOpacity: 0.8 }} />
                    </linearGradient>
                    <filter id="revealGlow">
                      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="url(#revealStarGrad)"
                    stroke="#FFF"
                    strokeWidth="0.3"
                    filter="url(#revealGlow)"
                  />
                </motion.svg>

                {/* Value or question mark */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {phase === 'spinning' ? (
                    <motion.span 
                      className="text-4xl font-bold text-white"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      animate={{ rotate: [0, -360] }}
                      transition={{ repeat: Infinity, duration: 0.3 }}
                    >
                      ?
                    </motion.span>
                  ) : (
                    <motion.span 
                      className="text-4xl font-bold text-white"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.5, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      {star.pointValue}
                    </motion.span>
                  )}
                </motion.div>
              </div>

              {/* Reaction text */}
              <AnimatePresence>
                {phase === 'reveal' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.span 
                      className="text-5xl block mb-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      {reaction.emoji}
                    </motion.span>
                    <p className="text-xl font-bold" style={{ color: starColor }}>
                      {reaction.text}
                    </p>
                    <p className="text-[var(--text-secondary)] mt-2">
                      +{star.pointValue} נקודות!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading text during spin */}
              {phase === 'spinning' && (
                <motion.p 
                  className="text-lg text-[var(--text-secondary)]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  מגלים את הכוכב...
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

