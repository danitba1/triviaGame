'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type TwistCard as TwistCardType, type Player } from '@/types/game.types';

interface TwistCardProps {
  /** The twist card to display */
  twist: TwistCardType;
  /** Player who drew the twist */
  player: Player;
  /** Player's assigned color */
  playerColor: string;
  /** Whether the card is revealed */
  isRevealed: boolean;
  /** Callback when card is flipped/revealed */
  onReveal?: () => void;
  /** Callback when action is confirmed */
  onConfirm?: () => void;
  /** Whether to show the confirm button */
  showConfirm?: boolean;
}

/**
 * TwistCard - Displays a twist card with flip animation
 */
export function TwistCard({
  twist,
  player,
  playerColor,
  isRevealed,
  onReveal,
  onConfirm,
  showConfirm = true,
}: TwistCardProps) {
  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.8 }}
      animate={{ 
        rotateY: isRevealed ? 0 : 180, 
        scale: 1,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        duration: 0.6,
      }}
      className="relative w-80 h-[480px] cursor-pointer perspective-1000"
      onClick={!isRevealed ? onReveal : undefined}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Back */}
      <motion.div
        className="absolute inset-0 rounded-3xl shadow-2xl flex flex-col items-center justify-center backface-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <motion.span
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl mb-4"
        >
          🌀
        </motion.span>
        <p className="text-white text-2xl font-bold">טוויסט!</p>
        <p className="text-white/70 text-sm mt-2">לחץ לחשיפה</p>
        
        {/* Decorative stars */}
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl text-white/40"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 2,
            }}
          >
            ✨
          </motion.span>
        ))}
      </motion.div>

      {/* Card Front */}
      <motion.div
        className="absolute inset-0 rounded-3xl shadow-2xl flex flex-col backface-hidden overflow-hidden"
        style={{
          backfaceVisibility: 'hidden',
          background: twist.isPositive 
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
            : 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)',
        }}
      >
        {/* Header with player info */}
        <div 
          className="p-4 text-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: playerColor }}
            >
              <span className="text-xl">{player.avatarEmoji}</span>
            </div>
            <span className="text-white font-bold text-lg">{player.name}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-6xl mb-3"
          >
            {twist.emoji}
          </motion.span>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white text-xl font-bold mb-2"
          >
            {twist.title}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/90 text-sm leading-relaxed px-2"
          >
            {twist.description}
          </motion.p>

          {/* Effect indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-2 mt-3 flex-wrap justify-center"
          >
            {twist.requiresChoice && (
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                👆 צריך לבחור
              </span>
            )}
            {twist.requiresQuestion && (
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                ❓ שאלה מיוחדת
              </span>
            )}
            {twist.effectValue && !twist.requiresQuestion && (
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                {twist.effectType === 'instant_points' ? `💰 ${twist.effectValue} נקודות` : 
                 twist.effectType === 'bonus_question' ? `🚶 ${twist.effectValue} צעדים` :
                 twist.effectType === 'category_master' ? `📚 ${twist.effectValue} שאלות` :
                 `⚡ ${twist.effectValue}`}
              </span>
            )}
          </motion.div>
        </div>

        {/* Action button */}
        {showConfirm && isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-5 pt-0"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
              style={{
                backgroundColor: 'white',
                color: twist.isPositive ? '#059669' : '#DC2626',
              }}
            >
              {twist.requiresChoice ? '🎯 בחר עכשיו!' : '✓ הבנתי!'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * TwistCardPopup - Full screen popup for twist card reveal
 */
interface TwistCardPopupProps {
  isOpen: boolean;
  twist: TwistCardType | null;
  player: Player | null;
  playerColor: string;
  onConfirm: () => void;
  isDigitalPlayer?: boolean;
}

export function TwistCardPopup({
  isOpen,
  twist,
  player,
  playerColor,
  onConfirm,
  isDigitalPlayer = false,
}: TwistCardPopupProps) {
  // Auto-confirm for digital players after a delay
  if (isDigitalPlayer && isOpen && twist) {
    setTimeout(onConfirm, 3000);
  }

  if (!twist || !player) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            className="flex flex-col items-center"
          >
            {/* Announcement */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-5xl inline-block"
              >
                🌀
              </motion.span>
              <h2 className="text-white text-3xl font-bold mt-2">טוויסט!</h2>
              <p className="text-white/70">{player.name} מקבל/ת הפתעה!</p>
            </motion.div>

            {/* The card */}
            <TwistCard
              twist={twist}
              player={player}
              playerColor={playerColor}
              isRevealed={true}
              onConfirm={onConfirm}
              showConfirm={!isDigitalPlayer}
            />

            {/* Digital player auto-continue message */}
            {isDigitalPlayer && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-white/60 text-sm mt-4"
              >
                🤖 הרובוט מבצע את הפעולה...
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

