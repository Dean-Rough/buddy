## 🚨 Project Lumo: Recovery Roadmap 🚨

This document outlines the critical path to address the severe architectural, security, and functionality issues identified during the codebase autopsy. All new feature development must halt until Phase 0 and Phase 1 are complete.

The goal is to methodically bring every system to a 10/10 score for stability, security, and feature completeness.

---

### **Phase 0: Triage & Stabilization (Immediate Priority)**

_This phase addresses the most critical, data-corrupting, and legally-exposed issues. The application is considered unstable and unsafe until these are resolved._

#### **1. Unify the Database Schema (Severity: 10/10)**

- **Problem:** The `prisma/schema.prisma` file contains duplicate, conflicting models (e.g., `Child` vs. `ChildAccount`). This is causing data fragmentation and is a critical data integrity risk.
- **Implementation Plan:**
  1.  **Create a Migration Script:** Write a one-time migration script (`scripts/migrate-legacy-children.ts`) to move all data from the old tables (`Child`, `Conversation`, `Message`, etc.) to the new tables (`ChildAccount`, `NewConversation`, `NewMessage`).
  2.  **Verify Data:** After running the script, manually verify that all data has been migrated correctly.
  3.  **Update Prisma Schema:** Delete the legacy models (`Child`, `Conversation`, `Message`, `SafetyEvent`, `ParentNotification`, `ChildMemory`) from `prisma/schema.prisma`. Rename the "New" models to their proper names (e.g., `NewConversation` -> `Conversation`).
  4.  **Update Codebase:** Search the entire codebase for any remaining references to the old models and update them to use the new, unified schema.
  5.  **Generate Client:** Run `npx prisma generate`.

#### **2. Implement Real Parent Safety Notifications (Severity: 9/10)**

- **Problem:** The safety system (`lib/ai/safety.ts`) logs critical alerts to the database but does not actually notify parents, despite the `//TODO` comment. This is a massive failure of the core safety promise.
- **Implementation Plan:**
  1.  **Create Notification Service:** Create a new file `lib/notifications.ts`.
  2.  **Integrate Resend:** Install the Resend SDK (`npm install resend`) and configure it in `lib/notifications.ts` using the `RESEND_API_KEY` environment variable.
  3.  **Create `sendSafetyAlert` Function:** In `lib/notifications.ts`, create an async function `sendSafetyAlert(parentEmail: string, childName: string, message: string)`. This function will construct and send a formatted email using Resend.
  4.  **Update `escalateToParent`:** In `lib/ai/safety.ts`, import `sendSafetyAlert` and call it within the `escalateToParent` function. Remove the `// TODO`.

#### **3. Build Functional Parent-Side Child Management (Severity: 9/10)**

- **Problem:** The Parent Dashboard (`app/parent/page.tsx`) is non-functional and dangerously instructs parents to use the Clerk developer dashboard.
- **Implementation Plan:**
  1.  **Create Child Management API:**
      - `POST /api/children`: Creates a new child sub-account under the authenticated parent.
      - `GET /api/children`: Lists all children for the authenticated parent.
      - `PUT /api/children/[id]`: Updates a specific child's details (name, age, etc.).
      - `DELETE /api/children/[id]`: Deletes a child's account.
  2.  **Build UI Components:**
      - In the `components/parent` directory, create `ChildAccountList.tsx`, `CreateChildForm.tsx`, and `EditChildModal.tsx`.
  3.  **Overhaul Parent Dashboard:**
      - Replace the entire content of `app/parent/page.tsx` with a real dashboard UI that uses the new components and API endpoints. Remove all "coming soon" buttons and the link to the Clerk dashboard.

---

### **Phase 1: Solidify the Foundation**

_With the critical fires put out, this phase focuses on building a stable, secure, and testable foundation._

#### **4. Write Comprehensive Safety & E2E Tests (Severity: 8/10)**

- **Problem:** Existing tests are placeholders and provide a false sense of security. The "8/8 passing" claim is misleading.
- **Implementation Plan:**
  1.  **Integration Test Suite:** In `tests/safety/`, create `safety.integration.test.ts`. Write tests that call the `/api/chat` endpoint with a list of known safe and unsafe inputs. Assert that the correct safety actions are taken and that parent notifications are triggered for escalations. Do not mock the database or the notification service.
  2.  **E2E Test Suite:** In `tests/e2e/`, create `full-flow.spec.ts` using Playwright. This test should simulate a full user journey:
      - Parent signs up.
      - Parent creates a new child account.
      - Parent logs out.
      - Child logs in.
      - Child has a short conversation.
      - Child sends an unsafe message that triggers an escalation.
      - Assert that the parent receives a notification (you can use a mock email service like MailHog for this).

#### **5. Secure the Memory System (Severity: 7/10)**

- **Problem:** The memory system (`lib/memory.ts`) uses fragile regex and stores potential PII.
- **Implementation Plan:**
  1.  **AI-Powered Extraction:** Update the `extractMemoriesFromMessage` function. Instead of regex, make an AI call (using a cheap, fast model like GPT-4o-mini) with a specific prompt to extract entities (preferences, topics, facts) in a structured JSON format.
  2.  **PII Filtering:** In the AI prompt, explicitly instruct the model to identify and flag any PII (names, locations, etc.). In the code, filter out or anonymize any flagged PII before storing it in the `ChildMemory` table.

#### **6. Implement API Security Best Practices (Severity: 6/10)**

- **Problem:** APIs lack input validation and rate limiting.
- **Implementation Plan:**
  1.  **Input Validation:** Install Zod (`npm install zod`). For every API route, create a Zod schema that defines the expected shape of the request body. Parse and validate the body against the schema at the beginning of each route handler.
  2.  **Rate Limiting:** Install Upstash Ratelimit (`npm install @upstash/ratelimit @upstash/redis`). Apply rate limiting to all critical API endpoints, especially `/api/chat` and auth-related routes.

---

### **Phase 2: Feature Completion & Polish**

_Now, we deliver on the original promises of the roadmap._

#### **7. Build the Real Persona System**

- **Implementation Plan:**
  1.  **Create Persona Manager:** In `lib/personas.ts`, create functions to get available personas from the database and manage them.
  2.  **Build UI:** Create the `PersonaSelector.tsx` component that allows a child to see and choose their AI's persona.
  3.  **Update Chat API:** The `/api/chat` endpoint should accept a `personaId`. This persona should be passed to the `createSystemPrompt` function in `lib/ai/client.ts` to dynamically generate the AI's personality, not use a hardcoded value.

#### **8. Enhance Chat & Conversation History**

- **Implementation Plan:**
  1.  **State Management:** Use Zustand (already installed) to create a proper store for chat state (`useChatStore.ts`). This store will manage messages, conversation ID, loading state, etc.
  2.  **History API:** Create a `/api/chat/history/[conversationId]` endpoint that retrieves all messages for a given conversation.
  3.  **Load History:** When a chat session starts, fetch and display the previous messages from the API.

#### **9. Finalize Moderation Dashboard**

- **Implementation Plan:**
  1.  **Flesh out API:** Implement the backend logic for the moderation API (`/api/moderation/*`) to allow moderators to review, annotate, and resolve safety events.
  2.  **Enhance UI:** Make the moderation dashboard (`app/moderation/page.tsx`) fully interactive, allowing for real decision-making that updates the status of `SafetyEvent` records in the database.

#### **10. Create Database Seeding**

- **Implementation Plan:**
  1.  **Comprehensive Seed File:** Expand `prisma/seed.ts` to create a realistic dataset: multiple parents, multiple children per parent, several personas, and sample conversations with varying levels of safety flags. This is crucial for realistic testing and development.

---

This roadmap is your path to redemption. Follow it.
