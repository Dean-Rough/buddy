'use client';

export default function TestPage() {
  console.log('🔍 Test page rendering');

  return (
    <div style={{ padding: '20px', background: 'white', color: 'black' }}>
      <h1>Test Page Working</h1>
      <p>If you see this, React is working.</p>
      <div
        id="test-marker"
        style={{ background: 'green', color: 'white', padding: '10px' }}
      >
        SUCCESS: Components rendering
      </div>
    </div>
  );
}
