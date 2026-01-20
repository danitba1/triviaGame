'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSounds } from '@/hooks/useSounds';

type SoundType = 
  | 'spin'
  | 'spinEnd'
  | 'starCollect'
  | 'correct'
  | 'wrong'
  | 'winner'
  | 'twist'
  | 'countdown'
  | 'click';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sounds = useSounds();
  
  return (
    <SoundContext.Provider value={sounds}>
      {children}
    </SoundContext.Provider>
  );
}

export function useGameSounds() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return no-op functions if not in provider
    return {
      playSound: () => {},
      stopSound: () => {},
      setVolume: () => {},
      isMuted: false,
      toggleMute: () => {},
    };
  }
  return context;
}


