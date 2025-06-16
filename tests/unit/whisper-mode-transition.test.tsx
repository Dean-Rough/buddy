import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import WhisperModeTransition, { 
  useWhisperModeTransition, 
  shouldTriggerWhisperMode 
} from '@/components/animations/WhisperModeTransition';
import { renderHook, act } from '@testing-library/react';

// Mock setTimeout and clearTimeout
vi.useFakeTimers();

describe('WhisperModeTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders children content', () => {
    render(
      <WhisperModeTransition isWhisperMode={false}>
        <div data-testid="child-content">Test Content</div>
      </WhisperModeTransition>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies normal mode colors initially', () => {
    const { container } = render(
      <WhisperModeTransition isWhisperMode={false}>
        <div>Normal Mode</div>
      </WhisperModeTransition>
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
    expect(mainDiv).toHaveClass('from-blue-400');
    expect(mainDiv).toHaveClass('to-purple-600');
  });

  it('applies whisper mode colors when enabled', () => {
    const { container } = render(
      <WhisperModeTransition isWhisperMode={true}>
        <div>Whisper Mode</div>
      </WhisperModeTransition>
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
    expect(mainDiv).toHaveClass('from-blue-50');
    expect(mainDiv).toHaveClass('via-purple-50');
    expect(mainDiv).toHaveClass('to-pink-50');
  });

  it('shows floating particles in whisper mode', () => {
    render(
      <WhisperModeTransition isWhisperMode={true}>
        <div>Content</div>
      </WhisperModeTransition>
    );

    const particles = document.querySelectorAll('.particle');
    expect(particles).toHaveLength(12);
  });

  it('does not show particles in normal mode', () => {
    render(
      <WhisperModeTransition isWhisperMode={false}>
        <div>Content</div>
      </WhisperModeTransition>
    );

    const particles = document.querySelectorAll('.particle');
    expect(particles).toHaveLength(0);
  });

  it('shows mode indicator during transition', () => {
    render(
      <WhisperModeTransition isWhisperMode={true}>
        <div>Content</div>
      </WhisperModeTransition>
    );

    // Initially should show the mode indicator
    expect(screen.getByText('🌙 Whisper Mode')).toBeInTheDocument();
  });

  it('shows ripple effect during transition', () => {
    render(
      <WhisperModeTransition isWhisperMode={true}>
        <div>Content</div>
      </WhisperModeTransition>
    );

    const ripples = document.querySelectorAll('.ripple');
    expect(ripples).toHaveLength(3);
  });

  it('calls onTransitionComplete after duration', async () => {
    const mockCallback = vi.fn();
    
    render(
      <WhisperModeTransition 
        isWhisperMode={true} 
        onTransitionComplete={mockCallback}
        duration={1000}
      >
        <div>Content</div>
      </WhisperModeTransition>
    );

    // Fast-forward time to complete transition
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  it('handles custom transition duration', () => {
    const mockCallback = vi.fn();
    
    render(
      <WhisperModeTransition 
        isWhisperMode={true} 
        onTransitionComplete={mockCallback}
        duration={500}
      >
        <div>Content</div>
      </WhisperModeTransition>
    );

    // Should not have completed yet
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(mockCallback).not.toHaveBeenCalled();

    // Should complete after full duration
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockCallback).toHaveBeenCalled();
  });

  it('cleans up timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <WhisperModeTransition isWhisperMode={true}>
        <div>Content</div>
      </WhisperModeTransition>
    );

    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('useWhisperModeTransition hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useWhisperModeTransition());

    expect(result.current.isWhisperMode).toBe(false);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('toggles whisper mode', () => {
    const { result } = renderHook(() => useWhisperModeTransition());

    act(() => {
      result.current.toggleWhisperMode();
    });

    expect(result.current.isWhisperMode).toBe(true);
    expect(result.current.isTransitioning).toBe(true);
  });

  it('sets whisper mode explicitly', () => {
    const { result } = renderHook(() => useWhisperModeTransition());

    act(() => {
      result.current.setWhisperMode(true);
    });

    expect(result.current.isWhisperMode).toBe(true);
    expect(result.current.isTransitioning).toBe(true);
  });

  it('does not trigger transition when setting same mode', () => {
    const { result } = renderHook(() => useWhisperModeTransition());

    // Start with false, set to false again
    act(() => {
      result.current.setWhisperMode(false);
    });

    expect(result.current.isWhisperMode).toBe(false);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('handles transition complete', () => {
    const { result } = renderHook(() => useWhisperModeTransition());

    act(() => {
      result.current.toggleWhisperMode();
    });

    expect(result.current.isTransitioning).toBe(true);

    act(() => {
      result.current.handleTransitionComplete();
    });

    expect(result.current.isTransitioning).toBe(false);
  });
});

describe('shouldTriggerWhisperMode utility', () => {
  const distressMessages = [
    'I feel sad today',
    'I\'m really scared',
    'I\'m worried about something',
    'I feel so anxious',
    'This made me upset',
    'I got hurt at school',
    'I\'m angry at my friend',
    'I feel lonely',
    'I\'m afraid of the dark',
    'I\'m nervous about tomorrow',
    'I\'m so stressed',
    'I\'m mad at everyone',
    'I\'m frustrated with this',
    'I was crying earlier',
    'I had tears in my eyes',
    'I need help with this',
    'This is an emergency',
    'I have a big problem',
    'I\'m in trouble',
    'I had a nightmare',
    'I had a bad dream',
    'I can\'t sleep',
    'I feel bad about myself',
  ];

  const normalMessages = [
    'Hello there!',
    'How are you doing?',
    'I love playing games',
    'School was fun today',
    'Can you help me with homework?',
    'I like ice cream',
    'What\'s your favorite color?',
    'I want to learn about dinosaurs',
    'That\'s really cool!',
    'Thank you for helping me',
  ];

  it('detects distress keywords correctly', () => {
    distressMessages.forEach(message => {
      expect(shouldTriggerWhisperMode(message)).toBe(true);
    });
  });

  it('does not trigger for normal messages', () => {
    normalMessages.forEach(message => {
      expect(shouldTriggerWhisperMode(message)).toBe(false);
    });
  });

  it('is case insensitive', () => {
    expect(shouldTriggerWhisperMode('I FEEL SAD')).toBe(true);
    expect(shouldTriggerWhisperMode('i am Scared')).toBe(true);
    expect(shouldTriggerWhisperMode('I Am WoRrIeD')).toBe(true);
  });

  it('detects keywords within longer sentences', () => {
    expect(shouldTriggerWhisperMode('Yesterday I was feeling really sad about what happened')).toBe(true);
    expect(shouldTriggerWhisperMode('Sometimes I get scared when it\'s dark outside')).toBe(true);
    expect(shouldTriggerWhisperMode('My mom says I shouldn\'t be worried but I am')).toBe(true);
  });

  it('handles empty or invalid input', () => {
    expect(shouldTriggerWhisperMode('')).toBe(false);
    expect(shouldTriggerWhisperMode('   ')).toBe(false);
  });
});