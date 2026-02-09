# Steps & Commitments Feature

## Overview

Steps (micro-commitments) allow users to break down milestones into actionable items they can track. Steps can be added manually by the user or directly from AI nudge action items.

## Where Steps Appear

| Page | Behavior |
|------|----------|
| **Profile page** (`/profile`) | Nudge with "Add" buttons on actions + Commitments list below |
| **Goal detail page** (`/profile/goals/[id]`) | Commitments list only (no nudges) |
| **Nudge detail page** (`/nudge/[id]`) | Nudge with "Add" buttons + Commitments list below |

## Adding Steps from Nudges

Each numbered or bullet action item in an AI nudge displays an "Add" button. Clicking it:

1. Creates a step via `POST /api/steps` with `source: 'ai'`
2. Immediately appears in the Commitments list (no refresh needed)
3. Button changes to "Added" (green checkmark)
4. If the step title already exists in commitments, button shows "Added" on page load

On mobile, the "Add" button is icon-only (compact) to preserve layout.

## Data Model

Steps are stored as a sub-array on milestone documents in Firestore:

```
plans/{planId}/milestones[].steps[] = {
  id: string
  title: string
  completed: boolean
  source: 'user' | 'ai'
  createdAt: Timestamp
  completedAt?: Timestamp
}
```

## API: `/api/steps`

- **GET** `?planId=&milestoneId=` - Fetch steps for a milestone
- **POST** `{ planId, milestoneId, title, source }` - Create a step
- **PATCH** `{ planId, milestoneId, stepId, completed }` - Toggle completion
- **DELETE** `{ planId, milestoneId, stepId }` - Remove a step

## Component Architecture

- **MilestoneCard** - Manages shared steps state, passes to both GameNudgeSlider and StepsList
- **GameNudgeSlider** - Passes `onAddStep` + `existingStepTitles` to NudgeFormatter
- **NudgeFormatter** - Renders action items with "Add" buttons when `onAddStep` is provided
- **NudgeContentWithSteps** - Client wrapper for the nudge detail page (Server Component), coordinates NudgeFormatter + StepsList
- **StepsList** - CRUD UI for commitments (check/uncheck, add, delete)
- **StepItem** - Single step row with checkbox and delete
- **SuggestedStepCard** - AI-suggested step card (shown when <2 active steps)
- **AchievementTrail** - Shows completed steps history

## Milestone Visual Distinction

Active milestones are visually distinct from future/completed:
- Indigo background + solid border + rounded corners + shadow
- "IN PROGRESS" badge above the title
- Future milestones: dashed gray border, muted text
- Completed milestones: green background + solid green border
