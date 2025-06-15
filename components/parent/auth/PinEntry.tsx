'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrutalCard from '../../ui/BrutalCard';
import BrutalButton from '../../ui/BrutalButton';
import BrutalInput from '../../ui/BrutalInput';

interface PinEntryProps {
  childName?: string;
  onVerified?: () => void;
}

export default function PinEntry({ childName, onVerified }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const router = useRouter();

  // Check lockout status on mount
  useEffect(() => {
    checkLockoutStatus();
  }, []);

  const checkLockoutStatus = async () => {
    try {
      const response = await fetch('/api/parent/pin-status');
      if (response.ok) {
        const data = await response.json();
        if (data.isLocked) {
          setIsLocked(true);
          setLockoutUntil(new Date(data.lockoutUntil));
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/parent/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.success) {
        // Successful verification - call onVerified or redirect
        if (onVerified) {
          onVerified();
        } else {
          router.push('/parent');
        }
      } else if (data.isLocked) {
        setIsLocked(true);
        setLockoutUntil(new Date(data.lockoutUntil));
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Incorrect PIN');
        setRemainingAttempts(data.remainingAttempts);
        setPin(''); // Clear PIN field
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits, max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);

    // Auto-submit when 4 digits entered
    if (cleaned.length === 4 && !isLoading) {
      setTimeout(() => {
        const form = document.getElementById('pin-form') as HTMLFormElement;
        form?.requestSubmit();
      }, 100);
    }
  };

  const handleForgotPin = () => {
    router.push('/parent/forgot-pin');
  };

  const formatLockoutTime = () => {
    if (!lockoutUntil) return '';

    const now = new Date();
    const diff = lockoutUntil.getTime() - now.getTime();
    const minutes = Math.ceil(diff / (1000 * 60));

    if (minutes <= 0) {
      setIsLocked(false);
      setLockoutUntil(null);
      return '';
    }

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center p-4">
        <BrutalCard className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-400 border-3 border-black mx-auto mb-4 flex items-center justify-center brutal-shadow-small">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="font-avotica font-bold text-2xl mb-4 text-red-700">
              Dashboard Locked
            </h1>
            <p className="text-gray-700 mb-4">
              Too many incorrect PIN attempts. Please try again in{' '}
              {formatLockoutTime()}.
            </p>
            <BrutalButton variant="red" size="medium" onClick={handleForgotPin}>
              Reset PIN via Email
            </BrutalButton>
          </div>
        </BrutalCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <BrutalCard className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-400 border-3 border-black mx-auto mb-4 flex items-center justify-center brutal-shadow-small">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <h1 className="font-avotica font-bold text-2xl mb-2">
              Parent Dashboard Access
            </h1>
            <p className="text-gray-600 text-sm">
              Enter your 4-digit PIN to access{' '}
              {childName ? `${childName}&apos;s` : "your child&apos;s"} safety settings
              and reports
            </p>
          </div>

          <form id="pin-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-center">
                PIN
              </label>
              <BrutalInput
                type="password"
                value={pin}
                onChange={e => handlePinChange(e.target.value)}
                placeholder="••••"
                className="text-center text-3xl tracking-[0.5em] font-mono"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 brutal-shadow-small text-center">
                {error}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <div className="text-sm mt-1">
                    {remainingAttempts} attempt
                    {remainingAttempts === 1 ? '' : 's'} remaining
                  </div>
                )}
              </div>
            )}

            <BrutalButton
              type="submit"
              variant="blue"
              size="large"
              className="w-full"
              disabled={isLoading || pin.length < 4}
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </BrutalButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleForgotPin}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Forgot PIN?
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Your PIN adds an extra layer of security to protect your family&apos;s
              safety settings and conversation data.
            </p>
          </div>
        </div>
      </BrutalCard>
    </div>
  );
}
