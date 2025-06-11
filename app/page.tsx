"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">🤖</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Buddy
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A safe AI companion for children aged 6-12
        </p>
        <div className="space-x-4">
          <Link 
            href="/parent"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Parent Dashboard
          </Link>
          <Link 
            href="/pin"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Child PIN Entry
          </Link>
        </div>
        
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-3">🛡️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Safe & Secure</h3>
            <p className="text-gray-600 text-sm">
              Dual-layer AI safety with real-time monitoring and parent oversight
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Age-Appropriate</h3>
            <p className="text-gray-600 text-sm">
              Content and language adapted specifically for your child's age
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-3">👨‍👩‍👧‍👦</div>
            <h3 className="font-semibold text-gray-900 mb-2">Parent Control</h3>
            <p className="text-gray-600 text-sm">
              Full visibility and control over your child's AI interactions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
