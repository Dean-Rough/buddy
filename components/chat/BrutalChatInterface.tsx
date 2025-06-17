'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WritingAnimation from './WritingAnimation';
import BrutalButton from '../ui/BrutalButton';
import BrutalInput from '../ui/BrutalInput';
import VoiceInput from './VoiceInput';
import TimeWarning from './TimeWarning';

interface Message {
  id: string;
  content: string;
  role: 'child' | 'assistant';
  timestamp: Date;
}

interface TimeStatus {
  minutesRemaining?: number;
  shouldShowWarning: boolean;
  warningMessage?: string;
  canContinueWithOverride: boolean;
  minutesUsedToday: number;
  sessionEnded?: boolean;
  reason?: string;
  endingMessage?: string;
}

interface BrutalChatInterfaceProps {
  childProfile: {
    id: string;
    name: string;
    age: number;
    persona?: string;
  };
}

export default function BrutalChatInterface({
  childProfile,
}: BrutalChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [writingMessage, setWritingMessage] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [timeStatus, setTimeStatus] = useState<TimeStatus | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = (force = false) => {
    const element = messagesEndRef.current;
    if (element) {
      if (force) {
        // Immediate scroll for new messages
        element.scrollIntoView({ behavior: 'auto' });
      } else {
        // Smooth scroll for animations
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when writing state changes
  useEffect(() => {
    if (isWriting) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isWriting]);

  // Auto-scroll when writing message updates (for real-time typing)
  useEffect(() => {
    if (writingMessage) {
      scrollToBottom();
    }
  }, [writingMessage]);

  useEffect(() => {
    generateContextualWelcome();
  }, [childProfile.name]);

  const generateContextualWelcome = async () => {
    try {
      // Get the last conversation to reference
      const response = await fetch(`/api/chat/last-context?childAccountId=${childProfile.id}`);
      let welcomeContent = `yo ${childProfile.name}! 🤘 what's good today?`;
      
      if (response.ok) {
        const lastContext = await response.json();
        if (lastContext.hasContext) {
          welcomeContent = generateOrganicGreeting(childProfile.name, lastContext);
        }
      }
      
      const welcomeMessage: Message = {
        id: 'welcome',
        content: welcomeContent,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error generating contextual welcome:', error);
      // Fallback to simple greeting
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `yo ${childProfile.name}! 🤘 what's good today?`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const generateOrganicGreeting = (name: string, context: any): string => {
    const { lastTopic, lastMood, timeAgo, keyTopics } = context;
    
    // Time-based greetings
    const timeBasedGreetings = [
      `hey ${name}! how was your day?`,
      `what's up ${name}? good day today?`,
      `yo ${name}! how've you been?`,
      `hey there ${name}! what's new?`,
    ];

    // Topic-specific follow-ups
    const topicGreetings: Record<string, string[]> = {
      'school': [
        `hey ${name}! how was school today?`,
        `yo ${name}! did you have that test you mentioned?`,
        `what's up ${name}? how'd school go?`,
        `hey ${name}! learn anything cool at school today?`,
      ],
      'family': [
        `hey ${name}! how's the family doing?`,
        `yo ${name}! how was dinner with everyone?`,
        `what's up ${name}? how are things at home?`,
      ],
      'friends': [
        `hey ${name}! did you hang out with your friends?`,
        `yo ${name}! how was hanging with the crew?`,
        `what's up ${name}? catch up with your buddies lately?`,
      ],
      'games': [
        `hey ${name}! play any cool games lately?`,
        `yo ${name}! beat that level you were stuck on?`,
        `what's up ${name}? any new gaming adventures?`,
      ],
      'sports': [
        `hey ${name}! how was practice?`,
        `yo ${name}! how'd your game go?`,
        `what's up ${name}? been staying active?`,
      ],
      'animals': [
        `hey ${name}! how's your pet doing?`,
        `yo ${name}! any fun animal stories today?`,
        `what's up ${name}? see any cool animals lately?`,
      ],
      'art': [
        `hey ${name}! been creating anything cool?`,
        `yo ${name}! finish that drawing you were working on?`,
        `what's up ${name}? any new art projects?`,
      ],
      'music': [
        `hey ${name}! been jamming to any good music?`,
        `yo ${name}! learn any new songs?`,
        `what's up ${name}? what's on your playlist today?`,
      ],
    };

    // Mood-based greetings
    if (lastMood === 'excited' || lastMood === 'happy') {
      return `hey ${name}! still feeling good about things? 😊`;
    }
    if (lastMood === 'worried' || lastMood === 'anxious') {
      return `hey ${name}, how are you feeling today? hope things are going better! 💪`;
    }

    // Use topic-specific greetings if we have a clear last topic
    if (lastTopic && topicGreetings[lastTopic]) {
      const greetings = topicGreetings[lastTopic];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Check for specific topics mentioned
    if (keyTopics.includes('party') || keyTopics.includes('birthday')) {
      return `hey ${name}! how was that party? 🎉`;
    }
    if (keyTopics.includes('test') || keyTopics.includes('exam')) {
      return `yo ${name}! how'd that test go?`;
    }
    if (keyTopics.includes('movie') || keyTopics.includes('film')) {
      return `hey ${name}! did you watch that movie?`;
    }
    if (keyTopics.includes('vacation') || keyTopics.includes('trip')) {
      return `yo ${name}! how was your trip? tell me everything! ✈️`;
    }
    if (keyTopics.includes('sleepover')) {
      return `hey ${name}! how was the sleepover? did you guys stay up all night? 😴`;
    }

    // Time-sensitive greetings based on when we last talked
    if (timeAgo === 'today') {
      return `hey ${name}! back so soon? what's happening? 😄`;
    }
    if (timeAgo === 'yesterday') {
      return `yo ${name}! how was the rest of yesterday?`;
    }
    if (timeAgo === 'this_week') {
      return `hey ${name}! good to see you again! how's your week going?`;
    }

    // Fall back to topic-based if available
    if (keyTopics.length > 0) {
      const topic = keyTopics[0];
      return `hey ${name}! how's everything going with ${topic}?`;
    }

    // Default friendly greeting
    return timeBasedGreetings[Math.floor(Math.random() * timeBasedGreetings.length)];
  };

  const enableAudio = () => {
    setAudioEnabled(true);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Enable audio on first user interaction
    if (!audioEnabled) {
      enableAudio();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'child',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Force immediate scroll for user messages
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          childAccountId: childProfile.id,
          conversationId,
        }),
      });

      const data = await response.json();

      // Handle session ending due to time limits
      if (data.timeStatus?.sessionEnded) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: data.timeStatus.endingMessage || data.response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);

        // Redirect to end session or show session ended state
        setTimeout(() => {
          router.push('/session-ended');
        }, 3000);
        return;
      }

      if (data.response) {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Handle time status
        if (data.timeStatus) {
          setTimeStatus(data.timeStatus);

          if (
            data.timeStatus.shouldShowWarning &&
            data.timeStatus.warningMessage
          ) {
            setShowTimeWarning(true);
          }
        }

        // Start writing animation
        setWritingMessage(data.response);
        setIsWriting(true);

        // Store message ID for completion
        (window as any).pendingMessageId =
          data.messageId || Date.now().toString();
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsWriting(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "ugh, my brain's being weird right now. try again?",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWritingComplete = (messageId: string, content: string) => {
    setIsWriting(false);
    setWritingMessage(null);
    const assistantMessage: Message = {
      id: messageId,
      content,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Force scroll when writing completes
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout = () => {
    localStorage.removeItem('childSession');
    localStorage.removeItem('childProfile');
    router.push('/');
  };

  const handleTimeWarningAcknowledge = () => {
    setShowTimeWarning(false);
  };

  const handleExtendTime = async () => {
    try {
      const response = await fetch('/api/chat/time-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAccountId: childProfile.id,
          action: 'extend_time',
          parentOverride: true, // This would require PIN verification in real implementation
        }),
      });

      if (response.ok) {
        setShowTimeWarning(false);
        setTimeStatus(null); // Reset time status to allow continued chatting

        // Show feedback message
        const extendMessage: Message = {
          id: Date.now().toString(),
          content:
            "Great! Your parent has given you more time to chat. Let's keep going! 🎉",
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, extendMessage]);
      }
    } catch (error) {
      console.error('Error extending time:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await fetch('/api/chat/time-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAccountId: childProfile.id,
          action: 'end_session',
        }),
      });

      router.push('/session-ended');
    } catch (error) {
      console.error('Error ending session:', error);
      router.push('/session-ended');
    }
  };

  return (
    <div className="h-screen paper-bg flex flex-col">
      {/* Brutal Header */}
      <div className="brutal-header flex justify-between items-center" style={{ backgroundColor: '#2563eb' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 border-3 border-black flex items-center justify-center brutal-shadow-small">
            <span className="font-rokano text-xl font-bold">
              {childProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-avotica font-bold text-xl text-white">
              {childProfile.name} + BUDDY
            </h1>
            <p className="text-yellow-400 font-avotica font-medium text-sm">
              CHAT MODE ACTIVATED
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <BrutalButton
            variant="blue"
            size="small"
            onClick={() => router.push('/parent')}
            className="text-white font-bold"
          >
            PARENT
          </BrutalButton>
          <BrutalButton
            variant="purple"
            size="small"
            onClick={() => router.push('/whisper')}
            className="text-white font-bold"
          >
            WHISPER MODE
          </BrutalButton>
          <BrutalButton
            variant="red"
            size="small"
            onClick={logout}
            className="text-white font-bold"
          >
            LOGOUT
          </BrutalButton>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`brutal-bubble ${
                message.role === 'child'
                  ? 'brutal-bubble-user'
                  : 'brutal-bubble-ai'
              }`}
            >
              <p className="text-base leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Writing Animation */}
        {isWriting && writingMessage && (
          <div className="flex justify-start">
            <div className="brutal-bubble brutal-bubble-ai">
              <WritingAnimation
                text={writingMessage}
                speed="fast"
                errorRate={0.02}
                playSound={audioEnabled}
                onComplete={() => {
                  const messageId =
                    (window as any).pendingMessageId || Date.now().toString();
                  handleWritingComplete(messageId, writingMessage);
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Brutal Input Area */}
      <div className="border-t-5 border-black bg-white p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <BrutalInput
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="type something cool..."
              disabled={isLoading}
              className="font-casual text-lg"
              maxLength={500}
            />
          </div>

          <BrutalButton
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            variant="green"
            size="large"
            className="shrink-0"
          >
            {isLoading ? '...' : 'SEND'}
          </BrutalButton>
        </div>

        {/* Voice Input */}
        <div className="mt-4 flex justify-center">
          <VoiceInput
            onTranscript={text => {
              setInputMessage(prev => prev + (prev ? ' ' : '') + text);
            }}
            onError={error => console.error('Voice input error:', error)}
            disabled={isLoading}
            whisperMode={false}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="font-avotica text-sm opacity-70">
            BE AWESOME • HAVE FUN • STAY SAFE 🤘
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {audioEnabled && (
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="flex items-center gap-1 text-xs opacity-60 hover:opacity-80 transition-opacity"
                title="Toggle writing sounds"
              >
                <span>{audioEnabled ? '🔊' : '🔇'}</span>
                <span className="font-casual">
                  writing sounds {audioEnabled ? 'on' : 'off'}
                </span>
              </button>
            )}
            {!audioEnabled && (
              <p className="font-casual text-xs opacity-50">
                send a message to enable writing sounds ✏️
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Time Warning Component */}
      {showTimeWarning && timeStatus && timeStatus.warningMessage && (
        <TimeWarning
          _minutesRemaining={timeStatus.minutesRemaining || 0}
          warningMessage={timeStatus.warningMessage}
          _childAge={childProfile.age}
          canContinueWithOverride={timeStatus.canContinueWithOverride}
          onExtendTime={handleExtendTime}
          onAcknowledge={handleTimeWarningAcknowledge}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  );
}
