"use client";

import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import BrutalButton from "../ui/BrutalButton";

interface BrutalHeaderProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
  onStartChatClick?: () => void;
}

export function BrutalHeader({ onSignInClick, onSignUpClick, onStartChatClick }: BrutalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b-5 border-black sticky top-0 z-50">
      <div className="container mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="brutal-h1 mr-2">BUDDY</h1>
            <div className="w-8 h-8 bg-yellow-400 border-3 border-black brutal-shadow-sm">
              <div className="w-full h-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="brutal-text hover:text-pink-500 transition-colors">
              FEATURES
            </a>
            <a href="#safety" className="brutal-text hover:text-blue-500 transition-colors">
              SAFETY
            </a>
            <a href="#parents" className="brutal-text hover:text-green-500 transition-colors">
              FOR PARENTS
            </a>
            
            <div className="flex gap-3 ml-4">
              <BrutalButton 
                onClick={onSignInClick}
                variant="white" 
                size="small"
              >
                PARENT LOGIN
              </BrutalButton>
              
              <BrutalButton 
                onClick={onStartChatClick}
                variant="yellow" 
                size="small"
              >
                START CHAT
              </BrutalButton>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <BrutalButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="white"
            size="small"
            className="md:hidden"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </BrutalButton>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-4 border-t-3 border-black pt-4">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="brutal-text hover:text-pink-500">
                FEATURES
              </a>
              <a href="#safety" className="brutal-text hover:text-blue-500">
                SAFETY
              </a>
              <a href="#parents" className="brutal-text hover:text-green-500">
                FOR PARENTS
              </a>
              
              <div className="flex flex-col gap-3 mt-4">
                <BrutalButton 
                  onClick={onSignInClick}
                  variant="white"
                  className="w-full"
                >
                  PARENT LOGIN
                </BrutalButton>
                
                <BrutalButton 
                  onClick={onStartChatClick}
                  variant="yellow"
                  className="w-full"
                >
                  START CHAT
                </BrutalButton>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default BrutalHeader;