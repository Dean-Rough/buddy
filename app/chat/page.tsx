'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import BrutalChatInterface from '@/components/chat/BrutalChatInterface';
import AuthGuard from '@/components/auth/AuthGuard';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  );
}

function ChatPageContent() {
  const { user } = useUser();
  const [childProfile, setChildProfile] = React.useState<ChildProfile | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getOrCreateChildProfile = async () => {
      if (!user) return;

      try {
        // First try to find existing child account by Clerk user ID
        const response = await fetch('/api/children');
        const data = await response.json();

        if (data.children && data.children.length > 0) {
          // Use the first child account found
          const child = data.children[0];
          setChildProfile({
            id: child.id,
            name: child.name,
            age: child.age,
          });
        } else {
          // Create a new child account if none exists
          const createResponse = await fetch('/api/children', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.firstName || user.username || 'Young Explorer',
              age: (user.unsafeMetadata?.age as number) || 8,
            }),
          });

          const createData = await createResponse.json();
          if (createData.success) {
            setChildProfile({
              id: createData.child.id,
              name: createData.child.name,
              age: createData.child.age,
            });
          }
        }
      } catch (error) {
        console.error('Failed to get child profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateChildProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-avotica text-lg">Setting up your chat...</p>
        </div>
      </div>
    );
  }

  if (!childProfile) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-center">
          <p className="font-avotica text-lg text-red-600">
            Failed to load chat profile
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 font-rokano bg-white border-3 border-black px-4 py-2 brutal-shadow"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return <BrutalChatInterface childProfile={childProfile} />;
}
