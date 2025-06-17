// Quick debug script to test chat API
async function testChatAPI() {
  try {
    console.log('Testing chat API...');

    const response = await fetch('http://localhost:4288/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello!',
        childAccountId: 'test-child-123',
      }),
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testChatAPI();
