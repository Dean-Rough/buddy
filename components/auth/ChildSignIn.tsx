'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalInput from '@/components/ui/BrutalInput';
import BrutalButton from '@/components/ui/BrutalButton';

interface ChildSignInProps {
  onCancel?: () => void;
  className?: string;
}

export default function ChildSignIn({
  onCancel,
  className = '',
}: ChildSignInProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    if (!username.trim() || !pin.trim()) {
      setError('ENTER YOUR USERNAME AND PASSWORD!');
      return;
    }

    if (pin.length < 1) {
      setError('ENTER YOUR PASSWORD!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Attempt sign in with username as identifier and PIN as password
      const result = await signIn.create({
        identifier: username.toLowerCase().trim(),
        password: pin,
      });

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });

        // Verify this is actually a child account
        const verificationResponse = await fetch('/api/auth/verify-child');
        const verificationData = await verificationResponse.json();

        if (
          !verificationData.isValid ||
          verificationData.userType !== 'child'
        ) {
          setError('THIS ACCOUNT IS NOT FOR CHILDREN! USE THE PARENT LOGIN');
          await signOut();
          return;
        }

        router.push('/chat');
      } else {
        // Handle other completion requirements (2FA, etc.)
        setError('ADDITIONAL VERIFICATION REQUIRED');
      }
    } catch (err: any) {
      console.error('Child sign in error:', err);

      // Map Clerk errors to child-friendly messages
      const errorMessage = err.errors?.[0]?.message || err.message || '';

      if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('incorrect')
      ) {
        setError('WRONG USERNAME OR PASSWORD! TRY AGAIN');
      } else if (errorMessage.includes('too many')) {
        setError('TOO MANY TRIES! WAIT A BIT AND TRY AGAIN');
      } else {
        setError('CONNECTION PROBLEM! TRY AGAIN');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Allow alphanumeric and basic characters, no spaces
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);
    setUsername(cleaned);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-50 ${className}`}
    >
      <BrutalCard variant="yellow" className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-rokano text-3xl mb-4">WELCOME BACK!</h1>
          <p className="font-avotica">
            Enter your username and password to start chatting with Onda!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block font-avotica font-bold mb-2"
            >
              Your Username
            </label>
            <BrutalInput
              id="username"
              type="text"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="coolkid123"
              disabled={isLoading}
              className="text-lg"
              maxLength={20}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="pin" className="block font-avotica font-bold mb-2">
              Your Password
            </label>
            <BrutalInput
              id="pin"
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              disabled={isLoading}
              error={error}
              className="text-lg"
              autoComplete="current-password"
            />
          </div>

          <div className="flex gap-4">
            {onCancel && (
              <BrutalButton
                type="button"
                onClick={onCancel}
                variant="orange"
                className="flex-1"
                disabled={isLoading}
              >
                BACK
              </BrutalButton>
            )}

            <BrutalButton
              type="submit"
              disabled={isLoading || !username.trim() || !pin.trim()}
              variant="green"
              className="flex-1"
            >
              {isLoading ? 'CHECKING...' : "LET'S GO!"}
            </BrutalButton>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="font-avotica text-sm text-gray-600">
            Forgot your username or password?
            <br />
            Ask a grown-up to help you!
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}
