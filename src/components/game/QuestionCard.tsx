'use client';

import { type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type TriviaQuestion, type AnswerOption, type Player, KNOWLEDGE_CATEGORIES } from '@/types/game.types';
import { PlayerCoin } from './PlayerCoin';

/** Player answer tracking */
interface PlayerAnswer {
  playerId: string;
  answerId: string;
}

interface QuestionCardProps {
  /** The question to display */
  question: TriviaQuestion;
  /** Current question number */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Current player (whose turn it is) */
  currentPlayer: Player;
  /** All players in the game */
  players: Player[];
  /** Player colors map */
  playerColors: Record<string, string>;
  /** Answers placed by players */
  playerAnswers: PlayerAnswer[];
  /** Whether all players have answered */
  allPlayersAnswered: boolean;
  /** Whether the answer has been revealed */
  isRevealed: boolean;
  /** Callback when current player clicks an answer */
  onAnswerClick: (answer: AnswerOption) => void;
  /** The player who is currently selecting (for human player interaction) */
  activePlayerId: string | null;
}

/**
 * QuestionCard - Displays a trivia question with multiple choice answers
 * Shows coins from all players who have answered
 */
export const QuestionCard: FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentPlayer,
  players,
  playerColors,
  playerAnswers,
  allPlayersAnswered,
  isRevealed,
  onAnswerClick,
  activePlayerId,
}) => {
  // Get category info for display
  const categoryInfo = KNOWLEDGE_CATEGORIES.find(c => c.id === question.category);

  // Check if current active player has answered
  const activePlayerHasAnswered = activePlayerId 
    ? playerAnswers.some(pa => pa.playerId === activePlayerId)
    : false;

  // Get players who answered each option
  const getPlayersForAnswer = (answerId: string): Player[] => {
    const playerIds = playerAnswers
      .filter(pa => pa.answerId === answerId)
      .map(pa => pa.playerId);
    return players.filter(p => playerIds.includes(p.id));
  };

  // Get difficulty stars
  const difficultyStars = '⭐'.repeat(question.difficulty);
  const emptyStars = '☆'.repeat(5 - question.difficulty);

  // Get answer button style based on state
  const getAnswerStyle = (answer: AnswerOption): string => {
    const baseStyle = 'bg-white border-gray-200';
    
    if (!isRevealed) {
      // Before reveal - show hover states only if player hasn't answered
      if (!activePlayerHasAnswered) {
        return `${baseStyle} hover:bg-gray-50 hover:border-[var(--color-primary)] cursor-pointer`;
      }
      return `${baseStyle} cursor-default`;
    }
    
    // After reveal
    if (answer.isCorrect) {
      return 'bg-green-100 border-green-500';
    }
    
    return 'bg-gray-100 border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="w-full"
    >
      {/* Question header */}
      <div className="flex items-center justify-between mb-4">
        {/* Category badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ backgroundColor: `${categoryInfo?.color}20` }}
        >
          <span className="text-xl">{categoryInfo?.emoji}</span>
          <span 
            className="font-semibold text-sm"
            style={{ color: categoryInfo?.color }}
          >
            {categoryInfo?.label}
          </span>
        </motion.div>

        {/* Difficulty indicator */}
        <div className="text-sm">
          <span className="text-yellow-500">{difficultyStars}</span>
          <span className="text-gray-300">{emptyStars}</span>
        </div>
      </div>

      {/* Question number */}
      <div className="text-center mb-2">
        <span className="text-sm text-[var(--text-secondary)]">
          שאלה {questionNumber} מתוך {totalQuestions}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl font-bold text-[var(--text-primary)] text-center leading-relaxed"
        >
          {question.questionText}
        </motion.h2>
      </div>

      {/* Waiting indicator */}
      {!allPlayersAnswered && activePlayerHasAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4 p-3 bg-[var(--color-accent)]/20 rounded-xl"
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[var(--text-primary)]"
          >
            ⏳ ממתינים לשאר השחקנים...
          </motion.span>
        </motion.div>
      )}

      {/* Answers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {question.answers.map((answer, index) => {
            const answeredPlayers = getPlayersForAnswer(answer.id);
            
            return (
              <motion.button
                key={answer.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={!activePlayerHasAnswered && !isRevealed ? { scale: 1.02 } : {}}
                whileTap={!activePlayerHasAnswered && !isRevealed ? { scale: 0.98 } : {}}
                onClick={() => !activePlayerHasAnswered && !isRevealed && onAnswerClick(answer)}
                disabled={activePlayerHasAnswered || isRevealed}
                className={`
                  relative p-5 rounded-2xl border-3 text-lg font-medium
                  transition-all duration-200 min-h-[100px]
                  ${getAnswerStyle(answer)}
                `}
              >
                {/* Answer letter */}
                <span className="absolute top-2 start-3 text-xs font-bold text-[var(--text-secondary)]">
                  {String.fromCharCode(1488 + index)}
                </span>
                
                {/* Answer text */}
                <span className="block pt-2 mb-3">
                  {answer.text}
                </span>

                {/* Player coins */}
                {answeredPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {answeredPlayers.map((player, coinIndex) => (
                      <PlayerCoin
                        key={player.id}
                        color={playerColors[player.id]}
                        avatarEmoji={player.avatarEmoji}
                        size="small"
                        delay={coinIndex * 0.1}
                      />
                    ))}
                  </div>
                )}

                {/* Correct/Incorrect indicator after reveal */}
                {isRevealed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 end-3 text-2xl"
                  >
                    {answer.isCorrect ? '✓' : ''}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
