'use client';

export default function DebugAuthPage() {
  const checkEnvVars = () => {
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    return {
      hasClerkKey: !!clerkPublishableKey,
      clerkKeyLength: clerkPublishableKey?.length || 0,
      clerkKeyPrefix: clerkPublishableKey?.substring(0, 10) || 'none',
    };
  };

  const envStatus = checkEnvVars();

  return (
    <div style={{ padding: '20px', background: 'white', color: 'black', fontFamily: 'monospace' }}>
      <h1>Debug Auth Status</h1>
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <h2>Environment Variables</h2>
        <pre>{JSON.stringify(envStatus, null, 2)}</pre>
      </div>
      
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <h2>Window Object</h2>
        <p>Window available: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
        <p>Location: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
      </div>

      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <h2>Clerk Status</h2>
        <p>This page should load if middleware is working correctly</p>
      </div>
    </div>
  );
}