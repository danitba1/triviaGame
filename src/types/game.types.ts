/**
 * Game-related TypeScript type definitions
 */

/** Available knowledge categories for trivia questions */
export type KnowledgeCategory = 
  | 'history'    // היסטוריה
  | 'sport'      // ספורט
  | 'bible'      // תנ"ך
  | 'culture'    // תרבות
  | 'geography'  // גיאוגרפיה
  | 'science'    // מדע
  | 'other';     // אחר

/** Category display information */
export interface CategoryInfo {
  id: KnowledgeCategory;
  label: string;
  emoji: string;
  color: string;
}

/** Difficulty level 1-5 (1 = easiest, 5 = hardest) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Answer option for a question */
export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Trivia question structure */
export interface TriviaQuestion {
  id: string;
  questionText: string;
  answers: AnswerOption[];
  difficulty: DifficultyLevel;
  category: KnowledgeCategory;
}

/** API request for generating questions */
export interface GenerateQuestionsRequest {
  categories: KnowledgeCategory[];
  customCategoryText?: string;
  questionCount: number;
}

/** API response with generated questions */
export interface GenerateQuestionsResponse {
  questions: TriviaQuestion[];
  success: boolean;
  error?: string;
}

/** Player types in the game */
export type PlayerType = 'human' | 'digital';

/** Individual player information */
export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  score: number;           // Points from stars collected
  boardPosition: number;   // Position on the circular board (0-24)
  starsCollected: number;  // Number of stars collected
  avatarEmoji: string;
}

/** Board configuration constants */
export const BOARD_TOTAL_STEPS = 25;
export const BOARD_GATE_POSITIONS = [0, 5, 10, 15, 20]; // Gates every 5 steps

/** Game setup/preferences configuration */
export interface GameSettings {
  humanPlayerCount: number;
  humanPlayerNames: string[];
  digitalPlayerCount: number;
  selectedCategories: KnowledgeCategory[];
  customCategoryText: string;
}

/** Star point values available in the game */
export const STAR_POINT_VALUES = [0, 50, 50, 100, 100, 150, 150, 200, 200, 250] as const;

/** Total number of stars in the game */
export const TOTAL_STARS = 10;

/** Individual star state */
export interface StarState {
  id: number;
  pointValue: number;
  isEarned: boolean;
  earnedByPlayerId: string | null;
}

/** Game state during play */
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedCategories: KnowledgeCategory[];
  stars: StarState[];
  isGameOver: boolean;
}

/** Shuffle array using Fisher-Yates algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Create initial stars array with shuffled values */
export function createInitialStars(): StarState[] {
  // Shuffle the point values so stars are in random order
  const shuffledValues = shuffleArray([...STAR_POINT_VALUES]);
  
  return shuffledValues.map((pointValue, index) => ({
    id: index,
    pointValue,
    isEarned: false,
    earnedByPlayerId: null,
  }));
}

/** Default game settings */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  humanPlayerCount: 1,
  humanPlayerNames: [''],
  digitalPlayerCount: 1,
  selectedCategories: ['history', 'sport', 'bible', 'culture', 'geography', 'science', 'other'],
  customCategoryText: '',
};

/** Available categories with display info */
export const KNOWLEDGE_CATEGORIES: CategoryInfo[] = [
  { id: 'history', label: 'היסטוריה', emoji: '🏛️', color: '#A855F7' },
  { id: 'sport', label: 'ספורט', emoji: '⚽', color: '#22C55E' },
  { id: 'bible', label: 'תנ"ך', emoji: '📜', color: '#FB923C' },
  { id: 'culture', label: 'תרבות', emoji: '🎭', color: '#F472B6' },
  { id: 'geography', label: 'גיאוגרפיה', emoji: '🌍', color: '#06B6D4' },
  { id: 'science', label: 'מדע', emoji: '🔬', color: '#8B5CF6' },
  { id: 'other', label: 'אחר', emoji: '✨', color: '#3B82F6' },
];

/** Digital player avatar options */
export const DIGITAL_PLAYER_AVATARS = ['🤖', '👾', '🎮', '🦾', '🧠', '💻'];

/** Human player avatar options */
export const HUMAN_PLAYER_AVATARS = ['👦', '👧', '🧒', '👨', '👩', '🧑', '👴', '👵'];

/**
 * Twist card types and effects
 */

/** Types of twist effects */
export type TwistEffectType = 
  | 'move_back_gate'           // Current player goes back to previous gate
  | 'others_back_gate'         // Other players go back to a gate
  | 'free_star'                // Choose any star from the board
  | 'steal_star'               // Take a star from another player
  | 'bonus_question'           // Answer question, if correct get 5 steps (only you)
  | 'instant_points'           // Get instant star points (50, 100, etc.)
  | 'upgrade_zero_star'        // If you have 0 star, it becomes worth 250
  | 'extra_turn'               // Get an extra turn after this one
  | 'swap_positions'           // Swap board position with another player
  | 'double_next'              // Next correct answer worth double
  | 'teleport_gate'            // Teleport to any gate of your choice
  | 'freeze_player'            // Skip next turn for another player
  | 'reverse_order'            // Reverse play order for 3 turns
  | 'star_peek'                // Peek at one hidden star value
  | 'shield'                   // Protected from negative effects for 2 turns
  | 'everyone_moves'           // Everyone moves 2 steps forward
  | 'random_teleport'          // Teleport to random position
  | 'category_master'          // Choose category for next 3 questions
  | 'difficulty_choice'        // Choose difficulty for next question
  | 'points_swap';             // Swap points with another player (if lower)

/** Twist card structure */
export interface TwistCard {
  id: string;
  title: string;
  description: string;
  emoji: string;
  effectType: TwistEffectType;
  effectValue?: number;           // Optional value (steps, points, etc.)
  targetPlayer?: 'self' | 'others' | 'choose' | 'all' | 'random';
  isPositive: boolean;            // Is this generally good for the player?
  requiresChoice: boolean;        // Does player need to make a choice?
  requiresQuestion: boolean;      // Does this twist involve answering a question?
}

/** Player modifier state (for effects that last multiple turns) */
export interface PlayerModifier {
  playerId: string;
  type: 'double_next' | 'shield' | 'frozen' | 'category_master';
  turnsRemaining: number;
  value?: string | number;       // Category name, multiplier, etc.
}

