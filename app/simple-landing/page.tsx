'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SimpleLandingPage() {
  const router = useRouter();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        textAlign: 'center',
        paddingTop: '40px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#333' }}>
          ONDA
        </h1>
        <h2 style={{ fontSize: '24px', marginBottom: '40px', color: '#666' }}>
          Safe AI Companion for Children
        </h2>
        
        {/* Main CTA */}
        <div style={{ marginBottom: '60px' }}>
          <button
            onClick={() => router.push('/sign-in')}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '15px 30px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            Sign In
          </button>
          
          <button
            onClick={() => router.push('/onboarding')}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              padding: '15px 30px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            Get Started
          </button>
        </div>
        
        {/* Features */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '60px'
        }}>
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '10px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>🛡️ Ultra Safe</h3>
            <p>Dual AI safety system monitors every conversation in real-time</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '10px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>👨‍👩‍👧‍👦 Parent Control</h3>
            <p>Full transparency with conversation summaries and instant alerts</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '10px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>🎯 Age Appropriate</h3>
            <p>Responses tailored for children aged 6-12 with proper context</p>
          </div>
        </div>
        
        {/* Debug Info */}
        <div style={{ 
          marginTop: '80px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#666'
        }}>
          <h4>Quick Links for Testing:</h4>
          <div style={{ marginTop: '10px' }}>
            <a href="/debug-deploy" style={{ margin: '0 10px' }}>Debug Page</a>
            <a href="/sign-in" style={{ margin: '0 10px' }}>Sign In</a>
            <a href="/chat" style={{ margin: '0 10px' }}>Chat</a>
            <a href="/parent" style={{ margin: '0 10px' }}>Parent Dashboard</a>
          </div>
          <div style={{ marginTop: '20px', fontSize: '12px' }}>
            Platform Status: Live Testing Deployment
          </div>
        </div>
      </div>
    </div>
  );
}