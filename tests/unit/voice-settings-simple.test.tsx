import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  },
  isVoiceAvailable: vi.fn(() => true),
  synthesizeSpeech: vi.fn(() => Promise.resolve(new ArrayBuffer(1024))),
}));

// Mock the UI components
vi.mock('@/components/ui/BrutalCard', () => ({
  default: function BrutalCard({ children }: any) {
    return <div data-testid="brutal-card">{children}</div>;
  },
}));

vi.mock('@/components/ui/BrutalButton', () => ({
  default: function BrutalButton({ children, onClick, disabled }: any) {
    return (
      <button onClick={onClick} disabled={disabled} data-testid="brutal-button">
        {children}
      </button>
    );
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => null),
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

describe('VoiceSettings - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('displays current persona name formatted correctly', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText(/Friendly Raccoon/)).toBeInTheDocument();
  });

  it('shows test voice button when voice is available', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('🔊 TEST VOICE')).toBeInTheDocument();
  });

  it('shows volume and speed controls when voice is enabled', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText(/Volume:/)).toBeInTheDocument();
    expect(screen.getByText(/Speed:/)).toBeInTheDocument();
  });

  it('shows auto-play toggle', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Auto-play Messages')).toBeInTheDocument();
  });

  it('shows voice features information', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('💡 Voice Features')).toBeInTheDocument();
  });

  it('shows close button when onClose prop is provided', () => {
    const mockOnClose = vi.fn();

    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('✕');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('LocalStorage error');
    });

    // Should not throw and should render normally
    expect(() => {
      render(
        <VoiceSettings
          currentPersona="friendly-raccoon"
          onSettingsChange={mockOnSettingsChange}
        />
      );
    }).not.toThrow();

    expect(screen.getByText('VOICE SETTINGS')).toBeInTheDocument();
  });

  it('adjusts settings when controls are changed', () => {
    render(
      <VoiceSettings
        currentPersona="friendly-raccoon"
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Find and adjust volume slider
    const volumeInput = screen.getByDisplayValue('0.8');
    fireEvent.change(volumeInput, { target: { value: '0.6' } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        volume: 0.6,
      })
    );
  });
});
