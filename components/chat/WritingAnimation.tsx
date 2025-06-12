"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface WritingAnimationProps {
  text: string;
  onComplete?: () => void;
  speed?: "slow" | "normal" | "fast";
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
  speed = "normal",
  errorRate = 0.03,
  showCursor = true,
  playSound = true,
}: WritingAnimationProps) {
  const [state, setState] = useState<WritingState>({
    displayText: "",
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
      audioRef.current.volume = 0.3;
      audioRef.current.loop = false;
    }
    
    return () => {
      if (soundTimerRef.current) {
        clearTimeout(soundTimerRef.current);
      }
    };
  }, [playSound]);

  const playWritingSound = useCallback(() => {
    if (audioRef.current && playSound) {
      // Play sound in short bursts to simulate writing
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
      
      // Stop sound after short duration
      if (soundTimerRef.current) {
        clearTimeout(soundTimerRef.current);
      }
      soundTimerRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }, 200 + Math.random() * 300);
    }
  }, [playSound]);

  const getBaseDelay = useCallback(() => {
    switch (speed) {
      case "slow": return 180;
      case "fast": return 80;
      default: return 120;
    }
  }, [speed]);

  const getCharacterDelay = useCallback((char: string, prevChar: string, baseDelay: number) => {
    // Realistic typing patterns
    if (char === prevChar) return baseDelay * 1.8; // Same char repeated
    if (/[.!?]/.test(char)) return baseDelay * 15; // End of sentence pause
    if (/[,;:]/.test(char)) return baseDelay * 8; // Punctuation pause
    if (char === ' ') return baseDelay * 2.5; // Space pause
    if (/[A-Z]/.test(char) && /[a-z]/.test(prevChar)) return baseDelay * 1.5; // Capital after lowercase
    
    // Add natural variation
    return baseDelay * (0.8 + Math.random() * 0.6);
  }, []);

  const shouldMakeError = useCallback(() => {
    return Math.random() < errorRate;
  }, [errorRate]);

  const generateTypingError = useCallback((targetText: string, currentIndex: number) => {
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
      }
    ];

    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    return errorType();
  }, []);

  useEffect(() => {
    if (!text || state.isComplete) return;

    setState(prev => ({ ...prev, isWriting: true }));

    let currentIndex = 0;
    let displayText = "";
    let timeoutId: NodeJS.Timeout;

    const writeCharacter = () => {
      if (currentIndex >= text.length) {
        setState({
          displayText: text,
          isWriting: false,
          isComplete: true,
          currentChar: text.length,
        });
        onComplete?.();
        return;
      }

      const currentChar = text[currentIndex];
      const prevChar = currentIndex > 0 ? text[currentIndex - 1] : '';
      const baseDelay = getBaseDelay();

      // Play writing sound occasionally (not every character)
      if (Math.random() < 0.4) {
        playWritingSound();
      }

      // Check for typing error
      if (shouldMakeError() && currentIndex < text.length - 2) {
        const errorText = generateTypingError(text, currentIndex);
        
        if (errorText && errorText !== currentChar) {
          // Type the error
          displayText += errorText;
          setState(prev => ({ 
            ...prev, 
            displayText,
            currentChar: currentIndex 
          }));
          
          // Wait, then backspace
          timeoutId = setTimeout(() => {
            const backspaceDelay = 80;
            let backspaceIndex = errorText.length;
            
            const backspaceChar = () => {
              if (backspaceIndex > 0) {
                displayText = displayText.slice(0, -1);
                setState(prev => ({ 
                  ...prev, 
                  displayText,
                  currentChar: currentIndex 
                }));
                backspaceIndex--;
                setTimeout(backspaceChar, backspaceDelay);
              } else {
                // Now type the correct character
                displayText += currentChar;
                setState(prev => ({ 
                  ...prev, 
                  displayText,
                  currentChar: currentIndex + 1 
                }));
                currentIndex++;
                
                const nextDelay = getCharacterDelay(currentChar, prevChar, baseDelay);
                timeoutId = setTimeout(writeCharacter, nextDelay);
              }
            };
            
            setTimeout(backspaceChar, baseDelay * 2);
          }, baseDelay);
          
          return;
        }
      }

      // Type the correct character
      displayText += currentChar;
      setState(prev => ({ 
        ...prev, 
        displayText,
        currentChar: currentIndex + 1 
      }));
      currentIndex++;

      const delay = getCharacterDelay(currentChar, prevChar, baseDelay);
      timeoutId = setTimeout(writeCharacter, delay);
    };

    // Start writing after brief delay
    timeoutId = setTimeout(writeCharacter, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, getBaseDelay, getCharacterDelay, shouldMakeError, generateTypingError, onComplete, state.isComplete, playWritingSound]);

  // Reset when text changes
  useEffect(() => {
    setState({
      displayText: "",
      isWriting: false,
      isComplete: false,
      currentChar: 0,
    });
  }, [text]);

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
              transform: char !== ' ' ? `rotate(${(Math.random() - 0.5) * 2}deg) translateY(${(Math.random() - 0.5) * 1}px)` : 'none',
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