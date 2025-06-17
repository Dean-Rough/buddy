# 🔧 Chat System Debug Guide & Architecture Map

## 🚨 **Critical Issue: Chat API 500 Error - RESOLVED**

**Problem**: Chat wasn't working after modularizing the prompt system  
**Root Cause**: TypeScript interface mismatch between `config-loader.ts` and actual JSON structure  
**Status**: ✅ **FIXED**

---

## 📊 **Chat System Architecture Map**

### 🗂️ **File Structure & Dependencies**

```
Chat Request Flow:
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: components/chat/BrutalChatInterface.tsx               │
│ ↓ POST /api/chat                                                │
├─────────────────────────────────────────────────────────────────┤
│ API Route: app/api/chat/route.ts                                │
│ ├── Child validation (Prisma)                                   │
│ ├── Safety validation (lib/ai/safety.ts)                        │
│ ├── Memory context (lib/memory.ts)                              │
│ ├── Time management (lib/time-management.ts)                    │
│ └── AI response generation (lib/ai/client.ts)                   │
│     └── Config loading (lib/config-loader.ts)                   │
│         ├── config/system-prompts.json                          │
│         ├── config/ai-personas.json                             │
│         └── config/safety-rules.json                            │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 **Request Processing Pipeline**

1. **Input Validation**

   - `childAccountId` and `message` required
   - Child account lookup in database

2. **Conversation Management**

   - Get/create conversation record
   - Load recent message history (last 5 messages)

3. **Context Analysis**

   - `ContextAwareWarnings.analyzeConversationContext()`
   - Time limit checking via `TimeManager`

4. **Dual-Layer Safety Validation**

   - **Layer 1**: Rule-based safety patterns
   - **Layer 2**: AI-powered safety analysis (GPT-4o-mini)

5. **Memory & Personalization**

   - Extract context from `lib/memory.ts`
   - Build conversation history

6. **AI Response Generation**

   - `generateChatResponse()` in `lib/ai/client.ts`
   - Uses modular prompt system from `config/`

7. **Response Safety Check**

   - Validate AI output before sending
   - Fallback responses for unsafe content

8. **Database Storage**
   - Save child message and AI response
   - Update conversation metadata

---

## 🐛 **Common Debug Issues & Solutions**

### **Issue 1: 500 Internal Server Error**

**Symptoms:**

```
api/chat:1 Failed to load resource: 500 Internal Server Error
Chat error: Error: Internal server error
```

**Debug Steps:**

1. Check server console for specific error
2. Verify environment variables in `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   DATABASE_URL=postgres://...
   ```
3. Test config loading:
   ```bash
   node -e "console.log(require('./lib/config-loader.js').loadSystemPrompts())"
   ```

**Fixed Causes:**

- ✅ TypeScript interface mismatch in `config-loader.ts`
- ✅ Missing properties in JSON config files
- ✅ Incorrect property access patterns

### **Issue 2: Config Loading Failures**

**Symptoms:**

- "Failed to load system prompts config"
- TypeScript compilation errors

**Solutions:**

1. **Verify Config Files Exist:**

   ```bash
   ls -la config/
   # Must have: system-prompts.json, ai-personas.json, safety-rules.json
   ```

2. **Check JSON Syntax:**

   ```bash
   node -e "JSON.parse(require('fs').readFileSync('config/system-prompts.json', 'utf-8'))"
   ```

3. **Update TypeScript Interfaces:**
   - Match `SystemPrompts` interface to actual JSON structure
   - Add optional properties for backwards compatibility

### **Issue 3: Persona System Errors**

**Symptoms:**

- Responses feel generic/broken
- Missing personality traits

**Debug:**

1. Check persona exists in `config/ai-personas.json`
2. Verify persona properties match interface
3. Test with default persona (`chaos-raccoon`)

---

## 📝 **Configuration Files Reference**

### `config/system-prompts.json` Structure:

```json
{
  "version": "2.0.0",
  "chatPromptTemplate": "Template with {placeholders}",
  "ageSpecificStyles": {
    "7": { "style": "...", "vocabulary_notes": "..." },
    "8": { "style": "...", "vocabulary_notes": "..." }
  },
  "culturalKnowledge": {
    "gaming": {...},
    "youtube": {...},
    "current_slang": {...}
  },
  "responsePatterns": {
    "excitement_matching": {...},
    "sympathy_responses": {...}
  },
  "modeInstructions": {
    "normal": "...",
    "whisper": "..."
  },
  "safetyResponses": {...}
}
```

### `config/ai-personas.json` Structure:

```json
{
  "version": "2.0.0",
  "personas": {
    "chaos-raccoon": {
      "name": "Chaos Raccoon",
      "personality": "...",
      "speaking_style": "...",
      "interests": [...],
      "catchphrases": [...],
      "age_adaptations": {
        "6-8": { "style_adjustments": "..." }
      }
    }
  }
}
```

---

## 🔍 **Debugging Tools & Commands**

### **Quick Health Check:**

```bash
# 1. Check server status
curl http://localhost:4288/api/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test","childAccountId":"test"}'

# 2. TypeScript compilation
npx tsc --noEmit

# 3. Config validation
node debug-prompt-system.js
```

### **Server Logs:**

```bash
# Watch server output
npm run dev | grep -E "(error|Error|ERROR)"

# Check specific API endpoint
tail -f .next/server.log
```

### **Database Debugging:**

```bash
# Check child accounts
npx prisma studio

# Direct database query
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"ChildAccount\";"
```

---

## 🚀 **Testing the Fixed System**

### **Frontend Testing:**

1. Open chat interface at `http://localhost:4288/chat`
2. Enter a test child account
3. Send message: "Hello!"
4. Expect: Persona-appropriate response within 2-3 seconds

### **API Testing:**

```bash
# Test API directly
curl -X POST http://localhost:4288/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I love Minecraft!",
    "childAccountId": "test-child-id"
  }'
```

### **Expected Response:**

```json
{
  "response": "yo that's sick! minecraft is absolutely mental...",
  "conversationId": "...",
  "messageId": "...",
  "timeStatus": {...},
  "safety": {"blocked": false, ...}
}
```

---

## 🎯 **Future Development Notes**

### **Key Architectural Decisions:**

1. **Config-First Design**: All prompts externalized to JSON for easy updates
2. **Dual-Layer Safety**: Rule-based + AI validation for child protection
3. **Memory-Enhanced Responses**: Context preservation across conversations
4. **Age-Adaptive Communication**: Dynamic vocabulary and style adjustment

### **Extension Points:**

- Add new personas in `config/ai-personas.json`
- Update cultural knowledge seasonally
- Expand safety patterns for new risks
- Add regional adaptations (US, AU variants)

### **Performance Considerations:**

- Config caching prevents repeated file reads
- GPT-4o-mini for safety (cost-effective)
- GPT-4o for main responses (quality)
- Memory context limited to recent conversations

---

## ⚠️ **Critical Maintenance Tasks**

### **Monthly:**

- Update cultural knowledge (new games, YouTubers, slang)
- Review safety pattern effectiveness
- Monitor API costs and usage

### **Quarterly:**

- Full config file validation
- Performance optimization review
- Safety system audit

### **Emergency Procedures:**

If chat system fails:

1. Check server logs immediately
2. Verify environment variables
3. Test config loading with debug script
4. Roll back recent config changes if needed
5. Use mock responses as fallback (already implemented)

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready  
**Next Review**: March 2025
