/**
 * Twist cards repository - Special cards that change the game when drawn
 */

import { type TwistCard } from '@/types/game.types';

/**
 * Complete repository of twist cards
 * Contains 30 unique twist cards with various effects
 */
export const TWIST_CARDS: TwistCard[] = [
  // ===== MOVEMENT TWISTS =====
  {
    id: 'twist-back-gate-1',
    title: 'חזרה לשער!',
    description: 'חזור לשער האחרון שעברת. לפעמים צריך לעשות צעד אחורה כדי לזנק קדימה!',
    emoji: '🚪',
    effectType: 'move_back_gate',
    targetPlayer: 'self',
    isPositive: false,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-others-back-1',
    title: 'כולם אחורה!',
    description: 'כל השחקנים האחרים חוזרים לשער האחרון שלהם. אתה נשאר במקום! 😈',
    emoji: '⏪',
    effectType: 'others_back_gate',
    targetPlayer: 'others',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-teleport-gate-1',
    title: 'קפיצה מהירה!',
    description: 'בחר כל שער בלוח והתקפל אליו מיד! לאן תרצה לקפוץ?',
    emoji: '🌀',
    effectType: 'teleport_gate',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-random-teleport-1',
    title: 'הגרלה מטורפת!',
    description: 'תתקפל למיקום אקראי בלוח! האם המזל יהיה לצידך?',
    emoji: '🎲',
    effectType: 'random_teleport',
    targetPlayer: 'self',
    isPositive: false,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-swap-positions-1',
    title: 'החלף מקומות!',
    description: 'בחר שחקן אחר והחלף איתו מיקום בלוח. מי יקבל את המקום הטוב?',
    emoji: '🔄',
    effectType: 'swap_positions',
    targetPlayer: 'choose',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-everyone-moves-1',
    title: 'כולם קדימה!',
    description: 'כל השחקנים מתקדמים 2 צעדים! חגיגה לכולם! 🎉',
    emoji: '🚀',
    effectType: 'everyone_moves',
    effectValue: 2,
    targetPlayer: 'all',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },

  // ===== STAR TWISTS =====
  {
    id: 'twist-free-star-1',
    title: 'כוכב חינם!',
    description: 'בחר כל כוכב מהלוח וקבל אותו בחינם! איזה כוכב תבחר?',
    emoji: '⭐',
    effectType: 'free_star',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-steal-star-1',
    title: 'גנב כוכבים!',
    description: 'קח כוכב אחד משחקן אחר שיש לו לפחות כוכב אחד! 🦹',
    emoji: '🏴‍☠️',
    effectType: 'steal_star',
    targetPlayer: 'choose',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-upgrade-zero-1',
    title: 'הפתעת האפס!',
    description: 'אם יש לך כוכב עם 0 נקודות, הוא הופך להיות שווה 250 נקודות! 🌟',
    emoji: '0️⃣',
    effectType: 'upgrade_zero_star',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-star-peek-1',
    title: 'הצצה מהירה!',
    description: 'הצץ בערך של כוכב אחד לפני שתבחר אותו! רק אתה רואה!',
    emoji: '👀',
    effectType: 'star_peek',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },

  // ===== POINTS TWISTS =====
  {
    id: 'twist-instant-50-1',
    title: '50 נקודות מתנה!',
    description: 'קבל 50 נקודות ישר לחשבון! מתנה קטנה מהמשחק 🎁',
    emoji: '🎁',
    effectType: 'instant_points',
    effectValue: 50,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-instant-100-1',
    title: '100 נקודות בום!',
    description: 'וואו! 100 נקודות נופלות עליך משמיים! 💰',
    emoji: '💰',
    effectType: 'instant_points',
    effectValue: 100,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-points-swap-1',
    title: 'החלפת נקודות!',
    description: 'אם יש לך פחות נקודות משחקן אחר, תוכל להחליף איתו! 🔀',
    emoji: '🔀',
    effectType: 'points_swap',
    targetPlayer: 'choose',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-double-next-1',
    title: 'כפול הבא!',
    description: 'התשובה הנכונה הבאה שלך שווה כפול צעדים! 📈',
    emoji: '✖️2️⃣',
    effectType: 'double_next',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },

  // ===== QUESTION TWISTS =====
  {
    id: 'twist-bonus-question-1',
    title: 'שאלת בונוס!',
    description: 'ענה נכון על שאלה ותתקדם 5 צעדים! רק אתה משתתף! 🎯',
    emoji: '❓',
    effectType: 'bonus_question',
    effectValue: 5,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: true,
  },
  {
    id: 'twist-difficulty-choice-1',
    title: 'אתה בוחר!',
    description: 'בחר את רמת הקושי לשאלה הבאה! מה תהיה הבחירה שלך?',
    emoji: '🎚️',
    effectType: 'difficulty_choice',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-category-master-1',
    title: 'מאסטר הקטגוריה!',
    description: 'בחר את הקטגוריה ל-3 השאלות הבאות! בחר במה שאתה הכי טוב! 📚',
    emoji: '📚',
    effectType: 'category_master',
    effectValue: 3,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },

  // ===== TURN TWISTS =====
  {
    id: 'twist-extra-turn-1',
    title: 'תור נוסף!',
    description: 'אחרי התור הזה תקבל תור נוסף! 🔁',
    emoji: '🔁',
    effectType: 'extra_turn',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-freeze-player-1',
    title: 'הקפאה!',
    description: 'בחר שחקן אחר - הוא מפסיד את התור הבא שלו! ❄️',
    emoji: '❄️',
    effectType: 'freeze_player',
    targetPlayer: 'choose',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-reverse-order-1',
    title: 'הפוך!',
    description: 'סדר המשחק מתהפך ל-3 תורות! מימין לשמאל במקום משמאל לימין!',
    emoji: '↩️',
    effectType: 'reverse_order',
    effectValue: 3,
    targetPlayer: 'all',
    isPositive: false,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-shield-1',
    title: 'מגן הגנה!',
    description: 'אתה מוגן מכרטיסי טוויסט שליליים ל-2 תורות הבאות! 🛡️',
    emoji: '🛡️',
    effectType: 'shield',
    effectValue: 2,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },

  // ===== MORE MOVEMENT TWISTS =====
  {
    id: 'twist-back-gate-2',
    title: 'צעד אחורה!',
    description: 'אופס! חזור 3 צעדים אחורה. זה קורה לכולם!',
    emoji: '😅',
    effectType: 'move_back_gate',
    effectValue: 3,
    targetPlayer: 'self',
    isPositive: false,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-teleport-gate-2',
    title: 'שער הזדמנויות!',
    description: 'קפוץ לשער הכי קרוב לכוכב שאתה רוצה! חשוב בחוכמה!',
    emoji: '🚪✨',
    effectType: 'teleport_gate',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },

  // ===== MORE STAR TWISTS =====
  {
    id: 'twist-free-star-2',
    title: 'כוכב מזל!',
    description: 'בחר כוכב ותקבל אותו! הכוכבים מחכים לך! ✨',
    emoji: '🍀',
    effectType: 'free_star',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },
  {
    id: 'twist-steal-star-2',
    title: 'פיראט הכוכבים!',
    description: 'אר-ר-ר! קח כוכב מיריב! פיראטים לא שואלים רשות! 🏴‍☠️',
    emoji: '☠️',
    effectType: 'steal_star',
    targetPlayer: 'choose',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },

  // ===== MORE POINTS TWISTS =====
  {
    id: 'twist-instant-150-1',
    title: 'ג\'קפוט קטן!',
    description: '150 נקודות נכנסות ישר לכיס! מזל טוב! 🎰',
    emoji: '🎰',
    effectType: 'instant_points',
    effectValue: 150,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
  {
    id: 'twist-double-next-2',
    title: 'סופר כוח!',
    description: 'הכוח שלך מוכפל! הצעדים מהתשובה הנכונה הבאה - כפולים! 💪',
    emoji: '💪',
    effectType: 'double_next',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },

  // ===== MORE QUESTION TWISTS =====
  {
    id: 'twist-bonus-question-2',
    title: 'אתגר אישי!',
    description: 'שאלת אתגר! ענה נכון ותקפוץ 5 צעדים קדימה! 🏆',
    emoji: '🏆',
    effectType: 'bonus_question',
    effectValue: 5,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: true,
  },
  {
    id: 'twist-category-master-2',
    title: 'בחירת המומחה!',
    description: 'אתה המומחה! בחר קטגוריה לשלוש השאלות הבאות!',
    emoji: '🎓',
    effectType: 'category_master',
    effectValue: 3,
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: true,
    requiresQuestion: false,
  },

  // ===== MORE TURN TWISTS =====
  {
    id: 'twist-extra-turn-2',
    title: 'עוד סיבוב!',
    description: 'קיבלת עוד הזדמנות! אחרי התור הזה - עוד אחד! 🎡',
    emoji: '🎡',
    effectType: 'extra_turn',
    targetPlayer: 'self',
    isPositive: true,
    requiresChoice: false,
    requiresQuestion: false,
  },
];

/**
 * Get a shuffled copy of twist cards
 */
export function getShuffledTwists(): TwistCard[] {
  const shuffled = [...TWIST_CARDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get twist cards that require player choice
 */
export function getChoiceTwists(): TwistCard[] {
  return TWIST_CARDS.filter(t => t.requiresChoice);
}

/**
 * Get positive/negative twists
 */
export function getPositiveTwists(): TwistCard[] {
  return TWIST_CARDS.filter(t => t.isPositive);
}

export function getNegativeTwists(): TwistCard[] {
  return TWIST_CARDS.filter(t => !t.isPositive);
}

