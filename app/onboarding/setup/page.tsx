'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalCard from '@/components/ui/BrutalCard';

export default function UserTypeSetupPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUserTypeSelection = async (userType: 'child' | 'parent') => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Update user metadata with user type
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          userType,
        },
      });

      // Route based on user type
      if (userType === 'child') {
        router.push('/chat');
      } else {
        router.push('/parent');
      }
    } catch (error) {
      console.error('Failed to update user type:', error);
      setIsLoading(false);
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="font-rokano text-4xl mb-4">ALMOST THERE!</h1>
          <p className="font-avotica text-lg text-gray-700">
            Just one quick question to set up your account properly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <BrutalCard variant="blue">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">🧒</div>
              <h3 className="font-rokano text-2xl mb-4">I&apos;M A KID</h3>
              <p className="font-avotica text-gray-600 mb-6">
                Set up my account so I can start chatting with Onda right away!
              </p>
              <BrutalButton
                onClick={() => handleUserTypeSelection('child')}
                variant="blue"
                size="large"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'SETTING UP...' : 'START CHATTING'}
              </BrutalButton>
            </div>
          </BrutalCard>

          <BrutalCard variant="blue">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="font-rokano text-2xl mb-4">I&apos;M A PARENT</h3>
              <p className="font-avotica text-gray-600 mb-6">
                Set up parental controls and manage my family&apos;s accounts.
              </p>
              <BrutalButton
                onClick={() => handleUserTypeSelection('parent')}
                variant="blue"
                size="large"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'SETTING UP...' : 'PARENT DASHBOARD'}
              </BrutalButton>
            </div>
          </BrutalCard>
        </div>

        <div className="mt-8 text-center">
          <p className="font-avotica text-sm text-gray-500">
            Don&apos;t worry - you can always change this later in your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
