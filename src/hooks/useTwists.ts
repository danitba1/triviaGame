'use client';

import { useState, useCallback, useRef } from 'react';
import { type TwistCard, type PlayerModifier } from '@/types/game.types';
import { getShuffledTwists } from '@/data/twists';

interface UseTwistsReturn {
  /** Get a random unused twist card */
  drawTwist: () => TwistCard | null;
  /** Currently active twist (being displayed/executed) */
  activeTwist: TwistCard | null;
  /** Set the active twist */
  setActiveTwist: (twist: TwistCard | null) => void;
  /** Mark a twist as used */
  markTwistUsed: (twistId: string) => void;
  /** Reset all twists for a new game */
  resetTwists: () => void;
  /** Number of remaining unused twists */
  remainingTwists: number;
  /** Player modifiers (effects that last multiple turns) */
  modifiers: PlayerModifier[];
  /** Add a modifier */
  addModifier: (modifier: PlayerModifier) => void;
  /** Remove a modifier */
  removeModifier: (playerId: string, type: PlayerModifier['type']) => void;
  /** Decrement all modifier turns and remove expired ones */
  tickModifiers: () => void;
  /** Check if player has a specific modifier */
  hasModifier: (playerId: string, type: PlayerModifier['type']) => boolean;
  /** Get modifier for player */
  getModifier: (playerId: string, type: PlayerModifier['type']) => PlayerModifier | undefined;
}

/**
 * useTwists - Custom hook for managing twist cards in the game
 */
export function useTwists(): UseTwistsReturn {
  // Shuffled deck of twist cards
  const twistDeck = useRef<TwistCard[]>(getShuffledTwists());
  // Set of used twist IDs
  const usedTwistIds = useRef<Set<string>>(new Set());
  // Currently active twist being displayed/executed
  const [activeTwist, setActiveTwist] = useState<TwistCard | null>(null);
  // Player modifiers (effects that persist across turns)
  const [modifiers, setModifiers] = useState<PlayerModifier[]>([]);
  // Force re-render counter for remaining twists
  const [, setUpdateCounter] = useState(0);

  // Draw a random unused twist
  const drawTwist = useCallback((): TwistCard | null => {
    const availableTwists = twistDeck.current.filter(
      t => !usedTwistIds.current.has(t.id)
    );

    if (availableTwists.length === 0) {
      // All twists used, reshuffle
      usedTwistIds.current.clear();
      twistDeck.current = getShuffledTwists();
      return twistDeck.current[0] || null;
    }

    // Pick random from available
    const randomIndex = Math.floor(Math.random() * availableTwists.length);
    const twist = availableTwists[randomIndex];
    
    return twist;
  }, []);

  // Mark a twist as used
  const markTwistUsed = useCallback((twistId: string) => {
    usedTwistIds.current.add(twistId);
    setUpdateCounter(c => c + 1); // Force re-render
  }, []);

  // Reset twists for new game
  const resetTwists = useCallback(() => {
    usedTwistIds.current.clear();
    twistDeck.current = getShuffledTwists();
    setActiveTwist(null);
    setModifiers([]);
    setUpdateCounter(c => c + 1);
  }, []);

  // Add a player modifier
  const addModifier = useCallback((modifier: PlayerModifier) => {
    setModifiers(prev => {
      // Remove existing modifier of same type for same player
      const filtered = prev.filter(
        m => !(m.playerId === modifier.playerId && m.type === modifier.type)
      );
      return [...filtered, modifier];
    });
  }, []);

  // Remove a specific modifier
  const removeModifier = useCallback((playerId: string, type: PlayerModifier['type']) => {
    setModifiers(prev => prev.filter(
      m => !(m.playerId === playerId && m.type === type)
    ));
  }, []);

  // Tick down modifier turns and remove expired ones
  const tickModifiers = useCallback(() => {
    setModifiers(prev => prev
      .map(m => ({ ...m, turnsRemaining: m.turnsRemaining - 1 }))
      .filter(m => m.turnsRemaining > 0)
    );
  }, []);

  // Check if player has a modifier
  const hasModifier = useCallback((playerId: string, type: PlayerModifier['type']): boolean => {
    return modifiers.some(m => m.playerId === playerId && m.type === type);
  }, [modifiers]);

  // Get a specific modifier for a player
  const getModifier = useCallback((playerId: string, type: PlayerModifier['type']): PlayerModifier | undefined => {
    return modifiers.find(m => m.playerId === playerId && m.type === type);
  }, [modifiers]);

  // Calculate remaining twists
  const remainingTwists = twistDeck.current.length - usedTwistIds.current.size;

  return {
    drawTwist,
    activeTwist,
    setActiveTwist,
    markTwistUsed,
    resetTwists,
    remainingTwists,
    modifiers,
    addModifier,
    removeModifier,
    tickModifiers,
    hasModifier,
    getModifier,
  };
}

