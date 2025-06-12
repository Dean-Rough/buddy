"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="brutal-h1 mb-4">PARENT ACCESS</h1>
          <p className="brutal-text">
            Sign in to access your parent dashboard and manage your child's account.
          </p>
        </div>
        
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "brutal-btn brutal-btn-green",
                card: "brutal-card border-3 border-black shadow-lg",
                headerTitle: "brutal-h3",
                headerSubtitle: "brutal-text",
                socialButtonsBlockButton: "brutal-btn brutal-btn-white mb-2",
                formFieldInput: "brutal-input",
                formFieldLabel: "brutal-text font-bold",
                footerActionLink: "brutal-text text-blue-600 hover:text-blue-800"
              }
            }}
            redirectUrl="/parent"
          />
        </div>
      </div>
    </div>
  );
}