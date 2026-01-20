'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  type TriviaQuestion, 
  type KnowledgeCategory,
  type DifficultyLevel,
  type GenerateQuestionsResponse 
} from '@/types/game.types';

interface UseQuestionsReturn {
  /** Array of generated questions */
  questions: TriviaQuestion[];
  /** Current question being displayed */
  currentQuestion: TriviaQuestion | null;
  /** Number of questions answered */
  questionsAnswered: number;
  /** Whether questions are being loaded */
  isLoading: boolean;
  /** Error message if generation failed */
  errorMessage: string | null;
  /** Generate new questions from API */
  generateQuestions: (categories: KnowledgeCategory[], customText?: string) => Promise<void>;
  /** Select next question by difficulty (optionally filtered by category) */
  selectQuestionByDifficulty: (difficulty: DifficultyLevel, forcedCategory?: KnowledgeCategory | null) => TriviaQuestion | null;
  /** Mark current question as answered and clear it */
  completeCurrentQuestion: () => void;
  /** Check if there are more questions */
  hasMoreQuestions: boolean;
  /** Total number of remaining questions */
  remainingQuestions: number;
}

/**
 * useQuestions - Custom hook for managing trivia questions with difficulty selection
 */
export function useQuestions(): UseQuestionsReturn {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track used question IDs to avoid repeats
  const usedQuestionIds = useRef<Set<string>>(new Set());

  // Generate questions from API
  const generateQuestions = useCallback(async (
    categories: KnowledgeCategory[],
    customText?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    usedQuestionIds.current.clear();

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          customCategoryText: customText,
          questionCount: 100,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data: GenerateQuestionsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setQuestions(data.questions);
      setQuestionsAnswered(0);
      setCurrentQuestion(null);
    } catch (error) {
      console.error('Error generating questions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה בטעינת השאלות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a question by difficulty level (optionally filtered by category)
  const selectQuestionByDifficulty = useCallback((
    difficulty: DifficultyLevel, 
    forcedCategory?: KnowledgeCategory | null
  ): TriviaQuestion | null => {
    // Helper to filter by category if forced
    const categoryFilter = (q: TriviaQuestion) => 
      !forcedCategory || q.category === forcedCategory;
    
    // Find unused questions with the requested difficulty (and category if specified)
    const availableQuestions = questions.filter(
      q => q.difficulty === difficulty && 
           !usedQuestionIds.current.has(q.id) &&
           categoryFilter(q)
    );

    if (availableQuestions.length === 0) {
      // Fallback: try nearby difficulties (still respecting category if forced)
      const nearbyDifficulties = [difficulty - 1, difficulty + 1, difficulty - 2, difficulty + 2]
        .filter(d => d >= 1 && d <= 5) as DifficultyLevel[];
      
      for (const nearbyDiff of nearbyDifficulties) {
        const fallbackQuestions = questions.filter(
          q => q.difficulty === nearbyDiff && 
               !usedQuestionIds.current.has(q.id) &&
               categoryFilter(q)
        );
        if (fallbackQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
          const selected = fallbackQuestions[randomIndex];
          usedQuestionIds.current.add(selected.id);
          setCurrentQuestion(selected);
          return selected;
        }
      }

      // Last fallback: any unused question (still respect category if forced, then ignore category)
      let anyUnused = questions.filter(
        q => !usedQuestionIds.current.has(q.id) && categoryFilter(q)
      );
      
      // If no questions in forced category, fall back to any category
      if (anyUnused.length === 0 && forcedCategory) {
        anyUnused = questions.filter(q => !usedQuestionIds.current.has(q.id));
      }
      
      if (anyUnused.length > 0) {
        const randomIndex = Math.floor(Math.random() * anyUnused.length);
        const selected = anyUnused[randomIndex];
        usedQuestionIds.current.add(selected.id);
        setCurrentQuestion(selected);
        return selected;
      }

      return null;
    }

    // Pick a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selected = availableQuestions[randomIndex];
    usedQuestionIds.current.add(selected.id);
    setCurrentQuestion(selected);
    return selected;
  }, [questions]);

  // Complete current question
  const completeCurrentQuestion = useCallback(() => {
    setQuestionsAnswered(prev => prev + 1);
    setCurrentQuestion(null);
  }, []);

  // Calculate remaining questions
  const remainingQuestions = questions.length - usedQuestionIds.current.size;
  const hasMoreQuestions = remainingQuestions > 0;

  return {
    questions,
    currentQuestion,
    questionsAnswered,
    isLoading,
    errorMessage,
    generateQuestions,
    selectQuestionByDifficulty,
    completeCurrentQuestion,
    hasMoreQuestions,
    remainingQuestions,
  };
}
