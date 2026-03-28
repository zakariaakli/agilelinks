# Enneagram Assessment

## Overview

A structured 3-phase personality assessment that determines a user's Enneagram type before account creation. Results are stored against a lead record and carried into the user profile post-signup.

---

## Assessment Flow

### Phase 1 — Triad Detection
5 forced-choice A/B/C questions, each option mapped to a center (Gut / Head / Heart). Frontend tallies scores locally. If two centers tie, an AI-generated binary tiebreaker question resolves it.

### Phase 2 — Within-Triad Differentiation
5 forced-choice questions targeting the winning triad's specific types (e.g., Gut → Types 1, 8, 9). If Phase 1 produced a clear dominant + secondary center, a 3-question mixed set first confirms the dominant before routing to its full type set.

### Phase 3 — AI Conversational Challenge
6–8 turn chat targeting the top 2 candidate types from Phase 2. The AI uses scenario-based prompts to surface behavioral patterns. The user can request results after turn 4.

---

## Scoring

The scoring endpoint receives the full Phase 3 transcript plus `structuredContext` (Phase 1/2 scores and candidate types) as high-confidence anchors. The AI outputs a radar profile (scores for all 9 types) with a declared dominant type.

---

## Question Storage

Assessment questions live in Firestore `assessmentConfig/enneagram` and are never bundled into the client. They are served exclusively via a server-side API route (`/api/assessment-config`) using the Firebase Admin SDK, with a 1-hour cache header.

Sets stored:
- `phase1` — 5 triad detection questions
- `phase2_gut`, `phase2_head`, `phase2_heart` — 5 type questions each
- `phase2_mixed_gut_head`, `phase2_mixed_gut_heart`, `phase2_mixed_head_heart` — 3-question binary tie-resolution sets

---

## Lead Capture & Booking

After results are shown, the user enters their email to book a session. On submission:
1. Calendly opens immediately (synchronous `window.open` — before any async op to avoid popup blocking)
2. Lead record written to Firestore `leads` with `enneagramResult`, `assessmentDetail`, email, and timestamp
3. Notification email sent to `zakli@stepiva.ai` via `/api/notify-lead` (fire-and-forget)

`assessmentDetail` contains Phase 1 scores, Phase 2 scores, and candidate types — persisted to localStorage so it can be picked up post-signup.

---

## Key API Routes

| Route | Purpose |
|---|---|
| `GET /api/assessment-config?set=<phase>` | Serves questions from Firestore (Admin SDK, server-side only) |
| `POST /api/notify-lead` | Sends lead notification email via Resend |
| `POST /api/chatbot/enneagram-assess` | Phase 3 chat + tiebreaker question generation |
| `POST /api/chatbot/enneagram-score` | Final radar scoring with structured context |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CALENDLY_URL` | Booking link — change without redeploying |
| `FIREBASE_SERVICE_ACCOUNT` | Admin SDK credentials (JSON string) |
