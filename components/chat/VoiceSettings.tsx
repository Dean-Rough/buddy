'use client';

import React, { useState, useEffect } from 'react';
import { isVoiceAvailable } from '@/lib/voice';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface VoiceSettings {
  enabled: boolean;
  volume: number;
  speed: number;
  autoPlay: boolean;
  persona: string;
}

interface VoiceSettingsProps {
  currentPersona: string;
  whisperMode?: boolean;
  onSettingsChange: (settings: VoiceSettings) => void;
  onClose?: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  volume: 0.8,
  speed: 1.0,
  autoPlay: true,
  persona: 'friendly-raccoon',
};

export default function VoiceSettings({
  currentPersona,
  whisperMode = false,
  onSettingsChange,
  onClose,
}: VoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('onda-voice-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsed,
            persona: currentPersona,
          });
        } catch (error) {
          console.error('Error parsing voice settings:', error);
          setSettings({ ...DEFAULT_SETTINGS, persona: currentPersona });
        }
      } else {
        setSettings({ ...DEFAULT_SETTINGS, persona: currentPersona });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
      setSettings({ ...DEFAULT_SETTINGS, persona: currentPersona });
    }
  }, [currentPersona]);

  // Save settings to localStorage and notify parent
  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('onda-voice-settings', JSON.stringify(updated));
    onSettingsChange(updated);
  };

  // Test voice with current settings
  const testVoice = async () => {
    if (!isVoiceAvailable() || isTestPlaying) return;

    setIsTestPlaying(true);

    try {
      const testTexts = {
        'friendly-raccoon':
          "Hey there! I'm your friendly raccoon buddy. We're gonna have so much fun chatting together!",
        'wise-jellyfish':
          "Hello, young explorer. I'm here to share wisdom and help you discover wonderful things about the world.",
        'chill-robot':
          'Greetings, human. I am your robotic companion, ready to assist with your queries and adventures.',
      };

      const testText =
        testTexts[currentPersona as keyof typeof testTexts] ||
        testTexts['friendly-raccoon'];

      // Import voice synthesis
      const { synthesizeSpeech } = await import('@/lib/voice');

      const audioBuffer = await synthesizeSpeech({
        text: testText,
        persona: currentPersona,
        childAge: 8,
        whisperMode,
      });

      if (audioBuffer) {
        const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
        const audio = new Audio(URL.createObjectURL(blob));
        audio.volume = settings.volume;
        audio.playbackRate = settings.speed;

        await audio.play();
      }
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setIsTestPlaying(false);
    }
  };

  return (
    <BrutalCard variant={whisperMode ? 'pink' : 'blue'} className="max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-rokano text-lg">VOICE SETTINGS</h3>
        {onClose && (
          <BrutalButton variant="white" size="small" onClick={onClose}>
            ✕
          </BrutalButton>
        )}
      </div>

      {!isVoiceAvailable() && (
        <div className="mb-4 p-3 bg-orange-100 border-2 border-orange-300 brutal-shadow-small">
          <p className="text-xs text-orange-800">
            ⚠️ Voice features require Cartesia API key configuration
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Voice Enabled Toggle */}
        <div className="flex justify-between items-center">
          <label className="font-avotica font-bold text-sm">
            Voice Enabled
          </label>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
            disabled={!isVoiceAvailable()}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {settings.enabled && isVoiceAvailable() && (
          <>
            {/* Volume Control */}
            <div>
              <label className="font-avotica font-bold text-sm mb-2 block">
                Volume: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={e =>
                  updateSettings({ volume: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>

            {/* Speed Control */}
            <div>
              <label className="font-avotica font-bold text-sm mb-2 block">
                Speed: {settings.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.speed}
                onChange={e =>
                  updateSettings({ speed: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Auto-play Toggle */}
            <div className="flex justify-between items-center">
              <div>
                <label className="font-avotica font-bold text-sm">
                  Auto-play Messages
                </label>
                <p className="text-xs text-gray-600">
                  Automatically play voice for AI responses
                </p>
              </div>
              <button
                onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoPlay ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.autoPlay ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Voice Preview */}
            <div>
              <label className="font-avotica font-bold text-sm mb-2 block">
                Current Voice:{' '}
                {currentPersona
                  .replace('-', ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <div className="bg-white/50 p-3 brutal-shadow-small text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Voice settings apply to your selected persona
                </p>
                <BrutalButton
                  variant="green"
                  size="small"
                  onClick={testVoice}
                  disabled={isTestPlaying}
                >
                  {isTestPlaying ? '🔊 PLAYING...' : '🔊 TEST VOICE'}
                </BrutalButton>
              </div>
            </div>

            {/* Whisper Mode Info */}
            {whisperMode && (
              <div className="p-3 bg-purple-50 border-2 border-purple-300 brutal-shadow-small">
                <h5 className="font-avotica font-bold text-purple-800 text-sm mb-1">
                  🌙 Whisper Mode Active
                </h5>
                <p className="text-xs text-purple-700">
                  Voice is automatically adjusted for a calming, gentle
                  experience
                </p>
              </div>
            )}

            {/* Voice Quality Info */}
            <div className="p-3 bg-blue-50 border-2 border-blue-300 brutal-shadow-small">
              <h5 className="font-avotica font-bold text-blue-800 text-sm mb-1">
                💡 Voice Features
              </h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Age-appropriate speech speed and tone</li>
                <li>• High-quality Cartesia TTS technology</li>
                <li>• Persona-matched voice characteristics</li>
                <li>• Emotional expression and emphasis</li>
                <li>• Cached for faster playback</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </BrutalCard>
  );
}
