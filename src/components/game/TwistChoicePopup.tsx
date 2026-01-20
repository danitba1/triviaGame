'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type Player, type TwistCard, type KnowledgeCategory, type DifficultyLevel, KNOWLEDGE_CATEGORIES } from '@/types/game.types';
import { GATE_POSITIONS } from './CircularBoard';

interface TwistChoicePopupProps {
  isOpen: boolean;
  twist: TwistCard | null;
  currentPlayer: Player | null;
  playerColor: string;
  allPlayers: Player[];
  playerColors: Record<string, string>;
  onChoosePlayer?: (player: Player) => void;
  onChooseGate?: (gatePosition: number) => void;
  onChooseDifficulty?: (difficulty: DifficultyLevel) => void;
  onChooseCategory?: (category: KnowledgeCategory) => void;
  availableCategories?: KnowledgeCategory[];
}

/**
 * TwistChoicePopup - Popup for selecting twist targets/options
 */
export function TwistChoicePopup({
  isOpen,
  twist,
  currentPlayer,
  playerColor,
  allPlayers,
  playerColors,
  onChoosePlayer,
  onChooseGate,
  onChooseDifficulty,
  onChooseCategory,
  availableCategories = [],
}: TwistChoicePopupProps) {
  if (!twist || !currentPlayer || !isOpen) return null;

  // Star-related twists are handled by clicking on the board, not this popup
  const isStarRelatedTwist = twist.effectType === 'free_star' || twist.effectType === 'star_peek';
  if (isStarRelatedTwist) {
    // Don't show the choice popup for star-related twists
    return null;
  }

  // Determine what type of choice is needed
  const needsPlayerChoice = twist.targetPlayer === 'choose' && onChoosePlayer;
  const needsGateChoice = twist.effectType === 'teleport_gate' && onChooseGate;
  const needsDifficultyChoice = twist.effectType === 'difficulty_choice' && onChooseDifficulty;
  const needsCategoryChoice = twist.effectType === 'category_master' && onChooseCategory;

  // Get other players (for player selection)
  const otherPlayers = allPlayers.filter(p => p.id !== currentPlayer.id);

  // Get players with stars (for steal)
  const playersWithStars = otherPlayers.filter(p => p.starsCollected > 0);

  // Get category info
  const categoryInfos = KNOWLEDGE_CATEGORIES.filter(c => availableCategories.includes(c.id));

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
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div 
              className="rounded-t-3xl p-5 text-center text-white"
              style={{ 
                background: twist.isPositive 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)' 
              }}
            >
              <span className="text-5xl block mb-2">{twist.emoji}</span>
              <h2 className="text-2xl font-bold">{twist.title}</h2>
              <p className="text-white/80 mt-1">{twist.description}</p>
            </div>

            {/* Choice content */}
            <div className="p-5">
              {/* Player Selection */}
              {needsPlayerChoice && (
                <div>
                  <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">
                    {twist.effectType === 'steal_star' 
                      ? '🏴‍☠️ בחר שחקן לגנוב ממנו כוכב'
                      : twist.effectType === 'swap_positions'
                      ? '🔄 בחר שחקן להחליף איתו מיקום'
                      : twist.effectType === 'freeze_player'
                      ? '❄️ בחר שחקן להקפיא'
                      : twist.effectType === 'points_swap'
                      ? '🔀 בחר שחקן להחליף איתו נקודות'
                      : '👆 בחר שחקן'}
                  </h3>
                  
                  {/* For steal star, only show players with stars */}
                  {twist.effectType === 'steal_star' && playersWithStars.length === 0 ? (
                    <div className="text-center p-4 bg-gray-100 rounded-xl">
                      <span className="text-4xl mb-2 block">😅</span>
                      <p className="text-[var(--text-secondary)]">אין שחקנים עם כוכבים!</p>
                      <p className="text-sm text-[var(--text-secondary)]">הטוויסט בוטל</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {(twist.effectType === 'steal_star' ? playersWithStars : otherPlayers).map(player => (
                        <motion.button
                          key={player.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onChoosePlayer(player)}
                          className="p-4 rounded-xl border-2 transition-all hover:shadow-lg"
                          style={{ 
                            borderColor: playerColors[player.id],
                            backgroundColor: `${playerColors[player.id]}15`,
                          }}
                        >
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                            style={{ backgroundColor: playerColors[player.id] }}
                          >
                            <span className="text-2xl">{player.avatarEmoji}</span>
                          </div>
                          <p className="font-bold" style={{ color: playerColors[player.id] }}>
                            {player.name}
                          </p>
                          {twist.effectType === 'steal_star' && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              ⭐ {player.starsCollected} כוכבים
                            </p>
                          )}
                          {twist.effectType === 'swap_positions' && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              📍 מיקום {player.boardPosition}
                            </p>
                          )}
                          {twist.effectType === 'points_swap' && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              💰 {player.score} נקודות
                            </p>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gate Selection */}
              {needsGateChoice && (
                <div>
                  <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">
                    🚪 בחר שער להתקפל אליו
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {GATE_POSITIONS.map((gatePos, index) => (
                      <motion.button
                        key={gatePos}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onChooseGate(gatePos)}
                        className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        <span className="text-2xl block">🚪</span>
                        <span className="text-xs">שער {index + 1}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Selection */}
              {needsDifficultyChoice && (
                <div>
                  <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">
                    🎚️ בחר רמת קושי לשאלה הבאה
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as DifficultyLevel[]).map(diff => (
                      <motion.button
                        key={diff}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onChooseDifficulty(diff)}
                        className="p-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                        style={{
                          background: `linear-gradient(135deg, 
                            ${diff === 1 ? '#10B981, #059669' : 
                              diff === 2 ? '#3B82F6, #2563EB' : 
                              diff === 3 ? '#F59E0B, #D97706' : 
                              diff === 4 ? '#EF4444, #DC2626' : 
                              '#8B5CF6, #7C3AED'})`,
                          color: 'white',
                        }}
                      >
                        <span className="text-2xl block">{diff}</span>
                        <span className="text-xs block mt-1">
                          {'⭐'.repeat(diff)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-[var(--text-secondary)] mt-3">
                    רמה גבוהה = יותר צעדים אם תענה נכון!
                  </p>
                </div>
              )}

              {/* Category Selection */}
              {needsCategoryChoice && (
                <div>
                  <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">
                    📚 בחר קטגוריה ל-{twist.effectValue || 3} השאלות הבאות
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryInfos.map(cat => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChooseCategory(cat.id)}
                        className="p-4 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: cat.color }}
                      >
                        <span className="text-3xl block mb-1">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

