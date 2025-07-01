'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    // Capture all errors
    const errorHandler = (e: ErrorEvent) => {
      const errorInfo = `${new Date().toISOString()} - ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
      setErrorLog(prev => [...prev, errorInfo]);
    };

    window.addEventListener('error', errorHandler);

    // Collect diagnostics
    const diag = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
          exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length,
          firstChars: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
          lastChars: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(
            (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0) - 10
          ),
          hasNewline: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('\n'),
          hasSpace: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes(' '),
          startsWithPk: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_'),
        },
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
      window: {
        location: window.location.href,
        origin: window.location.origin,
      },
      document: {
        readyState: document.readyState,
        title: document.title,
      },
      modules: {
        clerkLoaded: typeof window !== 'undefined' && !!(window as any).Clerk,
      },
    };

    setDiagnostics(diag);

    // Test Clerk loading
    const checkClerk = setInterval(() => {
      if ((window as any).Clerk) {
        console.log('✅ Clerk loaded successfully');
        clearInterval(checkClerk);
      }
    }, 100);

    setTimeout(() => clearInterval(checkClerk), 5000);

    return () => {
      window.removeEventListener('error', errorHandler);
      clearInterval(checkClerk);
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#f5f5f5' }}>
      <h1>Debug Diagnostics</h1>
      
      <section>
        <h2>Environment Variables</h2>
        <pre style={{ background: '#fff', padding: '10px', border: '1px solid #ddd' }}>
          {JSON.stringify(diagnostics.environment, null, 2)}
        </pre>
      </section>

      <section>
        <h2>Browser Info</h2>
        <pre style={{ background: '#fff', padding: '10px', border: '1px solid #ddd' }}>
          {JSON.stringify(diagnostics.browser, null, 2)}
        </pre>
      </section>

      <section>
        <h2>Window Info</h2>
        <pre style={{ background: '#fff', padding: '10px', border: '1px solid #ddd' }}>
          {JSON.stringify(diagnostics.window, null, 2)}
        </pre>
      </section>

      <section>
        <h2>Module Status</h2>
        <pre style={{ background: '#fff', padding: '10px', border: '1px solid #ddd' }}>
          {JSON.stringify(diagnostics.modules, null, 2)}
        </pre>
      </section>

      <section>
        <h2>Error Log</h2>
        <div style={{ background: '#fee', padding: '10px', border: '1px solid #c00' }}>
          {errorLog.length === 0 ? (
            <p>No errors captured</p>
          ) : (
            errorLog.map((error, i) => <div key={i}>{error}</div>)
          )}
        </div>
      </section>

      <section>
        <h2>Quick Tests</h2>
        <button 
          onClick={() => {
            console.log('Testing console output');
            alert('If you see this, JavaScript is working');
          }}
          style={{ padding: '10px', margin: '5px' }}
        >
          Test JavaScript
        </button>
        <button 
          onClick={() => {
            throw new Error('Test error - this is intentional');
          }}
          style={{ padding: '10px', margin: '5px' }}
        >
          Trigger Test Error
        </button>
      </section>
    </div>
  );
}