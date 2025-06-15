// app/api/chat/enhanced/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAwareChat } from '@/lib/knowledge/integration';
import { SafetyValidator } from '@/lib/safety/validator';
import { PersonaManager } from '@/lib/personas/manager';
import { ConversationLogger } from '@/lib/logging/conversation';

// Initialize services
const knowledgeChat = new KnowledgeAwareChat();
const safetyValidator = new SafetyValidator();
const personaManager = new PersonaManager();
const conversationLogger = new ConversationLogger();

export async function POST(req: NextRequest) {
try {
const {
message,
childId,
childAge,
childName,
personaId,
mode = 'normal',
sessionId
} = await req.json();

    // Step 1: Safety validation with context
    const safetyCheck = await safetyValidator.validateMessage(message, {
      childAge,
      recentMessages: await conversationLogger.getRecentMessages(sessionId, 5),
      personaContext: personaId
    });

    if (safetyCheck.severity >= 3) {
      // Critical safety issue - notify parents immediately
      await notifyParents(childId, safetyCheck);

      return NextResponse.json({
        response: getEmergencyResponse(childAge, safetyCheck.category),
        safety: safetyCheck,
        shouldEndConversation: true
      });
    }

    // Step 2: Enhance prompt with knowledge
    const { enhancedPrompt, knowledgeContext, unknownTerms } =
      await knowledgeChat.enhancePrompt(message, childAge, childId, personaId);

    // Step 3: Get persona-specific system prompt
    const systemPrompt = await personaManager.getSystemPrompt({
      personaId,
      childAge,
      childName,
      mode,
      detectedMood: safetyCheck.detectedMood || 'neutral',
      timeContext: getTimeContext(),
      knowledgeContext,
      unknownTerms,
      safetyLevel: safetyCheck.severity
    });

    // Step 4: Generate AI response
    const aiResponse = await generateAIResponse({
      systemPrompt,
      userMessage: message,
      enhancedContext: enhancedPrompt,
      temperature: getTemperature(mode, safetyCheck.severity),
      maxTokens: getMaxTokens(childAge)
    });

    // Step 5: Post-process AI response for safety
    const processedResponse = await safetyValidator.validateAIResponse(
      aiResponse,
      childAge
    );

    // Step 6: Log conversation
    await conversationLogger.logExchange({
      sessionId,
      childId,
      message,
      response: processedResponse.content,
      safety: safetyCheck,
      knowledge: knowledgeContext,
      unknownTerms,
      timestamp: new Date()
    });

    // Step 7: Update conversation context
    knowledgeChat.updateContext(childId, extractTopics(message));

    // Step 8: Check for pattern-based escalation
    const patternCheck = await checkConversationPatterns(sessionId, childId);
    if (patternCheck.shouldEscalate) {
      await scheduleParentNotification(childId, patternCheck.reason);
    }

    return NextResponse.json({
      response: processedResponse.content,
      typing: generateTypingPattern(processedResponse.content, childAge),
      safety: {
        level: safetyCheck.severity,
        supportNeeded: safetyCheck.supportResponse
      },
      knowledge: {
        learned: knowledgeContext.length > 0,
        unknownTerms: unknownTerms.length > 0 ? unknownTerms : undefined
      }
    });

} catch (error) {
console.error('Chat error:', error);

    // Safe fallback response
    return NextResponse.json({
      response: "whoops something went weird there - wanna try saying that again?",
      error: true
    });

}
}

// Helper functions
async function generateAIResponse({
systemPrompt,
userMessage,
enhancedContext,
temperature,
maxTokens
}: {
systemPrompt: string;
userMessage: string;
enhancedContext: string;
temperature: number;
maxTokens: number;
}) {
const messages = [
{ role: 'system', content: systemPrompt + '\n\n' + enhancedContext },
{ role: 'user', content: userMessage }
];

const response = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: {
'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
'Content-Type': 'application/json',
},
body: JSON.stringify({
model: 'gpt-4-turbo-preview',
messages,
temperature,
max_tokens: maxTokens,
presence_penalty: 0.1,
frequency_penalty: 0.1
})
});

const data = await response.json();
return data.choices[0].message.content;
}

function getTemperature(mode: string, safetyLevel: number): number {
// Lower temperature for safety concerns, higher for creative mode
if (safetyLevel >= 2) return 0.3;
if (mode === 'whisper') return 0.4;
if (mode === 'normal') return 0.7;
if (mode === 'coach') return 0.5;
return 0.7;
}

function getMaxTokens(age: number): number {
// Shorter responses for younger kids
if (age <= 8) return 150;
if (age <= 10) return 200;
return 250;
}

function getTimeContext(): string {
const hour = new Date().getHours();
const isWeekend = [0, 6].includes(new Date().getDay());

if (hour < 9) return isWeekend ? 'weekend_morning' : 'schoolday_morning';
if (hour < 15) return isWeekend ? 'weekend_afternoon' : 'schoolday_afternoon';
if (hour < 18) return 'after_school';
if (hour < 21) return 'evening';
return 'late_evening';
}

function generateTypingPattern(response: string, age: number): any {
// Simulate human typing patterns
const baseWPM = age <= 8 ? 40 : age <= 10 ? 60 : 80;
const variance = 0.2;

const words = response.split(' ');
const pattern = [];
let currentDelay = 0;

words.forEach((word, i) => {
const wordTime = (word.length / 5) _ (60 / baseWPM) _ 1000;
const randomVariance = 1 + (Math.random() - 0.5) _ variance;
currentDelay += wordTime _ randomVariance;

    // Add thinking pauses
    if (i > 0 && i % 7 === 0) {
      currentDelay += 300 + Math.random() * 500; // Thinking pause
    }

    pattern.push({
      text: words.slice(0, i + 1).join(' '),
      delay: Math.round(currentDelay)
    });

});

return pattern;
}

function extractTopics(message: string): string {
// Simple topic extraction
const topics = [];

if (/minecraft|roblox|fortnite|game/i.test(message)) {
topics.push('gaming');
}
if (/school|homework|teacher|class/i.test(message)) {
topics.push('school');
}
if (/friend|mate|bully/i.test(message)) {
topics.push('social');
}
if (/youtube|video|watch/i.test(message)) {
topics.push('content');
}

return topics[0] || 'general';
}

async function checkConversationPatterns(
sessionId: string,
childId: string
): Promise<{ shouldEscalate: boolean; reason?: string }> {
const recentMessages = await conversationLogger.getRecentMessages(sessionId, 20);

// Check for concerning patterns
const sadMessageCount = recentMessages.filter(m =>
/sad|cry|depressed|lonely|hate myself/i.test(m.content)
).length;

if (sadMessageCount >= 3) {
return {
shouldEscalate: true,
reason: 'Persistent emotional distress pattern detected'
};
}

// Check for escalating severity
const severityTrend = recentMessages.map(m => m.safety?.severity || 0);
const increasing = severityTrend.every((v, i) =>
i === 0 || v >= severityTrend[i - 1]
);

if (increasing && severityTrend.length >= 3 && severityTrend[severityTrend.length - 1] >= 2) {
return {
shouldEscalate: true,
reason: 'Escalating concern pattern detected'
};
}

return { shouldEscalate: false };
}

function getEmergencyResponse(age: number, category: string): string {
const responses = {
self_harm: {
"7-8": "that sounds really scary and i'm worried about you. can you talk to a grown-up you trust right now? they really want to help",
"9-10": "i'm really worried about what you're saying. this is too big for us to handle alone - please talk to a trusted adult right away",
"11-12": "what you're going through sounds incredibly hard and i'm genuinely worried. please reach out to a trusted adult immediately - you deserve support"
},
abuse: {
"7-8": "that doesn't sound right at all. you should tell a grown-up you trust about this - like a teacher or family member who makes you feel safe",
"9-10": "what you're describing isn't okay and it's not your fault. please tell a trusted adult - a teacher, counselor, or family member who can help",
"11-12": "this is serious and you don't have to deal with it alone. please talk to a trusted adult immediately - what's happening to you isn't okay"
},
default: {
"7-8": "this seems really important. let's get a grown-up to help with this, okay?",
"9-10": "this is something a trusted adult would be much better at helping with. can you talk to someone?",
"11-12": "this is beyond what i can help with - please reach out to a trusted adult who can properly support you"
}
};

const ageGroup = age <= 8 ? "7-8" : age <= 10 ? "9-10" : "11-12";
return responses[category]?.[ageGroup] || responses.default[ageGroup];
}

// Example real conversation flow:
/\*
Child (age 10): "have u heard of the new minecraft update with the armadillos"

System Process:

1. Safety: SAFE (severity 0)
2. Knowledge lookup: Found "minecraft 1.21 update armadillos"
3. Trending: "minecraft armadillos" trending with ages 8-11
4. Unknown terms: None
5. Persona: chaos-raccoon (Rocket)

AI Response: "YOOO the armadillos are actually sick!! they drop scutes that you can use to make wolf armor now - your doggo can be protected! have you found any yet? they're mostly in savanna biomes btw"

---

Child: "my friend said skibidi toilet is cringe now is that true"

System Process:

1. Safety: SAFE (severity 0)
2. Knowledge lookup: "skibidi toilet" status: fading
3. Persona context: Be honest but supportive

AI Response: "honestly yeah it's kinda past its peak but who cares if you still like it? trends come and go so fast anyway. if you think it's funny then it's funny, don't let anyone tell you what to enjoy lol"

---

Child: "everyone hates me at school"

System Process:

1. Safety: EMOTIONAL_DISTRESS (severity 1)
2. Pattern check: First mention of social distress
3. Mode: Automatically soften response

AI Response: "that sounds really tough, feeling like that must hurt a lot. want to tell me what's been happening? sometimes things feel worse than they actually are but your feelings are totally valid either way"

---

Child: "whats rizz mean my brother keeps saying it"

System Process:

1. Safety: SAFE (severity 0)
2. Knowledge lookup: Not found in safe sources
3. Unknown term flagged

AI Response: "lol your brother's using new slang! from what i've heard it means like being charming or good at talking to people, especially crushes. kinda like having good social skills but cooler sounding. is he saying you have rizz or no rizz? 😄"
\*/
