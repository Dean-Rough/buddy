export default function TestBasicPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Basic Test Page</h1>
      <p>If you can see this, Next.js is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <details>
        <summary>Environment Check</summary>
        <pre>
          NODE_ENV: {process.env.NODE_ENV || 'undefined'}
        </pre>
      </details>
    </div>
  );
}