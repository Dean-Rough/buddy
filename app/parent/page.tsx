'use client';

import { useState, useEffect } from 'react';
import PinSetup from '@/components/parent/auth/PinSetup';
import PinEntry from '@/components/parent/auth/PinEntry';
import ParentDashboardComponent from '@/components/parent/ParentDashboard';
import AuthGuard from '@/components/auth/AuthGuard';

interface PinStatus {
  requiresSetup: boolean;
  isLocked: boolean;
  lockoutUntil?: string;
  failedAttempts?: number;
}

export default function ParentDashboard() {
  return (
    <AuthGuard>
      <ParentDashboardWithPin />
    </AuthGuard>
  );
}

function ParentDashboardWithPin() {
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const response = await fetch('/api/parent/pin-status');
      if (response.ok) {
        const status = await response.json();
        setPinStatus(status);
      } else {
        console.error('Failed to check PIN status');
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerified = () => {
    setPinVerified(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show PIN setup if required
  if (pinStatus?.requiresSetup) {
    return <PinSetup />;
  }

  // Show PIN entry if not verified yet
  if (!pinVerified) {
    return <PinEntry onVerified={handlePinVerified} />;
  }

  // Show main dashboard
  return <ParentDashboardComponent />;
}
