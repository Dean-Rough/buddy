'use client';

import { Sparkles, Shield } from 'lucide-react';
import BrutalButton from '../ui/BrutalButton';
import { useAuthFlow } from '@/lib/useAuthFlow';

interface BrutalFooterProps {}

export function BrutalFooter({}: BrutalFooterProps) {
  const { handleAuthFlow } = useAuthFlow();
  return (
    <footer className="bg-white text-black border-t-5 border-black mt-20">
      <div className="container mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img src="/onda-logo-black.svg" alt="Onda" className="h-8 mb-4" />
            <p className="font-avotica text-gray-700 mb-4">
              The AI companion that actually gets kids. Safe, smart, and
              genuinely fun.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-400 border-3 border-white brutal-shadow-sm">
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src="/onda-icon-black.svg"
                    alt="Onda Icon"
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <div className="w-10 h-10 bg-pink-500 border-3 border-white brutal-shadow-sm">
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-400 border-3 border-white brutal-shadow-sm">
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-black" />
                </div>
              </div>
            </div>
          </div>

          {/* For Kids */}
          <div>
            <h4 className="font-avotica font-bold text-lg text-yellow-400 mb-4 uppercase">
              FOR KIDS
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleAuthFlow({ type: 'signup' })}
                  className="font-avotica text-gray-700 hover:text-yellow-600 transition-colors text-left"
                >
                  Start Chatting
                </button>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  How It Works
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Safety Tips
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Fun Features
                </span>
              </li>
            </ul>
          </div>

          {/* For Parents */}
          <div>
            <h4 className="font-avotica font-bold text-lg text-pink-500 mb-4 uppercase">
              FOR PARENTS
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleAuthFlow({ type: 'login' })}
                  className="font-avotica text-gray-700 hover:text-pink-600 transition-colors text-left"
                >
                  Parent Dashboard
                </button>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Safety Features
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-avotica font-bold text-lg text-blue-400 mb-4 uppercase">
              SUPPORT
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Help Center
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Contact Us
                </span>
              </li>
              <li>
                <span className="font-avotica text-gray-400 cursor-not-allowed">
                  Bug Reports
                </span>
              </li>
              <li>
                <a
                  href="#"
                  className="font-avotica text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Feature Requests
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-3 border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="font-avotica text-gray-600 mb-4 md:mb-0">
            © 2024 Onda. BUILT FOR KIDS • TRUSTED BY PARENTS • POWERED BY THE
            FUTURE
          </div>

          <div className="flex gap-4">
            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'login' })}
              variant="blue"
              size="small"
            >
              PARENT ACCESS
            </BrutalButton>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default BrutalFooter;
