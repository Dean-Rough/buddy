import { describe, it, expect } from 'vitest';
import { shouldTriggerWhisperMode } from '@/components/animations/WhisperModeTransition';

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
    'Please help me',
    'This is an emergency',
    'I have a big problem',
    'I have a real problem',
    'I\'m in trouble',
    'I had a nightmare',
    'I had a bad dream',
    'I can\'t sleep',
    'I cannot sleep',
    'I have trouble sleeping',
    'I feel bad about myself',
    'I\'m feeling bad',
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
    'I\'m happy today',
    'This is awesome',
    'I had a great day',
    'I\'m excited about tomorrow',
    'Can we play together?',
  ];

  it('detects distress keywords correctly', () => {
    distressMessages.forEach(message => {
      expect(shouldTriggerWhisperMode(message)).toBe(true);
    });
  });

  it('does not trigger for normal messages', () => {
    normalMessages.forEach(message => {
      const result = shouldTriggerWhisperMode(message);
      if (result) {
        console.log(`False positive for: "${message}"`);
      }
      expect(result).toBe(false);
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

  it('correctly identifies specific distress patterns', () => {
    // Test some edge cases
    expect(shouldTriggerWhisperMode('help me please')).toBe(true);
    expect(shouldTriggerWhisperMode('I had trouble sleeping')).toBe(true);
    expect(shouldTriggerWhisperMode('feeling hurt inside')).toBe(true);
    expect(shouldTriggerWhisperMode('this is a big problem for me')).toBe(true);
  });

  it('does not false positive on similar words', () => {
    // Words that might be similar but shouldn't trigger
    expect(shouldTriggerWhisperMode('I\'m helping my friend')).toBe(false); // "helping" != "help me"
    expect(shouldTriggerWhisperMode('I\'m learning to troubleshoot')).toBe(false); // "troubleshoot" != "in trouble"
    expect(shouldTriggerWhisperMode('I love my teddy bear')).toBe(false);
    expect(shouldTriggerWhisperMode('The weather is nice')).toBe(false);
    expect(shouldTriggerWhisperMode('I can help you with homework')).toBe(false);
    expect(shouldTriggerWhisperMode('No problem, I can do it')).toBe(false);
  });
});