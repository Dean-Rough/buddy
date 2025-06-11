# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context
Buddy is a safe AI chat companion for children aged 6-12. This is a child safety application requiring strict security and privacy compliance.

## Planned Tech Stack (per PRD)
- **Frontend**: Next.js with React, TailwindCSS
- **Backend**: Next.js API routes  
- **Database**: NeonDB (PostgreSQL)
- **Auth**: Clerk with PIN-based login for children
- **Deployment**: Vercel
- **AI**: OpenAI/Anthropic via proxy with dual-layer safety
- **Voice**: Cartesia TTS

## Development Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Test suite
npm run lint         # ESLint
npm run type-check   # TypeScript validation
```

## Critical Architecture Requirements
- **Dual-layer AI safety**: Primary chat agent + real-time safety monitor
- **PIN-based authentication**: No usernames/passwords for children
- **Age-appropriate responses**: Adjust language complexity based on child's age
- **Real-time escalation**: Alert parents within 60 seconds of concerning content
- **Persistent memory**: Child-specific context tied to PIN
- **Data minimization**: 90-day retention, parent-deletable

## Security Imperatives
- All child inputs must be sanitized and validated
- All data encrypted at rest and in transit
- Never log sensitive child conversations in plain text
- COPPA/GDPR compliance is mandatory
- Safety layer must validate ALL AI responses before delivery
- No collection of location, device, or biometric data

## Child Safety Patterns
- Error boundaries required for all child-facing components
- Gentle redirects for inappropriate topics ("That's a great question for a trusted grown-up!")
- Human-style typing animations to mask safety processing time
- Whisper Mode for calming interactions during distress

## Testing Requirements
- Safety layer effectiveness: 95%+ accuracy on test scenarios
- Child UX flows must work without adult assistance
- Escalation system must trigger within 60 seconds
- Memory persistence must work across sessions
- All safety checks must pass before any deployment