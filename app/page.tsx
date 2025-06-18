'use client';

import BrutalButton from '@/components/ui/BrutalButton';
import Image from 'next/image';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalHeader from '@/components/layout/BrutalHeader';
import BrutalFooter from '@/components/layout/BrutalFooter';
import VideoBackground from '@/components/ui/VideoBackground';
import { useAuthFlow } from '@/lib/useAuthFlow';
import { Ban, Target, Eye, Shield, Users, Clock } from 'lucide-react';
export default function BrutalLandingPage() {
  const { handleAuthFlow } = useAuthFlow();

  // Add debugging
  console.log('🔍 Landing page rendering');
  
  // Add error boundary
  if (typeof window !== 'undefined') {
    console.log('🔍 Landing page on client side');
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <BrutalHeader
        onSignInClick={() => handleAuthFlow({ type: 'login' })}
        onSignUpClick={() => handleAuthFlow({ type: 'signup' })}
      />

      {/* Hero Section with Video Background */}
      <VideoBackground
        videoSrc="/videos/4961708-uhd_3840_2160_25fps.mp4"
        overlayOpacity={0.2}
        className="min-h-screen flex items-center"
      >
        <div className="container mx-auto px-8 py-24 text-center text-on-video">
          <div className="flex justify-center mb-6">
            <Image
              src="/onda-logo-white.svg"
              alt="Onda"
              width={192}
              height={192}
            />
          </div>
          <h1 className="font-rokano text-4xl text-white mb-6">
            BIG ANSWERS FOR LITTLE MINDS
          </h1>
          <h2 className="font-rokano text-2xl text-yellow-400 mb-8">
            A safe space for your child to talk.
          </h2>
          <p className="font-avotica text-xl max-w-4xl mx-auto mb-12 text-gray-200">
            When your child needs to talk but you&apos;re not available—or when
            they need answers you&apos;re not comfortable giving—Onda steps in.
            A safe AI companion that handles the tricky questions, builds their
            confidence, and keeps you in the loop.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'signup' })}
              variant="yellow"
              size="large"
              className="relative z-30"
            >
              GET STARTED
            </BrutalButton>

            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'login' })}
              variant="white"
              size="large"
              className="relative z-30"
            >
              SIGN IN
            </BrutalButton>
          </div>
        </div>
      </VideoBackground>

      {/* Parent Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-rokano text-4xl mb-6">
              WHAT PARENTS ACTUALLY GET
            </h2>
            <p className="font-avotica text-xl max-w-3xl mx-auto text-gray-700">
              The conversations you dread, handled professionally. The questions
              you can&apos;t answer, answered safely. The peace of mind you
              deserve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BrutalCard variant="blue">
              <div className="mb-4 flex justify-start">
                <Ban className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                NO MORE AWKWARD TALKS
              </h3>
              <p className="font-avotica">
                &quot;Where do babies come from?&quot; &quot;What&apos;s
                sex?&quot; &quot;Why do people die?&quot; Let Onda handle
                age-appropriate answers while you focus on being their parent,
                not their encyclopedia.
              </p>
            </BrutalCard>

            <BrutalCard variant="blue">
              <div className="mb-4 flex justify-start">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                ALIGNED WITH YOUR VALUES
              </h3>
              <p className="font-avotica">
                Onda reinforces your family&apos;s values and parenting
                approach. No contradicting your rules, no undermining your
                authority—just support that works WITH you.
              </p>
            </BrutalCard>

            <BrutalCard variant="yellow">
              <div className="mb-4 flex justify-start">
                <Eye className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                FULL TRANSPARENCY
              </h3>
              <p className="font-avotica">
                See every conversation. Get weekly summaries. Know exactly what
                your child discussed and how Onda responded. No secrets, no
                surprises.
              </p>
            </BrutalCard>

            <BrutalCard variant="pink">
              <div className="mb-4 flex justify-start">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                EXPERT-VERIFIED SAFETY
              </h3>
              <p className="font-avotica">
                Every response is double-checked by AI safety systems designed
                by child development experts. If something&apos;s concerning,
                you know immediately.
              </p>
            </BrutalCard>

            <BrutalCard variant="pink">
              <div className="mb-4 flex justify-start">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                MEETS KIDS AT THEIR LEVEL
              </h3>
              <p className="font-avotica">
                Talks like a friend, thinks like a counselor. Handles the
                emotional support conversations you might find draining or
                difficult to navigate.
              </p>
            </BrutalCard>

            <BrutalCard variant="yellow">
              <div className="mb-4 flex justify-start">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-avotica font-bold text-xl mb-4">
                AVAILABLE WHEN YOU&apos;RE NOT
              </h3>
              <p className="font-avotica">
                3AM worries, after-school meltdowns, bedtime fears. Onda&apos;s
                there for the moments when you&apos;re busy, tired, or just need
                backup.
              </p>
            </BrutalCard>
          </div>

          <div className="text-center mt-16">
            <div className="bg-gray-50 rounded-lg p-8 max-w-4xl mx-auto">
              <blockquote className="font-avotica text-lg italic text-gray-700 mb-4">
                &quot;I was dreading &apos;the talk&apos; with my 9-year-old.
                Instead, she got age-appropriate answers from Onda, and I got a
                summary of exactly what was discussed. She felt heard, I felt
                relieved. Win-win.&quot;
              </blockquote>
              <div className="text-center">
                <p className="font-avotica font-bold">Jennifer K.</p>
                <p className="font-avotica text-sm text-gray-500">
                  Mother of two, Denver
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-24 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-rokano text-4xl mb-6">
              THE RESULTS PARENTS SEE
            </h2>
            <p className="font-avotica text-lg max-w-2xl mx-auto">
              When kids have a safe space to process their thoughts, amazing
              things happen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BrutalCard variant="white">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  89%
                </div>
                <h3 className="font-avotica font-bold text-lg mb-4">
                  More Confident at School
                </h3>
                <p className="font-avotica text-sm">
                  Kids who use Onda report feeling more comfortable speaking up
                  in class and with friends.
                </p>
              </div>
            </BrutalCard>

            <BrutalCard variant="white">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">76%</div>
                <h3 className="font-avotica font-bold text-lg mb-4">
                  Better Communication at Home
                </h3>
                <p className="font-avotica text-sm">
                  Parents report their children are more open and articulate
                  about their feelings.
                </p>
              </div>
            </BrutalCard>

            <BrutalCard variant="white">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  92%
                </div>
                <h3 className="font-avotica font-bold text-lg mb-4">
                  Parents Feel More Confident
                </h3>
                <p className="font-avotica text-sm">
                  Knowing their child has safe, smart support gives parents
                  peace of mind.
                </p>
              </div>
            </BrutalCard>
          </div>

          <div className="mt-16 text-center">
            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'signup' })}
              variant="blue"
              size="large"
            >
              TRY ONDA
            </BrutalButton>
            <p className="font-avotica text-sm text-gray-500 mt-4">
              Join thousands of families using Onda safely
            </p>
          </div>
        </div>
      </section>

      {/* Safety Section with Video Background */}
      <VideoBackground
        videoSrc="/videos/4498964-uhd_3840_2160_25fps.mp4"
        overlayOpacity={0.2}
        className="py-24"
      >
        <section id="safety" className="container mx-auto px-8">
          <div className="text-center mb-16 text-on-video">
            <h2 className="font-rokano text-4xl mb-6">ULTRA SAFE</h2>
            <p className="font-avotica text-lg max-w-2xl mx-auto text-gray-200">
              Parents get total control. Kids get total fun. Everyone wins.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                DUAL AI SAFETY
              </h3>
              <p className="font-avotica">
                Two AI systems work together - one for fun conversations,
                another that monitors every message for safety in real-time.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                PARENT ALERTS
              </h3>
              <p className="font-avotica">
                If anything concerning comes up, parents get notified instantly.
                Complete transparency, zero surprises.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                PRIVACY PROTECTED
              </h3>
              <p className="font-avotica">
                COPPA compliant, data encrypted, and your kid&apos;s
                conversations stay private. We&apos;re serious about digital
                safety.
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                95%+ SAFETY
              </h3>
              <p className="font-avotica">
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
            <h2 className="font-rokano text-4xl mb-6">FOR PARENTS</h2>
            <p className="font-avotica text-lg max-w-2xl mx-auto">
              Complete oversight without killing the fun. See everything,
              control everything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                FULL CONTROL DASHBOARD
              </h3>
              <p className="font-avotica">
                View all conversations in real-time
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                SET LIMITS
              </h3>
              <p className="font-avotica">
                Set content filters and time limits
              </p>
            </BrutalCard>

            <BrutalCard variant="white">
              <h3 className="font-avotica font-bold text-xl mb-4">
                INSTANT ALERTS
              </h3>
              <p className="font-avotica">Get instant safety alerts</p>
            </BrutalCard>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <BrutalCard variant="white">
                <h3 className="font-avotica font-bold text-xl mb-4">
                  DATA CONTROL
                </h3>
                <p className="font-avotica mb-6">
                  Delete data anytime, anywhere
                </p>
                <BrutalButton
                  onClick={() => handleAuthFlow({ type: 'signup' })}
                  variant="green"
                  size="large"
                >
                  PARENT DASHBOARD
                </BrutalButton>
              </BrutalCard>
            </div>

            <BrutalCard variant="yellow">
              <h4 className="font-avotica font-bold text-xl mb-4">
                TESTIMONIAL
              </h4>
              <p className="font-avotica mb-4">
                &quot;Finally found an AI my 10-year-old actually wants to talk
                to. The safety features give me peace of mind, and she loves how
                &apos;real&apos; Onda feels. Win-win!&quot;
              </p>
              <p className="font-avotica font-bold">— Sarah M., Parent</p>
            </BrutalCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-8 text-center">
          <h2 className="font-rokano text-4xl mb-6 text-white">
            READY TO START?
          </h2>
          <p className="font-avotica text-xl mb-12 text-gray-300 max-w-2xl mx-auto">
            Join thousands of families already using Onda for safe, fun,
            intelligent conversations.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'signup' })}
              variant="yellow"
              size="large"
              className="relative z-30"
            >
              GET STARTED
            </BrutalButton>

            <BrutalButton
              onClick={() => handleAuthFlow({ type: 'login' })}
              variant="white"
              size="large"
              className="relative z-30"
            >
              SIGN IN
            </BrutalButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <BrutalFooter />
    </div>
  );
}
