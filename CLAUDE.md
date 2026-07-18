# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stepiva** is an AI-powered coaching companion platform that keeps coaching insights alive between sessions. The platform uses personality-aware AI (Enneagram, MBTI) to provide structured reflection and nudges applied to real goals.

Built with Next.js 15 (App Router), TypeScript, Firebase, and OpenAI.

## Development Commands

### Essential Commands
- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Build for production (includes sitemap generation via postbuild)
- `npm start` — Start production server

### Code Quality
- `npm run lint` — Run ESLint (note: build ignores ESLint via next.config.ts)
- `npx tsc --noEmit` — Type-check without emitting files (no dedicated typecheck script)

### Testing
- `npm test` — Run all tests
- `npm run test:watch` — Run tests in watch mode
- `npm run test:coverage` — Generate coverage report (70% threshold)
- `npm run test:integration` — Run integration tests only
- `npm run test:api` — Run API tests only
- `npm run test:e2e` — Run end-to-end tests only
- `npm run test:ci` — CI mode with max 2 workers

## Architecture Overview

### Core Application Structure

**Next.js App Router** (`/app`)
- File-based routing with nested layouts
- Server and client components
- API routes under `/app/api`

**Shared Components** (`/Components`)
- 60+ React components including complex features like AIEnneagramTest, GameNudgeSlider, GamificationSystem
- Mix of UI components and feature-specific modules
- All components are capitalized (e.g., `Header.tsx`, `Auth.tsx`)

**Business Logic** (`/lib`)
- Analytics tracking (PostHog integration)
- Firebase wrappers with usage tracking (`trackedFirestore.ts`, `trackedFirestoreClient.ts`)
- Email notification system (SendGrid via `sendMilestoneEmail.ts`)
- Push notification system (`sendPushNotification.ts`)
- Plan lifecycle management (`planPersistence.ts`, `noPlanReminders.ts`)
- AI milestone generation (`generateMilestoneNudgeFromAI.ts`)

**Type Definitions** (`/types`)
- Custom TypeScript types
- Keep minimal - most types are defined inline

**Styling** (`/Styles`)
- CSS modules for component-specific styles
- Global styles in `globals.css`
- Bootstrap 5 + Material UI components

**Testing** (`/__tests__`)
- Jest + React Testing Library
- Organized by type: `/integration`, `/api`, `/e2e`
- Test utilities in `/__tests__/utils`

### Firebase Architecture

**Client-side** (`firebase.js`)
- Initialized with environment variables prefixed `NEXT_PUBLIC_REACT_APP_FIREBASE_*`
- Exports: `db`, `auth`, `googleProvider`, and Firestore utilities

**Server-side** (`firebase-admin.js`)
- Admin SDK for server-side operations
- Used in API routes and cron jobs

**Tracked Firestore Pattern**
- `trackedFirestore.ts` (server) and `trackedFirestoreClient.ts` (client) wrap Firestore operations
- Automatic usage tracking to `/api/track-firebase-usage`
- Use these wrappers instead of raw Firestore calls

### Key Feature Areas

**Enneagram Assessment** (see `Functional Documentation/ENNEAGRAM_ASSESSMENT.md`)
- 3-phase AI-driven personality test (triad detection → type differentiation → conversational challenge)
- Pre-signup lead capture with results stored in Firestore `leads` collection
- Results persist to user profile post-signup
- Questions served from Firestore `assessmentConfig/enneagram` via `/api/assessment-config`
- Scoring via `/api/chatbot/enneagram-score` using OpenAI with structured context

**Goal Wizard & Plan Lifecycle** (see `PLAN_LIFECYCLE.md`, `Functional Documentation/GOAL_WIZARD.md`)
- Multi-pass AI system for creating personalized goal plans with milestones
- Plans stored in Firestore with status tracking (active/completed)
- Automated milestone monitoring via cron job

**Nudge System** (see `NUDGE_WORKFLOW.md`)
- AI-powered milestone reminders using Enneagram insights
- Daily cron job (7:00 AM UTC) finds pending milestones
- Personalized content generation via OpenAI
- Multi-channel delivery: email (SendGrid), push notifications (web-push), in-app
- User-configurable schedule (daily, weekly, custom days)

**Notification System** (see `Functional Documentation/NOTIFICATIONS.md`)
- Centralized tracking in Firestore `notifications` collection
- Status: pending → processing → sent → delivered/failed
- `/api/milestoneReminders` orchestrates the workflow

**Gamification & Levels**
- Achievement tracking, XP points, level progression
- Components: `GamificationSystem.tsx`, `AchievementTrail.tsx`
- Steps & commitments system (see `Functional Documentation/STEPS_COMMITMENTS.md`)

### API Routes Architecture

**AI Integration** (`/app/api`)
- `/api/openAi/route.ts` — Generic OpenAI wrapper
- `/api/chatbot/*` — Specialized AI endpoints (coach-reflect, nudge-reflect, enneagram-assess, etc.)
- `/api/plan/*` — Goal planning AI workflows (draft-milestones, frame-assumptions, first-nudge)

**Notifications & Scheduling**
- `/api/milestoneReminders/route.ts` — Cron-triggered reminder orchestration
- `/api/subscribe-push/route.ts`, `/api/unsubscribe-push/route.ts` — Web push subscriptions

**Analytics & Tracking**
- `/api/track-firebase-usage/route.ts` — Usage metrics for Firestore operations
- `/api/track-openai-usage/route.ts` — Token usage tracking for AI calls

**Lead Management**
- `/api/waitlist/route.ts` — Waitlist signup
- `/api/notify-lead/route.ts` — Email notifications for new leads

### Configuration Files

**next.config.ts**
- ESLint disabled during builds (`ignoreDuringBuilds: true`)
- Webpack externals for OpenTelemetry (server-side only)
- ESM externals mode: loose

**jest.config.cjs**
- Next.js-aware Jest setup
- Path aliases: `@/Components`, `@/lib`, `@/Styles`
- 70% coverage threshold across all metrics

**.eslintrc.js**
- TypeScript, React, Next.js, accessibility (jsx-a11y), Prettier
- Explicit module boundary types disabled for flexibility

**vercel.json** (assumed from cron references)
- Contains cron job configuration for automated milestone reminders

## Development Philosophy

### Implementation Principles
- Implement ONLY explicitly requested features
- Choose simplest solution that meets requirements
- Write production-grade code from start (no placeholders)
- Design for scalability without premature optimization

### Code Standards
- Follow SOLID principles and clean architecture
- Maximum file size: 300 lines (refactor into modules if exceeded)
- Design for testability with clear separation of concerns
- Use dependency injection where appropriate

### Quality Requirements
- Comprehensive TypeScript type safety
- Proper error handling and validation
- Logging hooks for observability
- Document architectural decisions in code comments

### Workflow
1. Analyze request and existing codebase context
2. Propose approach and identify potential issues
3. Wait for confirmation before proceeding
4. Implement with proper error handling and tests
5. Explain architectural decisions made

### Constraints
- No dummy implementations — all code must be functional
- Avoid over-engineering: implement only requested features
- No speculative features or "nice to have" additions
- Follow established patterns in the existing codebase

## Important Patterns

### Firebase Usage
- Always use tracked wrappers (`trackedFirestore.ts` or `trackedFirestoreClient.ts`)
- Server routes use Admin SDK (`firebase-admin.js`)
- Client components use client SDK (`firebase.js`)

### AI Integration
- Token tracking via `/api/track-openai-usage` for cost monitoring
- Personality context (Enneagram type) included in prompts for personalization
- Structured output with Zod schemas where applicable

### Component Organization
- Components in `/Components` (capitalized)
- Pages in `/app` using App Router conventions
- Shared styles in `/Styles` as CSS modules

### Environment Variables
- Firebase client config: `NEXT_PUBLIC_REACT_APP_FIREBASE_*`
- Server-side secrets: stored in `.env.local` (not committed)
- Example file: `.env.example`

## Key Documentation Files

Reference these for detailed feature documentation:
- `PLAN_LIFECYCLE.md` — Goal planning system architecture
- `NUDGE_WORKFLOW.md` — Automated notification system
- `Functional Documentation/ENNEAGRAM_ASSESSMENT.md` — Personality assessment flow
- `Functional Documentation/GOAL_WIZARD.md` — Goal creation product docs
- `Functional Documentation/NOTIFICATIONS.md` — Notification infrastructure
- `TESTING.md` — Testing guidelines and patterns
- `ANALYTICS_SETUP.md` / `ANALYTICS_TROUBLESHOOTING.md` — PostHog integration
- `FEEDBACK_SYSTEM.md` — User feedback collection
- `GEN_Z_UX_GUIDE.md` — UX design principles for target demographic

## Pre-commit Checklist

Before committing, ensure:
1. `npm run build` succeeds
2. `npx tsc --noEmit` passes (no type errors)
3. Tests pass: `npm test`
4. Code follows established patterns in the codebase
