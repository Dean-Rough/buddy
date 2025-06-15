import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock auth endpoints
  http.post('/api/auth/create-child', () => {
    return HttpResponse.json({
      success: true,
      childId: 'mock-child-id',
      message: 'Child created successfully',
    });
  }),

  http.post('/api/auth/verify-child', () => {
    return HttpResponse.json({
      success: true,
      child: {
        id: 'mock-child-id',
        name: 'Test Child',
        age: 8,
        persona: 'friendly',
      },
    });
  }),

  // Mock chat endpoint
  http.post('/api/chat', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      response: `Mock response to: ${(body as any).message}`,
      safety: {
        level: 0,
        flagged: false,
      },
    });
  }),

  // Mock children endpoint
  http.get('/api/children', () => {
    return HttpResponse.json({
      children: [
        {
          id: 'mock-child-1',
          name: 'Alice',
          age: 7,
          persona: 'curious',
        },
        {
          id: 'mock-child-2',
          name: 'Bob',
          age: 10,
          persona: 'adventurous',
        },
      ],
    });
  }),

  // Mock external AI APIs
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: 'Mock AI response',
            role: 'assistant',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });
  }),

  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      content: [
        {
          type: 'text',
          text: 'Mock Anthropic response',
        },
      ],
      role: 'assistant',
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    });
  }),
];
