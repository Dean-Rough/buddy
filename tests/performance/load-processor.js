// Artillery.js processor for custom load test logic
module.exports = {
  // Custom functions for load testing
  setRandomChildAge,
  setRandomMessage,
  logResponse,
  measureSafetyProcessing,
  measureChatProcessing,
  measureTimeCheck,
  measurePageLoad,
};

/**
 * Set a random child age for testing
 */
function setRandomChildAge(context, events, done) {
  context.vars.childAge = Math.floor(Math.random() * 7) + 6; // 6-12 years old
  return done();
}

/**
 * Set a random message for testing
 */
function setRandomMessage(context, events, done) {
  const messages = [
    'Hello there!',
    'How are you doing today?',
    'Can you tell me a story?',
    'What is your favorite color?',
    'I need help with my homework',
    'Tell me about dinosaurs',
    'Why is the sky blue?',
    'Can we play a game?',
    'I feel happy today',
    'What should I do when I am bored?',
    'Can you help me understand fractions?',
    'Tell me a joke please',
    'What animals live in the ocean?',
    'How do computers work?',
    'I want to learn about space',
  ];

  context.vars.testMessage =
    messages[Math.floor(Math.random() * messages.length)];
  return done();
}

/**
 * Log response for debugging
 */
function logResponse(context, events, done) {
  console.log('Response status:', context.response?.statusCode);
  if (context.response?.statusCode >= 400) {
    console.log('Error response:', context.response?.body);
  }
  return done();
}

/**
 * Measure safety processing time
 */
function measureSafetyProcessing(context, events, done) {
  const startTime = Date.now();

  // Add custom timing metric
  events.emit('counter', 'safety_requests', 1);

  // If this is a response, measure the processing time
  if (context.response) {
    const processingTime = Date.now() - startTime;
    events.emit('histogram', 'safety_processing_time', processingTime);

    // Track safety results
    if (context.response.body) {
      try {
        const body = JSON.parse(context.response.body);
        if (body.blocked) {
          events.emit('counter', 'safety_blocked_messages', 1);
        }
        if (body.severity) {
          events.emit('histogram', 'safety_severity_levels', body.severity);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  return done();
}

/**
 * Measure chat processing time
 */
function measureChatProcessing(context, events, done) {
  const startTime = Date.now();

  events.emit('counter', 'chat_requests', 1);

  if (context.response) {
    const processingTime = Date.now() - startTime;
    events.emit('histogram', 'chat_processing_time', processingTime);

    // Track chat results
    if (context.response.body) {
      try {
        const body = JSON.parse(context.response.body);
        if (body.response) {
          events.emit('counter', 'successful_chat_responses', 1);
          events.emit(
            'histogram',
            'chat_response_length',
            body.response.length
          );
        }
        if (body.safety) {
          events.emit(
            'histogram',
            'chat_safety_score',
            body.safety.inputSafety || 0
          );
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  return done();
}

/**
 * Measure time check duration
 */
function measureTimeCheck(context, events, done) {
  const startTime = Date.now();

  events.emit('counter', 'time_check_requests', 1);

  if (context.response) {
    const duration = Date.now() - startTime;
    events.emit('histogram', 'time_check_duration', duration);
  }

  return done();
}

/**
 * Measure page load time
 */
function measurePageLoad(context, events, done) {
  const startTime = Date.now();

  events.emit('counter', 'page_load_requests', 1);

  if (context.response) {
    const loadTime = Date.now() - startTime;
    events.emit('histogram', 'page_load_time', loadTime);

    // Track page size
    if (context.response.body) {
      events.emit('histogram', 'page_size_bytes', context.response.body.length);
    }
  }

  return done();
}
