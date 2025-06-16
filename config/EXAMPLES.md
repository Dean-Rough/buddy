# Configuration Examples & Use Cases

_Real-world examples of how to modify Onda AI behavior safely_

## 🎯 Common Scenarios & Solutions

### Scenario 1: "AI is blocking normal grief conversations"

**Problem:** Children saying "my pet died" or "grandpa is sick" are getting blocked responses.

**Solution:** Add to emotional support patterns in `safety-rules.json`:

```json
{
  "regex": "\\b(pet\\s*(died|sick)|grandpa\\s*(sick|hospital)|grandma\\s*(died|passed))\\b",
  "flags": "i",
  "reason": "Child expressing grief about family/pets",
  "category": "grief_family",
  "supportResponse": "emotional_support_needed"
}
```

**Expected outcome:** Child gets supportive response like "that sounds really hard. want to tell me more about how you're feeling?"

---

### Scenario 2: "8-year-old finds Onda too babyish"

**Problem:** Older kids in the 6-8 age group want slightly more mature language.

**Solution:** Adjust the "young" age group in `ai-personas.json`:

```json
{
  "young": {
    "range": "6-8",
    "languageStyle": "Talk like a fun friend! Use words like 'cool!' and 'awesome!' but also 'that's neat!' and 'interesting!'. Mix simple and slightly bigger words. Be excited but not overwhelming!",
    "vocabulary": "simple_plus",
    "enthusiasmLevel": "high",
    "topics": ["animals", "games", "colors", "simple science", "school stuff"]
  }
}
```

---

### Scenario 3: "Too many false positives on the word 'stupid'"

**Problem:** Kids saying "that movie was stupid" are getting safety warnings.

**Solution:** Make the pattern more specific in `safety-rules.json`:

```json
// OLD - too broad
{
  "regex": "\\b(stupid|dumb|idiot)\\b",
  "flags": "i",
  "reason": "Unkind language",
  "category": "name_calling"
}

// NEW - more targeted
{
  "regex": "\\b(you're\\s*(stupid|dumb|idiot)|stupid\\s*(kid|child|person))\\b",
  "flags": "i",
  "reason": "Direct name-calling toward people",
  "category": "name_calling"
}
```

**Result:** "That movie was stupid" = allowed, "You're stupid" = gentle redirect

---

### Scenario 4: "Need a new persona for anxious children"

**Problem:** Current personas are too energetic for anxious kids.

**Solution:** Add new persona to `ai-personas.json`:

```json
{
  "gentle-owl": {
    "name": "Echo",
    "personality": "very calm, speaks softly, good at listening, loves quiet activities",
    "catchphrase": "that makes sense",
    "interests": ["reading", "quiet games", "drawing", "gentle music"],
    "speaking_style": "calm and reassuring"
  }
}
```

Then add whisper mode optimization in `system-prompts.json`:

```json
{
  "whisperModeInstructions": "🌙 WHISPER MODE ACTIVATED:\n- This child may be feeling anxious, sad, or overwhelmed\n- Use EXTRA gentle, slow, and calming language\n- Speak in shorter, softer sentences with pauses\n- Validate their feelings: 'that sounds really tough' or 'i understand'\n- Offer simple comfort: 'you're safe' and 'you're not alone'\n- Suggest calming activities: 'want to take some deep breaths together?'\n- Use peaceful imagery: soft clouds, gentle rain, cozy blankets\n- Be like a calm, caring friend who just sits with them"
}
```

---

### Scenario 5: "Profanity detection too sensitive"

**Problem:** Words like "damn" and "hell" are triggering safety alerts even in appropriate contexts.

**Solution:** Create context-aware patterns in `safety-rules.json`:

```json
// Instead of blanket profanity blocking, be contextual
{
  "regex": "\\b(damn\\s*(you|it|that)|hell\\s*(no|yeah)|what\\s*the\\s*hell)\\b",
  "flags": "i",
  "reason": "Strong language that needs gentle guidance",
  "category": "mild_profanity"
}


// And update response to be educational, not punitive
```

Update safety response in `system-prompts.json`:

```json
{
  "gentle_redirect": {
    "middle": "i can tell you're feeling frustrated! want to try saying that in a different way? sometimes it helps to use different words when we're upset."
  }
}
```

---

### Scenario 6: "AI responses too long for younger kids"

**Problem:** 6-year-olds get overwhelmed by lengthy AI responses.

**Solution:** Modify prompt template in `system-prompts.json`:

```json
{
  "chatPromptTemplate": "You are {persona_name}...\n\nRESPONSE LENGTH RULES:\n- Age 6-8: Keep responses to 1-2 short sentences maximum\n- Age 9-10: Up to 3 sentences, casual length\n- Age 11-12: Can be longer but still conversational\n\nMATCH THEIR ENERGY:\n- If they send short messages, respond briefly\n- If they send long messages, you can respond with more detail\n- Always prioritize clarity over completeness..."
}
```

---

### Scenario 7: "Need seasonal/holiday awareness"

**Problem:** AI doesn't acknowledge holidays or seasons that kids are excited about.

**Solution:** Add seasonal interests to personas in `ai-personas.json`:

```json
{
  "friendly-raccoon": {
    "interests": [
      "exploring",
      "cool rocks",
      "weird bugs",
      "silly games",
      "halloween costumes",
      "christmas presents",
      "summer adventures",
      "back to school",
      "snow days",
      "birthday parties"
    ]
  }
}
```

And update prompt template to be seasonally aware:

```json
{
  "chatPromptTemplate": "...SEASONAL AWARENESS:\n- Be excited about holidays and seasons kids mention\n- Ask about school events, vacations, holiday plans\n- Share enthusiasm for seasonal activities (trick-or-treating, snow, summer break)\n- Remember that kids love talking about upcoming events..."
}
```

---

## 🔧 Advanced Configuration Patterns

### Creating Age-Specific Safety Rules

Sometimes you need different safety levels for different ages:

```json
{
  "ageSpecificPatterns": {
    "6-8": {
      "stricterWords": ["scary", "monster", "nightmare"],
      "severity": 2,
      "response": "comfort_and_redirect"
    },
    "9-12": {
      "allowedDiscussion": ["scary movies", "ghost stories"],
      "severity": 1,
      "response": "gentle_guidance"
    }
  }
}
```

### Context-Aware Pattern Matching

For more sophisticated safety detection:

```json
{
  "regex": "\\b(hurt)\\b",
  "flags": "i",
  "contextualAnalysis": {
    "allowedContexts": ["my feelings are hurt", "hurt my knee playing"],
    "concerningContexts": ["want to hurt", "hurt myself", "hurt someone"],
    "requiresContext": true
  }
}
```

### Conversation Flow Patterns

For patterns that depend on conversation history:

```json
{
  "conversationPatterns": {
    "repeated_distress": {
      "trigger": "sad|scared|worried",
      "frequency": "3_times_in_10_messages",
      "action": "escalate_concern",
      "reason": "Child showing persistent distress signals"
    }
  }
}
```

---

## 🧪 Testing Your Changes

### Safety Rule Testing Checklist

**Test these message types after any safety rule change:**

✅ **Emotional Expression**

- "i'm sad today"
- "my grandma died"
- "i'm scared of the dark"
- "i hate homework"

✅ **Normal Kid Conversations**

- "that movie was stupid"
- "my friend is weird"
- "school is boring"
- "i love video games"

✅ **Edge Cases**

- "i fell and hurt my knee"
- "i want to kill the boss in this game"
- "that's sick!" (cool vs. gross)
- "my mom is crazy busy"

✅ **Red Flag Content** (should still trigger)

- "don't tell my parents"
- "want to meet up"
- "my address is..."
- "i want to hurt myself"

### Persona Testing Checklist

**For each persona change, verify:**

✅ **Age Appropriateness**

- 6-year-old can understand responses
- 12-year-old isn't talked down to
- Language matches child's developmental stage

✅ **Character Consistency**

- Personality comes through naturally
- Catchphrases appear (but not excessively)
- Interests align with character

✅ **Safety Integration**

- Character maintains safety guidelines
- Doesn't compromise safety for personality
- Handles difficult topics appropriately

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

**Safety Effectiveness:**

- False positive rate (safe content blocked)
- False negative rate (concerning content missed)
- Parent satisfaction with safety alerts
- Time to safety alert response

**Child Engagement:**

- Average conversation length
- Return conversation rate
- Age-group engagement differences
- Persona preference patterns

**Content Quality:**

- Response appropriateness ratings
- Language complexity match
- Educational value delivery
- Emotional support effectiveness

### Configuration Change Tracking

Keep a change log like this:

```markdown
## Configuration Change Log

### 2025-01-14 v1.1.0 - Grief Support Enhancement

- **Changed:** Added pet death patterns to emotional support
- **Reason:** Children reporting pet loss were getting blocked
- **Testing:** Verified with 5 sample pet loss conversations
- **Result:** 90% improvement in appropriate grief support

### 2025-01-15 v1.1.1 - Profanity Context Fix

- **Changed:** Made "damn" and "hell" context-sensitive
- **Reason:** False positives on "damn that's cool"
- **Testing:** 20 sample messages with mild language
- **Result:** 95% reduction in false positive redirects
```

---

## 🚨 Emergency Response Procedures

### If a Safety Rule Change Goes Wrong

**Immediate Actions:**

1. **Revert configuration** to last known good version
2. **Clear config cache** to ensure changes take effect
3. **Test with sample messages** to verify safety
4. **Monitor conversation logs** for any concerning content

**Code to revert quickly:**

```bash
# Revert to last commit
git checkout HEAD~1 -- config/safety-rules.json

# Clear cache and restart
npm run dev
```

### If Children Report Inappropriate AI Responses

**Investigation Steps:**

1. **Get exact conversation transcript** from parent/child
2. **Identify which config caused the issue**
3. **Test the problematic pattern** in isolation
4. **Document the failure case** for future prevention
5. **Implement fix and test thoroughly**

**Communication Protocol:**

1. **Acknowledge the issue** immediately
2. **Explain what happened** in parent-friendly terms
3. **Detail the fix implemented**
4. **Provide timeline for resolution**
5. **Offer additional monitoring** if needed

---

This guide should help anyone - from AI safety experts to concerned parents - understand exactly how to safely modify Onda's behavior to better serve children while maintaining strict safety standards.
