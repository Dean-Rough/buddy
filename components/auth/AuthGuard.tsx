'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requiredUserType?: 'child' | 'parent';
  fallbackUrl?: string;
}

export default function AuthGuard({
  children,
  requiredUserType,
  fallbackUrl = '/',
}: AuthGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Not authenticated - redirect to landing page
    if (!user) {
      router.push(fallbackUrl);
      return;
    }

    const userType = user.unsafeMetadata?.userType;

    // No user type set - redirect to setup
    if (!userType) {
      router.push('/onboarding/setup');
      return;
    }

    // Check user type requirements
    if (requiredUserType && userType !== requiredUserType) {
      // Wrong user type - redirect appropriately
      if (userType === 'child') {
        router.push('/chat');
      } else if (userType === 'parent') {
        router.push('/parent');
      } else {
        router.push('/onboarding/setup');
      }
      return;
    }
  }, [user, isLoaded, requiredUserType, fallbackUrl, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Redirecting...
          </h2>
          <p className="text-gray-600">Taking you to sign in</p>
        </div>
      </div>
    );
  }

  const userType = user.unsafeMetadata?.userType;

  // No user type - redirect to setup
  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Setting up...
          </h2>
          <p className="text-gray-600">
            Just need to finish your account setup
          </p>
        </div>
      </div>
    );
  }

  // Wrong user type
  if (requiredUserType && userType !== requiredUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Redirecting...
          </h2>
          <p className="text-gray-600">Taking you to the right place</p>
        </div>
      </div>
    );
  }

  // All checks passed - render the protected content
  return <>{children}</>;
}
