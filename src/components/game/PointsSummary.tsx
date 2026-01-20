'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';
import { type Player, type TriviaQuestion } from '@/types/game.types';

interface PlayerPoints {
  player: Player;
  pointsEarned: number;
  isCorrect: boolean;
  isCurrentTurn: boolean;
}

interface PointsSummaryProps {
  /** Points earned by each player */
  playerPoints: PlayerPoints[];
  /** Player colors */
  playerColors: Record<string, string>;
  /** The question that was answered */
  question: TriviaQuestion;
  /** Callback to proceed to next question */
  onNextQuestion: () => void;
  /** Whether there are more questions */
  hasMoreQuestions: boolean;
}

/**
 * PointsSummary - Modal popup showing points earned by each player after answer reveal
 */
export const PointsSummary: FC<PointsSummaryProps> = ({
  playerPoints,
  playerColors,
  question,
  onNextQuestion,
  hasMoreQuestions,
}) => {
  // Sort by points earned (highest first)
  const sortedPlayers = [...playerPoints].sort((a, b) => b.pointsEarned - a.pointsEarned);
  
  // Get correct answer text
  const correctAnswer = question.answers.find(a => a.isCorrect)?.text;
  
  // Count correct answers
  const correctCount = playerPoints.filter(p => p.isCorrect).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Correct answer header */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-3xl p-6 text-center text-white">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-5xl block mb-2"
          >
            ✓
          </motion.span>
          <p className="text-lg font-medium opacity-90">התשובה הנכונה היא:</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mt-1"
          >
            {correctAnswer}
          </motion.p>
          <p className="text-sm mt-2 opacity-80">
            {correctCount} מתוך {playerPoints.length} ענו נכון!
          </p>
        </div>

        {/* Points breakdown */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">
            🎯 נקודות שנצברו:
          </h3>
          
          <div className="space-y-2">
            {sortedPlayers.map((item, index) => (
              <motion.div
                key={item.player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.08 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  item.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                {/* Player avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: playerColors[item.player.id] }}
                >
                  <span className="text-lg">{item.player.avatarEmoji}</span>
                </div>

                {/* Player name & status */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] truncate">
                    {item.player.name}
                    {item.isCurrentTurn && (
                      <span className="text-xs bg-[var(--color-accent)] text-[var(--text-primary)] px-2 py-0.5 rounded-full ms-2">
                        תורו
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.isCorrect ? '✓ נכון!' : '✗ לא נכון'}
                  </p>
                </div>

                {/* Points */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.08, type: 'spring' }}
                  className={`text-xl font-bold px-3 py-1 rounded-lg ${
                    item.pointsEarned > 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {item.pointsEarned > 0 ? `+${item.pointsEarned}` : '0'}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Scoring reminder */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center text-sm text-blue-700">
            <p>🎲 בתור שלך: <strong>{question.difficulty} נקודות</strong></p>
            <p>👥 לא בתור שלך: <strong>1 נקודה</strong></p>
          </div>

          {/* Next question button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            {hasMoreQuestions ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextQuestion}
                className="w-full btn-primary text-xl py-4"
              >
                🎯 שאלה הבאה
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextQuestion}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl py-4 rounded-2xl shadow-lg font-bold"
              >
                🏆 סיכום המשחק
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
