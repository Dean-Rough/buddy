'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WritingAnimation from './WritingAnimation';
import VoiceMessage from './VoiceMessage';
import VoiceInput from './VoiceInput';

interface Message {
  id: string;
  content: string;
  role: 'child' | 'assistant';
  timestamp: Date;
}

interface WhisperModeInterfaceProps {
  childProfile: {
    id: string;
    name: string;
    age: number;
  };
}

export default function WhisperModeInterface({
  childProfile,
}: WhisperModeInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [writingMessage, setWritingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWriting]);

  useEffect(() => {
    // Gentle welcome message for Whisper Mode
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hi ${childProfile.name}... I'm here with you. Take your time. What's on your mind?`,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // Set calming background music or sounds here if available
    document.body.classList.add('whisper-mode');

    return () => {
      document.body.classList.remove('whisper-mode');
    };
  }, [childProfile.name]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'child',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          childId: childProfile.id,
          conversationId,
          whisperMode: true, // Signal to use calming responses
        }),
      });

      const data = await response.json();

      if (data.response) {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Start writing animation with slower speed for calming effect
        setWritingMessage(data.response);
        setIsWriting(true);

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
        content:
          "I'm here with you. Sometimes I need a moment to think. Can you tell me more?",
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exitWhisperMode = () => {
    router.push('/chat');
  };

  const logout = () => {
    localStorage.removeItem('childSession');
    localStorage.removeItem('childProfile');
    router.push('/');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col whisper-mode-container">
      {/* Gentle Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-pink-200 border border-purple-200 rounded-full flex items-center justify-center">
            <span className="font-medium text-purple-700">
              {childProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-avotica font-bold text-gray-800">
              {childProfile.name} • Whisper Mode
            </h1>
            <p className="font-avotica text-purple-600 text-sm">
              🌙 Calm space for gentle conversation
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exitWhisperMode}
            className="font-avotica text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Normal Mode
          </button>
          <button
            onClick={logout}
            className="font-avotica text-gray-500 hover:text-gray-600 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.role === 'child'
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-900 border border-purple-200'
                  : 'bg-white/90 text-gray-800 border border-purple-100 shadow-sm'
              }`}
            >
              <p className="text-base leading-relaxed">{message.content}</p>
              {message.role === 'assistant' && (
                <VoiceMessage
                  text={message.content}
                  persona="friendly-raccoon"
                  childAge={childProfile.age}
                  whisperMode={true}
                />
              )}
            </div>
          </div>
        ))}

        {/* Writing Animation */}
        {isWriting && writingMessage && (
          <div className="flex justify-start">
            <div className="bg-white/90 text-gray-800 border border-purple-100 shadow-sm max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
              <WritingAnimation
                text={writingMessage}
                speed="slow" // Slower for calming effect
                errorRate={0.01} // Fewer errors for smoother experience
                playSound={false} // No typing sounds in whisper mode
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

      {/* Gentle Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-purple-100 p-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind... take your time"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none resize-none bg-white/90 text-gray-800 placeholder-purple-400"
              rows={1}
              style={{ minHeight: '48px' }}
              maxLength={500}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="font-avotica bg-gradient-to-br from-purple-300 to-pink-300 text-purple-800 px-6 py-3 rounded-2xl hover:from-purple-400 hover:to-pink-400 focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>

        {/* Voice Input */}
        <div className="mt-4 flex justify-center">
          <VoiceInput
            onTranscript={text => {
              setInputMessage(prev => prev + (prev ? ' ' : '') + text);
            }}
            onError={error => console.error('Voice input error:', error)}
            disabled={isLoading}
            whisperMode={true}
          />
        </div>

        <div className="mt-3 text-center">
          <p className="font-avotica text-purple-600 text-sm">
            You&rsquo;re safe here • Take deep breaths • You&rsquo;re not alone
            💜
          </p>
        </div>
      </div>

      <style jsx global>{`
        .whisper-mode-container {
          animation: whisperFadeIn 2s ease-in-out;
        }

        @keyframes whisperFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .whisper-mode textarea {
          transition: all 0.3s ease;
        }

        .whisper-mode textarea:focus {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
