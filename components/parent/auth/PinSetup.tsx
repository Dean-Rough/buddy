'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrutalCard from '../../ui/BrutalCard';
import BrutalButton from '../../ui/BrutalButton';
import BrutalInput from '../../ui/BrutalInput';

export default function PinSetup() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!understood) {
      setError(
        'Please confirm you understand the PIN protects child safety settings'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/parent/setup-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push('/parent');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to set up PIN');
      }
    } catch (error) {
      console.error('PIN setup error:', error);
      setError('Failed to set up PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits, max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
  };

  const handleConfirmPinChange = (value: string) => {
    // Only allow digits, max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(cleaned);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <BrutalCard className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-400 border-3 border-black mx-auto mb-4 flex items-center justify-center brutal-shadow-small">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="font-avotica font-bold text-2xl mb-2">
              Welcome to Your Dashboard
            </h1>
            <p className="text-gray-600 text-sm">
              For extra security, please set a 4-digit PIN to access your parent
              dashboard and child settings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter 4-digit PIN
              </label>
              <BrutalInput
                type="password"
                value={pin}
                onChange={e => handlePinChange(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm PIN
              </label>
              <BrutalInput
                type="password"
                value={confirmPin}
                onChange={e => handleConfirmPinChange(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="understood"
                checked={understood}
                onChange={e => setUnderstood(e.target.checked)}
                className="mt-1 w-4 h-4 border-2 border-black"
              />
              <label htmlFor="understood" className="text-sm text-gray-700">
                I understand this PIN protects my child&apos;s safety settings
                and conversation data
              </label>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 brutal-shadow-small">
                {error}
              </div>
            )}

            <BrutalButton
              type="submit"
              variant="green"
              size="large"
              className="w-full"
              disabled={isLoading || !pin || !confirmPin || !understood}
            >
              {isLoading ? 'Setting up...' : 'Set PIN & Continue'}
            </BrutalButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This PIN is separate from your account password and adds an extra
              layer of security for your family&apos;s safety settings.
            </p>
          </div>
        </div>
      </BrutalCard>
    </div>
  );
}
