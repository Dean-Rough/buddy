"use client";

import { useState, useEffect } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalInput from "@/components/ui/BrutalInput";
import BrutalButton from "@/components/ui/BrutalButton";

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
}

interface ChildProfile {
  name: string;
  age: number;
  username: string;
  pin: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    title: "CREATE PARENT ACCOUNT",
    description: "First, let's set up your account so you can manage everything safely."
  },
  {
    step: 2,
    title: "TELL US ABOUT YOUR CHILD",
    description: "Help us create the perfect Buddy experience for your kid."
  },
  {
    step: 3,
    title: "SET UP CHILD LOGIN",
    description: "Choose a username and PIN your child will use to access Buddy."
  },
  {
    step: 4,
    title: "PARENT DASHBOARD PIN",
    description: "Set a PIN to protect your parent dashboard and controls."
  }
];

export default function ParentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Parent account data
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentName, setParentName] = useState("");
  
  // Child profile data
  const [childProfile, setChildProfile] = useState<ChildProfile>({
    name: "",
    age: 7,
    username: "",
    pin: ""
  });
  
  // Parent dashboard PIN
  const [dashboardPin, setDashboardPin] = useState("");
  
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    if (userLoaded && user) {
      // If user already exists and has completed onboarding, redirect to parent dashboard
      if (user.unsafeMetadata?.onboardingComplete) {
        router.push("/parent");
        return;
      }
      
      // If user exists but hasn't completed onboarding, skip step 1 and pre-fill data
      if (user.emailAddresses?.[0]?.emailAddress) {
        setParentEmail(user.emailAddresses[0].emailAddress);
        setParentName(user.firstName || "");
        // Skip straight to child profile setup since parent account already exists
        setCurrentStep(2);
      }
    }
  }, [userLoaded, user, router]);

  const handleParentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpLoaded) return;
    
    if (!parentEmail.trim() || !parentPassword.trim() || !parentName.trim()) {
      setError("PLEASE FILL IN ALL FIELDS!");
      return;
    }

    if (parentPassword.length < 8) {
      setError("PASSWORD MUST BE AT LEAST 8 CHARACTERS!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.create({
        emailAddress: parentEmail.trim(),
        password: parentPassword,
        firstName: parentName.trim(),
        unsafeMetadata: {
          userType: "parent",
          onboardingStep: 1
        }
      });

      // Send verification email
      await result.prepareEmailAddressVerification({
        strategy: "email_code"
      });

      setCurrentStep(2);
    } catch (err: any) {
      console.error("Parent signup error:", err);
      setError(err.errors?.[0]?.message || "SIGNUP FAILED! TRY AGAIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childProfile.name.trim()) {
      setError("ENTER YOUR CHILD'S NAME!");
      return;
    }

    if (childProfile.age < 6 || childProfile.age > 12) {
      setError("BUDDY IS FOR KIDS AGED 6-12!");
      return;
    }

    setError("");
    setCurrentStep(3);
  };

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childProfile.username.trim() || !childProfile.pin.trim()) {
      setError("CHOOSE A USERNAME AND PIN!");
      return;
    }

    if (childProfile.username.length < 3) {
      setError("USERNAME MUST BE AT LEAST 3 CHARACTERS!");
      return;
    }

    if (childProfile.pin.length < 4) {
      setError("PIN MUST BE AT LEAST 4 DIGITS!");
      return;
    }

    setError("");
    setCurrentStep(4);
  };

  const handleDashboardPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dashboardPin.length < 4) {
      setError("DASHBOARD PIN MUST BE AT LEAST 4 DIGITS!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create child account via API
      const response = await fetch("/api/auth/create-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail,
          childProfile,
          dashboardPin
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update parent metadata with dashboard PIN and child info
        if (user) {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              userType: "parent",
              onboardingComplete: true,
              dashboardPinHash: data.dashboardPinHash,
              childUsername: childProfile.username
            }
          });
        }

        // Redirect to success page
        router.push("/onboarding/success");
      } else {
        setError(data.error || "SETUP FAILED! TRY AGAIN");
      }
    } catch (err: any) {
      console.error("Child account creation error:", err);
      setError("SETUP FAILED! TRY AGAIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setChildProfile(prev => ({ ...prev, username: cleaned }));
  };

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setChildProfile(prev => ({ ...prev, pin: digits }));
  };

  const handleDashboardPinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setDashboardPin(digits);
  };

  const currentStepData = ONBOARDING_STEPS[currentStep - 1];

  // Show loading for existing users while we determine their state
  if (userLoaded && user && currentStep === 1 && user.emailAddresses?.[0]?.emailAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <BrutalCard variant="white" className="w-full max-w-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="brutal-h3 mb-2">SETTING UP YOUR ACCOUNT</h2>
          <p className="brutal-text">We're preparing your onboarding experience...</p>
        </BrutalCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <BrutalCard variant="white" className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= step.step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.step}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <h1 className="brutal-h2 mb-4">{currentStepData.title}</h1>
          <p className="brutal-text">{currentStepData.description}</p>
        </div>

        {/* Step 1: Parent Signup (only show for new users without existing accounts) */}
        {currentStep === 1 && !user && (
          <form onSubmit={handleParentSignup} className="space-y-6">
            <BrutalInput
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Your Name"
              disabled={isLoading}
            />
            
            <BrutalInput
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
            
            <BrutalInput
              type="password"
              value={parentPassword}
              onChange={(e) => setParentPassword(e.target.value)}
              placeholder="Choose a strong password"
              disabled={isLoading}
              error={error}
            />

            <BrutalButton
              type="submit"
              disabled={isLoading}
              variant="green"
              className="w-full"
            >
              {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </BrutalButton>
          </form>
        )}

        {/* Step 1: Existing User Welcome */}
        {currentStep === 1 && user && (
          <div className="text-center space-y-6">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="brutal-h3">WELCOME BACK!</h3>
            <p className="brutal-text">
              We see you already have an account. Let's set up your child's Buddy experience!
            </p>
            
            <BrutalButton
              onClick={() => setCurrentStep(2)}
              variant="green"
              className="w-full"
            >
              CONTINUE TO CHILD SETUP
            </BrutalButton>
          </div>
        )}

        {/* Step 2: Child Profile */}
        {currentStep === 2 && (
          <form onSubmit={handleChildProfile} className="space-y-6">
            <BrutalInput
              type="text"
              value={childProfile.name}
              onChange={(e) => setChildProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your child's name"
              disabled={isLoading}
            />
            
            <div>
              <label className="block brutal-text font-bold mb-2">Age</label>
              <select
                value={childProfile.age}
                onChange={(e) => setChildProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                className="w-full p-3 border-2 border-black rounded-lg brutal-text"
              >
                {Array.from({ length: 7 }, (_, i) => i + 6).map(age => (
                  <option key={age} value={age}>{age} years old</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-center brutal-text bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <BrutalButton
              type="submit"
              variant="green"
              className="w-full"
            >
              NEXT STEP
            </BrutalButton>
          </form>
        )}

        {/* Step 3: Child Login Setup */}
        {currentStep === 3 && (
          <form onSubmit={handleChildLogin} className="space-y-6">
            <div>
              <label className="block brutal-text font-bold mb-2">Choose Username</label>
              <BrutalInput
                type="text"
                value={childProfile.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="coolkid123"
                className="text-lg"
                maxLength={20}
              />
              <p className="text-sm text-gray-600 mt-1">Letters, numbers, and _ only</p>
            </div>
            
            <div>
              <label className="block brutal-text font-bold mb-2">Choose PIN</label>
              <BrutalInput
                type="password"
                value={childProfile.pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl font-bold tracking-widest"
                maxLength={6}
              />
              <p className="text-sm text-gray-600 mt-1">4-6 digits they can remember</p>
            </div>

            {error && (
              <div className="text-red-600 text-center brutal-text bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <BrutalButton
              type="submit"
              variant="green"
              className="w-full"
            >
              NEXT STEP
            </BrutalButton>
          </form>
        )}

        {/* Step 4: Dashboard PIN */}
        {currentStep === 4 && (
          <form onSubmit={handleDashboardPin} className="space-y-6">
            <div>
              <label className="block brutal-text font-bold mb-2">Your Dashboard PIN</label>
              <BrutalInput
                type="password"
                value={dashboardPin}
                onChange={(e) => handleDashboardPinChange(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl font-bold tracking-widest"
                maxLength={6}
              />
              <p className="text-sm text-gray-600 mt-1">4-6 digits to access parent controls</p>
            </div>

            {error && (
              <div className="text-red-600 text-center brutal-text bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <BrutalButton
              type="submit"
              disabled={isLoading}
              variant="green"
              className="w-full"
            >
              {isLoading ? "SETTING UP..." : "COMPLETE SETUP"}
            </BrutalButton>
          </form>
        )}

        {/* Back button for steps 2-4 */}
        {currentStep > 1 && currentStep < 4 && (
          <div className="mt-4">
            <BrutalButton
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              variant="orange"
              className="w-full"
            >
              BACK
            </BrutalButton>
          </div>
        )}
      </BrutalCard>
    </div>
  );
}