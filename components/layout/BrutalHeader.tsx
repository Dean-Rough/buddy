'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import BrutalButton from '../ui/BrutalButton';

interface BrutalHeaderProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export function BrutalHeader({
  onSignInClick,
  onSignUpClick,
}: BrutalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b-5 border-black sticky top-0 z-50">
      <div className="container mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/onda-logo-black.svg"
              alt="Onda"
              width={144}
              height={144}
              className="mr-2"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Navigation links removed - no corresponding page sections yet */}

            <div className="flex gap-3 ml-4">
              <BrutalButton
                onClick={onSignInClick}
                variant="white"
                size="small"
              >
                SIGN IN
              </BrutalButton>

              <BrutalButton
                onClick={onSignUpClick}
                variant="yellow"
                size="small"
              >
                SIGN UP
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
            {isMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </BrutalButton>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-4 border-t-3 border-black pt-4">
            <nav className="flex flex-col gap-4">
              {/* Mobile navigation links removed - no corresponding page sections yet */}

              <div className="flex flex-col gap-3 mt-4">
                <BrutalButton
                  onClick={onSignInClick}
                  variant="white"
                  className="w-full"
                >
                  SIGN IN
                </BrutalButton>

                <BrutalButton
                  onClick={onSignUpClick}
                  variant="yellow"
                  className="w-full"
                >
                  SIGN UP
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
