import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import '../styles/fonts.css';
import '../styles/brutalist.css';

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
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-avotica">
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
