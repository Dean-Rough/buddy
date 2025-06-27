'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AuthTestPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>🔐 Auth Flow Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Auth Status:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ 
            padding: '5px',
            backgroundColor: isLoaded ? '#ccffcc' : '#ffffcc'
          }}>
            <strong>Is Loaded:</strong> {String(isLoaded)}
          </li>
          <li style={{ 
            padding: '5px',
            backgroundColor: isSignedIn ? '#ccffcc' : '#ffcccc'
          }}>
            <strong>Is Signed In:</strong> {String(isSignedIn)}
          </li>
          <li style={{ padding: '5px' }}>
            <strong>User ID:</strong> {user?.id || 'None'}
          </li>
          <li style={{ padding: '5px' }}>
            <strong>User Type:</strong> {String(user?.unsafeMetadata?.userType) || 'None'}
          </li>
          <li style={{ padding: '5px' }}>
            <strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'None'}
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Navigation:</h2>
        <button 
          onClick={() => router.push('/')}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none'
          }}
        >
          Go to Home
        </button>
        
        <button 
          onClick={() => router.push('/onboarding/setup')}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none'
          }}
        >
          Go to Setup
        </button>
        
        <button 
          onClick={() => router.push('/parent')}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none'
          }}
        >
          Go to Parent
        </button>
        
        <button 
          onClick={() => router.push('/chat')}
          style={{ 
            padding: '10px 20px', 
            margin: '5px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none'
          }}
        >
          Go to Chat
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Auth Actions:</h2>
        {user && (
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
              margin: '5px',
              backgroundColor: '#607d8b',
              color: 'white',
              border: 'none'
            }}
          >
            Set User Type: Parent
          </button>
        )}
      </div>
    </div>
  );
}