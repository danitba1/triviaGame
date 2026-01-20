'use client';

import { type FC } from 'react';
import { motion } from 'framer-motion';

interface LoadingQuestionsProps {
  /** Current loading message to display */
  message?: string;
}

/**
 * LoadingQuestions - Fun loading screen while questions are being generated
 */
export const LoadingQuestions: FC<LoadingQuestionsProps> = ({
  message = 'מכינים שאלות מעניינות...',
}) => {
  const emojis = ['🧠', '📚', '🎯', '✨', '🌟', '💡', '🎓', '🔮'];

  return (
    <div className="min-h-screen bg-playful flex flex-col items-center justify-center px-4">
      {/* Animated emojis */}
      <div className="flex gap-4 mb-8">
        {emojis.map((emoji, index) => (
          <motion.span
            key={index}
            className="text-4xl"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 1,
              delay: index * 0.1,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Main loading spinner */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)]/20" />
        
        {/* Animated arc */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-secondary)]"
          style={{ borderRadius: '50%' }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ❓
          </motion.span>
        </div>
      </motion.div>

      {/* Loading text */}
      <motion.h2
        className="text-2xl font-bold text-[var(--text-primary)] mb-4 text-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.h2>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-[var(--color-accent)]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Fun fact */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-8 text-[var(--text-secondary)] text-center max-w-md"
      >
        💡 הידעתם? אנחנו משתמשים בבינה מלאכותית כדי ליצור שאלות מותאמות אישית!
      </motion.p>
    </div>
  );
};

