'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-playful relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="floating-shape w-32 h-32 bg-[var(--color-pink)] top-20 start-10" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-24 h-24 bg-[var(--color-purple)] top-40 end-20" style={{ animationDelay: '1s' }} />
      <div className="floating-shape w-20 h-20 bg-[var(--color-accent)] bottom-32 start-1/4" style={{ animationDelay: '2s' }} />
      <div className="floating-shape w-28 h-28 bg-[var(--color-secondary)] bottom-20 end-1/3" style={{ animationDelay: '3s' }} />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
            <span className="bg-gradient-to-l from-[var(--color-primary)] via-[var(--color-purple)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              משחק טריוויה
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium"
          >
            ?מוכנים לאתגר
          </motion.p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="card-playful max-w-md w-full text-center"
        >
          {/* Game icon/mascot placeholder */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-8xl mb-6"
          >
            🧠
          </motion.div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            !ברוכים הבאים
          </h2>
          
          <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
            בחרו קטגוריה והתחילו לשחק!
            <br />
            ענו על שאלות וצברו נקודות
          </p>

          {/* Start button - links to setup */}
          <Link href="/setup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary w-full text-xl py-4 mb-4"
            >
              🎮 התחל משחק
            </motion.button>
          </Link>

          {/* Secondary options */}
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex-1"
            >
              📊 טבלת ניקוד
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-white border-3 border-[var(--color-purple)] text-[var(--color-purple)] font-semibold hover:bg-[var(--color-purple)] hover:text-white transition-colors"
            >
              ⚙️ הגדרות
            </motion.button>
          </div>
        </motion.div>

        {/* Fun stats/info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-12 flex gap-8 text-center"
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-[var(--color-primary)]">100+</span>
            <span className="text-sm text-[var(--text-secondary)]">שאלות</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-[var(--color-secondary)]">7</span>
            <span className="text-sm text-[var(--text-secondary)]">קטגוריות</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-[var(--color-purple)]">🏆</span>
            <span className="text-sm text-[var(--text-secondary)]">פרסים</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
