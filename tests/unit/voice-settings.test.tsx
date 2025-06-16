import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import VoiceSettings from '@/components/chat/VoiceSettings';

// Mock the voice library
vi.mock('@/lib/voice', () => ({
  PERSONA_VOICES: {
    'friendly-raccoon': {
      voiceId: 'voice1',
      model: 'sonic-english',
      speed: 1.1,
      stability: 0.8,
    },
    'wise-jellyfish': {
      voiceId: 'voice2', 
      model: 'sonic-english',
      speed: 0.9,
      stability: 0.9,
    },
    'chill-robot': {
      voiceId: 'voice3',
      model: 'sonic-english', 
      speed: 1.0,
      stability: 0.8,
    },
  },
  isVoiceAvailable: vi.fn(() => true),
  synthesizeSpeech: vi.fn(() => Promise.resolve(new ArrayBuffer(1024))),
}));

// Mock the UI components
vi.mock('@/components/ui/BrutalCard', () => ({
  default: function BrutalCard({ children, className, variant }: any) {
    return <div className={`brutal-card ${variant} ${className}`}>{children}</div>;
  },
}));

vi.mock('@/components/ui/BrutalButton', () => ({
  default: function BrutalButton({ children, onClick, variant, size, disabled }: any) {
    return (
      <button 
        onClick={onClick} 
        className={`brutal-button ${variant} ${size}`}
        disabled={disabled}
      >
        {children}
      </button>
    );
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock URL.createObjectURL and Audio
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  volume: 0.8,
  playbackRate: 1.0,
}));

const mockOnSettingsChange = vi.fn();
const mockOnClose = vi.fn();

describe('VoiceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('renders voice settings component', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('VOICE SETTINGS')).toBeInTheDocument();
    expect(screen.getByText('Voice Enabled')).toBeInTheDocument();
    expect(screen.getByText('🔊 TEST VOICE')).toBeInTheDocument();
  });

  it('loads saved settings from localStorage', () => {
    const savedSettings = {
      enabled: false,
      volume: 0.5,
      speed: 0.8,
      autoPlay: false,
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));

    render(
      <VoiceSettings
        currentPersona="wise-jellyfish"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('onda-voice-settings');
  });

  it('toggles voice enabled setting', async () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const voiceEnabledSection = screen.getByText('Voice Enabled').closest('div');
    const toggleButton = voiceEnabledSection?.querySelector('button');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton!);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'onda-voice-settings',
      expect.stringContaining('"enabled":false')
    );
  });

  it('adjusts volume setting', async () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const volumeSlider = screen.getByDisplayValue('0.8');
    fireEvent.change(volumeSlider, { target: { value: '0.6' } });

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          volume: 0.6,
        })
      );
    });
  });

  it('adjusts speed setting', async () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const speedSlider = screen.getByDisplayValue('1');
    fireEvent.change(speedSlider, { target: { value: '1.2' } });

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 1.2,
        })
      );
    });
  });

  it('toggles auto-play setting', async () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const autoPlayToggle = screen.getByText('Auto-play Messages')
      .closest('div')
      ?.querySelector('button');
    
    expect(autoPlayToggle).toBeInTheDocument();
    fireEvent.click(autoPlayToggle!);

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          autoPlay: false,
        })
      );
    });
  });

  it('displays current persona information', () => {
    render(
      <VoiceSettings
        currentPersona="wise-jellyfish"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Current Voice: Wise Jellyfish')).toBeInTheDocument();
  });

  it('shows whisper mode information when active', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        whisperMode={true}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('🌙 Whisper Mode Active')).toBeInTheDocument();
    expect(screen.getByText(/Voice is automatically adjusted for a calming/)).toBeInTheDocument();
  });

  it('tests voice playback when test button clicked', async () => {
    const { synthesizeSpeech } = await import('@/lib/voice');
    
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const testButton = screen.getByText('🔊 TEST VOICE');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(synthesizeSpeech).toHaveBeenCalledWith({
        text: expect.stringContaining("Hey there! I'm your friendly raccoon buddy"),
        persona: 'friendly-raccoon',
        childAge: 8,
        whisperMode: false,
      });
    });

    // Check that button shows playing state
    expect(screen.getByText('🔊 PLAYING...')).toBeInTheDocument();
  });

  it('shows warning when voice is not available', async () => {
    const voiceModule = await import('@/lib/voice');
    vi.mocked(voiceModule.isVoiceAvailable).mockReturnValue(false);

    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText(/Voice features require Cartesia API key/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays volume percentage correctly', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Volume: 80%')).toBeInTheDocument();
  });

  it('displays speed multiplier correctly', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Speed: 1x')).toBeInTheDocument();
  });

  it('handles localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('LocalStorage error');
    });

    // Should not throw
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('VOICE SETTINGS')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('handles voice synthesis errors gracefully', async () => {
    const { synthesizeSpeech } = await import('@/lib/voice');
    synthesizeSpeech.mockRejectedValue(new Error('Synthesis failed'));

    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const testButton = screen.getByText('🔊 TEST VOICE');
    fireEvent.click(testButton);

    // Button should return to normal state after error
    await waitFor(() => {
      expect(screen.getByText('🔊 TEST VOICE')).toBeInTheDocument();
    });
  });

  it('uses correct test text for different personas', async () => {
    const { synthesizeSpeech } = await import('@/lib/voice');
    
    render(
      <VoiceSettings
        currentPersona="wise-jellyfish"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const testButton = screen.getByText('🔊 TEST VOICE');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(synthesizeSpeech).toHaveBeenCalledWith({
        text: expect.stringContaining("Hello, young explorer"),
        persona: 'wise-jellyfish',
        childAge: 8,
        whisperMode: false,
      });
    });
  });

  it('displays voice features information', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('💡 Voice Features')).toBeInTheDocument();
    expect(screen.getByText(/Age-appropriate speech speed/)).toBeInTheDocument();
    expect(screen.getByText(/High-quality Cartesia TTS/)).toBeInTheDocument();
    expect(screen.getByText(/Cached for faster playback/)).toBeInTheDocument();
  });
});