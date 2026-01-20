'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';

interface PlayerCoinProps {
  /** Player's color */
  color: string;
  /** Player's avatar emoji */
  avatarEmoji: string;
  /** Size of the coin */
  size?: 'small' | 'medium' | 'large';
  /** Animation delay */
  delay?: number;
}

/**
 * PlayerCoin - A colored coin/chip that represents a player's answer
 */
export const PlayerCoin: FC<PlayerCoinProps> = ({
  color,
  avatarEmoji,
  size = 'medium',
  delay = 0,
}) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-lg',
    large: 'w-12 h-12 text-xl',
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 15,
        delay,
      }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
      style={{ backgroundColor: color }}
    >
      <span className="drop-shadow-sm">{avatarEmoji}</span>
    </motion.div>
  );
};

