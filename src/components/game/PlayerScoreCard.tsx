'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { type Player, type StarState } from '@/types/game.types';

interface PlayerScoreCardProps {
  /** Player data */
  player: Player;
  /** Whether this player is the current turn holder */
  isCurrentTurn: boolean;
  /** Whether this player has answered the current question */
  hasAnswered: boolean;
  /** Player's color */
  color: string;
  /** Index for animation */
  index: number;
  /** Stars this player has collected */
  playerStars?: StarState[];
}

// Get star color based on point value
const getStarColor = (pointValue: number): string => {
  if (pointValue === 0) return '#9CA3AF';      // Gray
  if (pointValue === 50) return '#FCD34D';     // Yellow
  if (pointValue === 100) return '#FB923C';    // Orange
  if (pointValue === 150) return '#F472B6';    // Pink
  if (pointValue === 200) return '#A855F7';    // Purple
  if (pointValue === 250) return '#3B82F6';    // Blue
  return '#FFD700';
};

/**
 * PlayerScoreCard - Displays a player's name, score with their distinct color
 */
export const PlayerScoreCard: FC<PlayerScoreCardProps> = ({
  player,
  isCurrentTurn,
  hasAnswered,
  color,
  index,
  playerStars = [],
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex flex-col gap-2 px-4 py-3 rounded-xl transition-all overflow-hidden ${
        isCurrentTurn ? 'shadow-lg scale-105' : 'shadow-md'
      }`}
      style={{
        backgroundColor: `${color}20`,
        border: `3px solid ${color}`,
      }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-3 w-full">
        {/* Avatar with color ring */}
        <div 
          className="relative w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <span className="text-xl">{player.avatarEmoji}</span>
          
          {/* Current turn indicator */}
          {isCurrentTurn && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -top-1 -end-1 w-5 h-5 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-xs shadow-md"
            >
              👆
            </motion.div>
          )}
        </div>

        {/* Name & Score */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--text-primary)] truncate">
            {player.name}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="text-lg font-bold" style={{ color }}>
                {player.score}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">נק׳</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">|</span>
            <div className="flex items-center gap-0.5">
              <span className="text-xs">⭐</span>
              <span className="font-semibold text-[var(--text-primary)]">{player.starsCollected}</span>
            </div>
          </div>
        </div>

        {/* Answered indicator */}
        {hasAnswered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <span className="text-sm">✓</span>
          </motion.div>
        )}
      </div>

      {/* Player's collected stars */}
      {playerStars.length > 0 && (
        <div className="relative flex flex-wrap gap-1 mt-1">
          {playerStars.map((star) => (
            <motion.div
              key={star.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative flex items-center justify-center"
              title={`${star.pointValue} נקודות`}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={getStarColor(star.pointValue)}
                  stroke="#FFF"
                  strokeWidth="0.5"
                />
              </svg>
              <span 
                className="absolute inset-0 flex items-center justify-center font-bold text-white text-[8px]"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {star.pointValue}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
