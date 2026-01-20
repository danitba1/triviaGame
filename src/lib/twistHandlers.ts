/**
 * Twist Effect Handlers - Clear documentation and logic for each twist type
 * 
 * This file provides handler functions for each twist effect, making the game
 * logic clearer and easier to maintain.
 */

import { type Player, type StarState, type TwistCard, type TwistEffectType, type PlayerModifier, type DifficultyLevel, type KnowledgeCategory, BOARD_GATE_POSITIONS } from '@/types/game.types';

const TOTAL_STEPS = 25;

/**
 * TWIST EFFECT DOCUMENTATION
 * ==========================
 * 
 * Each twist effect has:
 * - requiresChoice: Does player need to make a selection?
 * - requiresQuestion: Does this twist involve answering a question?
 * - targetPlayer: Who does this affect? ('self', 'others', 'choose', 'all')
 * - effectValue: Optional numeric value (steps, points, turns, etc.)
 * 
 * MOVEMENT TWISTS:
 * ----------------
 * 1. move_back_gate: Player goes back to previous gate (or back N steps if effectValue set)
 * 2. others_back_gate: All OTHER players go back to their previous gates
 * 3. teleport_gate [choice]: Player chooses any gate to teleport to
 * 4. random_teleport: Player teleports to a random board position
 * 5. swap_positions [choice]: Swap board position with chosen player
 * 6. everyone_moves: Everyone moves N steps forward (effectValue)
 * 
 * STAR TWISTS:
 * ------------
 * 7. free_star [choice]: Player chooses any available star to collect
 * 8. steal_star [choice]: Take a star from chosen player (who has stars)
 * 9. upgrade_zero_star: If player has 0-point star, upgrade it to 250 points
 * 10. star_peek [choice]: Peek at one hidden star's value (only you see it)
 * 
 * POINTS/STEPS TWISTS:
 * --------------------
 * 11. instant_points: Get instant points added to score (effectValue)
 * 12. points_swap [choice]: Swap scores with chosen player (only if you have less)
 * 13. double_next [modifier]: Next correct answer earns double steps
 * 
 * QUESTION TWISTS:
 * ----------------
 * 14. bonus_question [question]: Answer alone - if correct, advance N steps (effectValue)
 * 15. difficulty_choice [choice]: Choose difficulty for the next question
 * 16. category_master [choice, modifier]: Choose category for next N questions (effectValue)
 * 
 * TURN TWISTS:
 * ------------
 * 17. extra_turn: Player gets another turn after this one
 * 18. freeze_player [choice, modifier]: Chosen player skips their next turn
 * 19. reverse_order: Reverse play order for N turns (effectValue)
 * 20. shield [modifier]: Protected from negative twist effects for N turns (effectValue)
 */

/** Result of executing a twist effect */
export interface TwistExecutionResult {
  /** Updated players array */
  players?: Player[];
  /** Updated stars array */
  stars?: StarState[];
  /** Modifier to add */
  addModifier?: PlayerModifier;
  /** Should skip to next turn after this? */
  goToNextTurn: boolean;
  /** Should show choice popup? */
  showChoicePopup: boolean;
  /** Should proceed to bonus question phase? */
  goToBonusQuestion: boolean;
  /** Should proceed to spinning phase (for difficulty choice)? */
  goToSpinning: boolean;
  /** Message to show */
  message?: string;
  /** Extra turn pending? */
  extraTurnPending?: boolean;
  /** Reverse play order? */
  reverseOrder?: number;
}

/**
 * Find the previous gate position for a given board position
 */
export function findPreviousGate(currentPosition: number): number {
  // Find the highest gate that is less than current position
  const previousGates = BOARD_GATE_POSITIONS.filter(g => g < currentPosition);
  if (previousGates.length > 0) {
    return Math.max(...previousGates);
  }
  // If at or before first gate, wrap to last gate
  return BOARD_GATE_POSITIONS[BOARD_GATE_POSITIONS.length - 1];
}

/**
 * Execute immediate twist effects (ones that don't require choices)
 */
export function executeImmediateTwist(
  twist: TwistCard,
  currentPlayer: Player,
  players: Player[],
  stars: StarState[],
): TwistExecutionResult {
  
  // If twist requires a choice, show the choice popup
  if (twist.requiresChoice) {
    return {
      goToNextTurn: false,
      showChoicePopup: true,
      goToBonusQuestion: false,
      goToSpinning: false,
    };
  }
  
  // Handle each effect type
  switch (twist.effectType) {
    
    // === MOVEMENT TWISTS ===
    
    case 'move_back_gate': {
      // If effectValue is set, go back N steps instead of to gate
      if (twist.effectValue) {
        const newPos = (currentPlayer.boardPosition - twist.effectValue + TOTAL_STEPS) % TOTAL_STEPS;
        const updatedPlayers = players.map(p =>
          p.id === currentPlayer.id ? { ...p, boardPosition: newPos } : p
        );
        return {
          players: updatedPlayers,
          goToNextTurn: true,
          showChoicePopup: false,
          goToBonusQuestion: false,
          goToSpinning: false,
          message: `${currentPlayer.name} חזר ${twist.effectValue} צעדים אחורה!`,
        };
      }
      
      // Go back to previous gate
      const prevGate = findPreviousGate(currentPlayer.boardPosition);
      const updatedPlayers = players.map(p =>
        p.id === currentPlayer.id ? { ...p, boardPosition: prevGate } : p
      );
      return {
        players: updatedPlayers,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `${currentPlayer.name} חזר לשער הקודם!`,
      };
    }
    
    case 'others_back_gate': {
      // Move all OTHER players back to their previous gates
      const updatedPlayers = players.map(p => {
        if (p.id === currentPlayer.id) return p;
        const prevGate = findPreviousGate(p.boardPosition);
        return { ...p, boardPosition: prevGate };
      });
      return {
        players: updatedPlayers,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: 'כל השחקנים האחרים חזרו לשער הקודם שלהם!',
      };
    }
    
    case 'random_teleport': {
      const randomPos = Math.floor(Math.random() * TOTAL_STEPS);
      const updatedPlayers = players.map(p =>
        p.id === currentPlayer.id ? { ...p, boardPosition: randomPos } : p
      );
      return {
        players: updatedPlayers,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `${currentPlayer.name} התקפל למיקום ${randomPos}!`,
      };
    }
    
    case 'everyone_moves': {
      const steps = twist.effectValue || 2;
      const updatedPlayers = players.map(p => ({
        ...p,
        boardPosition: (p.boardPosition + steps) % TOTAL_STEPS,
      }));
      return {
        players: updatedPlayers,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `כולם התקדמו ${steps} צעדים!`,
      };
    }
    
    // === STAR TWISTS ===
    
    case 'upgrade_zero_star': {
      // Find if player has a 0-point star
      const zeroStar = stars.find(
        s => s.earnedByPlayerId === currentPlayer.id && s.pointValue === 0
      );
      
      if (zeroStar) {
        // Upgrade the star to 250 points
        const updatedStars = stars.map(s =>
          s.id === zeroStar.id ? { ...s, pointValue: 250 } : s
        );
        // Also update player's score (+250 since it was 0)
        const updatedPlayers = players.map(p =>
          p.id === currentPlayer.id ? { ...p, score: p.score + 250 } : p
        );
        return {
          players: updatedPlayers,
          stars: updatedStars,
          goToNextTurn: true,
          showChoicePopup: false,
          goToBonusQuestion: false,
          goToSpinning: false,
          message: `🌟 הכוכב עם 0 נקודות שודרג ל-250 נקודות!`,
        };
      }
      
      return {
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `אין לך כוכב עם 0 נקודות לשדרוג.`,
      };
    }
    
    // === POINTS TWISTS ===
    
    case 'instant_points': {
      const points = twist.effectValue || 50;
      const updatedPlayers = players.map(p =>
        p.id === currentPlayer.id ? { ...p, score: p.score + points } : p
      );
      return {
        players: updatedPlayers,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `${currentPlayer.name} קיבל ${points} נקודות!`,
      };
    }
    
    case 'double_next': {
      return {
        addModifier: {
          playerId: currentPlayer.id,
          type: 'double_next',
          turnsRemaining: 2, // This turn + next turn
          value: 2,
        },
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `התשובה הנכונה הבאה של ${currentPlayer.name} שווה כפול!`,
      };
    }
    
    // === QUESTION TWISTS ===
    
    case 'bonus_question': {
      // Proceed to bonus question phase
      return {
        goToNextTurn: false,
        showChoicePopup: false,
        goToBonusQuestion: true,
        goToSpinning: false,
        message: `שאלת בונוס! ענה נכון ותתקדם ${twist.effectValue || 5} צעדים!`,
      };
    }
    
    // === TURN TWISTS ===
    
    case 'extra_turn': {
      return {
        extraTurnPending: true,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `${currentPlayer.name} יקבל תור נוסף!`,
      };
    }
    
    case 'reverse_order': {
      return {
        reverseOrder: twist.effectValue || 3,
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `סדר המשחק התהפך ל-${twist.effectValue || 3} תורות!`,
      };
    }
    
    case 'shield': {
      return {
        addModifier: {
          playerId: currentPlayer.id,
          type: 'shield',
          turnsRemaining: twist.effectValue || 2,
        },
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
        message: `${currentPlayer.name} מוגן מטוויסטים שליליים ל-${twist.effectValue || 2} תורות!`,
      };
    }
    
    default:
      // For any unhandled cases, just proceed to next turn
      return {
        goToNextTurn: true,
        showChoicePopup: false,
        goToBonusQuestion: false,
        goToSpinning: false,
      };
  }
}

/**
 * Check if a player should skip their turn (frozen modifier)
 */
export function isPlayerFrozen(playerId: string, modifiers: PlayerModifier[]): boolean {
  return modifiers.some(m => m.playerId === playerId && m.type === 'frozen' && m.turnsRemaining > 0);
}

/**
 * Get the double multiplier for a player (double_next modifier)
 */
export function getStepsMultiplier(playerId: string, modifiers: PlayerModifier[]): number {
  const doubleModifier = modifiers.find(
    m => m.playerId === playerId && m.type === 'double_next' && m.turnsRemaining > 0
  );
  return doubleModifier ? (doubleModifier.value as number || 2) : 1;
}

/**
 * Get the forced category for a player (category_master modifier)
 */
export function getForcedCategory(playerId: string, modifiers: PlayerModifier[]): KnowledgeCategory | null {
  const categoryModifier = modifiers.find(
    m => m.playerId === playerId && m.type === 'category_master' && m.turnsRemaining > 0
  );
  return categoryModifier ? (categoryModifier.value as KnowledgeCategory) : null;
}

/**
 * Check if a player has shield protection
 */
export function hasShieldProtection(playerId: string, modifiers: PlayerModifier[]): boolean {
  return modifiers.some(m => m.playerId === playerId && m.type === 'shield' && m.turnsRemaining > 0);
}

/**
 * Get description for what a choice-requiring twist needs
 */
export function getChoiceTypeForTwist(effectType: TwistEffectType): 'player' | 'gate' | 'difficulty' | 'category' | 'star' | 'starPeek' | null {
  switch (effectType) {
    case 'steal_star':
    case 'swap_positions':
    case 'freeze_player':
    case 'points_swap':
      return 'player';
    case 'teleport_gate':
      return 'gate';
    case 'difficulty_choice':
      return 'difficulty';
    case 'category_master':
      return 'category';
    case 'free_star':
      return 'star';
    case 'star_peek':
      return 'starPeek';
    default:
      return null;
  }
}

