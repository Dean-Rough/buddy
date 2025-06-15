'use client';

import { useState, useEffect, useCallback } from 'react';

interface TypingAnimationProps {
  text: string;
  onComplete?: () => void;
  speed?: 'slow' | 'normal' | 'fast';
  errorRate?: number;
  showCursor?: boolean;
}

interface TypingState {
  displayText: string;
  isTyping: boolean;
  isComplete: boolean;
}

export function TypingAnimation({
  text,
  onComplete,
  speed = 'normal',
  errorRate = 0.02,
  showCursor = true,
}: TypingAnimationProps) {
  const [state, setState] = useState<TypingState>({
    displayText: '',
    isTyping: false,
    isComplete: false,
  });

  const getBaseDelay = useCallback(() => {
    switch (speed) {
      case 'slow':
        return 150;
      case 'fast':
        return 60;
      default:
        return 100;
    }
  }, [speed]);

  const getCharacterDelay = useCallback(
    (char: string, prevChar: string, baseDelay: number) => {
      // Same character repeated
      if (char === prevChar) return baseDelay * 1.6;

      // Punctuation delays
      if (/[.!?]/.test(char)) return baseDelay * 12;
      if (/[,;:]/.test(char)) return baseDelay * 8;
      if (char === ' ') return baseDelay * 3;

      // Regular characters
      return baseDelay * (1 + Math.random() * 0.5); // Add some randomness
    },
    []
  );

  const shouldMakeError = useCallback(() => {
    return Math.random() < errorRate;
  }, [errorRate]);

  const generateTypingError = useCallback(
    (targetText: string, currentIndex: number) => {
      const errorTypes = [
        // Type 4 characters ahead
        () => {
          const ahead = targetText.slice(currentIndex, currentIndex + 4);
          return { error: ahead, probability: 0.3 };
        },
        // Type next character instead of current
        () => {
          const nextChar = targetText[currentIndex + 1] || '';
          return { error: nextChar, probability: 0.5 };
        },
        // Swap current and next character
        () => {
          const current = targetText[currentIndex] || '';
          const next = targetText[currentIndex + 1] || '';
          return { error: next + current, probability: 1.0 };
        },
        // Random wrong character (common mistakes)
        () => {
          const wrongChars = 'qwertyuiop';
          const randomChar =
            wrongChars[Math.floor(Math.random() * wrongChars.length)];
          return { error: randomChar, probability: 0.4 };
        },
      ];

      const errorType =
        errorTypes[Math.floor(Math.random() * errorTypes.length)]();

      if (Math.random() < errorType.probability) {
        return errorType.error;
      }

      return null;
    },
    []
  );

  useEffect(() => {
    if (!text || state.isComplete) return;

    setState(prev => ({ ...prev, isTyping: true }));

    let currentIndex = 0;
    let displayText = '';
    let timeoutId: NodeJS.Timeout;

    const typeCharacter = () => {
      if (currentIndex >= text.length) {
        setState({
          displayText: text,
          isTyping: false,
          isComplete: true,
        });
        onComplete?.();
        return;
      }

      const currentChar = text[currentIndex];
      const prevChar = currentIndex > 0 ? text[currentIndex - 1] : '';
      const baseDelay = getBaseDelay();

      // Check if we should make an error
      if (shouldMakeError() && currentIndex < text.length - 1) {
        const errorText = generateTypingError(text, currentIndex);

        if (errorText) {
          // Type the error
          displayText += errorText;
          setState(prev => ({ ...prev, displayText }));

          // Wait, then backspace the error
          timeoutId = setTimeout(() => {
            // Backspace the error
            for (let i = 0; i < errorText.length; i++) {
              setTimeout(() => {
                displayText = displayText.slice(0, -1);
                setState(prev => ({ ...prev, displayText }));
              }, i * 50); // Quick backspacing
            }

            // Continue with correct character after backspacing
            setTimeout(
              () => {
                displayText += currentChar;
                setState(prev => ({ ...prev, displayText }));
                currentIndex++;

                const nextDelay = getCharacterDelay(
                  currentChar,
                  prevChar,
                  baseDelay
                );
                timeoutId = setTimeout(typeCharacter, nextDelay);
              },
              errorText.length * 50 + 100
            );
          }, baseDelay);

          return;
        }
      }

      // Type the correct character
      displayText += currentChar;
      setState(prev => ({ ...prev, displayText }));
      currentIndex++;

      const delay = getCharacterDelay(currentChar, prevChar, baseDelay);
      timeoutId = setTimeout(typeCharacter, delay);
    };

    // Start typing after a brief delay
    timeoutId = setTimeout(typeCharacter, 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    text,
    getBaseDelay,
    getCharacterDelay,
    shouldMakeError,
    generateTypingError,
    onComplete,
    state.isComplete,
  ]);

  // Reset when text changes
  useEffect(() => {
    setState({
      displayText: '',
      isTyping: false,
      isComplete: false,
    });
  }, [text]);

  return (
    <span>
      {state.displayText}
      {(state.isTyping || !state.isComplete) && showCursor && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

export default TypingAnimation;
