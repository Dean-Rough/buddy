'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WritingAnimationProps {
  text: string;
  onComplete?: () => void;
  speed?: 'slow' | 'normal' | 'fast';
  errorRate?: number;
  showCursor?: boolean;
  playSound?: boolean;
}

interface WritingState {
  displayText: string;
  isWriting: boolean;
  isComplete: boolean;
  currentChar: number;
}

export function WritingAnimation({
  text,
  onComplete,
  speed = 'normal',
  errorRate = 0.03,
  showCursor = true,
  playSound = true,
}: WritingAnimationProps) {
  const [state, setState] = useState<WritingState>({
    displayText: '',
    isWriting: false,
    isComplete: false,
    currentChar: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    if (playSound && typeof window !== 'undefined') {
      audioRef.current = new Audio('/audio/Pencil Writing.mp3');
      audioRef.current.volume = 0.21; // Reduced from 0.3 to 0.21 (30% quieter)
      audioRef.current.loop = true; // Loop the audio continuously
    }

    return () => {
      if (soundTimerRef.current) {
        clearTimeout(soundTimerRef.current);
      }
      // Stop audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [playSound]);

  const startWritingSound = useCallback(() => {
    if (audioRef.current && playSound) {
      // Only play if not already playing to prevent AbortError
      if (audioRef.current.paused) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          // Filter out common browser errors that aren't actual issues
          if (
            !err.message.includes('autoplay') &&
            !err.name.includes('AbortError') &&
            !err.message.includes('interrupted')
          ) {
            console.warn('Audio playback error:', err);
          }
        });
      }
    }
  }, [playSound]);

  const stopWritingSound = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (soundTimerRef.current) {
      clearTimeout(soundTimerRef.current);
      soundTimerRef.current = null;
    }
  }, []);

  const getBaseDelay = useCallback(() => {
    switch (speed) {
      case 'slow':
        return 120;
      case 'fast':
        return 40;
      default:
        return 60; // Much faster default
    }
  }, [speed]);

  const getCharacterDelay = useCallback(
    (char: string, prevChar: string, baseDelay: number) => {
      // Realistic typing patterns - but much faster
      if (char === prevChar) return baseDelay * 1.5; // Same char repeated
      if (/[.!?]/.test(char)) return baseDelay * 6; // End of sentence pause (was 15x)
      if (/[,;:]/.test(char)) return baseDelay * 3; // Punctuation pause (was 8x)
      if (char === ' ') return baseDelay * 1.8; // Space pause (was 2.5x)
      if (/[A-Z]/.test(char) && /[a-z]/.test(prevChar)) return baseDelay * 1.2; // Capital after lowercase

      // Add natural variation
      return baseDelay * (0.7 + Math.random() * 0.6);
    },
    []
  );

  const shouldMakeError = useCallback(() => {
    return Math.random() < errorRate;
  }, [errorRate]);

  const generateTypingError = useCallback(
    (targetText: string, currentIndex: number) => {
      const errorTypes = [
        // Type wrong character
        () => {
          const wrongChars = 'qwertyuioplkjhgfdsazxcvbnm';
          return wrongChars[Math.floor(Math.random() * wrongChars.length)];
        },
        // Type next character instead
        () => targetText[currentIndex + 1] || '',
        // Double character
        () => targetText[currentIndex] + targetText[currentIndex],
        // Swap current and next
        () => {
          const current = targetText[currentIndex] || '';
          const next = targetText[currentIndex + 1] || '';
          return next + current;
        },
      ];

      const errorType =
        errorTypes[Math.floor(Math.random() * errorTypes.length)];
      return errorType();
    },
    []
  );

  useEffect(() => {
    if (!text || state.isComplete) return;

    setState(prev => ({ ...prev, isWriting: true }));

    // Start the writing sound at the beginning
    startWritingSound();

    let currentIndex = 0;
    let displayText = '';
    let timeoutId: NodeJS.Timeout;

    const writeCharacter = () => {
      if (currentIndex >= text.length) {
        setState({
          displayText: text,
          isWriting: false,
          isComplete: true,
          currentChar: text.length,
        });
        // Stop the writing sound when complete
        stopWritingSound();
        onComplete?.();
        return;
      }

      const currentChar = text[currentIndex];
      const prevChar = currentIndex > 0 ? text[currentIndex - 1] : '';
      const baseDelay = getBaseDelay();

      // Sound is now playing continuously, no need for individual calls

      // Check for typing error
      if (shouldMakeError() && currentIndex < text.length - 2) {
        const errorText = generateTypingError(text, currentIndex);

        if (errorText && errorText !== currentChar) {
          // Type the error
          displayText += errorText;
          setState(prev => ({
            ...prev,
            displayText,
            currentChar: currentIndex,
          }));

          // Wait, then backspace
          timeoutId = setTimeout(() => {
            const backspaceDelay = 50; // Faster backspacing
            let backspaceIndex = errorText.length;

            const backspaceChar = () => {
              if (backspaceIndex > 0) {
                displayText = displayText.slice(0, -1);
                setState(prev => ({
                  ...prev,
                  displayText,
                  currentChar: currentIndex,
                }));
                backspaceIndex--;
                setTimeout(backspaceChar, backspaceDelay);
              } else {
                // Now type the correct character
                displayText += currentChar;
                setState(prev => ({
                  ...prev,
                  displayText,
                  currentChar: currentIndex + 1,
                }));
                currentIndex++;

                const nextDelay = getCharacterDelay(
                  currentChar,
                  prevChar,
                  baseDelay
                );
                timeoutId = setTimeout(writeCharacter, nextDelay);
              }
            };

            setTimeout(backspaceChar, baseDelay); // Faster error correction start
          }, baseDelay);

          return;
        }
      }

      // Type the correct character
      displayText += currentChar;
      setState(prev => ({
        ...prev,
        displayText,
        currentChar: currentIndex + 1,
      }));
      currentIndex++;

      const delay = getCharacterDelay(currentChar, prevChar, baseDelay);
      timeoutId = setTimeout(writeCharacter, delay);
    };

    // Start writing after brief delay
    timeoutId = setTimeout(writeCharacter, 200); // Much faster start

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Stop sound if component is being cleaned up
      stopWritingSound();
    };
  }, [
    text,
    getBaseDelay,
    getCharacterDelay,
    shouldMakeError,
    generateTypingError,
    onComplete,
    state.isComplete,
    startWritingSound,
    stopWritingSound,
  ]);

  // Reset when text changes
  useEffect(() => {
    setState({
      displayText: '',
      isWriting: false,
      isComplete: false,
      currentChar: 0,
    });
    // Stop any playing sound when text changes
    stopWritingSound();
  }, [text, stopWritingSound]);

  return (
    <div className="writing-effect">
      <span
        className="handwritten-chat"
        style={{
          // Add slight character spacing for handwritten effect
          letterSpacing: '0.5px',
          // Add slight random rotation to each character for handwritten feel
          display: 'inline-block',
        }}
      >
        {state.displayText.split('').map((char, index) => (
          <span
            key={index}
            className={index < state.currentChar ? 'scribble-reveal' : ''}
            style={{
              display: char === ' ' ? 'inline' : 'inline-block',
              // Add tiny random transforms for handwritten feel
              transform:
                char !== ' '
                  ? `rotate(${(Math.random() - 0.5) * 2}deg) translateY(${(Math.random() - 0.5) * 1}px)`
                  : 'none',
              transition: 'all 0.1s ease',
            }}
          >
            {char}
          </span>
        ))}
      </span>

      {(state.isWriting || !state.isComplete) && showCursor && (
        <span className="writing-cursor">|</span>
      )}
    </div>
  );
}

export default WritingAnimation;
