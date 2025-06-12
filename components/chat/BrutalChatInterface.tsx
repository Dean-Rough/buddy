"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import WritingAnimation from "./WritingAnimation";
import BrutalButton from "../ui/BrutalButton";
import BrutalInput from "../ui/BrutalInput";

interface Message {
  id: string;
  content: string;
  role: 'child' | 'assistant';
  timestamp: Date;
}

interface BrutalChatInterfaceProps {
  childProfile: {
    id: string;
    name: string;
    age: number;
  };
}

export default function BrutalChatInterface({ childProfile }: BrutalChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [writingMessage, setWritingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWriting]);

  useEffect(() => {
    // Welcome message with personality
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `yo ${childProfile.name}! 🤘 i'm buddy, your ai friend who's actually cool. what's good today?`,
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
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          childId: childProfile.id,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.response) {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Start writing animation
        setWritingMessage(data.response);
        setIsWriting(true);
        
        // Store message ID for completion
        (window as any).pendingMessageId = data.messageId || Date.now().toString();
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
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

  return (
    <div className="h-screen paper-bg flex flex-col">
      {/* Brutal Header */}
      <div className="brutal-header flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 border-3 border-black flex items-center justify-center brutal-shadow-small">
            <span className="font-sink text-xl font-bold">
              {childProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="brutal-h3 text-white">
              {childProfile.name} + BUDDY
            </h1>
            <p className="text-yellow-400 font-just font-medium text-sm">
              CHAT MODE ACTIVATED
            </p>
          </div>
        </div>
        
        <BrutalButton 
          variant="red" 
          size="small" 
          onClick={logout}
          className="text-white font-bold"
        >
          LOGOUT
        </BrutalButton>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`brutal-bubble ${
              message.role === 'child' 
                ? 'brutal-bubble-user' 
                : 'brutal-bubble-ai'
            }`}>
              <p className="text-base leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}
        
        {/* Writing Animation */}
        {isWriting && writingMessage && (
          <div className="flex justify-start">
            <div className="brutal-bubble brutal-bubble-ai">
              <WritingAnimation
                text={writingMessage}
                speed="normal"
                errorRate={0.04}
                playSound={true}
                onComplete={() => {
                  const messageId = (window as any).pendingMessageId || Date.now().toString();
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
              onChange={(e) => setInputMessage(e.target.value)}
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
            {isLoading ? "..." : "SEND"}
          </BrutalButton>
        </div>
        
        <div className="mt-4 text-center">
          <p className="brutal-text text-sm opacity-70">
            BE AWESOME • HAVE FUN • STAY SAFE 🤘
          </p>
        </div>
      </div>
    </div>
  );
}

