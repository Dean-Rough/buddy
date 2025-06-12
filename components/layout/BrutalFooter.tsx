"use client";

import { Bot, Sparkles, Shield } from "lucide-react";
import BrutalButton from "../ui/BrutalButton";

interface BrutalFooterProps {
  onParentDashboard?: () => void;
}

export function BrutalFooter({ onParentDashboard }: BrutalFooterProps) {
  return (
    <footer className="bg-blue-600 text-white border-t-5 border-black mt-20">
      <div className="container mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="brutal-h2 text-yellow-400 mb-4">BUDDY</h3>
            <p className="brutal-text text-gray-300 mb-4">
              The AI companion that actually gets kids. Safe, smart, and genuinely fun.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-400 border-3 border-white brutal-shadow-sm">
                <div className="w-full h-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-black" />
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
            <h4 className="brutal-h3 text-lg text-yellow-400 mb-4 uppercase">FOR KIDS</h4>
            <ul className="space-y-2">
              <li><a href="#" className="brutal-text text-gray-300 hover:text-yellow-400 transition-colors">Start Chatting</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-yellow-400 transition-colors">How It Works</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-yellow-400 transition-colors">Safety Tips</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-yellow-400 transition-colors">Fun Features</a></li>
            </ul>
          </div>

          {/* For Parents */}
          <div>
            <h4 className="brutal-h3 text-lg text-pink-500 mb-4 uppercase">FOR PARENTS</h4>
            <ul className="space-y-2">
              <li><a href="#" className="brutal-text text-gray-300 hover:text-pink-500 transition-colors">Parent Dashboard</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-pink-500 transition-colors">Safety Features</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-pink-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-pink-500 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="brutal-h3 text-lg text-blue-400 mb-4 uppercase">SUPPORT</h4>
            <ul className="space-y-2">
              <li><a href="#" className="brutal-text text-gray-300 hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-blue-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-blue-400 transition-colors">Bug Reports</a></li>
              <li><a href="#" className="brutal-text text-gray-300 hover:text-blue-400 transition-colors">Feature Requests</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-3 border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="brutal-text text-gray-400 mb-4 md:mb-0">
            © 2024 BUDDY. BUILT FOR KIDS • TRUSTED BY PARENTS • POWERED BY THE FUTURE
          </div>
          
          <div className="flex gap-4">
            <BrutalButton 
              onClick={onParentDashboard}
              variant="white" 
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