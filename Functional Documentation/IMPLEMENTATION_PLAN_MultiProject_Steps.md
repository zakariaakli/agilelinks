# Implementation Plan: Multi-Project Switcher & Steps Feature

## Overview

This document outlines the implementation plan for:
1. **Multi-Project Switcher** - Header dropdown for switching between active plans
2. **Steps System** - Micro-commitments within milestones, integrated with nudges

---

## Approved Design Decisions

| Feature | Decision |
|---------|----------|
| Project Switcher | **Header Dropdown** (Option A) |
| Steps Display | **Inline Checklist** (Option A) |
| Step Limits | **No limit** - milestones can last months, users need flexibility |
| Achievement Trail | Always visible below active steps |

---

## Phase 1: Data Model & Backend

### 1.1 Create Step Model

**New File:** `Models/Step.ts`

```typescript
export interface Step {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  source: 'user' | 'ai';           // Track origin for analytics
  nudgeId?: string;                 // If proposed by a nudge
}
```

### 1.2 Update Milestone Model

**File:** `Models/Plan.ts` (or wherever Milestone is defined)

```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
  steps?: Step[];                   // NEW: Array of steps
}
```

### 1.3 Create Step API Routes

**New Files:**

| Route | Purpose |
|-------|---------|
| `app/api/steps/route.ts` | GET: List steps for milestone, POST: Create step |
| `app/api/steps/[id]/route.ts` | PATCH: Update step (complete/edit), DELETE: Remove step |

**POST `/api/steps`**
```typescript
// Request body
{
  planId: string;
  milestoneId: string;
  title: string;
  source: 'user' | 'ai';
  nudgeId?: string;
}
```

**PATCH `/api/steps/[id]`**
```typescript
// Request body
{
  completed?: boolean;
  title?: string;
}
```

### 1.4 Firestore Structure

```
plans/{planId}
  └── milestones: [{
        id: string,
        title: string,
        ...
        steps: [{
          id: string,
          title: string,
          completed: boolean,
          completedAt: timestamp | null,
          createdAt: timestamp,
          source: 'user' | 'ai',
          nudgeId: string | null
        }]
      }]
```

**Alternative (subcollection):**
```
plans/{planId}/milestones/{milestoneId}/steps/{stepId}
```

**Recommendation:** Use embedded array (first option) since:
- Steps are always accessed with milestone
- Simpler queries
- Fewer reads

---

## Phase 2: OpenAI Assistant Updates

### 2.1 Update Assistant Prompt

**File to update:** `ASSISTANT_PROMPT.md`
**Dashboard URL:** https://platform.openai.com/assistants/asst_E8XA9whMO0RTFgyfixAVBwUs

**Add to Input Structure section:**

```markdown
### Input Structure (Updated)

You receive JSON with:

```json
{
  "goalContext": "User's overall goal",
  "milestone": {
    "title": "Current milestone title",
    "description": "What they're working on",
    "blindSpotTip": "Personality-based warning",
    "strengthHook": "Personality-based encouragement",
    "daysInProgress": 8,
    "totalDays": 14,
    "daysRemaining": 6
  },
  "personalityContext": "Enneagram summary and details",
  "growthAdvice": "Type-specific coaching advice",
  "feedbackHistory": [...],
  "steps": {                          // NEW
    "active": [
      {"title": "Schedule meeting with Sarah", "daysOld": 3},
      {"title": "Prepare interview questions", "daysOld": 5}
    ],
    "recentlyCompleted": [
      {"title": "Identified 5 stakeholders", "completedDaysAgo": 2}
    ],
    "totalCompleted": 5
  }
}
```
```

**Add to Nudge Behavior section:**

```markdown
### Step-Aware Nudging

CRITICAL RULES for steps:

1. **Reference existing steps**: If user has active steps, acknowledge them
   - GOOD: "You committed to scheduling with Sarah - how did that go?"
   - BAD: Ignoring existing steps and suggesting new ones

2. **Celebrate completions**: If steps were recently completed, acknowledge
   - GOOD: "You knocked out 2 commitments since last time - nice momentum!"

3. **Propose new steps ONLY when helpful**:
   - User has 0-1 active steps → You MAY propose 1 new actionable step
   - User has 2+ active steps → Focus on encouragement, NO new proposals
   - Never overwhelm with too many suggestions

4. **Step proposal format** (when applicable):
   - End your nudge with: `[SUGGESTED_STEP: Brief actionable commitment]`
   - Example: `[SUGGESTED_STEP: Block 30 minutes Friday to review notes]`
   - Keep it concrete and achievable within the week

5. **Connect steps to personality**:
   - Use blind spot awareness: "Before diving into more tasks, pause on what's already on your plate"
   - Use strength leverage: "Your attention to detail will make that interview prep shine"
```

### 2.2 Update Input Structure in Code

**File:** `lib/generateMilestoneNudgeFromAI.ts`

```typescript
interface StepsContext {
  active: Array<{
    title: string;
    daysOld: number;
  }>;
  recentlyCompleted: Array<{
    title: string;
    completedDaysAgo: number;
  }>;
  totalCompleted: number;
}

interface GenerateMilestoneNudgeInput {
  // ... existing fields ...
  steps?: StepsContext;             // NEW
}
```

**Update the function to fetch steps:**

```typescript
// Fetch steps for this milestone
const planDoc = await db.collection('plans').doc(planId).get();
const planData = planDoc.data();
const milestone = planData.milestones.find(m => m.id === milestoneId);
const steps = milestone?.steps || [];

const now = new Date();
const stepsContext: StepsContext = {
  active: steps
    .filter(s => !s.completed)
    .map(s => ({
      title: s.title,
      daysOld: Math.floor((now - s.createdAt.toDate()) / (1000 * 60 * 60 * 24))
    })),
  recentlyCompleted: steps
    .filter(s => s.completed && s.completedAt)
    .filter(s => {
      const daysAgo = Math.floor((now - s.completedAt.toDate()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 7; // Last 7 days
    })
    .map(s => ({
      title: s.title,
      completedDaysAgo: Math.floor((now - s.completedAt.toDate()) / (1000 * 60 * 60 * 24))
    })),
  totalCompleted: steps.filter(s => s.completed).length
};
```

### 2.3 Update GitHub Actions Script

**File:** `.github/scripts/process-milestone-reminders.mjs`

Apply the same changes as above to the `generateMilestoneNudge` function.

### 2.4 Parse AI Response for Suggested Steps

**Add to nudge processing:**

```typescript
function parseNudgeResponse(response: string): {
  nudgeText: string;
  suggestedStep: string | null;
} {
  const stepMatch = response.match(/\[SUGGESTED_STEP:\s*(.+?)\]/);

  if (stepMatch) {
    return {
      nudgeText: response.replace(/\[SUGGESTED_STEP:\s*.+?\]/, '').trim(),
      suggestedStep: stepMatch[1].trim()
    };
  }

  return { nudgeText: response, suggestedStep: null };
}
```

### 2.5 Store Suggested Step with Notification

**Update Notification model:**

```typescript
export interface Notification {
  // ... existing fields ...
  suggestedStep?: string | null;    // NEW: AI-proposed step
}
```

---

## Phase 3: Frontend - Project Switcher

### 3.1 Create ProjectSwitcher Component

**New File:** `Components/ProjectSwitcher.tsx`

```typescript
interface ProjectSwitcherProps {
  plans: Plan[];
  activePlanId: string;
  onPlanChange: (planId: string) => void;
}
```

**Features:**
- Dropdown trigger showing current plan name + milestone
- Dropdown menu with all active plans
- Progress indicator per plan
- Gradient icon with plan initials

### 3.2 Update Header Component

**File:** `Components/Header.tsx`

- Add ProjectSwitcher between logo and nav
- Pass current plan context from page/layout
- Handle plan switching (update URL or context)

### 3.3 Create Mobile Project Sheet

**New File:** `Components/MobileProjectSheet.tsx`

- Bottom sheet for mobile project switching
- Triggered by tapping the compact switcher in mobile header
- Same content as desktop dropdown

### 3.4 Update Profile/Dashboard Page

**File:** `app/profile/page.tsx`

Current: Shows all plans in a grid/list
New:
- Show single focused plan with current milestone
- Use ProjectSwitcher to navigate between plans
- Remove the "show all plans" grid (or make it a separate "All Plans" view)

---

## Phase 4: Frontend - Steps UI

### 4.1 Create StepItem Component

**New File:** `Components/StepItem.tsx`

```typescript
interface StepItemProps {
  step: Step;
  onToggle: (stepId: string, completed: boolean) => void;
  onDelete: (stepId: string) => void;
}
```

**Features:**
- Checkbox (click to complete)
- Step text
- Delete button (hover reveal)
- Completed state styling (strikethrough, dimmed)

### 4.2 Create StepsList Component

**New File:** `Components/StepsList.tsx`

```typescript
interface StepsListProps {
  milestoneId: string;
  planId: string;
  steps: Step[];
  suggestedStep?: string | null;
  onStepAdded: (step: Step) => void;
  onStepToggled: (stepId: string, completed: boolean) => void;
}
```

**Sections:**
1. **Active Steps** - Uncompleted items with checkboxes
2. **Add Step** - Button to open inline input or modal
3. **Suggested Step** (if present) - Highlighted card with Accept/Skip buttons
4. **Achievement Trail** - Completed items (collapsed on mobile)

### 4.3 Create SuggestedStepCard Component

**New File:** `Components/SuggestedStepCard.tsx`

```typescript
interface SuggestedStepCardProps {
  stepText: string;
  nudgeId: string;
  onAccept: () => void;
  onSkip: () => void;
}
```

**Design:**
- Primary-50 background with dashed border
- Sparkle icon
- Accept (primary button) and Skip (ghost button) actions

### 4.4 Create AchievementTrail Component

**New File:** `Components/AchievementTrail.tsx`

```typescript
interface AchievementTrailProps {
  completedSteps: Step[];
  collapsed?: boolean;
}
```

**Features:**
- Green check icons
- Step text with completion date
- Collapsible on mobile (shows count when collapsed)

### 4.5 Update Nudge Page

**File:** `app/nudge/[id]/page.tsx`

- Add StepsList component below milestone info
- Pass suggestedStep from notification
- Handle step accept/skip actions

### 4.6 Create New Dashboard Layout

**File:** `app/profile/page.tsx` (refactor)

New structure:
```
┌─────────────────────────────────────────┐
│ Header with ProjectSwitcher             │
├─────────────────────────────────────────┤
│ Current Milestone Card                  │
│ - Title, dates, progress bar            │
│ - Personality hooks                     │
├─────────────────────────────────────────┤
│ My Commitments (Steps)                  │
│ - Active steps                          │
│ - Add step button                       │
│ - Suggested step (if any)               │
├─────────────────────────────────────────┤
│ Latest Nudge                            │
│ - Nudge message                         │
│ - Feedback button                       │
├─────────────────────────────────────────┤
│ Achievement Trail                       │
│ - Completed steps                       │
└─────────────────────────────────────────┘
```

---

## Phase 5: Styles

### 5.1 Create New CSS Modules

| File | Purpose |
|------|---------|
| `Styles/projectSwitcher.module.css` | Switcher dropdown styles |
| `Styles/steps.module.css` | Step item and list styles |
| `Styles/achievementTrail.module.css` | Completed steps trail |

### 5.2 Follow Design Tokens

Use existing tokens from `Styles/design-tokens.css`:
- Colors: `--color-primary-*`, `--color-secondary-*`, `--color-neutral-*`
- Spacing: `--space-*`
- Border radius: `--radius-*`
- Shadows: `--shadow-*`
- Transitions: `--transition-*`

---

## Phase 6: Testing & Polish

### 6.1 Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| User has 0 steps | AI may suggest 1 step |
| User has 2+ active steps | AI focuses on existing, no new proposals |
| User completes a step | Moves to Achievement Trail with date |
| User accepts suggested step | Added to active steps, linked to nudge |
| User skips suggested step | Dismissed, not shown again |
| User switches project | Dashboard updates to show new plan's milestone |
| Mobile view | Bottom sheet for project switching, collapsed trail |

### 6.2 Analytics Events (PostHog)

| Event | Properties |
|-------|------------|
| `step_created` | `source: 'user' | 'ai'`, `milestoneId`, `planId` |
| `step_completed` | `stepId`, `daysToComplete` |
| `step_deleted` | `stepId`, `wasCompleted` |
| `suggested_step_accepted` | `nudgeId`, `stepText` |
| `suggested_step_skipped` | `nudgeId` |
| `project_switched` | `fromPlanId`, `toPlanId` |

---

## Implementation Order

### Sprint 1: Backend Foundation
1. Create Step model
2. Update Milestone model to include steps
3. Create Step API routes
4. Write Firestore security rules for steps

### Sprint 2: AI Integration
5. Update ASSISTANT_PROMPT.md
6. Update OpenAI dashboard with new prompt
7. Modify `generateMilestoneNudgeFromAI.ts` to include steps context
8. Modify `.github/scripts/process-milestone-reminders.mjs`
9. Add suggested step parsing
10. Update Notification model

### Sprint 3: Frontend - Steps
11. Create StepItem component
12. Create StepsList component
13. Create SuggestedStepCard component
14. Create AchievementTrail component
15. Integrate into nudge page

### Sprint 4: Frontend - Project Switcher
16. Create ProjectSwitcher component
17. Create MobileProjectSheet component
18. Update Header component
19. Refactor profile/dashboard page
20. Add project switching logic

### Sprint 5: Polish
21. Add CSS styles
22. Add loading states
23. Add empty states
24. Add analytics events
25. Test all scenarios
26. Mobile testing

---

## Files to Create

| File | Type |
|------|------|
| `Models/Step.ts` | Model |
| `app/api/steps/route.ts` | API |
| `app/api/steps/[id]/route.ts` | API |
| `Components/ProjectSwitcher.tsx` | Component |
| `Components/MobileProjectSheet.tsx` | Component |
| `Components/StepItem.tsx` | Component |
| `Components/StepsList.tsx` | Component |
| `Components/SuggestedStepCard.tsx` | Component |
| `Components/AchievementTrail.tsx` | Component |
| `Styles/projectSwitcher.module.css` | Styles |
| `Styles/steps.module.css` | Styles |
| `Styles/achievementTrail.module.css` | Styles |

## Files to Modify

| File | Changes |
|------|---------|
| `ASSISTANT_PROMPT.md` | Add steps context instructions |
| `lib/generateMilestoneNudgeFromAI.ts` | Add steps to AI input |
| `.github/scripts/process-milestone-reminders.mjs` | Add steps to AI input |
| `Models/Notification.ts` | Add `suggestedStep` field |
| `Components/Header.tsx` | Add ProjectSwitcher |
| `app/profile/page.tsx` | Refactor to single-plan view |
| `app/nudge/[id]/page.tsx` | Add StepsList |

---

## OpenAI Dashboard Changes

**URL:** https://platform.openai.com/assistants/asst_E8XA9whMO0RTFgyfixAVBwUs

**Changes to make:**

1. Update the system instructions to include:
   - New input structure with `steps` object
   - Step-aware nudging rules
   - `[SUGGESTED_STEP: ...]` format for proposals

2. Test with sample inputs containing steps context

3. Verify output includes suggested steps in correct format

---

## Questions to Resolve Before Implementation

1. **Step deletion**: Soft delete (mark as deleted) or hard delete?
2. **Step editing**: Allow editing step title after creation?
3. **Step ordering**: Manual reorder or creation-date order?
4. **Suggested step expiry**: How long does a suggested step remain visible? Until next nudge?
5. **All Plans view**: Keep a separate page showing all plans, or only use switcher?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Step creation rate | >50% of nudge views result in step action |
| Step completion rate | >40% of steps completed within milestone duration |
| Suggested step acceptance | >30% of AI suggestions accepted |
| Project switch usage | Used by users with 2+ active plans |
| Achievement Trail views | >20% of users expand trail on mobile |
