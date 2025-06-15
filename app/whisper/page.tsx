'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WhisperModeInterface from '@/components/chat/WhisperModeInterface';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
}

export default function WhisperModePage() {
  const { user, isLoaded } = useUser();
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // Not authenticated, redirect to landing page
        router.push('/');
        return;
      }

      // Check if this is a child account
      const userType = user.unsafeMetadata?.userType;

      if (userType !== 'child') {
        // Not a child account, redirect based on user type
        if (userType === 'parent') {
          router.push('/parent');
        } else {
          router.push('/');
        }
        return;
      }

      // Extract child profile from Clerk user data
      const profile: ChildProfile = {
        id: user.id,
        name: user.firstName || user.username || 'Young Explorer',
        age: (user.unsafeMetadata?.age as number) || 8,
      };

      setChildProfile(profile);
    }
  }, [isLoaded, user, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-purple-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-purple-600">Loading your calm space...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or wrong user type
  if (!user || !childProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Redirecting...
          </h2>
          <p className="text-gray-600">Taking you to the right place</p>
        </div>
      </div>
    );
  }

  return <WhisperModeInterface childProfile={childProfile} />;
}
