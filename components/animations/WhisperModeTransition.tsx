'use client';

import { useEffect, useState, useRef } from 'react';

interface WhisperModeTransitionProps {
  isWhisperMode: boolean;
  onTransitionComplete?: () => void;
  children: React.ReactNode;
  duration?: number; // Transition duration in milliseconds
}

interface ColorScheme {
  background: string;
  text: string;
  accent: string;
  border: string;
  overlay: string;
}

const NORMAL_COLORS: ColorScheme = {
  background: 'from-blue-400 to-purple-600',
  text: 'text-white',
  accent: 'text-yellow-300',
  border: 'border-white/20',
  overlay: 'bg-black/10',
};

const WHISPER_COLORS: ColorScheme = {
  background: 'from-blue-50 via-purple-50 to-pink-50',
  text: 'text-gray-800',
  accent: 'text-purple-600',
  border: 'border-purple-100',
  overlay: 'bg-white/20',
};

export default function WhisperModeTransition({
  isWhisperMode,
  onTransitionComplete,
  children,
  duration = 2000,
}: WhisperModeTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentColors, setCurrentColors] = useState<ColorScheme>(
    isWhisperMode ? WHISPER_COLORS : NORMAL_COLORS
  );
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Start transition
    setIsTransitioning(true);
    setOverlayOpacity(1);

    // Transition phases
    const phaseOne = duration * 0.3; // 30% - fade to overlay
    const phaseTwo = duration * 0.4; // 40% - change colors
    const phaseThree = duration * 0.3; // 30% - fade from overlay

    // Phase 1: Fade to overlay
    setTimeout(() => {
      setCurrentColors(isWhisperMode ? WHISPER_COLORS : NORMAL_COLORS);
    }, phaseOne);

    // Phase 2: Start fade from overlay
    setTimeout(() => {
      setOverlayOpacity(0);
    }, phaseOne + phaseTwo);

    // Phase 3: Complete transition
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      onTransitionComplete?.();
    }, duration);

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [isWhisperMode, duration, onTransitionComplete]);

  // Add breathing animation for whisper mode
  const breathingStyle = isWhisperMode
    ? {
        animation: 'gentleBreathing 4s ease-in-out infinite',
      }
    : {};

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-1000 ease-in-out bg-gradient-to-br ${currentColors.background} relative overflow-hidden`}
      style={breathingStyle}
    >
      {/* Gentle particle overlay for whisper mode */}
      {isWhisperMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-particles">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${8 + Math.random() * 6}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transition overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isWhisperMode
            ? 'bg-gradient-to-br from-white/40 via-purple-50/60 to-pink-50/40'
            : 'bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-black/20'
        }`}
        style={{
          opacity: overlayOpacity,
          pointerEvents: isTransitioning ? 'all' : 'none',
        }}
      >
        {/* Gentle ripple effect during transition */}
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="ripple-container">
              <div className="ripple" />
              <div className="ripple ripple-delay-1" />
              <div className="ripple ripple-delay-2" />
            </div>
          </div>
        )}
      </div>

      {/* Content with color transitions */}
      <div
        className={`relative z-10 transition-all duration-1000 ease-in-out ${currentColors.text}`}
      >
        {children}
      </div>

      {/* Mode indicator */}
      {isTransitioning && (
        <div className="absolute top-4 right-4 z-20">
          <div
            className={`px-3 py-2 rounded-full backdrop-blur-sm transition-all duration-500 ${
              isWhisperMode
                ? 'bg-purple-100/80 text-purple-700 border border-purple-200'
                : 'bg-blue-900/80 text-blue-100 border border-blue-400'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {isWhisperMode ? '🌙 Whisper Mode' : '✨ Normal Mode'}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gentleBreathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.002);
          }
        }

        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(100vh) scale(0);
          }
          10% {
            opacity: 0.3;
            transform: translateY(90vh) scale(0.3);
          }
          90% {
            opacity: 0.3;
            transform: translateY(-10vh) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-20vh) scale(0);
          }
        }

        @keyframes rippleOut {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: floatUp linear infinite;
          pointer-events: none;
        }

        .ripple-container {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .ripple {
          position: absolute;
          inset: 0;
          border: 2px solid ${isWhisperMode ? 'rgba(147, 51, 234, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
          border-radius: 50%;
          animation: rippleOut 2s ease-out infinite;
        }

        .ripple-delay-1 {
          animation-delay: 0.5s;
        }

        .ripple-delay-2 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

// Hook for easy integration
export function useWhisperModeTransition() {
  const [isWhisperMode, setIsWhisperMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleWhisperMode = () => {
    setIsTransitioning(true);
    setIsWhisperMode(prev => !prev);
  };

  const setWhisperMode = (enabled: boolean) => {
    if (enabled !== isWhisperMode) {
      setIsTransitioning(true);
      setIsWhisperMode(enabled);
    }
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  return {
    isWhisperMode,
    isTransitioning,
    toggleWhisperMode,
    setWhisperMode,
    handleTransitionComplete,
  };
}

// Utility function to detect emotional distress triggers
export function shouldTriggerWhisperMode(message: string): boolean {
  const distressPatterns = [
    // Emotional states
    /\b(sad|scared|worried|anxious|upset|hurt|angry|lonely|afraid|nervous|stressed|mad|frustrated)\b/i,
    // Physical distress
    /\b(crying|tears)\b/i,
    // Help-seeking (emergency contexts, not homework help)
    /\b(need help)\b/i,
    /\bhelp me\b(?!\s+(with|do|understand|learn|figure|solve))/i, // "help me" but not "help me with homework"
    /\bemergency\b/i,
    // Problems and troubles
    /\b(big problem|real problem|in trouble|nightmare|bad dream)\b/i,
    // Sleep issues
    /\b(can't sleep|cannot sleep|trouble sleeping)\b/i,
    // Self-worth issues
    /\b(feel bad about|feeling bad|hate myself)\b/i,
  ];

  const lowercaseMessage = message.toLowerCase();
  return distressPatterns.some(pattern => 
    pattern.test(lowercaseMessage)
  );
}