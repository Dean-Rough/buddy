'use client';

import { SignIn } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Trust middleware to handle auth routing - no conflicting redirects

  return (
    <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-rokano text-4xl mb-4">SIGN IN</h1>
          <p className="font-avotica text-gray-600">
            Welcome back! Sign in to continue your Onda experience
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            redirectUrl="/onboarding/setup"
            afterSignInUrl="/onboarding/setup"
            appearance={{
              elements: {
                formButtonPrimary: 'brutal-btn brutal-btn-blue',
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
