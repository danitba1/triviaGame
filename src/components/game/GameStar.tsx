'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';

interface GameStarProps {
  /** Point value displayed in the star */
  pointValue: number;
  /** Whether the star has been earned */
  isEarned: boolean;
  /** Color of the player who earned it (if earned) */
  playerColor?: string;
  /** Index for staggered animation */
  index: number;
}

/**
 * GameStar - A decorative star showing point value
 */
export const GameStar: FC<GameStarProps> = ({
  pointValue,
  isEarned,
  playerColor,
  index,
}) => {
  // Star colors based on point value
  const getStarColor = (): string => {
    if (isEarned && playerColor) return playerColor;
    if (pointValue === 0) return '#9CA3AF';      // Gray
    if (pointValue === 50) return '#FCD34D';     // Yellow
    if (pointValue === 100) return '#FB923C';    // Orange
    if (pointValue === 150) return '#F472B6';    // Pink
    if (pointValue === 200) return '#A855F7';    // Purple
    if (pointValue === 250) return '#3B82F6';    // Blue
    return '#FFE66D';
  };

  const starColor = getStarColor();

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 15,
        delay: index * 0.08 
      }}
      className="relative"
    >
      {/* Star SVG */}
      <motion.svg
        width="70"
        height="70"
        viewBox="0 0 24 24"
        className={`drop-shadow-lg ${isEarned ? 'opacity-40' : ''}`}
        animate={!isEarned ? { 
          y: [0, -3, 0],
          rotate: [0, 2, 0, -2, 0]
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 3,
          delay: index * 0.2
        }}
      >
        <defs>
          <linearGradient id={`starGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: starColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 0.7 }} />
          </linearGradient>
          <filter id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={`url(#starGrad-${index})`}
          stroke={isEarned ? playerColor : '#FFF'}
          strokeWidth="0.5"
          filter={!isEarned ? `url(#glow-${index})` : undefined}
        />
      </motion.svg>

      {/* Point value */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.3 }}
        className={`absolute inset-0 flex items-center justify-center ${
          isEarned ? 'opacity-40' : ''
        }`}
      >
        <span 
          className={`font-bold text-sm ${
            pointValue === 0 ? 'text-gray-600' : 'text-white'
          }`}
          style={{ 
            textShadow: pointValue > 0 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            marginTop: '-2px'
          }}
        >
          {pointValue}
        </span>
      </motion.div>

      {/* Earned indicator */}
      {isEarned && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -end-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <span className="text-xs">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
};

