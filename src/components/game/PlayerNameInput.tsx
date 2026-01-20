'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { HUMAN_PLAYER_AVATARS } from '@/types/game.types';

interface PlayerNameInputProps {
  /** Player index (1-based for display) */
  playerIndex: number;
  /** Current name value */
  name: string;
  /** Callback when name changes */
  onNameChange: (name: string) => void;
}

/**
 * PlayerNameInput - A fun input field for entering player names
 */
export const PlayerNameInput: FC<PlayerNameInputProps> = ({
  playerIndex,
  name,
  onNameChange,
}) => {
  // Cycle through avatars based on player index
  const avatarEmoji = HUMAN_PLAYER_AVATARS[(playerIndex - 1) % HUMAN_PLAYER_AVATARS.length];
  
  // Different colors for each player
  const playerColors = ['#FF6B6B', '#4ECDC4', '#A855F7', '#FB923C', '#F472B6', '#3B82F6'];
  const accentColor = playerColors[(playerIndex - 1) % playerColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: playerIndex * 0.1 }}
      className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md"
      style={{ borderRight: `4px solid ${accentColor}` }}
    >
      {/* Avatar */}
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, delay: playerIndex * 0.1 + 0.2 }}
        className="text-4xl"
      >
        {avatarEmoji}
      </motion.span>

      {/* Input */}
      <div className="flex-1">
        <label 
          htmlFor={`player-${playerIndex}`}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
        >
          שחקן {playerIndex}
        </label>
        <input
          id={`player-${playerIndex}`}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={`הכנס שם לשחקן ${playerIndex}`}
          className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-200 focus:border-[var(--color-primary)] focus:outline-none transition-colors bg-gray-50"
          style={{ 
            direction: 'rtl',
          }}
        />
      </div>
    </motion.div>
  );
};

