'use client';

import { useEffect, useState } from 'react';

export default function DeploymentDebugPage() {
  const [checks, setChecks] = useState<Record<string, boolean | string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runChecks = async () => {
      const results: Record<string, boolean | string> = {};
      
      // Check 1: Basic rendering
      results.basicRender = true;
      
      // Check 2: Environment variables
      results.clerkPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      results.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'NOT SET';
      results.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET';
      
      // Check 3: Window object
      results.hasWindow = typeof window !== 'undefined';
      
      // Check 4: Clerk loading
      try {
        const { ClerkProvider } = await import('@clerk/nextjs');
        results.clerkImported = !!ClerkProvider;
      } catch (e) {
        results.clerkImported = false;
        results.clerkError = (e as Error).message;
      }
      
      // Check 5: API health
      try {
        const response = await fetch('/api/debug/middleware');
        results.apiHealthy = response.ok;
        results.apiStatus = response.status.toString();
      } catch (e) {
        results.apiHealthy = false;
        results.apiError = (e as Error).message;
      }
      
      setChecks(results);
    };
    
    runChecks().catch(e => {
      setError(e.message);
    });
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🔍 Deployment Debug Page</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffcccc', 
          padding: '10px', 
          margin: '10px 0',
          border: '1px solid #ff0000' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <h2>Environment Checks:</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(checks).map(([key, value]) => (
          <li key={key} style={{ 
            padding: '5px',
            margin: '5px 0',
            backgroundColor: value === true ? '#ccffcc' : 
                           value === false ? '#ffcccc' : '#ffffcc'
          }}>
            <strong>{key}:</strong> {String(value)}
          </li>
        ))}
      </ul>
      
      <h2>Quick Actions:</h2>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Go to Home
        </button>
        
        <button 
          onClick={() => window.location.href = '/sign-in'}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Go to Sign In
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
      
      <h2>Console Output:</h2>
      <div style={{ 
        backgroundColor: '#000', 
        color: '#0f0', 
        padding: '10px',
        marginTop: '20px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        Check browser console for additional errors...
      </div>
    </div>
  );
}