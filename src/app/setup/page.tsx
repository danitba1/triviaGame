'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlayerCountSelector } from '@/components/game/PlayerCountSelector';
import { PlayerNameInput } from '@/components/game/PlayerNameInput';
import { CategorySelector } from '@/components/game/CategorySelector';
import { 
  type GameSettings, 
  type KnowledgeCategory,
  DEFAULT_GAME_SETTINGS 
} from '@/types/game.types';

/**
 * GameSetupPage - First screen where players configure game preferences
 */
export default function GameSetupPage() {
  const router = useRouter();
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const totalSteps = 3;

  // Handler for human player count change
  const handleHumanCountChange = (newCount: number) => {
    const currentNames = [...gameSettings.humanPlayerNames];
    
    // Adjust names array to match new count
    while (currentNames.length < newCount) {
      currentNames.push('');
    }
    while (currentNames.length > newCount) {
      currentNames.pop();
    }

    setGameSettings({
      ...gameSettings,
      humanPlayerCount: newCount,
      humanPlayerNames: currentNames,
    });
  };

  // Handler for digital player count change
  const handleDigitalCountChange = (newCount: number) => {
    setGameSettings({
      ...gameSettings,
      digitalPlayerCount: newCount,
    });
  };

  // Handler for player name change
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...gameSettings.humanPlayerNames];
    newNames[index] = name;
    setGameSettings({
      ...gameSettings,
      humanPlayerNames: newNames,
    });
  };

  // Handler for category selection
  const handleCategoriesChange = (categories: KnowledgeCategory[]) => {
    setGameSettings({
      ...gameSettings,
      selectedCategories: categories,
    });
  };

  // Handler for custom category text
  const handleCustomTextChange = (text: string) => {
    setGameSettings({
      ...gameSettings,
      customCategoryText: text,
    });
  };

  // Check if current step is valid to proceed
  const canProceed = (): boolean => {
    if (currentStep === 2) {
      // Check if all player names are filled
      return gameSettings.humanPlayerNames.every(name => name.trim().length > 0);
    }
    return true;
  };

  // Handle start game
  const handleStartGame = () => {
    // Navigate to game page with settings as URL param
    const settingsParam = encodeURIComponent(JSON.stringify(gameSettings));
    router.push(`/game?settings=${settingsParam}`);
  };

  return (
    <div className="min-h-screen bg-playful relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="floating-shape w-24 h-24 bg-[var(--color-pink)] top-10 start-5 opacity-40" />
      <div className="floating-shape w-20 h-20 bg-[var(--color-purple)] top-32 end-10 opacity-40" />
      <div className="floating-shape w-16 h-16 bg-[var(--color-accent)] bottom-20 start-1/4 opacity-40" />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link 
            href="/"
            className="inline-block mb-4 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            → חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            ⚙️ הגדרות משחק
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            בואו נתאים את המשחק בדיוק בשבילכם!
          </p>
        </motion.div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              className={`h-3 rounded-full transition-all ${
                step === currentStep 
                  ? 'w-12 bg-[var(--color-primary)]' 
                  : step < currentStep 
                    ? 'w-8 bg-[var(--color-secondary)]' 
                    : 'w-8 bg-gray-200'
              }`}
              animate={{ 
                scale: step === currentStep ? [1, 1.1, 1] : 1 
              }}
              transition={{ repeat: step === currentStep ? Infinity : 0, duration: 2 }}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Player counts */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  👥 כמה שחקנים משתתפים?
                </h2>
              </div>

              <PlayerCountSelector
                label="שחקנים אמיתיים"
                icon="👨‍👩‍👧‍👦"
                count={gameSettings.humanPlayerCount}
                minCount={1}
                maxCount={6}
                onCountChange={handleHumanCountChange}
                accentColor="var(--color-primary)"
              />

              <PlayerCountSelector
                label="שחקנים דיגיטליים"
                icon="🤖"
                count={gameSettings.digitalPlayerCount}
                minCount={0}
                maxCount={5}
                onCountChange={handleDigitalCountChange}
                accentColor="var(--color-secondary)"
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--color-accent)]/20 rounded-xl p-4 text-center"
              >
                <span className="text-lg">
                  סה&quot;כ {gameSettings.humanPlayerCount + gameSettings.digitalPlayerCount} שחקנים במשחק
                </span>
                <span className="mx-2">🎮</span>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Player names */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  ✏️ מה השמות שלכם?
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  הכניסו שם לכל שחקן
                </p>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {gameSettings.humanPlayerNames.map((name, index) => (
                    <PlayerNameInput
                      key={index}
                      playerIndex={index + 1}
                      name={name}
                      onNameChange={(newName) => handleNameChange(index, newName)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Digital players preview */}
              {gameSettings.digitalPlayerCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-gray-50 rounded-xl p-4"
                >
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    🤖 שחקנים דיגיטליים:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: gameSettings.digitalPlayerCount }).map((_, i) => (
                      <span 
                        key={i}
                        className="bg-[var(--color-secondary)]/20 px-3 py-1 rounded-full text-sm"
                      >
                        רובוט {i + 1} 🤖
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Categories */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  📚 באילו נושאים תרצו לשחק?
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  בחרו לפחות נושא אחד
                </p>
              </div>

              <CategorySelector
                selectedCategories={gameSettings.selectedCategories}
                onCategoriesChange={handleCategoriesChange}
                customCategoryText={gameSettings.customCategoryText}
                onCustomTextChange={handleCustomTextChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mt-8"
        >
          {currentStep > 1 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-4 px-6 rounded-xl bg-white border-2 border-gray-200 text-[var(--text-primary)] font-semibold text-lg hover:border-[var(--color-primary)] transition-colors"
            >
              → הקודם
            </motion.button>
          )}

          {currentStep < totalSteps ? (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.03 : 1 }}
              whileTap={{ scale: canProceed() ? 0.97 : 1 }}
              onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                canProceed()
                  ? 'btn-primary'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              הבא ←
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartGame}
              className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-l from-[var(--color-green)] to-[#4ade80] text-white shadow-lg"
            >
              🎮 התחילו לשחק!
            </motion.button>
          )}
        </motion.div>

        {/* Step indicator text */}
        <p className="text-center text-[var(--text-secondary)] mt-4">
          שלב {currentStep} מתוך {totalSteps}
        </p>
      </main>
    </div>
  );
}

