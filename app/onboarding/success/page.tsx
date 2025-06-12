"use client";

import { useRouter } from "next/navigation";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalButton from "@/components/ui/BrutalButton";

export default function OnboardingSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <BrutalCard variant="white" className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="brutal-h1 mb-4">SETUP COMPLETE!</h1>
          <p className="brutal-text text-lg">
            Your child's Buddy account is ready! Here's what happens next:
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <BrutalCard variant="yellow" className="p-4">
            <h3 className="brutal-h3 mb-2">FOR YOUR CHILD</h3>
            <p className="brutal-text">
              They can now login with their username and PIN to start chatting with Buddy safely.
            </p>
          </BrutalCard>

          <BrutalCard variant="blue" className="p-4">
            <h3 className="brutal-h3 mb-2">FOR YOU</h3>
            <p className="brutal-text">
              Access your parent dashboard anytime to monitor conversations and manage settings.
            </p>
          </BrutalCard>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <BrutalButton
            onClick={() => router.push("/parent")}
            variant="green"
            className="flex-1"
          >
            GO TO PARENT DASHBOARD
          </BrutalButton>
          
          <BrutalButton
            onClick={() => router.push("/")}
            variant="white"
            className="flex-1"
          >
            BACK TO HOME
          </BrutalButton>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="brutal-text text-sm">
            💡 <strong>Pro Tip:</strong> Bookmark the parent dashboard and share the main page with your child for easy access!
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}