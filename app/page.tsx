"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalHeader from "@/components/layout/BrutalHeader";
import BrutalFooter from "@/components/layout/BrutalFooter";
import VideoBackground from "@/components/ui/VideoBackground";
import ChildSignIn from "@/components/auth/ChildSignIn";

export default function BrutalLandingPage() {
  const [showChildSignIn, setShowChildSignIn] = useState(false);
  const router = useRouter();

  // Show child sign-in modal
  if (showChildSignIn) {
    return (
      <ChildSignIn 
        onCancel={() => setShowChildSignIn(false)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <BrutalHeader 
        onSignInClick={() => router.push("/sign-in")}
        onSignUpClick={() => router.push("/onboarding")}
        onStartChatClick={() => setShowChildSignIn(true)}
      />

      {/* Hero Section with Video Background */}
      <VideoBackground 
        videoSrc="/videos/4961708-uhd_3840_2160_25fps.mp4"
        overlayOpacity={0.2}
        className="min-h-screen flex items-center"
      >
        <div className="container mx-auto px-8 py-24 text-center text-on-video">
          <h1 className="brutal-h1 mb-6">
            BUDDY
          </h1>
          <h2 className="brutal-h2 text-yellow-400 mb-8">
            AI FRIEND THAT'S ACTUALLY COOL
          </h2>
          <p className="brutal-text-large max-w-3xl mx-auto mb-12 text-gray-200">
            No more boring chat bots. Buddy is the AI companion that gets you, 
            talks like a real friend, and keeps you safe while having epic conversations.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <BrutalButton
              onClick={() => setShowChildSignIn(true)}
              variant="yellow"
              size="large"
              className="relative z-30"
            >
              START CHATTING NOW
            </BrutalButton>
            
            <BrutalButton
              onClick={() => router.push("/onboarding")}
              variant="white"
              size="large"
              className="relative z-30"
            >
              GET STARTED
            </BrutalButton>
          </div>
        </div>
      </VideoBackground>

      {/* Features Section */}
      <section id="features" className="py-24 paper-bg">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="brutal-h1 mb-6">WHY KIDS LOVE BUDDY</h2>
            <p className="brutal-text-large max-w-2xl mx-auto">
              Finally, an AI that doesn't talk down to you. Built for real conversations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BrutalCard variant="pink">
              <h3 className="brutal-h3 mb-4">REAL TALK</h3>
              <p className="brutal-text">
                Buddy doesn't sound like a robot. We use the latest AI to make 
                conversations feel natural, fun, and totally authentic.
              </p>
            </BrutalCard>

            <BrutalCard variant="blue">
              <h3 className="brutal-h3 mb-4">YOUR STYLE</h3>
              <p className="brutal-text">
                Buddy adapts to how you talk and what you're into. Gaming, art, 
                science, sports - whatever you love, Buddy's down to chat about it.
              </p>
            </BrutalCard>

            <BrutalCard variant="yellow">
              <h3 className="brutal-h3 mb-4">GETS SMARTER</h3>
              <p className="brutal-text">
                The more you chat, the better Buddy understands your interests 
                and personality. It's like having a friend who really knows you.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">ALWAYS THERE</h3>
              <p className="brutal-text">
                Need someone to talk to? Buddy's available 24/7 for conversations, 
                help with homework, or just to hang out when you're bored.
              </p>
            </BrutalCard>

            <BrutalCard variant="pink">
              <h3 className="brutal-h3 mb-4">WRITES LIKE YOU</h3>
              <p className="brutal-text">
                Watch Buddy type like a real person - with realistic handwriting, 
                typing sounds, and even occasional typos that get fixed!
              </p>
            </BrutalCard>

            <BrutalCard variant="blue">
              <h3 className="brutal-h3 mb-4">SUPER CREATIVE</h3>
              <p className="brutal-text">
                Want to brainstorm stories, jokes, or wild ideas? Buddy's imagination 
                is limitless and loves getting weird with your creativity.
              </p>
            </BrutalCard>
          </div>
        </div>
      </section>

      {/* Safety Section with Video Background */}
      <VideoBackground 
        videoSrc="/videos/4498964-uhd_3840_2160_25fps.mp4"
        overlayOpacity={0.2}
        className="py-24"
      >
        <section id="safety" className="container mx-auto px-8 text-on-video">
          <div className="text-center mb-16">
            <h2 className="brutal-h1 mb-6">ULTRA SAFE</h2>
            <p className="brutal-text-large max-w-2xl mx-auto text-gray-200">
              Parents get total control. Kids get total fun. Everyone wins.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">DUAL AI SAFETY</h3>
              <p className="brutal-text">
                Two AI systems work together - one for fun conversations, 
                another that monitors every message for safety in real-time.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">PARENT ALERTS</h3>
              <p className="brutal-text">
                If anything concerning comes up, parents get notified 
                instantly. Complete transparency, zero surprises.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">PRIVACY PROTECTED</h3>
              <p className="brutal-text">
                COPPA compliant, data encrypted, and your kid's conversations 
                stay private. We're serious about digital safety.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">95%+ SAFETY</h3>
              <p className="brutal-text">
                Our AI safety system catches inappropriate content with 
                industry-leading accuracy. Tested by child safety experts.
              </p>
            </BrutalCard>
          </div>
        </section>
      </VideoBackground>

      {/* Parents Section */}
      <section id="parents" className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="brutal-h1 mb-6">FOR PARENTS</h2>
            <p className="brutal-text-large max-w-2xl mx-auto">
              Complete oversight without killing the fun. See everything, control everything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">FULL CONTROL DASHBOARD</h3>
              <p className="brutal-text">
                View all conversations in real-time
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">SET LIMITS</h3>
              <p className="brutal-text">
                Set content filters and time limits
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="brutal-h3 mb-4">INSTANT ALERTS</h3>
              <p className="brutal-text">
                Get instant safety alerts
              </p>
            </BrutalCard>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <BrutalCard variant="white">
                <h3 className="brutal-h3 mb-4">DATA CONTROL</h3>
                <p className="brutal-text mb-6">
                  Delete data anytime, anywhere
                </p>
                <BrutalButton
                  onClick={() => router.push("/sign-in")}
                  variant="green"
                  size="large"
                >
                  ACCESS PARENT DASHBOARD
                </BrutalButton>
              </BrutalCard>
            </div>

            <BrutalCard variant="yellow">
              <h4 className="brutal-h3 mb-4">TESTIMONIAL</h4>
              <p className="brutal-text mb-4">
                "Finally found an AI my 10-year-old actually wants to talk to. 
                The safety features give me peace of mind, and she loves how 
                'real' Buddy feels. Win-win!"
              </p>
              <p className="brutal-text font-bold">
                — Sarah M., Parent
              </p>
            </BrutalCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-8 text-center">
          <h2 className="brutal-h1 mb-6 text-white">READY TO START?</h2>
          <p className="brutal-text-large mb-12 text-gray-300 max-w-2xl mx-auto">
            Join thousands of families already using Buddy for safe, fun, intelligent conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <BrutalButton
              onClick={() => setShowChildSignIn(true)}
              variant="yellow"
              size="large"
              className="relative z-30"
            >
              START CHATTING
            </BrutalButton>
            
            <BrutalButton
              onClick={() => router.push("/onboarding")}
              variant="white"
              size="large"
              className="relative z-30"
            >
              PARENT SETUP
            </BrutalButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <BrutalFooter onParentDashboard={() => router.push("/sign-in")} />
    </div>
  );
}
