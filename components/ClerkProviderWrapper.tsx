'use client';

import { ClerkProvider } from '@clerk/nextjs';

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Clean the publishable key to remove any trailing newlines or whitespace
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  
  if (!publishableKey) {
    console.error('❌ Clerk publishable key is missing!');
    return <>{children}</>;
  }
  
  // Log for debugging
  console.log('🔑 Clerk key length:', publishableKey.length);
  console.log('🔑 Clerk key ends with:', publishableKey.slice(-5));
  
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}