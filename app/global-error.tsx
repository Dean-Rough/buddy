'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Global error boundary caught:', error);
  
  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#fee' }}>
          <h2>Application Error</h2>
          <p>Something went wrong at the application level.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}