'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceMessageProps {
  text: string;
  persona: string;
  childAge: number;
  whisperMode?: boolean;
  onAudioComplete?: () => void;
}

export default function VoiceMessage({
  text,
  persona,
  childAge,
  whisperMode = false,
  onAudioComplete,
}: VoiceMessageProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Temporarily disable voice generation until Cartesia is configured
    if (process.env.NEXT_PUBLIC_VOICE_ENABLED === 'true') {
      generateAudio();
    }

    return () => {
      // Cleanup audio URL when component unmounts
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [text, persona, childAge, whisperMode]);

  const generateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          persona,
          childAge,
          whisperMode,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        throw new Error('Failed to generate audio');
      }
    } catch (err) {
      console.error('Audio generation error:', err);
      setError('Could not generate audio');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    onAudioComplete?.();
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    setError('Audio playback failed');
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          preload="auto"
        />
      )}

      {/* Play/Pause button */}
      <button
        onClick={isPlaying ? pauseAudio : playAudio}
        disabled={isLoading || !!error || !audioUrl}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
          whisperMode
            ? 'bg-purple-100 hover:bg-purple-200 text-purple-600'
            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <span className="text-xs">❌</span>
        ) : isPlaying ? (
          // Pause icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 3.5A1.5 1.5 0 017 2h6a1.5 1.5 0 011.5 1.5v13a1.5 1.5 0 01-1.5 1.5H7a1.5 1.5 0 01-1.5-1.5v-13z" />
          </svg>
        ) : (
          // Play icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        )}
      </button>

      {/* Audio status text */}
      <span className="text-xs text-gray-500">
        {isLoading
          ? 'Generating audio...'
          : error
            ? 'Audio unavailable'
            : isPlaying
              ? 'Playing...'
              : audioUrl
                ? 'Click to hear'
                : 'No audio'}
      </span>

      {/* Visual audio wave indicator when playing */}
      {isPlaying && (
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full animate-pulse ${
                whisperMode ? 'bg-purple-400' : 'bg-blue-400'
              }`}
              style={{
                height: `${8 + Math.random() * 8}px`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
