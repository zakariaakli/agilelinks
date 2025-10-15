# Plan Lifecycle & Automation Documentation

## Overview

This document explains the complete lifecycle of a plan from creation to automated notifications, AI interactions, and email delivery.

---

## 🔄 Complete Plan Lifecycle

### Phase 1: Plan Creation

**Location**: `/app/profile/companion/page.tsx` (Goal Wizard)

#### 1.1 User Input Collection
1. **Goal Type Selection**: User selects goal category (consultant, manager, or custom)
2. **Goal Description**: User provides detailed goal description
3. **Target Date**: User sets the final completion deadline
4. **Time Pressure**: User indicates if accelerated timeline is needed
5. **Nudge Frequency**: User selects daily or weekly reminder preference

#### 1.2 AI-Enhanced Question Generation
**API**: `/api/openAi` route handler
**Function**: `callOpenAIAssistant()`

- System sends goal + user's Enneagram personality to OpenAI
- AI generates 3-5 personalized clarifying questions based on:
  - Goal context
  - Personality type blind spots
  - Missing critical details

**User answers clarifying questions** to provide additional context.

#### 1.3 Milestone Generation
**Function**: `generateMilestones()` in companion page

**Two Generation Methods**:

**A. Template-Based (for predefined goals)**
- Uses `goalTemplateItems` for consultant/manager goals
- Automatically calculates dates based on `defaultOffsetDays`
- Milestones are evenly distributed from target date backwards

**B. AI-Generated (for custom goals)**
**API**: `/api/openAi` route handler
**Function**: `callOpenAIMilestonesGenerator()`

Input sent to OpenAI:
```typescript
{
  goalType: string,
  goalDescription: string,
  clarifyingAnswers: string[],
  enneagramSummary: string,
  targetDate: string,
  hasTimePressure: boolean
}
```

OpenAI generates:
- 5-8 sequential milestones
- Each with title, description, dates
- Personality-specific `blindSpotTip` (warnings)
- Personality-specific `strengthHook` (leverage points)

#### 1.4 Plan Storage
**Function**: `savePlan()` in companion page
**Collection**: `plans` in Firestore

```typescript
{
  userId: string,
  goalType: string,
  goal: string,
  targetDate: string,
  hasTimePressure: boolean,
  nudgeFrequency: 'daily' | 'weekly',
  clarifyingQuestions: [...],
  milestones: [...],
  createdAt: serverTimestamp(),
  status: 'active'
}
```

**Post-Creation**:
- Plan appears immediately in user's dashboard (`/app/profile/page.tsx`)
- User earns **200 XP** for plan creation
- Plan count updated in user document

---

### Phase 2: Automated Milestone Monitoring

**Location**: `/app/api/milestoneReminders/route.ts`
**Trigger**: Automated cron job
**Schedule**: **Every day at 9:00 AM UTC** (configured in `vercel.json`)

#### 2.1 Active Plan Detection
**Function**: `processMilestoneReminders()`

1. Queries all plans with `status: 'active'`
2. For each active plan:
   - Reads plan's `nudgeFrequency` setting (daily or weekly)
   - Iterates through all milestones

#### 2.2 Current Milestone Detection
**Logic**: A milestone is "current" if:
```typescript
const today = new Date();
const startDate = new Date(milestone.startDate);
const dueDate = new Date(milestone.dueDate);

const isCurrentMilestone =
  startDate <= today &&
  today <= dueDate &&
  !milestone.completed;
```

**Milestone States**:
- **Future**: `startDate > today` - Not yet active
- **Current**: `startDate ≤ today ≤ dueDate` and not completed - **Triggers notifications**
- **Completed**: `milestone.completed === true` - Skipped
- **Overdue**: `dueDate < today` and not completed - Still sends reminders

#### 2.3 Duplicate Prevention
Before creating a reminder, system checks for existing notifications:

**Lookback Period**:
- **Daily nudges**: Checks last 1 day
- **Weekly nudges**: Checks last 7 days

```typescript
const lookbackDays = nudgeFrequency === 'daily' ? 1 : 7;
const existingReminders = query(
  notifications,
  where('userId', '==', userId),
  where('milestoneId', '==', milestoneId),
  where('createdAt', '>=', lastNDays)
);

if (existingReminders.empty) {
  // Create new reminder
}
```

---

### Phase 3: AI Nudge Generation

**Location**: `/app/api/milestoneReminders/route.ts` - `processAIInBackground()`
**AI Function**: `/lib/generateMilestoneNudgeFromAI.ts`

#### 3.1 Background Processing Architecture
**Problem Solved**: Vercel has 10-second timeout for serverless functions
**Solution**: Async background processing

**Flow**:
1. Main endpoint returns immediately (< 1 second)
2. AI processing continues in background (10-30 seconds)
3. Notification created only after AI completes
4. User sees final AI-generated content (no placeholders)

#### 3.2 AI Prompt Construction
**Function**: `generateMilestoneNudgeFromAI()`

**Input Data Sent to OpenAI**:
```typescript
{
  milestone: {
    title: string,
    description: string,
    startDate: string,
    dueDate: string,
    blindSpotTip?: string,
    strengthHook?: string
  },
  goalContext: string,           // Full goal description
  enneagramType: string,         // User's personality type
  daysInProgress: number,        // Days since milestone started
  daysRemaining: number          // Days until due date
}
```

**AI Task**:
- Generate 2-3 sentence personalized nudge
- Reference current progress timeline
- Incorporate personality-specific guidance
- Provide actionable next steps
- Maintain encouraging, motivational tone

#### 3.3 Fallback System
If AI fails (API error, timeout, etc.):

**Function**: `generateFallbackNudge()`

Creates structured message:
```
Week X of your "[Milestone Title]" milestone!
[Random encouragement]
You have Y days remaining to achieve this goal.

Keep in mind: [blindSpotTip if available]
Leverage your strength: [strengthHook if available]

What's one key action you can take this week to move closer to completion?
```

#### 3.4 Notification Creation
**Collection**: `notifications` in Firestore

```typescript
{
  userId: string,
  type: 'milestone_reminder',
  prompt: string,              // AI-generated message
  createdAt: Timestamp,
  read: false,
  feedback: null,

  // Milestone-specific fields
  planId: string,
  milestoneId: string,
  milestoneTitle: string,
  blindSpotTip: string | null,
  strengthHook: string | null,
  startDate: string,
  dueDate: string,

  // Email tracking
  emailStatus: {
    sent: false,
    sentAt: null,
    attempts: 0,
    lastAttemptAt: null,
    deliveryStatus: 'pending'
  },

  // Notification metadata
  notificationMeta: {
    priority: 'medium',
    category: 'weekly_milestone',
    scheduledFor: Timestamp
  }
}
```

---

### Phase 4: Email Notification Delivery

**Location**: `/lib/sendMilestoneEmail.ts`
**Trigger**: Immediately after notification creation in background process

#### 4.1 Email Eligibility Check
**Function**: `sendMilestoneEmail()`

**Requirements**:
1. User has `companionSettings` document
2. `companionSettings.emailNudgesOptIn === true`
3. User has valid email address
4. Notification has not been sent before (`emailStatus.sent === false`)

#### 4.2 Email Content Generation
**Template**: HTML email with SendGrid

**Structure**:
```html
Subject: 🎯 Milestone Check-in: [Milestone Title]

Body:
- Personalized greeting
- AI-generated nudge message
- Milestone progress context
- Blind Spot Alert (if available)
- Strength Leverage Tip (if available)
- Call-to-action button linking to notification page
```

**CTA Link**: `https://yourdomain.com/nudge/[notificationId]`

#### 4.3 SendGrid API Call
**Service**: SendGrid Email API
**Configuration**:
- From: `noreply@yourdomain.com`
- Reply-To: User's support email
- Template: Dynamic HTML template
- Tracking: Click and open tracking enabled

#### 4.4 Delivery Status Tracking
**Function**: `markNotificationAsSent()` or `markNotificationSendFailed()`

**Success Path**:
```typescript
emailStatus: {
  sent: true,
  sentAt: Timestamp.now(),
  attempts: 1,
  lastAttemptAt: Timestamp.now(),
  deliveryStatus: 'sent'
}
```

**Failure Path**:
```typescript
emailStatus: {
  sent: false,
  attempts: attempts + 1,
  lastAttemptAt: Timestamp.now(),
  deliveryStatus: 'failed',
  errorMessage: error.message
}
```

---

### Phase 5: User Interaction

**Location**: `/app/nudge/[id]/page.tsx`

#### 5.1 Notification Access Methods
1. **Email Link**: User clicks CTA button in email
2. **Dashboard**: GameNudgeSlider in milestone cards
3. **Direct URL**: `/nudge/[notificationId]`

#### 5.2 Auto-Read Marking
When user opens notification page:
```typescript
useEffect(() => {
  updateDoc(notificationRef, { read: true });
}, []);
```

#### 5.3 Feedback Collection
**Component**: `FeedbackForm.tsx`

**Options**:
- 👍 "I like this nudge"
- 🤔 "You can do better"
- 🤷 "I don't relate"
- 💬 Optional text feedback

**XP Rewards**:
- Feedback submission: **25 XP**
- Consecutive responses: **+10 XP per day streak**

#### 5.4 Engagement Tracking
**Updates**:
```typescript
{
  feedback: userFeedback,
  read: true,
  respondedAt: Timestamp.now()
}
```

**Analytics Use**:
- Nudge quality scoring
- Personality type effectiveness analysis
- User engagement patterns

---

## 🗓️ Automated Schedule Summary

### Vercel Cron Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/milestoneReminders",
      "schedule": "0 9 * * *"  // 9:00 AM UTC daily
    }
  ]
}
```

**Cron Schedule**: `0 9 * * *`
- **Frequency**: Every day
- **Time**: 9:00 AM UTC
- **Timezone**: Coordinated Universal Time

**User Experience**:
- **Daily frequency users**: Receive reminder every day at 9 AM UTC
- **Weekly frequency users**: Receive reminder once per week (when no reminder exists in last 7 days)

### Processing Timeline

```
9:00 AM UTC - Cron triggers /api/milestoneReminders
  ↓
9:00:01 AM - Scan all active plans
  ↓
9:00:02 AM - Identify current milestones
  ↓
9:00:03 AM - Check duplicate prevention
  ↓
9:00:04 AM - Queue AI generation tasks
  ↓
9:00:05 AM - API returns success response
  ↓
9:00:06-35 AM - Background AI processing (10-30 seconds per reminder)
  ↓
9:00:36 AM - Notification created in Firestore
  ↓
9:00:37 AM - Email sent via SendGrid
  ↓
9:00:38 AM - Email status updated
  ↓
User receives email within 1 minute of notification creation
```

---

## 🔥 Key Features & Optimizations

### 1. Intelligent Scheduling
- **Frequency Preference**: Users choose daily or weekly reminders
- **Duplicate Prevention**: Automatic lookback checks prevent spam
- **Current Milestone Detection**: Only active milestones trigger reminders

### 2. Personality-Driven Content
- **Blind Spot Tips**: Warnings about personality-based challenges
- **Strength Hooks**: Leverage points for personality advantages
- **AI Personalization**: Nudges tailored to Enneagram type

### 3. Robust Error Handling
- **AI Fallback**: Template-based messages if AI fails
- **Email Retry**: Failed sends tracked for manual retry
- **Background Processing**: Avoids timeout errors

### 4. Cost Tracking
- **OpenAI Usage**: Token consumption per AI generation
- **Firebase Operations**: Read/write tracking for billing
- **User Attribution**: Costs tracked per user for analytics

### 5. User Engagement
- **XP Rewards**: Gamification for feedback responses
- **Streak Tracking**: Consecutive response bonuses
- **Interactive UI**: Swipe-able notification slider

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN CREATION PHASE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Input → AI Questions → Answers → AI Milestones        │
│                                ↓                             │
│                         Firestore: plans                     │
│                                ↓                             │
│                         Dashboard Display                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 AUTOMATED MONITORING PHASE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Vercel Cron (9 AM UTC) → /api/milestoneReminders           │
│                                ↓                             │
│  Query Active Plans → Find Current Milestones               │
│                                ↓                             │
│  Check Duplicate Prevention → Need Reminder?                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI GENERATION PHASE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Queue Background Task → OpenAI API Call                    │
│                                ↓                             │
│  Generate Personalized Nudge (10-30s)                       │
│                                ↓                             │
│  Create Notification in Firestore                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  EMAIL DELIVERY PHASE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Check Email Opt-In → Generate HTML Template                │
│                                ↓                             │
│  SendGrid API → Send Email → Track Status                   │
│                                ↓                             │
│  Update emailStatus in Firestore                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  USER INTERACTION PHASE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Opens Email → Clicks CTA → /nudge/[id]               │
│                                ↓                             │
│  Auto-Mark as Read → Display Content                        │
│                                ↓                             │
│  User Provides Feedback → Earn 25 XP                        │
│                                ↓                             │
│  Update Notification → Track Engagement                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Key Files Reference

### Plan Creation
- `/app/profile/companion/page.tsx` - Goal wizard UI
- `/app/api/openAi/route.ts` - AI question & milestone generation

### Automated Monitoring
- `/app/api/milestoneReminders/route.ts` - Main cron processor
- `/vercel.json` - Cron schedule configuration

### AI Generation
- `/lib/generateMilestoneNudgeFromAI.ts` - AI nudge creation
- `/lib/firebaseTracker.ts` - Cost tracking utilities

### Email Delivery
- `/lib/sendMilestoneEmail.ts` - Email sending logic
- `/lib/notificationTracking.ts` - Status management

### User Interaction
- `/app/nudge/[id]/page.tsx` - Notification display page
- `/Components/GameNudgeSlider.tsx` - Interactive slider UI
- `/Components/FeedbackForm.tsx` - Feedback collection

### Database Collections
- `plans` - User goal plans with milestones
- `notifications` - AI-generated nudges and reminders
- `companionSettings` - Email preferences and opt-ins
- `users` - User profiles with Enneagram results

---

## 🚀 Future Enhancements

### Planned Features
1. **Smart Send Time Optimization**: Send emails based on user timezone and engagement patterns
2. **A/B Testing**: Test different nudge formats and measure effectiveness
3. **Retry Logic**: Automatic retry for failed email deliveries
4. **Advanced Analytics**: Engagement scoring and success prediction
5. **Multi-Channel Delivery**: SMS and push notifications alongside email
6. **Dynamic Frequency**: AI-adjusted reminder frequency based on user engagement
7. **Milestone Auto-Completion**: Detect completion signals and auto-mark milestones

### Technical Improvements
1. **Batch Processing**: Process multiple users in parallel for faster execution
2. **Queue System**: Use job queue for better background task management
3. **Rate Limiting**: Prevent API abuse with intelligent rate limits
4. **Caching Layer**: Cache user data to reduce Firebase reads
5. **Monitoring Dashboard**: Real-time visibility into cron job execution
6. **Error Alerting**: Automatic notifications for system failures

---

## ✅ Summary

**Plan Lifecycle in 5 Steps**:

1. **Creation**: User creates plan with AI-generated milestones → Stored in Firestore
2. **Monitoring**: Daily cron job scans for current milestones → Detects reminder needs
3. **Generation**: Background AI creates personalized nudges → Saves to notifications
4. **Delivery**: Email sent via SendGrid → Status tracked in Firestore
5. **Interaction**: User opens, reads, provides feedback → Earns XP and engagement data

**Key Automation**:
- **Runs**: Every day at 9:00 AM UTC
- **Triggers**: Automatic for current milestones only
- **Frequency**: Daily or weekly based on user preference
- **Prevention**: Duplicate checking with lookback periods
- **Delivery**: Immediate email after AI generation completes

This system ensures users receive timely, personalized, and actionable reminders to stay on track with their goals while maintaining cost efficiency and system reliability.
