'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export type FlowType = 'signup' | 'login';

interface AuthFlowOptions {
  type: FlowType;
}

export function useAuthFlow() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const handleAuthFlow = useCallback(
    (options: AuthFlowOptions) => {
      const { type } = options;

      console.log('🚀 Simple auth flow:', type, {
        userExists: !!user,
        isLoaded,
      });

      // If user is already signed in, redirect to chat
      if (user && isLoaded) {
        console.log('✅ User already signed in, redirecting to chat');
        router.push('/chat');
        return;
      }

      // If not signed in, proceed with auth flow
      if (type === 'signup') {
        console.log('📝 Routing to signup → custom onboarding');
        router.push('/onboarding');
      } else {
        console.log('🔐 Routing to login → custom sign-in');
        router.push('/sign-in');
      }
    },
    [user, isLoaded, router]
  );

  return { handleAuthFlow };
}
