'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

// Trim environment variables to prevent newline issues
const trimmedPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

export default function ClientClerkProvider({ children }: { children: ReactNode }) {
  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('Clerk publishable key length:', trimmedPublishableKey?.length);
    console.log('Last char code:', trimmedPublishableKey?.charCodeAt(trimmedPublishableKey.length - 1));
  }

  return (
    <ClerkProvider publishableKey={trimmedPublishableKey}>
      {children}
    </ClerkProvider>
  );
}