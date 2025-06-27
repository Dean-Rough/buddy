'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AuthVisualizerPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [flowHistory, setFlowHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const newEntry = `${new Date().toLocaleTimeString()}: ${pathname} - Auth: ${isSignedIn ? 'YES' : 'NO'} - UserType: ${user?.unsafeMetadata?.userType || 'NONE'}`;
    setFlowHistory(prev => [...prev.slice(-10), newEntry]); // Keep last 10 entries
    setCurrentStep(prev => prev + 1);
  }, [pathname, isSignedIn, user?.unsafeMetadata?.userType]);

  const authState = {
    isLoaded,
    isSignedIn,
    userId: user?.id,
    userType: user?.unsafeMetadata?.userType,
    email: user?.emailAddresses?.[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    // Additional debugging data
    rawUnsafeMetadata: user?.unsafeMetadata,
    rawPublicMetadata: user?.publicMetadata,
    sessionId: user?.sessionId,
  };

  const middlewareLogic = {
    currentPath: pathname,
    isPublicRoute: [
      '/', '/test', '/debug-auth', '/debug-deploy', '/simple-landing', 
      '/auth-test', '/auth-visualizer', '/sign-in', '/onboarding', '/onboarding/setup'
    ].includes(pathname),
    expectedRedirect: getExpectedRedirect(authState, pathname),
  };

  function getExpectedRedirect(auth: any, path: string) {
    if (!auth.isSignedIn) {
      if (path.startsWith('/chat')) return 'Landing page (/)';
      if (path.startsWith('/parent')) return 'Sign-in (/sign-in)';
      return 'No redirect (public route)';
    }

    // User is signed in
    if (auth.userType === 'parent') {
      if (['/sign-in', '/onboarding', '/onboarding/setup', '/'].includes(path)) {
        return 'Parent dashboard (/parent)';
      }
    }

    if (auth.userType === 'child') {
      if (['/sign-in', '/onboarding', '/onboarding/setup', '/'].includes(path)) {
        return 'Child chat (/chat)';
      }
    }

    if (!auth.userType) {
      if (['/sign-in', '/onboarding', '/', '/chat', '/parent'].includes(path)) {
        return 'Setup page (/onboarding/setup)';
      }
    }

    return 'No redirect needed';
  }

  const testRoutes = [
    { name: 'Home', path: '/', color: '#4CAF50' },
    { name: 'Sign In', path: '/sign-in', color: '#2196F3' },
    { name: 'Onboarding', path: '/onboarding', color: '#FF9800' },
    { name: 'Setup', path: '/onboarding/setup', color: '#9C27B0' },
    { name: 'Parent Dashboard', path: '/parent', color: '#F44336' },
    { name: 'Child Chat', path: '/chat', color: '#E91E63' },
    { name: 'Debug Auth', path: '/debug-auth', color: '#607D8B' },
  ];

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ff6b6b', marginBottom: '30px' }}>
        🔍 AUTH FLOW VISUALIZER
      </h1>
      
      {/* Current Auth State */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: `3px solid ${isSignedIn ? '#4CAF50' : '#F44336'}`
      }}>
        <h2 style={{ color: '#64b5f6' }}>📊 Current Auth State</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {Object.entries(authState).map(([key, value]) => (
            <div key={key} style={{ 
              padding: '10px',
              backgroundColor: value ? '#2d5a2d' : '#5a2d2d',
              borderRadius: '4px'
            }}>
              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value) || 'null'}
            </div>
          ))}
        </div>
      </div>

      {/* Middleware vs Component Data Comparison */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '3px solid #E91E63'
      }}>
        <h2 style={{ color: '#ec407a' }}>🔍 Middleware vs Component UserType</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ 
            padding: '15px',
            backgroundColor: '#2d3a4d',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Component Access:</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: '#4CAF50' }}>user?.unsafeMetadata?.userType</div>
              <div style={{ color: '#fff', marginTop: '5px' }}>
                Value: <strong>{user?.unsafeMetadata?.userType || 'undefined'}</strong>
              </div>
            </div>
          </div>
          <div style={{ 
            padding: '15px',
            backgroundColor: '#4d2d3a',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Middleware Logic:</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: '#FF9800' }}>sessionClaims?.metadata?.userType ||</div>
              <div style={{ color: '#FF9800' }}>sessionClaims?.unsafeMetadata?.userType</div>
              <div style={{ color: '#fff', marginTop: '5px' }}>
                Simulated: <strong>{user?.unsafeMetadata?.userType || 'undefined'}</strong>
              </div>
              <div style={{ color: '#ccc', fontSize: '10px', marginTop: '5px' }}>
                (Note: Middleware has different data access)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middleware Analysis */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '3px solid #FF9800'
      }}>
        <h2 style={{ color: '#ffa726' }}>⚙️ Middleware Analysis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          <div style={{ 
            padding: '10px',
            backgroundColor: middlewareLogic.isPublicRoute ? '#2d5a2d' : '#5a2d2d',
            borderRadius: '4px'
          }}>
            <strong>Current Path:</strong> {middlewareLogic.currentPath}
          </div>
          <div style={{ 
            padding: '10px',
            backgroundColor: middlewareLogic.isPublicRoute ? '#2d5a2d' : '#5a2d2d',
            borderRadius: '4px'
          }}>
            <strong>Is Public Route:</strong> {String(middlewareLogic.isPublicRoute)}
          </div>
          <div style={{ 
            padding: '10px',
            backgroundColor: '#2d4a5a',
            borderRadius: '4px',
            gridColumn: 'span 2'
          }}>
            <strong>Expected Redirect:</strong> {middlewareLogic.expectedRedirect}
          </div>
        </div>
      </div>

      {/* Flow History */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '3px solid #9C27B0'
      }}>
        <h2 style={{ color: '#ba68c8' }}>📈 Flow History (Last 10 steps)</h2>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          backgroundColor: '#0d1117',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {flowHistory.map((entry, index) => (
            <div key={index} style={{ 
              padding: '5px 0',
              borderBottom: '1px solid #333',
              color: index === flowHistory.length - 1 ? '#4CAF50' : '#ccc'
            }}>
              <strong>Step {index + 1}:</strong> {entry}
            </div>
          ))}
        </div>
        <button 
          onClick={() => setFlowHistory([])}
          style={{ 
            marginTop: '10px',
            padding: '5px 15px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Clear History
        </button>
      </div>

      {/* Test Navigation */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '3px solid #4CAF50'
      }}>
        <h2 style={{ color: '#66bb6a' }}>🧪 Test Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {testRoutes.map((route) => (
            <button
              key={route.path}
              onClick={() => router.push(route.path)}
              style={{
                padding: '15px',
                backgroundColor: route.color,
                color: 'white',
                border: pathname === route.path ? '3px solid #FFF' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {route.name}
              {pathname === route.path && ' ← HERE'}
            </button>
          ))}
        </div>
      </div>

      {/* Auth Actions */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        border: '3px solid #607D8B'
      }}>
        <h2 style={{ color: '#90a4ae' }}>🔧 Auth Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {user && (
            <>
              <button 
                onClick={async () => {
                  await user.update({
                    unsafeMetadata: {
                      ...user.unsafeMetadata,
                      userType: 'parent'
                    }
                  });
                  window.location.reload();
                }}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Set Type: Parent
              </button>
              
              <button 
                onClick={async () => {
                  await user.update({
                    unsafeMetadata: {
                      ...user.unsafeMetadata,
                      userType: 'child'
                    }
                  });
                  window.location.reload();
                }}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Set Type: Child
              </button>
              
              <button 
                onClick={async () => {
                  await user.update({
                    unsafeMetadata: {
                      ...user.unsafeMetadata,
                      userType: undefined
                    }
                  });
                  window.location.reload();
                }}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Clear Type
              </button>
            </>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>

      {/* Flow Diagram */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '3px solid #E91E63'
      }}>
        <h2 style={{ color: '#ec407a' }}>📋 Expected Auth Flow Diagram</h2>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4' }}>
          <pre style={{ margin: 0, color: '#ccc' }}>
{`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Landing (/)   │───▶│   Sign In/Up    │───▶│  After Auth...  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                         ┌─────────────────────────┐
                                         │  Middleware Checks...   │
                                         └─────────────────────────┘
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    ▼                  ▼                  ▼
                            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                            │ Has Parent  │   │ Has Child   │   │ No UserType │
                            │   Type      │   │    Type     │   │  (New User) │
                            └─────────────┘   └─────────────┘   └─────────────┘
                                    │                  │                  │
                                    ▼                  ▼                  ▼
                            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                            │   /parent   │   │    /chat    │   │ /onboarding │
                            │ (Dashboard) │   │ (Chat App)  │   │   /setup    │
                            └─────────────┘   └─────────────┘   └─────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────┐
                                                               │ Choose Type │
                                                               │ Update User │
                                                               └─────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────┐
                                                               │ Redirect to │
                                                               │ Dashboard   │
                                                               └─────────────┘
`}
          </pre>
        </div>
      </div>
    </div>
  );
}