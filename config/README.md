# Onda AI Configuration Guide

_Your comprehensive guide to safely configuring AI behavior for child interactions_

## 🎯 Purpose

This directory contains **modular configuration files** that control how Onda AI interacts with children aged 6-12. These files allow you to adjust AI behavior, safety rules, and responses **without touching any code**.

## 🚨 **CRITICAL: Child Safety First**

Every change you make affects real children's safety. When in doubt:

- **Choose the more protective option**
- **Test thoroughly before deploying**
- **Never lower safety standards without legal review**

## 📁 Configuration Files Overview

### 1. `safety-rules.json` - The Safety Guardian

**Controls what triggers safety alerts and how severe they are**

**What it does:**

- Monitors every message children send
- Decides if content is safe, needs guidance, or requires parent notification
- Provides age-appropriate safety responses

**When to edit:**

- Safety alerts are too frequent (blocking normal conversations)
- New concerning patterns emerge that aren't caught
- Adjusting sensitivity for different age groups

### 2. `ai-personas.json` - The Character Personalities

**Defines who the AI "friends" are and how they talk**

**What it does:**

- Creates distinct AI companions (Onda the raccoon, Coral the jellyfish, etc.)
- Sets age-appropriate language levels (6-8 vs 11-12 year olds)
- Defines interests and speaking styles

**When to edit:**

- Adding new AI character personalities
- Adjusting language for different age groups
- Updating interests or catchphrases

### 3. `system-prompts.json` - The AI's Instructions

**The detailed instructions that tell the AI how to behave**

**What it does:**

- Provides the AI's core personality and safety rules
- Sets conversation style and topics
- Defines responses for different safety scenarios

**When to edit:**

- Fine-tuning AI responses and personality
- Updating safety instructions
- Adjusting whisper mode (for distressed children)

---

## 🔧 How to Make Changes Safely

### Step 1: Understand the Impact

Ask yourself:

- **Who does this affect?** (age group, all children, specific scenarios)
- **What's the safety risk?** (could this allow inappropriate content?)
- **Is this reversible?** (can I quickly undo this change?)

### Step 2: Make Small Changes

- **Change one pattern at a time**
- **Test with sample messages first**
- **Keep backup copies of original files**

### Step 3: Test Thoroughly

```bash
# Test the build still works
npm run build

# Run safety tests
npm run test:safety

# Test with sample conversations
npm run dev
```

### Step 4: Monitor After Deployment

- **Check safety event logs** for unexpected triggers
- **Review parent feedback** about AI responses
- **Monitor child engagement patterns**

---

## 📋 Common Configuration Tasks

### Adding a New Safety Pattern

**Example: Blocking discussions about weapons**

1. Open `safety-rules.json`
2. Find the appropriate severity section:
   - `criticalPatterns` - Immediate parent notification
   - `redirectPatterns` - Gentle guidance
   - `emotionalSupportPatterns` - Offer comfort
3. Add your pattern:

```json
{
  "regex": "\\b(gun|knife|weapon|sword)\\b",
  "flags": "i",
  "reason": "Weapon discussion not appropriate for children",
  "category": "weapons"
}
```

### Adjusting AI Personality

**Example: Making Onda more enthusiastic**

1. Open `ai-personas.json`
2. Find the `friendly-raccoon` persona
3. Update the personality field:

```json
{
  "personality": "SUPER excited about everything, loves weird stuff, always down for silly games and adventures!"
}
```

### Modifying Safety Responses

**Example: Gentler response for emotional support**

1. Open `system-prompts.json`
2. Find `safetyResponses.emotional_support`
3. Update the age-appropriate response:

```json
{
  "young": "that sounds really tough. i'm here with you. want to tell me more about how you're feeling? sometimes talking helps."
}
```

---

## ⚠️ Safety Guidelines

### ❌ NEVER Remove These Safety Rules

- **Personal information detection** (address, phone, school)
- **Self-harm monitoring** (suicide, wanting to die)
- **Stranger danger patterns** (meeting requests)
- **Secret-keeping requests** (don't tell parents)

### ✅ Safe to Adjust

- **Language sensitivity levels** (profanity detection)
- **Emotional support responses** (grief, sadness, fear)
- **Personality traits** (enthusiasm, interests)
- **Age-appropriate language** (slang, vocabulary)

### 🔍 Requires Legal Review

- **Fundamental safety level changes** (severity thresholds)
- **Data collection modifications** (what gets logged)
- **Parent notification triggers** (when emails are sent)

---

## 🎭 Understanding AI Personas

### Current Characters

**🦝 Onda (friendly-raccoon)**

- **Age group:** Universal (6-12)
- **Personality:** Curious, loves weird stuff, silly games
- **Best for:** Exploratory conversations, creative play
- **Catchphrase:** "dude that's awesome!"

**🪼 Coral (wise-jellyfish)**

- **Age group:** Sensitive children
- **Personality:** Calm, good listener, ocean-themed
- **Best for:** Emotional support, quiet conversations
- **Catchphrase:** "whoa cool!"

**🤖 Chip (chill-robot)**

- **Age group:** Tech-interested kids (9-12)
- **Personality:** Nerdy but fun, loves technology
- **Best for:** STEM conversations, logical thinking
- **Catchphrase:** "yo that's sick!"

### Age-Appropriate Language

**6-8 Years (young)**

- Simple words, short sentences
- "cool!" "awesome!" "whoa!"
- Very excited and energetic

**9-10 Years (middle)**

- Casual language: "dude", "that's sick!"
- Still excited but more chill
- Slightly more complex topics

**11-12 Years (older)**

- Age-appropriate slang: "that's fire", "bet"
- Enthusiastic but not babyish
- More mature conversation topics

---

## 📊 Safety Severity Levels

### Level 0: Safe ✅

- **Action:** Allow normally
- **Examples:** "I love dinosaurs", "School was fun today"
- **Logging:** Basic conversation logging only

### Level 1: Monitor 👀

- **Action:** Allow but log for patterns
- **Examples:** ALL CAPS messages, mild frustration
- **Logging:** Enhanced monitoring, pattern analysis

### Level 2: Redirect 🔄

- **Action:** Gentle guidance, continue conversation
- **Examples:** Name-calling, rude language
- **Response:** "hey, let's try to be kind with our words"

### Level 3: Escalate 🚨

- **Action:** Block message, notify parents immediately
- **Examples:** Self-harm, stranger contact, personal info requests
- **Response:** Suggest talking to trusted adult

---

## 🔄 Configuration Version Control

### Tracking Changes

Each config file has a version and lastUpdated field:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-14",
  "description": "..."
}
```

### Best Practices

1. **Increment version** for any change
2. **Document the reason** in commit messages
3. **Keep change logs** of safety rule modifications
4. **Test before incrementing version**

---

## 🚨 Emergency Procedures

### If Safety Rules Are Too Restrictive

1. **Don't panic** - children are protected
2. **Check recent safety logs** to see what's being blocked
3. **Adjust specific patterns** rather than lowering overall sensitivity
4. **Test changes with sample messages**

### If Safety Rules Are Too Permissive

1. **Immediately revert** to last known good configuration
2. **Review recent conversations** for concerning content
3. **Notify legal/compliance team** if inappropriate content was allowed
4. **Add missing safety patterns** before re-deploying

### Configuration File Corruption

1. **Restore from git backup** immediately
2. **Check syntax** with JSON validator
3. **Run full test suite** before deploying
4. **Consider rolling back** if errors persist

---

## 🧪 Testing Your Changes

### Quick Syntax Check

```bash
# Validate JSON syntax
cat config/safety-rules.json | python -m json.tool
cat config/ai-personas.json | python -m json.tool
cat config/system-prompts.json | python -m json.tool
```

### Safety Rule Testing

Create test messages and verify they trigger correct responses:

```javascript
// Test emotional support
"my grandma died" → should trigger emotional_support_needed

// Test personal info blocking
"my address is 123 main st" → should escalate to parents

// Test normal conversation
"i love playing soccer" → should be allowed normally
```

### Persona Testing

Start conversations and verify:

- **Age-appropriate language** is used
- **Character personality** comes through
- **Catchphrases** appear naturally (not every message)

---

## 📞 Getting Help

### For Technical Issues

- **Build failures:** Check syntax errors in JSON files
- **Pattern not working:** Verify regex syntax and flags
- **Performance issues:** Check for overly complex patterns

### For Safety Concerns

- **Contact legal team** for compliance questions
- **Review with child safety experts** for pattern changes
- **Consult age-development specialists** for language appropriateness

### For AI Behavior Issues

- **Test in development environment** first
- **Review conversation logs** to understand current behavior
- **Make incremental adjustments** rather than major changes

---

## 📚 Additional Resources

- **Child Development Guidelines:** Understanding age-appropriate communication
- **COPPA Compliance:** Legal requirements for child data protection
- **AI Safety Research:** Best practices for child-AI interactions
- **Regex Testing Tools:** For validating safety patterns

Remember: **Every configuration change affects real children's safety and experience. When in doubt, choose the more protective option and consult with experts.**
