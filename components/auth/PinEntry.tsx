"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PinEntry() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.success) {
        // Store session token
        localStorage.setItem("childSession", data.sessionToken);
        localStorage.setItem("childProfile", JSON.stringify(data.child));
        
        // Redirect to chat
        router.push("/chat");
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back\! 👋
          </h2>
          <p className="text-gray-600">Enter your special PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              Your PIN
            </label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Enter Buddy World"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
