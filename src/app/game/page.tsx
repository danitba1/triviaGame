'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlayerScoreCard } from '@/components/game/PlayerScoreCard';
import { QuestionCard } from '@/components/game/QuestionCard';
import { LoadingQuestions } from '@/components/game/LoadingQuestions';
import { RevealCountdown } from '@/components/game/RevealCountdown';
import { SpinningWheel, type WheelOption } from '@/components/game/SpinningWheel';
import { CircularBoard, GATE_POSITIONS, TOTAL_STEPS } from '@/components/game/CircularBoard';
import { StarRevealPopup } from '@/components/game/StarRevealPopup';
import { TwistCardPopup } from '@/components/game/TwistCard';
import { TwistChoicePopup } from '@/components/game/TwistChoicePopup';
import { useQuestions } from '@/hooks/useQuestions';
import { useTwists } from '@/hooks/useTwists';
import { useGameSounds } from '@/contexts/SoundContext';
import { 
  type Player, 
  type StarState,
  type GameSettings,
  type AnswerOption,
  type DifficultyLevel,
  type TwistCard,
  type KnowledgeCategory,
  createInitialStars,
  HUMAN_PLAYER_AVATARS,
  DIGITAL_PLAYER_AVATARS,
  DEFAULT_GAME_SETTINGS,
} from '@/types/game.types';
import {
  executeImmediateTwist,
  isPlayerFrozen,
  getStepsMultiplier,
  getForcedCategory,
  getChoiceTypeForTwist,
} from '@/lib/twistHandlers';

// Player colors for visual distinction
const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#A855F7', '#FB923C', 
  '#F472B6', '#3B82F6', '#22C55E', '#EF4444'
];

/** Game phases */
type GamePhase = 
  | 'spinning' 
  | 'twist'           // Showing twist card
  | 'twistChoice'     // Player making a twist choice
  | 'twistBonusQ'     // Twist bonus question
  | 'question' 
  | 'countdown' 
  | 'results' 
  | 'moving' 
  | 'selectStar' 
  | 'revealingStar' 
  | 'finished';

/** Player answer tracking */
interface PlayerAnswer {
  playerId: string;
  answerId: string;
}

/** Steps earned by a player in current round */
interface PlayerStepsEarned {
  player: Player;
  stepsEarned: number;
  isCorrect: boolean;
  isCurrentTurn: boolean;
}

/**
 * Create players from game settings with starting positions at gates
 */
function createPlayersFromSettings(settings: GameSettings): Player[] {
  const players: Player[] = [];
  const totalPlayers = settings.humanPlayerNames.length + settings.digitalPlayerCount;

  // Add human players
  settings.humanPlayerNames.forEach((name, index) => {
    // Distribute players across gates
    const startGate = GATE_POSITIONS[index % GATE_POSITIONS.length];
    players.push({
      id: `human-${index}`,
      name: name || `שחקן ${index + 1}`,
      type: 'human',
      score: 0,
      boardPosition: startGate,
      starsCollected: 0,
      avatarEmoji: HUMAN_PLAYER_AVATARS[index % HUMAN_PLAYER_AVATARS.length],
    });
  });

  // Add digital players
  for (let i = 0; i < settings.digitalPlayerCount; i++) {
    const playerIndex = settings.humanPlayerNames.length + i;
    const startGate = GATE_POSITIONS[playerIndex % GATE_POSITIONS.length];
    players.push({
      id: `digital-${i}`,
      name: `רובוט ${i + 1}`,
      type: 'digital',
      score: 0,
      boardPosition: startGate,
      starsCollected: 0,
      avatarEmoji: DIGITAL_PLAYER_AVATARS[i % DIGITAL_PLAYER_AVATARS.length],
    });
  }

  return players;
}

/**
 * Calculate gates passed when moving from one position to another
 */
function getGatesPassed(startPos: number, steps: number): number[] {
  const gatesPassed: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const pos = (startPos + i) % TOTAL_STEPS;
    if (GATE_POSITIONS.includes(pos)) {
      gatesPassed.push(pos);
    }
  }
  return gatesPassed;
}

/**
 * GameContent - Main game content component
 */
function GameContent() {
  const searchParams = useSearchParams();
  
  // Sound effects
  const { playSound, stopSound, toggleMute, isMuted } = useGameSounds();
  const [soundMuted, setSoundMuted] = useState(false);
  
  const handleToggleMute = useCallback(() => {
    toggleMute();
    setSoundMuted(prev => !prev);
  }, [toggleMute]);
  
  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [stars, setStars] = useState<StarState[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  
  // Game phase state
  const [gamePhase, setGamePhase] = useState<GamePhase>('spinning');
  const [wheelResult, setWheelResult] = useState<WheelOption | null>(null);
  
  // Answer tracking state
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [activeHumanIndex, setActiveHumanIndex] = useState(0);
  const [roundSteps, setRoundSteps] = useState<PlayerStepsEarned[]>([]);
  
  // Movement and star selection state
  const [pendingMovements, setPendingMovements] = useState<{playerId: string, steps: number}[]>([]);
  const [currentMovingPlayerIndex, setCurrentMovingPlayerIndex] = useState(0);
  const [gatesPassedQueue, setGatesPassedQueue] = useState<number[]>([]);
  const [selectingStarPlayer, setSelectingStarPlayer] = useState<Player | null>(null);
  const [revealingStar, setRevealingStar] = useState<StarState | null>(null);

  // Questions hook
  const {
    currentQuestion,
    questionsAnswered,
    isLoading,
    errorMessage,
    generateQuestions,
    selectQuestionByDifficulty,
    completeCurrentQuestion,
    hasMoreQuestions,
    remainingQuestions,
  } = useQuestions();

  // Twists hook
  const {
    drawTwist,
    activeTwist,
    setActiveTwist,
    markTwistUsed,
    modifiers,
    addModifier,
    removeModifier,
    tickModifiers,
    hasModifier,
    getModifier,
  } = useTwists();

  // Twist-related state
  const [showTwistChoice, setShowTwistChoice] = useState(false);
  const [chosenDifficulty, setChosenDifficulty] = useState<DifficultyLevel | null>(null);
  const [extraTurnPending, setExtraTurnPending] = useState(false);
  const [playOrderReversed, setPlayOrderReversed] = useState(false);
  const [reverseTurnsRemaining, setReverseTurnsRemaining] = useState(0);
  const [bonusQuestionSteps, setBonusQuestionSteps] = useState(5); // Steps to earn from bonus question
  const [peekedStarId, setPeekedStarId] = useState<number | null>(null);

  // Initialize game from URL params
  useEffect(() => {
    const settingsParam = searchParams.get('settings');
    let settings: GameSettings = DEFAULT_GAME_SETTINGS;

    if (settingsParam) {
      try {
        settings = JSON.parse(decodeURIComponent(settingsParam));
      } catch {
        console.error('Failed to parse game settings');
      }
    }

    setGameSettings(settings);
    setPlayers(createPlayersFromSettings(settings));
    setStars(createInitialStars());
    generateQuestions(settings.selectedCategories, settings.customCategoryText);
  }, [searchParams, generateQuestions]);

  // Create player color map
  const playerColors: Record<string, string> = {};
  players.forEach((player, index) => {
    playerColors[player.id] = PLAYER_COLORS[index % PLAYER_COLORS.length];
  });

  // Player positions map for the board
  const playerPositions: Record<string, number> = {};
  players.forEach(p => {
    playerPositions[p.id] = p.boardPosition;
  });

  // Current turn player
  const currentTurnPlayer = players[currentTurnIndex];
  
  // Get human/digital players
  const humanPlayers = players.filter(p => p.type === 'human');
  const digitalPlayers = players.filter(p => p.type === 'digital');
  const activeHumanPlayer = humanPlayers[activeHumanIndex] || null;
  const allPlayersAnswered = playerAnswers.length === players.length;
  
  // Available stars (not earned yet)
  const availableStars = stars.filter(s => !s.isEarned);
  
  // Check if game should end (no more stars)
  const isGameOver = availableStars.length === 0;

  // Handle wheel spin complete
  const handleWheelComplete = useCallback((result: WheelOption) => {
    // Stop spin sound and play end sound
    stopSound('spin');
    playSound('spinEnd');
    
    setWheelResult(result);
    
    // Check if current player has category_master modifier
    const forcedCategory = currentTurnPlayer 
      ? getForcedCategory(currentTurnPlayer.id, modifiers)
      : null;
    
    if (result === 'twist') {
      // Draw a twist card!
      const twist = drawTwist();
      if (twist) {
        setActiveTwist(twist);
        markTwistUsed(twist.id);
        playSound('twist');
        setTimeout(() => {
          setGamePhase('twist');
        }, 1000);
      } else {
        // No twist available, default to random question
        const randomDifficulty = (Math.floor(Math.random() * 5) + 1) as DifficultyLevel;
        selectQuestionByDifficulty(randomDifficulty, forcedCategory);
        setTimeout(() => {
          setGamePhase('question');
        }, 1500);
      }
    } else {
      // Check if player has a chosen difficulty from twist
      const difficultyToUse = chosenDifficulty || (result as DifficultyLevel);
      setChosenDifficulty(null);
      selectQuestionByDifficulty(difficultyToUse, forcedCategory);
      
      setTimeout(() => {
        setGamePhase('question');
      }, 1500);
    }
  }, [selectQuestionByDifficulty, drawTwist, setActiveTwist, markTwistUsed, chosenDifficulty, playSound, stopSound, currentTurnPlayer, modifiers]);

  // Simulate a single digital player answer (fully random, independent of other players)
  const simulateDigitalAnswer = useCallback((playerId: string, playerName: string) => {
    if (!currentQuestion) return;
    
    // Generate a completely random answer index
    const randomIndex = Math.floor(Math.random() * currentQuestion.answers.length);
    const selectedAnswer = currentQuestion.answers[randomIndex];
    
    console.log(`🤖 ${playerName} randomly chose answer index ${randomIndex}: ${selectedAnswer.text}`);
    
    setPlayerAnswers(prev => {
      // Check if this player already answered
      if (prev.some(pa => pa.playerId === playerId)) return prev;
      
      return [...prev, {
        playerId: playerId,
        answerId: selectedAnswer.id,
      }];
    });
  }, [currentQuestion]);

  // Handle human player answer
  const handleAnswerClick = useCallback((answer: AnswerOption) => {
    if (!activeHumanPlayer || gamePhase !== 'question') return;
    if (playerAnswers.some(pa => pa.playerId === activeHumanPlayer.id)) return;
    
    const newAnswers = [...playerAnswers, {
      playerId: activeHumanPlayer.id,
      answerId: answer.id,
    }];
    
    setPlayerAnswers(newAnswers);
    
    if (activeHumanIndex < humanPlayers.length - 1) {
      setActiveHumanIndex(prev => prev + 1);
    }
  }, [activeHumanPlayer, gamePhase, playerAnswers, activeHumanIndex, humanPlayers.length]);

  // Effect to simulate digital player answers one by one with independent random choices
  useEffect(() => {
    if (gamePhase !== 'question') return;
    if (!currentQuestion) return;
    
    // Find next digital player who hasn't answered yet
    const nextDigitalPlayer = digitalPlayers.find(dp => 
      !playerAnswers.some(pa => pa.playerId === dp.id)
    );
    
    if (nextDigitalPlayer) {
      // Each digital player "thinks" for a random time (1-3 seconds) then answers randomly
      const thinkingTime = 1000 + Math.random() * 2000;
      const playerId = nextDigitalPlayer.id;
      const playerName = nextDigitalPlayer.name;
      
      const timer = setTimeout(() => {
        simulateDigitalAnswer(playerId, playerName);
      }, thinkingTime);
      return () => clearTimeout(timer);
    }
  }, [playerAnswers, digitalPlayers, simulateDigitalAnswer, gamePhase, currentQuestion]);

  // Effect to start countdown when all players answered
  useEffect(() => {
    if (allPlayersAnswered && gamePhase === 'question') {
      const timer = setTimeout(() => {
        setGamePhase('countdown');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allPlayersAnswered, gamePhase]);

  // Handle countdown complete - calculate steps
  const handleCountdownComplete = useCallback(() => {
    if (!currentQuestion) return;
    
    const correctAnswerId = currentQuestion.answers.find(a => a.isCorrect)?.id;
    
    // Calculate steps for each player (steps = difficulty if their turn, 1 otherwise)
    // Also apply double_next modifier if player has it
    const stepsResults: PlayerStepsEarned[] = players.map(player => {
      const playerAnswer = playerAnswers.find(pa => pa.playerId === player.id);
      const isCorrect = playerAnswer?.answerId === correctAnswerId;
      const isCurrentTurn = player.id === currentTurnPlayer?.id;
      
      let stepsEarned = 0;
      if (isCorrect) {
        // Base steps
        const baseSteps = isCurrentTurn ? currentQuestion.difficulty : 1;
        // Apply double_next modifier if player has it
        const multiplier = getStepsMultiplier(player.id, modifiers);
        stepsEarned = baseSteps * multiplier;
        
        // If player used the double modifier, remove it
        if (multiplier > 1) {
          removeModifier(player.id, 'double_next');
        }
      }
      
      return {
        player,
        stepsEarned,
        isCorrect,
        isCurrentTurn,
      };
    });
    
    // Play sound based on current turn player's result
    const currentPlayerResult = stepsResults.find(r => r.isCurrentTurn);
    if (currentPlayerResult?.isCorrect) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
    
    setRoundSteps(stepsResults);
    
    // Create pending movements for players who earned steps
    const movements = stepsResults
      .filter(r => r.stepsEarned > 0)
      .map(r => ({ playerId: r.player.id, steps: r.stepsEarned }));
    
    setPendingMovements(movements);
    setCurrentMovingPlayerIndex(0);
    
    setGamePhase('results');
  }, [currentQuestion, players, playerAnswers, currentTurnPlayer, playSound, modifiers, removeModifier]);

  // Handle proceeding after results - start movement phase
  const handleStartMovement = useCallback(() => {
    if (pendingMovements.length === 0) {
      // No one to move, go to next turn
      handleNextTurn();
      return;
    }
    
    setCurrentMovingPlayerIndex(0);
    setGamePhase('moving');
  }, [pendingMovements]);

  // Process next player movement
  const processNextMovement = useCallback(() => {
    if (currentMovingPlayerIndex >= pendingMovements.length) {
      // All movements done, check if game over
      if (availableStars.length === 0) {
        setGamePhase('finished');
      } else {
        handleNextTurn();
      }
      return;
    }
    
    const movement = pendingMovements[currentMovingPlayerIndex];
    const player = players.find(p => p.id === movement.playerId);
    if (!player) return;
    
    // Calculate gates passed
    const gatesPassed = getGatesPassed(player.boardPosition, movement.steps);
    const newPosition = (player.boardPosition + movement.steps) % TOTAL_STEPS;
    
    // Update player position
    setPlayers(prev => prev.map(p => 
      p.id === player.id ? { ...p, boardPosition: newPosition } : p
    ));
    
    // If gates were passed and stars available, show star selection
    if (gatesPassed.length > 0 && availableStars.length > 0) {
      setGatesPassedQueue(gatesPassed);
      setSelectingStarPlayer(player);
      setGamePhase('selectStar');
    } else {
      // Move to next player
      setTimeout(() => {
        setCurrentMovingPlayerIndex(prev => prev + 1);
      }, 500);
    }
  }, [currentMovingPlayerIndex, pendingMovements, players, availableStars]);

  // Effect to process movements
  useEffect(() => {
    if (gamePhase === 'moving') {
      const timer = setTimeout(() => {
        processNextMovement();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, currentMovingPlayerIndex, processNextMovement]);

  // Handle star selection - triggers reveal popup
  const handleSelectStar = useCallback((star: StarState) => {
    if (!selectingStarPlayer) return;
    
    // Store the selected star and show reveal popup
    setRevealingStar(star);
    setGamePhase('revealingStar');
  }, [selectingStarPlayer]);

  // Effect: Digital player auto-selects star when it's their turn
  useEffect(() => {
    if (gamePhase !== 'selectStar') return;
    if (!selectingStarPlayer || selectingStarPlayer.type !== 'digital') return;
    if (availableStars.length === 0) return;
    
    // Digital player "thinks" for 1-2 seconds then picks a random star
    const delay = 1000 + Math.random() * 1000;
    const timer = setTimeout(() => {
      const randomStar = availableStars[Math.floor(Math.random() * availableStars.length)];
      handleSelectStar(randomStar);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [gamePhase, selectingStarPlayer, availableStars, handleSelectStar]);

  // Handle reveal complete - actually award the star
  const handleStarRevealComplete = useCallback(() => {
    if (!selectingStarPlayer || !revealingStar) return;
    
    // Play star collection sound
    playSound('starCollect');
    
    // Award star to player
    setStars(prev => prev.map(s => 
      s.id === revealingStar.id ? { ...s, isEarned: true, earnedByPlayerId: selectingStarPlayer.id } : s
    ));
    
    // Update player score
    setPlayers(prev => prev.map(p => 
      p.id === selectingStarPlayer.id 
        ? { ...p, score: p.score + revealingStar.pointValue, starsCollected: p.starsCollected + 1 }
        : p
    ));
    
    // Check if more gates in queue
    const remainingGates = gatesPassedQueue.slice(1);
    const remainingStars = stars.filter(s => !s.isEarned && s.id !== revealingStar.id);
    
    // Clear revealing star
    setRevealingStar(null);
    
    if (remainingGates.length > 0 && remainingStars.length > 0) {
      setGatesPassedQueue(remainingGates);
      setGamePhase('selectStar');
    } else {
      // Done with this player's star selection
      setSelectingStarPlayer(null);
      setGatesPassedQueue([]);
      
      // Check if game over
      if (remainingStars.length === 0) {
        setGamePhase('finished');
      } else {
        // Move to next player in movement queue
        setCurrentMovingPlayerIndex(prev => prev + 1);
        setGamePhase('moving');
      }
    }
  }, [selectingStarPlayer, revealingStar, gatesPassedQueue, stars, playSound]);

  // Handle next turn
  const handleNextTurn = useCallback(() => {
    completeCurrentQuestion();
    setPlayerAnswers([]);
    setRoundSteps([]);
    setPendingMovements([]);
    setActiveHumanIndex(0);
    setWheelResult(null);
    setActiveTwist(null);
    setShowTwistChoice(false);
    
    // Handle extra turn
    if (extraTurnPending) {
      setExtraTurnPending(false);
      setGamePhase('spinning');
      return;
    }
    
    // Handle reverse play order
    if (reverseTurnsRemaining > 0) {
      setReverseTurnsRemaining(prev => prev - 1);
      if (reverseTurnsRemaining === 1) {
        setPlayOrderReversed(false);
      }
    }
    
    // Tick down modifiers
    tickModifiers();
    
    // Calculate next player index
    let nextIndex: number;
    if (playOrderReversed) {
      nextIndex = (currentTurnIndex - 1 + players.length) % players.length;
    } else {
      nextIndex = (currentTurnIndex + 1) % players.length;
    }
    
    // Skip frozen players (keep skipping until we find a non-frozen player)
    let attempts = 0;
    while (isPlayerFrozen(players[nextIndex]?.id, modifiers) && attempts < players.length) {
      // Remove the frozen modifier for this player since they're missing their turn
      removeModifier(players[nextIndex].id, 'frozen');
      // Move to next player
      if (playOrderReversed) {
        nextIndex = (nextIndex - 1 + players.length) % players.length;
      } else {
        nextIndex = (nextIndex + 1) % players.length;
      }
      attempts++;
    }
    
    setCurrentTurnIndex(nextIndex);
    setGamePhase('spinning');
  }, [players.length, players, completeCurrentQuestion, extraTurnPending, playOrderReversed, reverseTurnsRemaining, currentTurnIndex, tickModifiers, modifiers, removeModifier, setActiveTwist]);

  // Handle bonus question answer (only current player answers)
  const handleBonusQuestionAnswer = useCallback((answer: AnswerOption) => {
    if (!currentTurnPlayer || !currentQuestion || gamePhase !== 'twistBonusQ') return;
    
    const isCorrect = answer.isCorrect;
    
    // Show feedback
    if (isCorrect) {
      playSound('correct');
      // Player advances bonusQuestionSteps
      const newPosition = (currentTurnPlayer.boardPosition + bonusQuestionSteps) % TOTAL_STEPS;
      
      // Check if player passes any gates
      const gatesPassed = getGatesPassed(currentTurnPlayer.boardPosition, bonusQuestionSteps);
      
      setPlayers(prev => prev.map(p =>
        p.id === currentTurnPlayer.id ? { ...p, boardPosition: newPosition } : p
      ));
      
      // If gates passed and stars available, show star selection
      if (gatesPassed.length > 0 && availableStars.length > 0) {
        setGatesPassedQueue(gatesPassed);
        setSelectingStarPlayer(currentTurnPlayer);
        setTimeout(() => {
          completeCurrentQuestion();
          setActiveTwist(null);
          setGamePhase('selectStar');
        }, 1500);
      } else {
        setTimeout(() => {
          completeCurrentQuestion();
          setActiveTwist(null);
          handleNextTurn();
        }, 1500);
      }
    } else {
      playSound('wrong');
      // Wrong answer - no movement, go to next turn
      setTimeout(() => {
        completeCurrentQuestion();
        setActiveTwist(null);
        handleNextTurn();
      }, 1500);
    }
  }, [currentTurnPlayer, currentQuestion, gamePhase, bonusQuestionSteps, availableStars, playSound, completeCurrentQuestion, setActiveTwist, handleNextTurn]);

  // Handle twist card confirmation (execute the effect)
  const handleTwistConfirm = useCallback(() => {
    if (!activeTwist || !currentTurnPlayer) return;
    
    // Use the centralized twist handler
    const result = executeImmediateTwist(activeTwist, currentTurnPlayer, players, stars);
    
    // Apply updates from result
    if (result.players) {
      setPlayers(result.players);
    }
    if (result.stars) {
      setStars(result.stars);
    }
    if (result.addModifier) {
      addModifier(result.addModifier);
    }
    if (result.extraTurnPending) {
      setExtraTurnPending(true);
    }
    if (result.reverseOrder) {
      setPlayOrderReversed(true);
      setReverseTurnsRemaining(result.reverseOrder);
    }
    
    // Handle navigation based on result
    if (result.showChoicePopup) {
      setShowTwistChoice(true);
      setGamePhase('twistChoice');
      return;
    }
    
    if (result.goToBonusQuestion) {
      // Start bonus question - only current player answers
      const randomDifficulty = (Math.floor(Math.random() * 5) + 1) as DifficultyLevel;
      const forcedCategory = getForcedCategory(currentTurnPlayer.id, modifiers);
      selectQuestionByDifficulty(randomDifficulty, forcedCategory);
      setBonusQuestionSteps(activeTwist.effectValue || 5);
      setGamePhase('twistBonusQ');
      return;
    }
    
    if (result.goToSpinning) {
      setActiveTwist(null);
      setGamePhase('spinning');
      return;
    }
    
    // Default: go to next turn
    if (result.goToNextTurn) {
      setActiveTwist(null);
      setTimeout(() => {
        handleNextTurn();
      }, 1000);
    }
  }, [activeTwist, currentTurnPlayer, players, stars, addModifier, setActiveTwist, handleNextTurn, selectQuestionByDifficulty]);

  // Handle twist choice selection
  const handleTwistChoosePlayer = useCallback((targetPlayer: Player) => {
    if (!activeTwist || !currentTurnPlayer) return;
    
    switch (activeTwist.effectType) {
      case 'steal_star': {
        // Transfer a random star from target to current player
        const targetStars = stars.filter(s => s.earnedByPlayerId === targetPlayer.id);
        if (targetStars.length > 0) {
          const randomStar = targetStars[Math.floor(Math.random() * targetStars.length)];
          setStars(prev => prev.map(s => 
            s.id === randomStar.id ? { ...s, earnedByPlayerId: currentTurnPlayer.id } : s
          ));
          setPlayers(prev => prev.map(p => {
            if (p.id === targetPlayer.id) {
              return { ...p, score: p.score - randomStar.pointValue, starsCollected: p.starsCollected - 1 };
            }
            if (p.id === currentTurnPlayer.id) {
              return { ...p, score: p.score + randomStar.pointValue, starsCollected: p.starsCollected + 1 };
            }
            return p;
          }));
        }
        break;
      }
      
      case 'swap_positions': {
        // Swap board positions
        const currentPos = currentTurnPlayer.boardPosition;
        const targetPos = targetPlayer.boardPosition;
        setPlayers(prev => prev.map(p => {
          if (p.id === currentTurnPlayer.id) return { ...p, boardPosition: targetPos };
          if (p.id === targetPlayer.id) return { ...p, boardPosition: currentPos };
          return p;
        }));
        break;
      }
      
      case 'freeze_player': {
        // Add frozen modifier to target
        addModifier({
          playerId: targetPlayer.id,
          type: 'frozen',
          turnsRemaining: 1,
        });
        break;
      }
      
      case 'points_swap': {
        // Swap points if current has less
        if (currentTurnPlayer.score < targetPlayer.score) {
          const currentScore = currentTurnPlayer.score;
          const targetScore = targetPlayer.score;
          setPlayers(prev => prev.map(p => {
            if (p.id === currentTurnPlayer.id) return { ...p, score: targetScore };
            if (p.id === targetPlayer.id) return { ...p, score: currentScore };
            return p;
          }));
        }
        break;
      }
    }
    
    // After twist choice, go to next turn (twist replaces question)
    setShowTwistChoice(false);
    setActiveTwist(null);
    setTimeout(() => {
      handleNextTurn();
    }, 1000);
  }, [activeTwist, currentTurnPlayer, stars, addModifier, setActiveTwist, handleNextTurn]);

  const handleTwistChooseGate = useCallback((gatePosition: number) => {
    if (!currentTurnPlayer) return;
    
    setPlayers(prev => prev.map(p => 
      p.id === currentTurnPlayer.id ? { ...p, boardPosition: gatePosition } : p
    ));
    
    setShowTwistChoice(false);
    setActiveTwist(null);
    setTimeout(() => {
      handleNextTurn();
    }, 1000);
  }, [currentTurnPlayer, setActiveTwist, handleNextTurn]);

  const handleTwistChooseDifficulty = useCallback((difficulty: DifficultyLevel) => {
    setChosenDifficulty(difficulty);
    setShowTwistChoice(false);
    setActiveTwist(null);
    
    // Start spinning phase again with chosen difficulty ready
    setGamePhase('spinning');
  }, [setActiveTwist]);

  const handleTwistChooseCategory = useCallback((category: KnowledgeCategory) => {
    if (!currentTurnPlayer || !activeTwist) return;
    
    addModifier({
      playerId: currentTurnPlayer.id,
      type: 'category_master',
      turnsRemaining: activeTwist.effectValue || 3,
      value: category,
    });
    
    setShowTwistChoice(false);
    setActiveTwist(null);
    setTimeout(() => {
      handleNextTurn();
    }, 1000);
  }, [currentTurnPlayer, activeTwist, addModifier, setActiveTwist, handleNextTurn]);

  // Handle free star selection (from twist)
  const handleTwistFreeStar = useCallback((star: StarState) => {
    if (!currentTurnPlayer) return;
    
    // Award star to player
    setStars(prev => prev.map(s => 
      s.id === star.id ? { ...s, isEarned: true, earnedByPlayerId: currentTurnPlayer.id } : s
    ));
    setPlayers(prev => prev.map(p => 
      p.id === currentTurnPlayer.id 
        ? { ...p, score: p.score + star.pointValue, starsCollected: p.starsCollected + 1 }
        : p
    ));
    
    setShowTwistChoice(false);
    setActiveTwist(null);
    setTimeout(() => {
      handleNextTurn();
    }, 1000);
  }, [currentTurnPlayer, setActiveTwist, handleNextTurn]);

  // Handle star peek
  const handleStarPeek = useCallback((star: StarState) => {
    setPeekedStarId(star.id);
    // Show peek for 3 seconds then proceed to next turn
    setTimeout(() => {
      setPeekedStarId(null);
      setShowTwistChoice(false);
      setActiveTwist(null);
      handleNextTurn();
    }, 3000);
  }, [setActiveTwist, handleNextTurn]);

  // Effect: Digital player auto-handles twist
  useEffect(() => {
    if (gamePhase !== 'twist') return;
    if (!currentTurnPlayer || currentTurnPlayer.type !== 'digital') return;
    if (!activeTwist) return;
    
    // Digital player "thinks" then confirms twist
    const timer = setTimeout(() => {
      handleTwistConfirm();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [gamePhase, currentTurnPlayer, activeTwist, handleTwistConfirm]);

  // Effect: Digital player auto-answers bonus question
  useEffect(() => {
    if (gamePhase !== 'twistBonusQ') return;
    if (!currentTurnPlayer || currentTurnPlayer.type !== 'digital') return;
    if (!currentQuestion) return;
    
    // Digital player "thinks" for 1-2 seconds then answers randomly
    const thinkingTime = 1000 + Math.random() * 1000;
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * currentQuestion.answers.length);
      const randomAnswer = currentQuestion.answers[randomIndex];
      handleBonusQuestionAnswer(randomAnswer);
    }, thinkingTime);
    
    return () => clearTimeout(timer);
  }, [gamePhase, currentTurnPlayer, currentQuestion, handleBonusQuestionAnswer]);

  // Effect: Digital player auto-handles twist choice
  useEffect(() => {
    if (gamePhase !== 'twistChoice') return;
    if (!currentTurnPlayer || currentTurnPlayer.type !== 'digital') return;
    if (!activeTwist) return;
    
    const delay = 1500 + Math.random() * 1000;
    const timer = setTimeout(() => {
      // Make a random choice based on twist type
      if (activeTwist.targetPlayer === 'choose') {
        const otherPlayers = players.filter(p => p.id !== currentTurnPlayer.id);
        if (activeTwist.effectType === 'steal_star') {
          const withStars = otherPlayers.filter(p => p.starsCollected > 0);
          if (withStars.length > 0) {
            handleTwistChoosePlayer(withStars[Math.floor(Math.random() * withStars.length)]);
          } else {
            // Skip - no one has stars, go to next turn
            setShowTwistChoice(false);
            setActiveTwist(null);
            handleNextTurn();
          }
        } else if (otherPlayers.length > 0) {
          handleTwistChoosePlayer(otherPlayers[Math.floor(Math.random() * otherPlayers.length)]);
        }
      } else if (activeTwist.effectType === 'teleport_gate') {
        handleTwistChooseGate(GATE_POSITIONS[Math.floor(Math.random() * GATE_POSITIONS.length)]);
      } else if (activeTwist.effectType === 'difficulty_choice') {
        handleTwistChooseDifficulty((Math.floor(Math.random() * 5) + 1) as DifficultyLevel);
      } else if (activeTwist.effectType === 'category_master') {
        const categories = gameSettings.selectedCategories;
        handleTwistChooseCategory(categories[Math.floor(Math.random() * categories.length)]);
      } else if (activeTwist.effectType === 'free_star') {
        if (availableStars.length > 0) {
          handleTwistFreeStar(availableStars[Math.floor(Math.random() * availableStars.length)]);
        }
      } else if (activeTwist.effectType === 'star_peek') {
        if (availableStars.length > 0) {
          handleStarPeek(availableStars[Math.floor(Math.random() * availableStars.length)]);
        }
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [gamePhase, currentTurnPlayer, activeTwist, players, gameSettings.selectedCategories, availableStars, 
      handleTwistChoosePlayer, handleTwistChooseGate, handleTwistChooseDifficulty, 
      handleTwistChooseCategory, handleTwistFreeStar, handleStarPeek, selectQuestionByDifficulty, setActiveTwist]);

  // Play winner sound when game finishes
  useEffect(() => {
    if (gamePhase === 'finished' || isGameOver) {
      playSound('winner');
    }
  }, [gamePhase, isGameOver, playSound]);

  // Loading state
  if (isLoading) {
    return <LoadingQuestions message="מכינים את המשחק..." />;
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-playful flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">😢</span>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">שגיאה</h2>
        <p className="text-[var(--text-secondary)] mb-6">{errorMessage}</p>
        <Link href="/setup" className="btn-primary">חזרה להתחלה</Link>
      </div>
    );
  }

  // Game not ready
  if (players.length === 0) {
    return <LoadingQuestions message="טוען משחק..." />;
  }

  // Game finished screen
  if (gamePhase === 'finished' || isGameOver) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    return (
      <div className="min-h-screen bg-playful flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center"
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-7xl block mb-4"
          >
            🏆
          </motion.span>
          
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">כל הכוכבים נאספו!</h2>
          <p className="text-lg text-[var(--text-secondary)] mb-6">והזוכה הוא...</p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-2xl mb-6"
            style={{ backgroundColor: `${playerColors[winner.id]}20`, border: `3px solid ${playerColors[winner.id]}` }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: playerColors[winner.id] }}>
              <span className="text-3xl">{winner.avatarEmoji}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: playerColors[winner.id] }}>{winner.name}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{winner.score} נקודות! 🎉</p>
            <p className="text-sm text-[var(--text-secondary)]">({winner.starsCollected} כוכבים)</p>
          </motion.div>
          
          <div className="space-y-2 mb-6">
            {sortedPlayers.map((player, index) => (
              <motion.div key={player.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                <span className="text-lg w-6">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: playerColors[player.id] }}>
                  <span>{player.avatarEmoji}</span>
                </div>
                <span className="flex-1 font-semibold text-start">{player.name}</span>
                <span className="text-xs text-[var(--text-secondary)]">⭐{player.starsCollected}</span>
                <span className="font-bold" style={{ color: playerColors[player.id] }}>{player.score}</span>
              </motion.div>
            ))}
          </div>
          
          <Link href="/setup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary text-xl px-8 py-4 w-full">
              🎮 משחק חדש
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-playful relative overflow-hidden">
      {/* Countdown overlay */}
      <AnimatePresence>
        {gamePhase === 'countdown' && (
          <RevealCountdown seconds={2} onComplete={handleCountdownComplete} onTick={() => playSound('countdown')} />
        )}
      </AnimatePresence>

      {/* Star selection instruction for twist */}
      {gamePhase === 'twistChoice' && (activeTwist?.effectType === 'free_star' || activeTwist?.effectType === 'star_peek') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3"
        >
          <span className="text-2xl">{activeTwist?.emoji}</span>
          <span className="font-bold">
            {activeTwist?.effectType === 'free_star' 
              ? 'בחר כוכב מהלוח!' 
              : 'בחר כוכב להציץ בו!'}
          </span>
          <span className="text-2xl animate-bounce">👇</span>
        </motion.div>
      )}

      {/* Star reveal popup */}
      <StarRevealPopup
        isOpen={gamePhase === 'revealingStar' && revealingStar !== null}
        star={revealingStar}
        player={selectingStarPlayer}
        playerColor={selectingStarPlayer ? playerColors[selectingStarPlayer.id] : PLAYER_COLORS[0]}
        onComplete={handleStarRevealComplete}
      />

      {/* Twist card popup */}
      <TwistCardPopup
        isOpen={gamePhase === 'twist' && activeTwist !== null}
        twist={activeTwist}
        player={currentTurnPlayer}
        playerColor={currentTurnPlayer ? playerColors[currentTurnPlayer.id] : PLAYER_COLORS[0]}
        onConfirm={handleTwistConfirm}
        isDigitalPlayer={currentTurnPlayer?.type === 'digital'}
      />

      {/* Twist choice popup */}
      <TwistChoicePopup
        isOpen={gamePhase === 'twistChoice' && showTwistChoice && activeTwist !== null}
        twist={activeTwist}
        currentPlayer={currentTurnPlayer}
        playerColor={currentTurnPlayer ? playerColors[currentTurnPlayer.id] : PLAYER_COLORS[0]}
        allPlayers={players}
        playerColors={playerColors}
        onChoosePlayer={handleTwistChoosePlayer}
        onChooseGate={handleTwistChooseGate}
        onChooseDifficulty={handleTwistChooseDifficulty}
        onChooseCategory={handleTwistChooseCategory}
        availableCategories={gameSettings.selectedCategories}
      />

      {/* Free star selection for twist (reuse the star selection banner logic) */}
      <AnimatePresence>
        {gamePhase === 'twistChoice' && activeTwist?.effectType === 'free_star' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 p-4"
          >
            <div 
              className="max-w-md mx-auto rounded-2xl p-4 text-center text-white shadow-2xl"
              style={{ backgroundColor: currentTurnPlayer ? playerColors[currentTurnPlayer.id] : PLAYER_COLORS[0] }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-3xl inline-block"
              >
                ⭐🎁
              </motion.span>
              <p className="font-bold text-lg mt-1">
                {currentTurnPlayer?.name} קיבל/ה כוכב חינם!
              </p>
              <p className="text-sm opacity-90">
                {currentTurnPlayer?.type === 'digital' 
                  ? '🤖 הרובוט בוחר כוכב...'
                  : 'לחץ/י על כוכב בלוח כדי לבחור'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star peek overlay */}
      <AnimatePresence>
        {peekedStarId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl"
            >
              <span className="text-6xl block mb-4">👀</span>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">הצצה לכוכב!</h3>
              <p className="text-lg text-[var(--text-secondary)] mb-4">רק אתה/את רואה:</p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-5xl font-bold text-[var(--color-secondary)]"
              >
                {stars.find(s => s.id === peekedStarId)?.pointValue} ⭐
              </motion.div>
              <p className="text-sm text-[var(--text-secondary)] mt-4">נעלם בעוד 3 שניות...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star selection banner when active */}
      <AnimatePresence>
        {gamePhase === 'selectStar' && selectingStarPlayer && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 p-4"
          >
            <div 
              className="max-w-md mx-auto rounded-2xl p-4 text-center text-white shadow-2xl"
              style={{ backgroundColor: playerColors[selectingStarPlayer.id] }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-3xl inline-block"
              >
                🚪⭐
              </motion.span>
              <p className="font-bold text-lg mt-1">
                {selectingStarPlayer.name} עבר/ה שער!
              </p>
              <p className="text-sm opacity-90">
                {selectingStarPlayer.type === 'digital' 
                  ? '🤖 הרובוט בוחר כוכב...'
                  : 'לחץ/י על כוכב בלוח כדי לבחור'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results popup with modified content for steps */}
      <AnimatePresence>
        {gamePhase === 'results' && roundSteps.length > 0 && currentQuestion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-3xl p-6 text-center text-white">
                <span className="text-5xl block mb-2">✓</span>
                <p className="text-lg font-medium opacity-90">התשובה הנכונה:</p>
                <p className="text-2xl font-bold mt-1">{currentQuestion.answers.find(a => a.isCorrect)?.text}</p>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-4">🚶 צעדים שנצברו:</h3>
                <div className="space-y-2">
                  {roundSteps.map((item, index) => (
                    <motion.div key={item.player.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${item.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: playerColors[item.player.id] }}>
                        <span className="text-lg">{item.player.avatarEmoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">
                          {item.player.name}
                          {item.isCurrentTurn && <span className="text-xs bg-[var(--color-accent)] px-2 py-0.5 rounded-full ms-2">תורו</span>}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">{item.isCorrect ? '✓ נכון!' : '✗ לא נכון'}</p>
                      </div>
                      <div className={`text-xl font-bold px-3 py-1 rounded-lg ${item.stepsEarned > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {item.stepsEarned > 0 ? `+${item.stepsEarned}` : '0'}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center text-sm text-blue-700">
                  <p>🎯 בתור שלך: <strong>{currentQuestion.difficulty} צעדים</strong></p>
                  <p>👥 לא בתור שלך: <strong>1 צעד</strong></p>
                  <p className="mt-1 text-xs">🚪 כשעוברים שער - בוחרים כוכב!</p>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleStartMovement}
                  className="w-full btn-primary text-xl py-4 mt-6">
                  🚶 התחל תנועה
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-2">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-2">
          <Link href="/setup" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm">← משחק חדש</Link>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">🎮 משחק טריוויה</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMute}
              className="text-xl hover:scale-110 transition-transform"
              title={soundMuted ? 'הפעל צלילים' : 'השתק צלילים'}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
            <div className="text-sm text-[var(--text-secondary)]">⭐ נותרו: {availableStars.length}</div>
          </div>
        </motion.div>

        {/* Main game area - Board centered */}
        <div className="flex flex-col items-center mb-4">
          {/* Circular Board with Stars - Large and centered */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 rounded-3xl p-3 shadow-lg">
            <CircularBoard
              players={players}
              playerColors={playerColors}
              playerPositions={playerPositions}
              stars={stars}
              starSelectionActive={gamePhase === 'selectStar' || (gamePhase === 'twistChoice' && (activeTwist?.effectType === 'free_star' || activeTwist?.effectType === 'star_peek'))}
              onStarClick={
                gamePhase === 'twistChoice' && activeTwist?.effectType === 'free_star' 
                  ? handleTwistFreeStar 
                  : gamePhase === 'twistChoice' && activeTwist?.effectType === 'star_peek'
                  ? handleStarPeek
                  : handleSelectStar
              }
              peekedStarId={peekedStarId}
            />
            {gamePhase === 'moving' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-[var(--color-primary)] font-medium text-sm">
                🚶 שחקנים זזים...
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Bottom section: Spinner (left) + Players (right) */}
        <div className="flex flex-row gap-4 items-start justify-center">
          {/* Small Spinner - Left side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 rounded-2xl p-3 shadow-md"
          >
            {gamePhase === 'spinning' ? (
              <SpinningWheel
                onSpinComplete={handleWheelComplete}
                onSpinStart={() => playSound('spin')}
                playerName={currentTurnPlayer?.name || ''}
                playerColor={playerColors[currentTurnPlayer?.id] || PLAYER_COLORS[0]}
                size="small"
                compact
                autoSpinDelay={currentTurnPlayer?.type === 'digital' ? 1500 : undefined}
              />
            ) : (
              <div className="flex flex-col items-center" style={{ width: 160 }}>
                <p className="text-xs text-[var(--text-secondary)] mb-1">תור:</p>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                  style={{ backgroundColor: playerColors[currentTurnPlayer?.id] }}
                >
                  <span className="text-lg">{currentTurnPlayer?.avatarEmoji}</span>
                </div>
                <p className="text-sm font-bold truncate max-w-full" style={{ color: playerColors[currentTurnPlayer?.id] }}>
                  {currentTurnPlayer?.name}
                </p>
                {wheelResult && (
                  <div className="mt-2 px-3 py-1 rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: wheelResult === 'twist' ? '#8B5CF6' : '#4ECDC4' }}>
                    {wheelResult === 'twist' ? '🌀 טוויסט' : `רמה ${wheelResult}`}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Players score cards - Right side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 rounded-2xl p-3 shadow-md"
          >
            <h3 className="text-sm font-bold text-[var(--text-primary)] text-center mb-2">🏆 שחקנים</h3>
            <div className="flex flex-col gap-1.5" style={{ minWidth: 180 }}>
              {players.map((player, index) => (
                <PlayerScoreCard
                  key={player.id}
                  player={player}
                  isCurrentTurn={index === currentTurnIndex}
                  hasAnswered={playerAnswers.some(pa => pa.playerId === player.id)}
                  color={playerColors[player.id]}
                  index={index}
                  playerStars={stars.filter(s => s.earnedByPlayerId === player.id)}
                />
              ))}
            </div>
          </motion.div>
        </div>

      </main>

      {/* Question Phase Popup */}
      <AnimatePresence>
        {gamePhase === 'question' && currentQuestion && (
          <motion.div
            key="question-popup"
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
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header with player info */}
              <div 
                className="rounded-t-3xl p-4 text-center"
                style={{ backgroundColor: playerColors[currentTurnPlayer?.id], color: 'white' }}
              >
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
                      <span className="text-2xl">{currentTurnPlayer?.avatarEmoji}</span>
                    </div>
                    <span className="text-xl font-bold">{currentTurnPlayer?.name}</span>
                  </div>
                  <span className="opacity-60">|</span>
                  <div className="text-sm">
                    <span className="opacity-80">רמת קושי: </span>
                    <span className="font-bold">{'⭐'.repeat(currentQuestion.difficulty)}</span>
                    <span className="opacity-80"> ({currentQuestion.difficulty} צעדים)</span>
                  </div>
                </div>
              </div>

              {/* Question content */}
              <div className="p-5">
                {/* Active human player indicator */}
                {activeHumanPlayer && humanPlayers.length > 1 && !playerAnswers.some(pa => pa.playerId === activeHumanPlayer.id) && (
                  <motion.div 
                    key={activeHumanPlayer.id} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 rounded-xl text-center"
                    style={{ backgroundColor: `${playerColors[activeHumanPlayer.id]}20`, border: `2px dashed ${playerColors[activeHumanPlayer.id]}` }}
                  >
                    <span className="font-bold" style={{ color: playerColors[activeHumanPlayer.id] }}>
                      {activeHumanPlayer.avatarEmoji} {activeHumanPlayer.name}
                    </span>
                    <span className="text-[var(--text-secondary)]"> - בחר/י את התשובה שלך!</span>
                  </motion.div>
                )}

                {/* Digital players thinking indicator */}
                {digitalPlayers.filter(dp => !playerAnswers.some(pa => pa.playerId === dp.id)).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="mb-3 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      🤖
                    </motion.span>
                    <span>רובוטים חושבים...</span>
                    {digitalPlayers.filter(dp => !playerAnswers.some(pa => pa.playerId === dp.id)).map(dp => (
                      <span 
                        key={dp.id} 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: `${playerColors[dp.id]}30`, color: playerColors[dp.id] }}
                      >
                        {dp.avatarEmoji}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* Question Card */}
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={questionsAnswered + 1}
                  totalQuestions={100}
                  currentPlayer={currentTurnPlayer}
                  players={players}
                  playerColors={playerColors}
                  playerAnswers={playerAnswers}
                  allPlayersAnswered={allPlayersAnswered}
                  isRevealed={false}
                  onAnswerClick={handleAnswerClick}
                  activePlayerId={activeHumanPlayer?.id || null}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bonus Question Phase Popup (Twist) */}
        {gamePhase === 'twistBonusQ' && currentQuestion && currentTurnPlayer && (
          <motion.div
            key="bonus-question-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header - Bonus Question Badge */}
              <div 
                className="rounded-t-3xl p-4 text-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)', color: 'white' }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl">🎯</span>
                  <span className="text-2xl font-bold">שאלת בונוס!</span>
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: playerColors[currentTurnPlayer.id] }}
                  >
                    <span className="text-xl">{currentTurnPlayer.avatarEmoji}</span>
                  </div>
                  <span className="text-lg font-bold">{currentTurnPlayer.name}</span>
                </div>
                <div className="mt-2 text-sm opacity-90">
                  ענה נכון ותתקדם <span className="font-bold text-lg">{bonusQuestionSteps}</span> צעדים!
                </div>
              </div>

              {/* Question content */}
              <div className="p-5">
                {/* Digital player thinking */}
                {currentTurnPlayer.type === 'digital' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="mb-4 flex items-center justify-center gap-2 text-[var(--text-secondary)]"
                  >
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      🤖
                    </motion.span>
                    <span>{currentTurnPlayer.name} חושב...</span>
                  </motion.div>
                )}

                {/* Question Card for bonus question */}
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={questionsAnswered + 1}
                  totalQuestions={100}
                  currentPlayer={currentTurnPlayer}
                  players={[currentTurnPlayer]} // Only show current player
                  playerColors={playerColors}
                  playerAnswers={[]}
                  allPlayersAnswered={false}
                  isRevealed={false}
                  onAnswerClick={currentTurnPlayer.type === 'human' ? handleBonusQuestionAnswer : undefined}
                  activePlayerId={currentTurnPlayer.type === 'human' ? currentTurnPlayer.id : null}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * GamePage - Main game page with Suspense boundary
 */
export default function GamePage() {
  return (
    <Suspense fallback={<LoadingQuestions message="טוען משחק..." />}>
      <GameContent />
    </Suspense>
  );
}
