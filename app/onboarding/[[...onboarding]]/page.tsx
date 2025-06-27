'use client';

import { SignUp } from '@clerk/nextjs';

export default function OnboardingCatchAllPage() {
  return (
    <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-rokano text-4xl mb-4">CREATE ACCOUNT</h1>
          <p className="font-avotica text-gray-600">
            Join thousands of families using Onda for safe AI conversations
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            redirectUrl="/onboarding/setup"
            afterSignUpUrl="/onboarding/setup"
            appearance={{
              elements: {
                formButtonPrimary: 'brutal-btn brutal-btn-green',
                card: 'brutal-card border-3 border-black shadow-lg',
                headerTitle: 'font-avotica font-bold text-xl',
                headerSubtitle: 'font-avotica',
                socialButtonsBlockButton: 'brutal-btn brutal-btn-white mb-2',
                formFieldInput: 'brutal-input',
                formFieldLabel: 'font-avotica font-bold',
                footerActionLink:
                  'font-avotica text-blue-600 hover:text-blue-800',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}