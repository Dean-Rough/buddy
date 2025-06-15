'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  whisperMode?: boolean;
  disabled?: boolean;
}

export default function VoiceInput({
  onTranscript,
  onError,
  whisperMode = false,
  disabled = false,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  // Check if speech recognition is supported
  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    return () => {
      stopRecording();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio level monitoring
      const monitorAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255); // Normalize to 0-1

          if (isRecording) {
            animationRef.current = requestAnimationFrame(monitorAudioLevel);
          }
        }
      };

      monitorAudioLevel();

      // Set up speech recognition
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
          stopRecording();
        }
      };

      recognition.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        onError?.(errorMessage);
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.start();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Microphone access denied';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setAudioLevel(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-gray-500 text-center p-2">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Recording Button */}
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`relative w-12 h-12 rounded-full transition-all duration-200 ${
          whisperMode
            ? isRecording
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-purple-100 hover:bg-purple-200'
            : isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-100 hover:bg-blue-200'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } flex items-center justify-center shadow-md`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {/* Microphone Icon */}
        <svg
          className={`w-6 h-6 ${
            isRecording
              ? 'text-white'
              : whisperMode
                ? 'text-purple-600'
                : 'text-blue-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
        </svg>

        {/* Audio Level Ring */}
        {isRecording && (
          <div
            className="absolute inset-0 rounded-full border-4 border-white/50"
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              opacity: 0.7 + audioLevel * 0.3,
            }}
          />
        )}

        {/* Pulsing Ring When Recording */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
        )}
      </button>

      {/* Status Text */}
      <div className="text-center min-h-[2rem]">
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <p
              className={`text-xs ${whisperMode ? 'text-purple-600' : 'text-blue-600'}`}
            >
              Listening...
            </p>
            {transcript && (
              <p className="text-xs text-gray-600 max-w-xs truncate">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
          </div>
        ) : isProcessing ? (
          <p className="text-xs text-gray-500">Processing...</p>
        ) : (
          <p className="text-xs text-gray-500">
            {whisperMode ? 'Tap to speak gently' : 'Tap to speak'}
          </p>
        )}
      </div>

      {/* Visual Audio Wave */}
      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-100 ${
                whisperMode ? 'bg-purple-400' : 'bg-blue-400'
              }`}
              style={{
                height: `${8 + audioLevel * 20 + Math.sin(Date.now() / 200 + i) * 4}px`,
                opacity: 0.6 + audioLevel * 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
