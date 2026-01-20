'use client';

import { type ReactNode } from 'react';
import { SoundProvider } from '@/contexts/SoundContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      {children}
    </SoundProvider>
  );
}


