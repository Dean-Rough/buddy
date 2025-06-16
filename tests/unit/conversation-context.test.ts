import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeEmotionalState,
  extractTopic,
  type EmotionalState,
} from '@/lib/conversation-context';

describe('Conversation Context Utilities', () => {
  describe('analyzeEmotionalState', () => {
    it('detects happy emotions correctly', () => {
      const messages = [
        'I am so happy today!',
        'This is awesome and amazing!',
        'I love this game so much!',
        'I feel great and excited!',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('happy');
        expect(result.intensity).toBe(8);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects sad emotions correctly', () => {
      const messages = [
        'I feel so sad right now',
        'I want to cry',
        'I am really down today',
        'This makes me feel blue',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('sad');
        expect(result.intensity).toBe(3);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects angry emotions correctly', () => {
      const messages = [
        'I am so angry about this',
        'This makes me mad',
        'I feel frustrated and furious',
        'I am really annoyed',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('angry');
        expect(result.intensity).toBe(7);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects scared emotions correctly', () => {
      const messages = [
        'I am scared of the dark',
        'This is frightening me',
        'I feel afraid and worried',
        'That terrified me',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('scared');
        expect(result.intensity).toBe(4);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects curious emotions correctly', () => {
      const messages = [
        'I wonder how this works',
        'I am curious about dinosaurs',
        'Why do birds fly?',
        'What if we could time travel?',
        'This is so interesting!',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('curious');
        expect(result.intensity).toBe(6);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('defaults to neutral for unclear emotions', () => {
      const neutralMessages = [
        'Hello there',
        'The weather is nice',
        'I went to the store',
        'Can you help me with math?',
      ];

      neutralMessages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('neutral');
        expect(result.intensity).toBe(5);
        expect(result.confidence).toBe(0);
      });
    });

    it('includes triggers in the result', () => {
      const result = analyzeEmotionalState('I am so happy and excited!');
      expect(result.triggers).toContain('happy');
      expect(result.triggers).toContain('excited');
    });

    it('sets appropriate timestamps', () => {
      const result = analyzeEmotionalState('I feel great');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(Date.now() - result.timestamp.getTime()).toBeLessThan(1000);
    });
  });

  describe('extractTopic', () => {
    it('extracts school-related topics', () => {
      const schoolMessages = [
        'I have homework to do',
        'My teacher is really nice',
        'I learned about science in class',
        'School was fun today',
      ];

      schoolMessages.forEach(message => {
        expect(extractTopic(message)).toBe('school');
      });
    });

    it('extracts family-related topics', () => {
      const familyMessages = [
        'My mom made dinner',
        'I played with my dad',
        'My brother is annoying',
        'Family time is important',
      ];

      familyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('family');
      });
    });

    it('extracts friend-related topics', () => {
      const friendMessages = [
        'I played with my friend',
        'My buddy came over',
        'I like my classmates',
        'Can I play with someone?',
      ];

      friendMessages.forEach(message => {
        expect(extractTopic(message)).toBe('friends');
      });
    });

    it('extracts hobby-related topics', () => {
      const hobbyMessages = [
        'I like to draw',
        'I enjoy playing soccer',
        'My hobby is reading',
        'I love playing games',
        'Music is my favorite',
      ];

      hobbyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('hobbies');
      });
    });

    it('extracts food-related topics', () => {
      const foodMessages = [
        'I am hungry',
        'Pizza is my favorite food',
        'What should I eat for lunch?',
        'I had a snack',
      ];

      foodMessages.forEach(message => {
        expect(extractTopic(message)).toBe('food');
      });
    });

    it('extracts animal-related topics', () => {
      const animalMessages = [
        'I love dogs',
        'My pet cat is cute',
        'We went to the zoo',
        'Birds are amazing animals',
      ];

      animalMessages.forEach(message => {
        expect(extractTopic(message)).toBe('animals');
      });
    });

    it('extracts technology-related topics', () => {
      const techMessages = [
        'I like playing computer games',
        'Can I use the tablet?',
        'This app is cool',
        'I watched a video',
      ];

      techMessages.forEach(message => {
        expect(extractTopic(message)).toBe('technology');
      });
    });

    it('extracts feelings-related topics', () => {
      const feelingMessages = [
        'I feel sad today',
        'My emotions are mixed',
        'I am happy but worried',
        'How do you feel?',
      ];

      feelingMessages.forEach(message => {
        expect(extractTopic(message)).toBe('feelings');
      });
    });

    it('extracts help-related topics', () => {
      const helpMessages = [
        'Can you help me?',
        'I have a problem',
        'I don\'t know what to do',
        'I am confused about this',
        'I need assistance',
      ];

      helpMessages.forEach(message => {
        expect(extractTopic(message)).toBe('help');
      });
    });

    it('extracts story-related topics', () => {
      const storyMessages = [
        'Tell me a story',
        'I read a book today',
        'Once upon a time',
        'Can you tell me about dragons?',
      ];

      storyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('stories');
      });
    });

    it('defaults to general_chat for unmatched topics', () => {
      const generalMessages = [
        'Hello there',
        'Good morning',
        'How are you?',
        'Nice weather today',
      ];

      generalMessages.forEach(message => {
        expect(extractTopic(message)).toBe('general_chat');
      });
    });

    it('handles case insensitive matching', () => {
      expect(extractTopic('I LOVE SCHOOL')).toBe('school');
      expect(extractTopic('my FAMILY is great')).toBe('family');
      expect(extractTopic('HELP me please')).toBe('help');
    });

    it('handles multiple topic indicators', () => {
      // When multiple topics are present, it should return the first match
      const result = extractTopic('I need help with my school homework');
      // Should match 'school' or 'help' depending on pattern order
      expect(['school', 'help']).toContain(result);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty messages', () => {
      expect(analyzeEmotionalState('')).toMatchObject({
        primaryEmotion: 'neutral',
        intensity: 5,
        confidence: 0,
      });
      
      expect(extractTopic('')).toBe('general_chat');
    });

    it('handles very long messages', () => {
      const longMessage = 'I am so happy '.repeat(100);
      const result = analyzeEmotionalState(longMessage);
      expect(result.primaryEmotion).toBe('happy');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('handles messages with special characters', () => {
      const result = analyzeEmotionalState('I am happy!!! 😊🎉');
      expect(result.primaryEmotion).toBe('happy');
      
      const topic = extractTopic('My mom said: "Do your homework!"');
      expect(['family', 'school']).toContain(topic);
    });

    it('handles mixed emotions in a single message', () => {
      // Should pick the first/strongest emotion detected
      const result = analyzeEmotionalState('I am happy but also a bit scared');
      expect(['happy', 'scared']).toContain(result.primaryEmotion);
    });
  });
});