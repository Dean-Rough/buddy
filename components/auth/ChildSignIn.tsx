"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalInput from "@/components/ui/BrutalInput";
import BrutalButton from "@/components/ui/BrutalButton";

interface ChildSignInProps {
  onCancel?: () => void;
  className?: string;
}

export default function ChildSignIn({ onCancel, className = "" }: ChildSignInProps) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    if (!username.trim() || !pin.trim()) {
      setError("ENTER YOUR USERNAME AND PIN!");
      return;
    }

    if (pin.length < 4) {
      setError("PIN MUST BE AT LEAST 4 DIGITS!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Attempt sign in with username as identifier and PIN as password
      const result = await signIn.create({
        identifier: username.toLowerCase().trim(),
        password: pin,
      });

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        // Check if this is actually a child account
        // We'll do this check after setting the session
        router.push("/chat");
      } else {
        // Handle other completion requirements (2FA, etc.)
        setError("ADDITIONAL VERIFICATION REQUIRED");
      }
    } catch (err: any) {
      console.error("Child sign in error:", err);
      
      // Map Clerk errors to child-friendly messages
      const errorMessage = err.errors?.[0]?.message || err.message || "";
      
      if (errorMessage.includes("Invalid") || errorMessage.includes("incorrect")) {
        setError("WRONG USERNAME OR PIN! TRY AGAIN");
      } else if (errorMessage.includes("too many")) {
        setError("TOO MANY TRIES! WAIT A BIT AND TRY AGAIN");
      } else {
        setError("CONNECTION PROBLEM! TRY AGAIN");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
  };

  const handleUsernameChange = (value: string) => {
    // Allow alphanumeric and basic characters, no spaces
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(cleaned);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-50 ${className}`}>
      <BrutalCard variant="yellow" className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="brutal-h2 mb-4">WELCOME BACK!</h1>
          <p className="brutal-text">
            Enter your username and secret PIN to start chatting with Buddy!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block brutal-text font-bold mb-2">
              Your Username
            </label>
            <BrutalInput
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="coolkid123"
              disabled={isLoading}
              className="text-lg"
              maxLength={20}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="pin" className="block brutal-text font-bold mb-2">
              Your Secret PIN
            </label>
            <BrutalInput
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••"
              disabled={isLoading}
              error={error}
              className="text-center text-2xl font-bold tracking-widest"
              maxLength={6}
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
              disabled={isLoading || !username.trim() || pin.length < 4}
              variant="green"
              className="flex-1"
            >
              {isLoading ? "CHECKING..." : "LET'S GO!"}
            </BrutalButton>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="brutal-text text-sm text-gray-600">
            Forgot your username or PIN?<br />
            Ask a grown-up to help you!
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}