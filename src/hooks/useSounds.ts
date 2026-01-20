'use client';

import { useCallback, useRef, useEffect } from 'react';

type SoundType = 
  | 'spin'           // Spinner turning
  | 'spinEnd'        // Spinner stops
  | 'starCollect'    // Player gets a star
  | 'correct'        // Correct answer
  | 'wrong'          // Wrong answer
  | 'winner'         // Winner announcement
  | 'twist'          // Twist card drawn
  | 'countdown'      // Countdown tick
  | 'click';         // Button click

interface UseSoundsReturn {
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

/**
 * useSounds - Custom hook for game sound effects using Web Audio API
 */
export function useSounds(): UseSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(0.5);
  const mutedRef = useRef(false);
  const activeOscillators = useRef<Map<string, OscillatorNode>>(new Map());

  // Initialize AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create a simple tone
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = volumeRef.current
  ) => {
    if (mutedRef.current) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, [getAudioContext]);

  // Play a sequence of tones
  const playSequence = useCallback((
    frequencies: number[],
    noteDuration: number,
    type: OscillatorType = 'sine'
  ) => {
    if (mutedRef.current) return;
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, noteDuration, type);
      }, index * noteDuration * 1000 * 0.8);
    });
  }, [playTone]);

  // Spinning wheel sound (continuous)
  const playSpinSound = useCallback(() => {
    if (mutedRef.current) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      
      // Modulate frequency for spinning effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(8, ctx.currentTime); // Speed of wobble
      lfoGain.gain.setValueAtTime(50, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      gainNode.gain.setValueAtTime(volumeRef.current * 0.15, ctx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      lfo.start(ctx.currentTime);
      oscillator.start(ctx.currentTime);
      
      activeOscillators.current.set('spin', oscillator);
      
      // Auto-stop after 5 seconds max
      setTimeout(() => {
        stopSound('spin');
      }, 5000);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, [getAudioContext]);

  // Stop a specific sound
  const stopSound = useCallback((type: SoundType) => {
    const oscillator = activeOscillators.current.get(type);
    if (oscillator) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped
      }
      activeOscillators.current.delete(type);
    }
  }, []);

  // Play different sound effects
  const playSound = useCallback((type: SoundType) => {
    if (mutedRef.current) return;

    switch (type) {
      case 'spin':
        playSpinSound();
        break;
        
      case 'spinEnd':
        stopSound('spin');
        // Ding sound when spinner stops
        playSequence([600, 800, 1000], 0.15, 'sine');
        break;
        
      case 'starCollect':
        // Magical star collection sound - ascending arpeggio
        playSequence([523, 659, 784, 1047], 0.12, 'sine');
        setTimeout(() => {
          playTone(1319, 0.4, 'sine', volumeRef.current * 0.8);
        }, 400);
        break;
        
      case 'correct':
        // Happy success sound - major chord arpeggio
        playSequence([523, 659, 784], 0.15, 'sine');
        setTimeout(() => {
          playTone(1047, 0.5, 'sine', volumeRef.current * 0.6);
        }, 350);
        break;
        
      case 'wrong':
        // Sad buzzer sound
        playTone(200, 0.15, 'square', volumeRef.current * 0.3);
        setTimeout(() => {
          playTone(150, 0.3, 'square', volumeRef.current * 0.3);
        }, 150);
        break;
        
      case 'winner':
        // Fanfare celebration
        const fanfare = [523, 523, 523, 659, 784, 659, 784, 1047];
        playSequence(fanfare, 0.2, 'sine');
        // Add harmonics
        setTimeout(() => {
          playSequence([784, 784, 784, 988, 1175], 0.2, 'triangle');
        }, 100);
        break;
        
      case 'twist':
        // Mysterious twist sound
        playTone(400, 0.1, 'sine');
        setTimeout(() => playTone(500, 0.1, 'sine'), 100);
        setTimeout(() => playTone(600, 0.1, 'sine'), 200);
        setTimeout(() => playTone(800, 0.3, 'triangle'), 300);
        break;
        
      case 'countdown':
        // Simple tick
        playTone(800, 0.08, 'sine', volumeRef.current * 0.4);
        break;
        
      case 'click':
        // Soft click
        playTone(1000, 0.05, 'sine', volumeRef.current * 0.2);
        break;
    }
  }, [playSpinSound, playSequence, playTone, stopSound]);

  // Set master volume (0-1)
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeOscillators.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    stopSound,
    setVolume,
    isMuted: mutedRef.current,
    toggleMute,
  };
}


