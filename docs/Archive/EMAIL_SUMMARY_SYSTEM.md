# Email Summary System - Simple & Cost-Effective

## Overview

Automated weekly email summaries for parents using a low-cost LLM to analyze conversations and generate family-friendly insights.

## Summary Generation Pipeline

### 1. 📊 **Data Collection**

**Gather week's conversations for analysis**

```typescript
interface WeeklyData {
  childId: string;
  childName: string;
  parentEmail: string;
  weekStart: Date;
  weekEnd: Date;
  conversations: {
    id: string;
    date: Date;
    duration: number; // minutes
    messageCount: number;
    childMessages: string[];
    aiResponses: string[];
    safetyFlags: string[];
    mood: string; // from context analyzer
    topics: string[]; // from context analyzer
  }[];
  totalChatTime: number;
  totalSessions: number;
  safetyEvents: SafetyEvent[];
}
```

### 2. 🤖 **Low-Cost LLM Analysis**

**Use GPT-4o-mini for cost-effective summarization**

**Conversation Analysis Prompt:**

```
You are analyzing a week of conversations between a child (age X) and an AI companion for a parent summary.

IMPORTANT: This is for the PARENT, not the child. Be professional but warm.

Analyze these conversations and provide:

1. OVERALL MOOD: How did the child seem emotionally this week?
2. MAIN INTERESTS: What topics were they most excited about?
3. LEARNING MOMENTS: Any educational discussions or curiosity shown?
4. SOCIAL/EMOTIONAL: Any mentions of friends, school, feelings to note?
5. SAFETY STATUS: Were all conversations appropriate? (Yes/No + brief note)

CONVERSATIONS:
{conversation_summaries}

USAGE DATA:
- Total chat time: {total_time}
- Number of sessions: {session_count}
- Average session: {avg_session} minutes

Respond in this JSON format:
{
  "overall_mood": "string (positive/curious/mixed/concerning)",
  "mood_details": "brief explanation",
  "main_interests": ["interest1", "interest2", "interest3"],
  "learning_moments": "brief description of educational content",
  "social_emotional": "brief note about social/emotional content",
  "safety_status": "all_good" | "minor_concerns" | "needs_attention",
  "safety_details": "brief explanation if not all_good",
  "highlights": ["notable moment 1", "notable moment 2"],
  "suggested_conversations": ["conversation starter 1", "conversation starter 2"]
}
```

### 3. 📧 **Email Template Generation**

**Transform analysis into parent-friendly email**

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background: #2563eb;
        color: white;
        padding: 20px;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: #f8fafc;
        padding: 20px;
      }
      .section {
        background: white;
        margin: 16px 0;
        padding: 16px;
        border-radius: 8px;
      }
      .stats {
        display: flex;
        gap: 20px;
      }
      .stat {
        text-align: center;
        flex: 1;
      }
      .highlight {
        background: #eff6ff;
        border-left: 4px solid #2563eb;
        padding: 12px;
      }
      .safety-good {
        color: #059669;
      }
      .safety-concern {
        color: #dc2626;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>{{childName}}'s Week with Onda</h1>
        <p>{{weekDateRange}}</p>
      </div>

      <div class="content">
        <div class="section">
          <h2>📊 This Week's Overview</h2>
          <div class="stats">
            <div class="stat">
              <strong>{{totalChatTime}}</strong><br />
              Total chat time
            </div>
            <div class="stat">
              <strong>{{sessionCount}}</strong><br />
              Conversations
            </div>
            <div class="stat">
              <strong>{{avgSession}} mins</strong><br />
              Average length
            </div>
          </div>
        </div>

        <div class="section">
          <h2>😊 Emotional Wellbeing</h2>
          <p><strong>Overall mood:</strong> {{overallMood}}</p>
          <p>{{moodDetails}}</p>
        </div>

        <div class="section">
          <h2>🎯 Interests & Learning</h2>
          <p><strong>Main interests:</strong> {{mainInterests}}</p>
          <p><strong>Learning moments:</strong> {{learningMoments}}</p>
        </div>

        {{#if socialEmotional}}
        <div class="section">
          <h2>👥 Social & Emotional</h2>
          <p>{{socialEmotional}}</p>
        </div>
        {{/if}}

        <div class="section">
          <h2>🛡️ Safety Status</h2>
          <p class="{{safetyClass}}">
            <strong>{{safetyStatusText}}</strong>
          </p>
          {{#if safetyDetails}}
          <p>{{safetyDetails}}</p>
          {{/if}}
        </div>

        {{#if highlights}}
        <div class="section">
          <h2>✨ This Week's Highlights</h2>
          {{#each highlights}}
          <div class="highlight">{{this}}</div>
          {{/each}}
        </div>
        {{/if}}

        <div class="section">
          <h2>💬 Family Conversation Starters</h2>
          <ul>
            {{#each suggestedConversations}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>

        <div class="section" style="text-align: center; color: #6b7280;">
          <p>
            Generated by Onda AI •
            <a href="{{dashboardUrl}}">View Dashboard</a> •
            <a href="{{unsubscribeUrl}}">Email Settings</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
```

## Implementation Architecture

### 1. **Scheduled Job System**

```typescript
// lib/summary-generator.ts
export class WeeklySummaryGenerator {
  async generateWeeklySummaries() {
    // Run every Sunday at 8 PM
    const parentsToProcess = await this.getParentsForSummaries();

    for (const parent of parentsToProcess) {
      try {
        await this.generateSummaryForParent(parent);
      } catch (error) {
        console.error(`Summary failed for parent ${parent.id}:`, error);
        await this.sendErrorNotification(parent);
      }
    }
  }

  private async generateSummaryForParent(parent: Parent) {
    // 1. Collect week's data
    const weeklyData = await this.collectWeeklyData(parent);

    // 2. Analyze with GPT-4o-mini
    const analysis = await this.analyzeWithLLM(weeklyData);

    // 3. Generate email
    const emailHtml = await this.generateEmail(weeklyData, analysis);

    // 4. Send email
    await this.sendSummaryEmail(parent.email, emailHtml);

    // 5. Log for tracking
    await this.logSummaryGeneration(parent.id, weeklyData);
  }

  private async analyzeWithLLM(data: WeeklyData): Promise<SummaryAnalysis> {
    const prompt = this.buildAnalysisPrompt(data);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective option
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3, // Consistent summaries
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

### 2. **Privacy-Conscious Data Processing**

```typescript
// Only extract necessary data for analysis
private prepareConversationSummary(conversation: Conversation): string {
  // Don't include full messages - just topics and mood
  const childTopics = conversation.messages
    .filter(m => m.role === 'child')
    .map(m => this.extractTopics(m.content))
    .flat();

  const detectedMood = this.analyzeMood(conversation.messages);

  return `Session: ${conversation.createdAt.toDateString()}
Duration: ${conversation.duration} minutes
Topics discussed: ${childTopics.join(', ')}
Child's mood: ${detectedMood}
Safety flags: ${conversation.safetyFlags.join(', ') || 'None'}`;
}
```

### 3. **Cost Optimization**

```typescript
// Batch processing to minimize API calls
const BATCH_SIZE = 5; // Process 5 summaries per API call
const MAX_TOKENS = 800; // Keep costs low

// Smart caching to avoid re-processing
const cacheKey = `summary_${parentId}_${weekStart}_${weekEnd}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 4. **Email Delivery System**

```typescript
// app/api/cron/weekly-summaries/route.ts
export async function GET() {
  // Only allow scheduled execution
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const generator = new WeeklySummaryGenerator();
  await generator.generateWeeklySummaries();

  return Response.json({ success: true });
}
```

### 5. **Vercel Cron Configuration**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/weekly-summaries",
      "schedule": "0 20 * * 0"
    }
  ]
}
```

## Database Schema Addition

```sql
CREATE TABLE "WeeklySummary" (
  "id" TEXT NOT NULL,
  "parentClerkUserId" TEXT NOT NULL,
  "childAccountId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "weekEnd" DATE NOT NULL,
  "totalChatTime" INTEGER NOT NULL,
  "sessionCount" INTEGER NOT NULL,
  "analysisData" JSONB NOT NULL,
  "emailSent" BOOLEAN DEFAULT false,
  "emailSentAt" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY ("id"),
  UNIQUE("parentClerkUserId", "childAccountId", "weekStart"),
  CONSTRAINT "WeeklySummary_parentClerkUserId_fkey"
    FOREIGN KEY ("parentClerkUserId") REFERENCES "Parent" ("clerkUserId"),
  CONSTRAINT "WeeklySummary_childAccountId_fkey"
    FOREIGN KEY ("childAccountId") REFERENCES "ChildAccount" ("id")
);
```

## Cost Analysis

**GPT-4o-mini Pricing** (as of 2024):

- Input: $0.15 per 1M tokens
- Output: $0.075 per 1M tokens

**Weekly Summary Cost Estimate:**

- Input tokens per summary: ~1,500 (conversation data)
- Output tokens per summary: ~800 (analysis JSON)
- Cost per summary: ~$0.0003 (less than a penny!)
- 1,000 families: ~$0.30 per week
- Annual cost for 1,000 families: ~$15

**Extremely cost-effective** while providing valuable parent insights!

## Sample Email Output

```
Subject: Emma's Week with Onda (Dec 4-10, 2024)

📊 This Week's Overview
Total chat time: 3h 24m
Conversations: 12
Average length: 17 mins

😊 Emotional Wellbeing
Overall mood: Positive and curious
Emma was generally upbeat this week, showing excitement about her school science project and demonstrating good emotional vocabulary when discussing a minor friendship issue.

🎯 Interests & Learning
Main interests: Space exploration, creative writing, friendship dynamics
Learning moments: Asked thoughtful questions about planets and solar systems, worked through a friendship conflict with maturity

🛡️ Safety Status
✅ All conversations were appropriate
No safety concerns detected this week.

✨ This Week's Highlights
• Showed genuine curiosity about space exploration
• Handled friendship conflict with emotional maturity

💬 Family Conversation Starters
• "What was the most interesting thing you learned about space this week?"
• "How did your conversation with Onda help with your friend situation?"
```

This system provides **meaningful insights** for parents while keeping costs minimal and privacy protected!
