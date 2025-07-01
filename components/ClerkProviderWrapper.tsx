'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect } from 'react';

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Clean the publishable key to remove any trailing newlines or whitespace
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  
  useEffect(() => {
    // Enhanced error logging
    console.log('🔍 ClerkProviderWrapper mounted');
    console.log('🔑 Environment:', process.env.NODE_ENV);
    console.log('🔑 Clerk key exists:', !!publishableKey);
    console.log('🔑 Clerk key length:', publishableKey?.length);
    console.log('🔑 Clerk key format:', publishableKey?.startsWith('pk_') ? 'Valid format' : 'Invalid format');
    
    // Log any syntax errors
    window.addEventListener('error', (e) => {
      console.error('🚨 Runtime error caught:', e.message);
      console.error('🚨 Error filename:', e.filename);
      console.error('🚨 Error line:col:', `${e.lineno}:${e.colno}`);
      console.error('🚨 Error object:', e.error);
      
      // Send error to parent for debugging
      if (e.message.includes('Unexpected token') || e.message.includes('SyntaxError')) {
        document.body.innerHTML = `
          <div style="padding: 20px; font-family: monospace; background: #fee; border: 2px solid #c00;">
            <h2>Syntax Error Detected</h2>
            <p><strong>Message:</strong> ${e.message}</p>
            <p><strong>File:</strong> ${e.filename}</p>
            <p><strong>Location:</strong> Line ${e.lineno}, Column ${e.colno}</p>
            <p><strong>Stack:</strong></p>
            <pre>${e.error?.stack || 'No stack trace'}</pre>
          </div>
        `;
      }
    });
  }, [publishableKey]);
  
  if (!publishableKey) {
    console.error('❌ Clerk publishable key is missing!');
    return (
      <div style={{ padding: '20px', background: '#fee', border: '2px solid #c00' }}>
        <h2>Configuration Error</h2>
        <p>Clerk authentication is not configured. Please check environment variables.</p>
        <details>
          <summary>Debug Info</summary>
          <pre>{JSON.stringify({ 
            env: process.env.NODE_ENV,
            hasKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            keyLength: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length
          }, null, 2)}</pre>
        </details>
        {children}
      </div>
    );
  }
  
  try {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        {children}
      </ClerkProvider>
    );
  } catch (error) {
    console.error('❌ ClerkProvider initialization error:', error);
    return (
      <div style={{ padding: '20px', background: '#fee', border: '2px solid #c00' }}>
        <h2>Clerk Initialization Error</h2>
        <p>Failed to initialize authentication provider.</p>
        <details>
          <summary>Error Details</summary>
          <pre>{String(error)}</pre>
        </details>
        {children}
      </div>
    );
  }
}