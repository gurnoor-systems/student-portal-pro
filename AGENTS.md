# Agent Guidelines & Operational Reference (AGENTS.md)
## Project: Personal & Academic Management System

---

### 1. Ground Truth & Core Directives
1. **Source of Truth:** All requirements, features, data structures, and acceptance criteria are strictly defined in [`PRD.md`](file:///d:/Personal_management_system/PRD.md). Never deviate from or invent functional requirements outside `PRD.md` without explicit user confirmation.
2. **No Assumptions Rule:** If a technical choice, architectural pattern, third-party library, UI layout preference, or feature behavior has multiple viable options, **DO NOT assume**. Always present the options clearly to the user and request their choice before proceeding.
3. **Step-by-Step Execution:** Work strictly milestone-by-milestone as defined in Section 7 of `PRD.md`. Complete, test, and verify each milestone before moving forward.

---

### 2. Architecture & Data Security Invariants (Non-Negotiable)

- **Multi-Tenant User Isolation:**
  - Every data record (`Task`, `Assignment`, `Classroom`, `Category`, `Reminder`, `DailyStat`) must be strictly tied to an active `userId`.
  - No user can ever view, query, update, or delete another user's data (IDOR prevention at all levels).
  - Client-side storage and caches must be cleanly partitioned per user (`user_${userId}_data`).
  - Session termination (logout) must completely purge all active in-memory states and secure caches.
- **External Integrations:**
  - Google Classroom & Google Calendar integrations must adhere to the data contracts in `PRD.md` (Section 3.4 & 3.6).

---

### 3. Frontend & Design System Standards

- **Technology Foundation:**
  - Core: HTML5 semantic structure, clean JavaScript (ES6+ modular / TypeScript where specified).
  - Styling: Modern Vanilla CSS with CSS custom properties (variables) for dynamic theme tokens. Do not introduce CSS frameworks (like Tailwind) unless explicitly selected by the user.
- **Aesthetic Excellence:**
  - Premium design: Rich gradients, smooth micro-interactions, WCAG-compliant contrast ratios, and glassmorphism.
  - Zero-flicker Dark / Light theme switching with persistent state.
  - Full multi-device responsiveness (Mobile $< 768\text{px}$, Tablet $768\text{px}-1024\text{px}$, Desktop $> 1024\text{px}$).

---

### 4. Decision-Making & Option-Presentation Protocol

When any of the following situations arise, the Agent **must halt and present the structured options** to the user:
1. **Framework & Tooling Choices:** (e.g., Single-Page App with Vanilla JS vs. Vite + React/Vue/Next.js).
2. **Backend & Persistence Layer:** (e.g., Firebase / Firestore vs. Node.js Express + PostgreSQL/SQLite vs. Client-side LocalStorage/IndexedDB with simulated backend).
3. **Third-Party Integrations:** (e.g., Google OAuth client setup, Mock vs. Live Google API keys).
4. **UI Layout Alternatives:** (e.g., Tab bar vs. Persistent Sidebar layout on tablet views).

#### Format for Presenting Options:
```markdown
### ❓ Decision Point: [Topic Name]
We need to decide on [brief description]. Here are the recommended options:

- **Option A (Recommended):** [Details, Pros, Cons]
- **Option B:** [Details, Pros, Cons]
- **Option C:** [Details, Pros, Cons]

Which option would you prefer to proceed with?
```

---

### 5. Implementation Phasing & Checklists

Agents must execute the implementation according to the 8 phases established in `PRD.md`:
- **Phase 1:** Project Setup, Shell Layout & CSS Design Tokens (Dark/Light).
- **Phase 2:** User Authentication, Session State & Multi-Tenant Data Store.
- **Phase 3:** Central Home Dashboard & 2-Click Quick-Add Task Modal.
- **Phase 4:** Assignment Tracker (Kanban / List) & Priority Matrix.
- **Phase 5:** Classrooms Hub & Course Materials / Direct Video Launcher.
- **Phase 6:** Interactive Calendar View & Google Calendar 2-Way Sync Engine.
- **Phase 7:** Progress Dashboard, Completion Rings & Streak Analytics.
- **Phase 8:** Notification/Reminder Engine, Accessibility & Final Polish.

---

### 6. Code Quality & Verification Mandates

- **No Placeholders or Broken Links:** Interactive buttons must have handlers or visual feedback; mock services must return realistic data structures matching `PRD.md`.
- **Pre-Delivery Verification:**
  1. Inspect responsiveness across desktop, tablet, and mobile dimensions.
  2. Verify dark mode and light mode contrast and transitions.
  3. Verify that user data isolation holds true across multiple mock/real accounts.
  4. Ensure zero console errors or uncaught exceptions.
