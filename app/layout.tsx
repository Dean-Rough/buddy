import type { Metadata } from 'next';
import { ClerkProviderWrapper } from '@/components/ClerkProviderWrapper';
import './globals.css';
import '../styles/fonts.css';
import '../styles/brutalist.css';
import ErrorBoundary from '@/components/ErrorBoundary';

// Initialize why-did-you-render in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('../lib/why-did-you-render');
}

export const metadata: Metadata = {
  title: 'Onda - Safe AI Companion for Children',
  description: 'A safe AI chat companion for children aged 6-12',
  icons: {
    icon: '/favicon.svg',
    apple: '/onda-icon-black.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add debugging for production
  if (typeof window !== 'undefined') {
    console.log('🔍 Root Layout rendering on client');
    window.addEventListener('error', e => {
      console.error('🚨 Global error:', e.error);
    });
    window.addEventListener('unhandledrejection', e => {
      console.error('🚨 Unhandled promise rejection:', e.reason);
    });
  }

  return (
    <ClerkProviderWrapper>
      <html lang="en">
        <body className="font-avotica">
          <div
            id="debug-info"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              background: 'red',
              color: 'white',
              padding: '4px',
              fontSize: '12px',
              zIndex: 9999,
            }}
          >
            Layout Loaded
          </div>
          <ErrorBoundary>
            <main>{children}</main>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
