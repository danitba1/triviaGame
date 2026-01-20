'use client';

import { type FC, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

/** Wheel segment options */
export type WheelOption = 1 | 2 | 3 | 4 | 5 | 'twist';

interface WheelSegment {
  value: WheelOption;
  label: string;
  color: string;
  emoji: string;
}

/** The 7 wheel segments */
const WHEEL_SEGMENTS: WheelSegment[] = [
  { value: 1, label: '1', color: '#22C55E', emoji: '⭐' },      // Green - Easy
  { value: 'twist', label: 'טוויסט', color: '#8B5CF6', emoji: '🌀' }, // Purple - Twist
  { value: 2, label: '2', color: '#4ECDC4', emoji: '⭐⭐' },    // Teal
  { value: 3, label: '3', color: '#FFE66D', emoji: '⭐⭐⭐' },  // Yellow
  { value: 'twist', label: 'טוויסט', color: '#F472B6', emoji: '🌀' }, // Pink - Twist
  { value: 4, label: '4', color: '#FB923C', emoji: '⭐⭐⭐⭐' }, // Orange
  { value: 5, label: '5', color: '#FF6B6B', emoji: '⭐⭐⭐⭐⭐' }, // Red - Hard
];

interface SpinningWheelProps {
  /** Callback when wheel stops spinning */
  onSpinComplete: (result: WheelOption) => void;
  /** Callback when wheel starts spinning */
  onSpinStart?: () => void;
  /** Whether the wheel is disabled */
  disabled?: boolean;
  /** Current player's name */
  playerName: string;
  /** Current player's color */
  playerColor: string;
  /** Size of the wheel: 'small' (160px), 'medium' (240px), 'large' (320px) */
  size?: 'small' | 'medium' | 'large';
  /** Compact mode hides extra text */
  compact?: boolean;
  /** Auto-spin after delay (for digital players) */
  autoSpinDelay?: number;
}

const WHEEL_SIZES = {
  small: { wheel: 160, labelRadius: 50, fontSize: 'text-xs', pointerSize: 10 },
  medium: { wheel: 240, labelRadius: 75, fontSize: 'text-sm', pointerSize: 12 },
  large: { wheel: 320, labelRadius: 100, fontSize: 'text-base', pointerSize: 15 },
};

/**
 * SpinningWheel - A colorful spinning wheel to select question difficulty
 */
export const SpinningWheel: FC<SpinningWheelProps> = ({
  onSpinComplete,
  onSpinStart,
  disabled = false,
  playerName,
  playerColor,
  size = 'large',
  compact = false,
  autoSpinDelay,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const [hasAutoSpun, setHasAutoSpun] = useState(false);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length; // ~51.43 degrees per segment

  const spinWheel = useCallback(() => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    setSelectedSegment(null);
    
    // Trigger spin start callback (for sound effects)
    onSpinStart?.();

    // Random number of full rotations (3-5) plus random segment
    const fullRotations = 3 + Math.floor(Math.random() * 3);
    const randomSegmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    
    // Calculate the target segment center position
    const segmentCenter = randomSegmentIndex * segmentAngle + (segmentAngle / 2);
    
    // The pointer is at the top. After total rotation R, pointer points to:
    // (360 - (R mod 360)) mod 360 degrees on the wheel
    // We want this to equal segmentCenter, so:
    // (R mod 360) should equal (360 - segmentCenter)
    const targetVisualRotation = (360 - segmentCenter + 360) % 360;
    const currentVisualRotation = rotation % 360;
    
    // Calculate how much extra to rotate from current position to target
    let extraRotation = targetVisualRotation - currentVisualRotation;
    if (extraRotation < 0) extraRotation += 360; // Always rotate forward
    
    const finalRotation = rotation + (fullRotations * 360) + extraRotation;
    
    setRotation(finalRotation);

    // After animation completes, report result
    setTimeout(() => {
      const result = WHEEL_SEGMENTS[randomSegmentIndex];
      setSelectedSegment(result);
      setIsSpinning(false);
      onSpinComplete(result.value);
    }, 4000); // Match animation duration

  }, [isSpinning, disabled, rotation, segmentAngle, onSpinComplete, onSpinStart]);

  // Auto-spin effect for digital players
  useEffect(() => {
    if (autoSpinDelay && !isSpinning && !selectedSegment && !hasAutoSpun) {
      const timer = setTimeout(() => {
        setHasAutoSpun(true);
        spinWheel();
      }, autoSpinDelay);
      return () => clearTimeout(timer);
    }
  }, [autoSpinDelay, isSpinning, selectedSegment, hasAutoSpun, spinWheel]);

  // Reset hasAutoSpun when playerName changes (new turn)
  useEffect(() => {
    setHasAutoSpun(false);
    setSelectedSegment(null);
  }, [playerName]);

  const sizeConfig = WHEEL_SIZES[size];
  const wheelPx = sizeConfig.wheel;

  return (
    <div className="flex flex-col items-center">
      {/* Player turn indicator - hide in compact mode */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <p className="text-lg text-[var(--text-secondary)]">התור של:</p>
          <p className="text-2xl font-bold" style={{ color: playerColor }}>
            {playerName}
          </p>
        </motion.div>
      )}

      {/* Wheel container */}
      <div className="relative" style={{ width: wheelPx, height: wheelPx }}>
        {/* Pointer/Arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div 
            className="w-0 h-0 border-l-transparent border-r-transparent"
            style={{ 
              borderTopColor: playerColor,
              borderLeftWidth: sizeConfig.pointerSize,
              borderRightWidth: sizeConfig.pointerSize,
              borderTopWidth: sizeConfig.pointerSize * 1.5,
            }}
          />
        </div>

        {/* Spinning wheel */}
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden shadow-xl"
          style={{
            background: 'conic-gradient(from 0deg, ' + 
              WHEEL_SEGMENTS.map((seg, i) => 
                `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ') + ')',
          }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 4,
            ease: [0.2, 0.8, 0.3, 1], // Custom easing for realistic spin
          }}
        >
          {/* Segment labels */}
          {WHEEL_SEGMENTS.map((segment, index) => {
            const angle = index * segmentAngle + segmentAngle / 2;
            const radians = (angle - 90) * (Math.PI / 180);
            const radius = sizeConfig.labelRadius; // Distance from center based on size
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;

            return (
              <div
                key={index}
                className="absolute text-center"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`,
                }}
              >
                <span className={`text-white font-bold ${sizeConfig.fontSize} drop-shadow-lg`}>
                  {segment.value === 'twist' ? '🌀' : segment.label}
                </span>
              </div>
            );
          })}

          {/* Center circle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg flex items-center justify-center"
            style={{ 
              width: size === 'small' ? 32 : size === 'medium' ? 48 : 64,
              height: size === 'small' ? 32 : size === 'medium' ? 48 : 64,
            }}
          >
            <span className={size === 'small' ? 'text-base' : size === 'medium' ? 'text-xl' : 'text-2xl'}>🎯</span>
          </div>
        </motion.div>

        {/* Outer ring decoration */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none" 
          style={{ border: `${size === 'small' ? 3 : size === 'medium' ? 5 : 8}px solid rgba(255,255,255,0.3)` }}
        />
      </div>

      {/* Spin button - smaller in compact mode */}
      {!selectedSegment && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={!isSpinning && !autoSpinDelay ? { scale: 1.05 } : {}}
          whileTap={!isSpinning && !autoSpinDelay ? { scale: 0.95 } : {}}
          onClick={autoSpinDelay ? undefined : spinWheel}
          disabled={isSpinning || disabled || !!autoSpinDelay}
          className={`mt-3 rounded-xl font-bold text-white shadow-lg transition-all ${
            compact ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-xl'
          } ${
            isSpinning || autoSpinDelay
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:shadow-xl'
          }`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                🎡
              </motion.span>
              {compact ? '...' : 'מסתובב...'}
            </span>
          ) : autoSpinDelay && !hasAutoSpun ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                🤖
              </motion.span>
              {compact ? 'רובוט...' : 'הרובוט מסובב...'}
            </span>
          ) : (
            <span>🎡 {compact ? 'סובב!' : 'סובב את הגלגל!'}</span>
          )}
        </motion.button>
      )}

      {/* Result display */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={compact ? 'mt-2 text-center' : 'mt-6 text-center'}
        >
          <div 
            className={`inline-block rounded-xl text-white font-bold shadow-lg ${
              compact ? 'px-3 py-1.5 text-sm' : 'px-6 py-3 text-xl'
            }`}
            style={{ backgroundColor: selectedSegment.color }}
          >
            {selectedSegment.value === 'twist' ? (
              <span>{compact ? '🌀' : '🌀 טוויסט! 🌀'}</span>
            ) : (
              <span>
                {compact ? `${selectedSegment.label} ⭐` : `רמת קושי: ${selectedSegment.label} ${selectedSegment.emoji}`}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

