'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { type Player, type StarState } from '@/types/game.types';

/** Board configuration */
export const TOTAL_STEPS = 25;
export const GATE_INTERVAL = 5;
export const GATE_POSITIONS = [0, 5, 10, 15, 20]; // Gates at these positions

interface CircularBoardProps {
  /** All players in the game */
  players: Player[];
  /** Player colors map */
  playerColors: Record<string, string>;
  /** Player positions on the board (0-24) */
  playerPositions: Record<string, number>;
  /** Stars to display in the center */
  stars: StarState[];
  /** Callback when a star is clicked (for selection) */
  onStarClick?: (star: StarState) => void;
  /** Whether star selection is active */
  starSelectionActive?: boolean;
  /** Highlighted steps (for movement preview) */
  highlightedSteps?: number[];
  /** Star ID being peeked at (from twist) */
  peekedStarId?: number | null;
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

/**
 * CircularBoard - A circular game board with 25 steps, 5 gates, and stars in the center
 */
export const CircularBoard: FC<CircularBoardProps> = ({
  players,
  playerColors,
  playerPositions,
  stars,
  onStarClick,
  starSelectionActive = false,
  highlightedSteps = [],
  peekedStarId = null,
}) => {
  const boardSize = 420; // Larger board size
  const centerX = boardSize / 2;
  const centerY = boardSize / 2;
  const radius = 175; // Distance of steps from center
  const stepSize = 32; // Size of each step circle

  // Calculate position for each step
  const getStepPosition = (stepIndex: number) => {
    const angle = (stepIndex / TOTAL_STEPS) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Check if a step is a gate
  const isGate = (stepIndex: number) => GATE_POSITIONS.includes(stepIndex);

  // Get players at a specific position
  const getPlayersAtPosition = (stepIndex: number): Player[] => {
    return players.filter(p => playerPositions[p.id] === stepIndex);
  };

  // Step colors
  const getStepColor = (stepIndex: number, isHighlighted: boolean) => {
    if (isGate(stepIndex)) return '#FFD700'; // Gold for gates
    if (isHighlighted) return '#4ECDC4'; // Teal for highlighted
    return '#E5E7EB'; // Gray for normal
  };

  // Available stars (not earned)
  const availableStars = stars.filter(s => !s.isEarned);
  const earnedStars = stars.filter(s => s.isEarned);

  // Calculate star positions in a circular pattern in the center
  const getStarPosition = (index: number, total: number) => {
    if (total === 1) {
      return { x: centerX, y: centerY };
    }
    
    // Inner circle for stars
    const starRadius = total <= 5 ? 45 : 65;
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + starRadius * Math.cos(angle),
      y: centerY + starRadius * Math.sin(angle),
    };
  };

  return (
    <div className="relative" style={{ width: boardSize, height: boardSize }}>
      {/* Background circle decoration */}
      <div 
        className="absolute rounded-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"
        style={{
          width: radius * 2 - 40,
          height: radius * 2 - 40,
          left: centerX - (radius - 20),
          top: centerY - (radius - 20),
        }}
      />

      {/* Connection lines between steps */}
      <svg 
        className="absolute inset-0" 
        width={boardSize} 
        height={boardSize}
        style={{ pointerEvents: 'none' }}
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const pos1 = getStepPosition(i);
          const pos2 = getStepPosition((i + 1) % TOTAL_STEPS);
          return (
            <line
              key={`line-${i}`}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke="#D1D5DB"
              strokeWidth={4}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Stars in the center */}
      <div className="absolute" style={{ left: 0, top: 0, width: boardSize, height: boardSize, pointerEvents: 'none' }}>
        {/* Available stars - values are HIDDEN */}
        {availableStars.map((star, index) => {
          const pos = getStarPosition(index, availableStars.length);
          // All stars appear golden/mysterious when values are hidden
          const mysteryColor = '#FFD700';
          
          return (
            <motion.button
              key={star.id}
              className="absolute"
              style={{
                left: pos.x - 22,
                top: pos.y - 22,
                width: 44,
                height: 44,
                pointerEvents: starSelectionActive ? 'auto' : 'none',
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                boxShadow: starSelectionActive ? `0 0 20px ${mysteryColor}` : 'none',
              }}
              whileHover={starSelectionActive ? { scale: 1.3, rotate: 15 } : {}}
              whileTap={starSelectionActive ? { scale: 0.9 } : {}}
              transition={{ delay: index * 0.05, type: 'spring' }}
              onClick={() => starSelectionActive && onStarClick?.(star)}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id={`starGrad-${star.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: mysteryColor, stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 0.8 }} />
                  </linearGradient>
                  <filter id={`starGlow-${star.id}`}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={`url(#starGrad-${star.id})`}
                  stroke="#FFF"
                  strokeWidth="0.5"
                  filter={starSelectionActive ? `url(#starGlow-${star.id})` : undefined}
                />
              </svg>
              {/* Question mark instead of value (or show value if peeked) */}
              <span 
                className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
              >
                {peekedStarId === star.id ? star.pointValue : '?'}
              </span>
            </motion.button>
          );
        })}

        {/* Center game icon when no stars left */}
        {availableStars.length === 0 && (
          <motion.div 
            className="absolute rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
            style={{
              width: 70,
              height: 70,
              left: centerX - 35,
              top: centerY - 35,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-3xl">🏆</span>
          </motion.div>
        )}
      </div>

      {/* Steps */}
      {Array.from({ length: TOTAL_STEPS }).map((_, stepIndex) => {
        const pos = getStepPosition(stepIndex);
        const isGateStep = isGate(stepIndex);
        const isHighlighted = highlightedSteps.includes(stepIndex);
        const playersHere = getPlayersAtPosition(stepIndex);
        const stepColor = getStepColor(stepIndex, isHighlighted);

        return (
          <motion.div
            key={`step-${stepIndex}`}
            className="absolute flex items-center justify-center"
            style={{
              width: isGateStep ? stepSize + 10 : stepSize,
              height: isGateStep ? stepSize + 10 : stepSize,
              left: pos.x - (isGateStep ? stepSize + 10 : stepSize) / 2,
              top: pos.y - (isGateStep ? stepSize + 10 : stepSize) / 2,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: stepIndex * 0.02 }}
          >
            {/* Step circle */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center shadow-md ${
                isHighlighted ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: stepColor,
                border: isGateStep ? '3px solid #B8860B' : '2px solid white',
              }}
            >
              {/* Gate icon */}
              {isGateStep && playersHere.length === 0 && (
                <span className="text-base">🚪</span>
              )}

              {/* Step number for non-gate steps without players */}
              {!isGateStep && playersHere.length === 0 && (
                <span className="text-xs font-bold text-gray-500">
                  {stepIndex + 1}
                </span>
              )}

              {/* Player avatars */}
              {playersHere.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-0.5">
                  {playersHere.slice(0, 4).map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                      style={{ 
                        backgroundColor: playerColors[player.id],
                        marginLeft: idx > 0 ? -6 : 0,
                        border: '2px solid white',
                      }}
                    >
                      {player.avatarEmoji}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Gate labels */}
      {GATE_POSITIONS.map((gatePos, idx) => {
        const pos = getStepPosition(gatePos);
        const labelRadius = radius + 30;
        const angle = (gatePos / TOTAL_STEPS) * 2 * Math.PI - Math.PI / 2;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        return (
          <motion.div
            key={`gate-label-${idx}`}
            className="absolute text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full shadow-sm"
            style={{
              left: labelX - 24,
              top: labelY - 12,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
          >
            שער {idx + 1}
          </motion.div>
        );
      })}

    </div>
  );
};
