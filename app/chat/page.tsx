"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
}

export default function ChatPage() {
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for valid child session
    const sessionToken = localStorage.getItem('childSession');
    const profileData = localStorage.getItem('childProfile');

    if (!sessionToken || !profileData) {
      router.push('/pin');
      return;
    }

    try {
      const profile = JSON.parse(profileData);
      
      // Validate session token (basic check)
      const sessionData = JSON.parse(atob(sessionToken));
      const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000; // 24 hours
      
      if (isExpired) {
        localStorage.removeItem('childSession');
        localStorage.removeItem('childProfile');
        router.push('/pin');
        return;
      }

      setChildProfile(profile);
    } catch (error) {
      console.error('Invalid session data:', error);
      localStorage.removeItem('childSession');
      localStorage.removeItem('childProfile');
      router.push('/pin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!childProfile) {
    return null; // Router will redirect
  }

  return <ChatInterface childProfile={childProfile} />;
}