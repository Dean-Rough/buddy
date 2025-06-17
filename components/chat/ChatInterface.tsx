'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TypingAnimation from './TypingAnimation';

interface Message {
  id: string;
  content: string;
  role: 'child' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  childProfile: {
    id: string;
    name: string;
    age: number;
  };
}

export default function ChatInterface({ childProfile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hi ${childProfile.name}! 👋 I'm Onda, your AI friend. What would you like to chat about today?`,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
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
    setIsTyping(true);

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

      if (data.response) {
        // Set conversation ID if this is the first message
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Start typing animation
        setTypingMessage(data.response);
        setIsTyping(true);

        // Store message ID for when typing completes
        (window as any).pendingMessageId =
          data.messageId || Date.now().toString();
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content:
          "Oops! I'm having trouble hearing you right now. Could you try again?",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingComplete = (messageId: string, content: string) => {
    setIsTyping(false);
    setTypingMessage(null);
    const assistantMessage: Message = {
      id: messageId,
      content,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const logout = () => {
    localStorage.removeItem('childSession');
    localStorage.removeItem('childProfile');
    router.push('/');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-500 shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-500 font-bold">
              {childProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-white">
              Hi, {childProfile.name}! 👋
            </h2>
            <p className="text-sm text-blue-100">Chatting with Onda</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/parent')}
            className="text-sm text-white hover:text-blue-100 px-3 py-1 rounded border border-white/30 hover:bg-white/10"
          >
            Parent Dashboard
          </button>
          <button
            onClick={() => router.push('/whisper')}
            className="text-sm text-white hover:text-blue-100 px-3 py-1 rounded border border-white/30 hover:bg-white/10"
          >
            Whisper Mode
          </button>
          <button
            onClick={logout}
            className="text-sm text-white hover:text-blue-100 px-3 py-1 rounded hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.role === 'child'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 shadow-sm'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Typing animation */}
        {isTyping && typingMessage && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-sm max-w-xs lg:max-w-md px-4 py-2 rounded-2xl">
              <p className="text-sm">
                <TypingAnimation
                  text={typingMessage}
                  speed="normal"
                  errorRate={0.03}
                  onComplete={() => {
                    const messageId =
                      (window as any).pendingMessageId || Date.now().toString();
                    handleTypingComplete(messageId, typingMessage);
                  }}
                />
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={isLoading}
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Remember: Be kind and have fun! 🌟
        </p>
      </div>
    </div>
  );
}
