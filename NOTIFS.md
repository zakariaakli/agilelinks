# Notification System Architecture

## Overview

The notification system manages two types of intelligent nudges to help users stay on track with their personal development goals:

1. **Daily Personality Nudges** - Enneagram-based reflections and tips
2. **Weekly Milestone Reminders** - Goal progress check-ins with personalized guidance

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Generation    │    │     Storage      │    │    Delivery     │
│     Layer       │    │     Layer        │    │     Layer       │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • AI Content    │───▶│ • notifications  │───▶│ • Email Engine  │
│   Generation    │    │   collection     │    │ • SendGrid API  │
│ • Milestone     │    │ • companionSetts │    │ • HTML Templates│
│   Detection     │    │   collection     │    │ • Link Tracking │
│ • Scheduling    │    │ • plans collection│    │ • Delivery Logs │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### 📊 Database Collections

#### `notifications` Collection
Central storage for all generated nudges and reminders with enhanced email tracking.

```typescript
interface EnhancedNotification {
  userId: string;                    // Target user
  type: string | 'milestone_reminder'; // Content type
  prompt: string;                    // AI-generated message
  createdAt: Timestamp;             // Creation time
  read: boolean;                    // User viewed status
  feedback: string | null;          // User feedback
  
  // Milestone-specific fields
  planId?: string;                  // Associated goal plan
  milestoneId?: string;             // Specific milestone
  milestoneTitle?: string;          // Human-readable title
  blindSpotTip?: string;           // Personality blind spot warning
  strengthHook?: string;           // Leverage personality strength
  startDate?: string;              // Milestone start date
  dueDate?: string;                // Milestone due date
  
  // ✅ Enhanced tracking fields (NEW)
  emailStatus: EmailStatus;         // Email delivery tracking
  notificationMeta: NotificationMeta; // Priority and categorization
}

interface EmailStatus {
  sent: boolean;                    // Email delivery status
  sentAt?: Timestamp;              // When email was sent
  attempts: number;                // Send attempt count
  lastAttemptAt?: Timestamp;       // Last attempt timestamp
  deliveryStatus?: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'clicked';
  errorMessage?: string;           // Error details for failed sends
}

interface NotificationMeta {
  priority: 'low' | 'medium' | 'high';        // Send priority
  category: 'daily_nudge' | 'weekly_milestone' | 'urgent_milestone';
  scheduledFor?: Timestamp;        // Scheduled send time
  expiresAt?: Timestamp;          // Notification expiration
}
```

#### `companionSettings` Collection
User email preferences and opt-in status.

```typescript
interface CompanionSettings {
  userId: string;           // Document ID
  email: string;           // User email address
  emailNudgesOptIn: boolean; // Email delivery consent
}
```

#### `plans` Collection
User goals containing milestones for progress tracking.

```typescript
interface Plan {
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  status: 'active' | 'completed' | 'paused';
  milestones: Milestone[];
}
```

### 🔄 Generation Layer

#### Daily Personality Nudges
**API**: `/api/generateNudges`

1. **Scan users** with completed Enneagram assessments
2. **Extract personality data** (dominant type + summary)
3. **Generate AI content** using OpenAI Assistants API
4. **Create notification** documents in Firestore

**Key Features**:
- Personality-driven content generation
- Enneagram type-specific messaging
- Simple notification structure

#### Weekly Milestone Reminders
**API**: `/api/weeklyMilestoneReminders`

1. **Scan active plans** for current milestones
2. **Detect current milestones** (`startDate ≤ today ≤ dueDate` & `!completed`)
3. **Generate progress-aware content** with timeline context
4. **Include personality tips** (blind spots + strengths)
5. **Prevent duplicates** with 7-day lookback

**Key Features**:
- Smart milestone detection
- Progress-aware messaging
- Personality-enhanced guidance
- Duplicate prevention
- Rich content structure

### 📧 Delivery Layer

#### Email Sending Engine
**Function**: `sendDailyNudges()` in `/lib/sendNudge.ts`

**Enhanced Process Flow** (✅ Updated):
1. **Scan companionSettings** for opted-in users
2. **Fetch unsent notifications** using `getUnsentNotifications()`
3. **Prioritize notifications** by importance (urgent > weekly > daily)
4. **Send highest priority notification** only
5. **Generate HTML email** based on notification type
6. **Send via SendGrid** API with error handling
7. **Mark notification status** (sent/failed) with `markNotificationAsSent()`
8. **Log delivery details** with timestamps and error tracking

#### Email Templates

**Personality Nudges**:
```html
✨ Today's Reflection for [Enneagram Type]
[AI-generated prompt]
[CTA: View Your Daily Tip]
```

**Milestone Reminders**:
```html
🎯 Milestone Check-in: [Milestone Title]
[AI-generated progress message]

⚠️ Blind Spot Alert: [Personality warning]
💪 Leverage Your Strength: [Personality advantage]

[CTA: View Full Reminder]
```

## 🔧 Core Features

### 1. AI-Powered Content Generation

**Technology**: OpenAI Assistants API
**Models**: GPT-4 via Assistant endpoints

**Personality Nudges** (`/lib/generateNudgeFromAI.ts`):
- Uses user's Enneagram summary
- Generates 1-2 sentence daily reflections
- Personality-specific tone and advice

**Milestone Nudges** (`/lib/generateMilestoneNudgeFromAI.ts`):
- Progress timeline awareness
- Goal context integration
- Blind spot & strength incorporation
- Action-oriented weekly guidance

### 2. Smart Scheduling & Detection

**Daily Nudges**: Manual/cron triggered
**Milestone Reminders**: Weekly scan with intelligent detection

**Current Milestone Logic**:
```typescript
const isCurrentMilestone = startDate <= today && today <= dueDate && !completed;
```

**Duplicate Prevention** (✅ All notification types):
```typescript
// Enhanced email tracking prevents duplicates
const unsentNotifications = await getUnsentNotifications(userId);
// Only notifications with emailStatus.sent === false are returned

// Legacy milestone-specific check (7 days)
const existingReminders = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  where('milestoneId', '==', milestoneId),
  where('createdAt', '>=', lastWeek)
);
```

### 3. User Engagement Tracking

**Web Interface**: `/app/nudge/[id]/page.tsx`
- Automatic read marking
- User feedback collection
- Rich milestone display
- Personality tip highlighting

**Feedback System**:
- Predefined options: "I like this nudge", "You can do better", "I don't relate"
- Optional text feedback
- Stored in notification document

### 4. Email Delivery Management

**SendGrid Integration**: Professional email delivery
**Opt-in System**: `companionSettings.emailNudgesOptIn`
**Template System**: Dynamic HTML based on notification type

## ✅ Enhanced Email Tracking System

### Key Improvements (Latest Update)
1. **✅ Duplicate Email Prevention**: Comprehensive tracking prevents multiple sends
2. **✅ Email Status Tracking**: Full delivery confirmation and failure logging
3. **✅ Smart Prioritization**: Urgent milestones > weekly reminders > daily nudges
4. **✅ Consistent Duplicate Prevention**: All notification types protected
5. **✅ Enhanced Error Handling**: Failed sends logged with retry capability

### Remaining Opportunities
- Click-through analytics integration
- Unsubscribe management interface
- A/B testing capabilities
- Smart send time optimization based on user activity
- Advanced engagement scoring

## 🛠️ Development Commands

**Test Milestone Reminder**:
```bash
POST /api/testMilestoneReminder
{
  "userId": "test-user-id"
}
```

**Manual Nudge Generation**:
```bash
GET /api/generateNudges
```

**Manual Milestone Reminder Generation**:
```bash
GET /api/weeklyMilestoneReminders
```

**Send Pending Emails**:
```bash
GET /api/sendDailyNudges
```

## ⏰ Automated Scheduling (Production)

The notification system runs automatically on Vercel using cron jobs:

### Daily Personality Nudges
- **Generation**: Every day at **3:00 AM Paris time** (`/api/generateNudges`)
- **Delivery**: Every day at **4:00 AM Paris time** (`/api/sendDailyNudges`)

### Weekly Milestone Reminders  
- **Generation**: Every Monday at **3:00 AM Paris time** (`/api/weeklyMilestoneReminders`)
- **Delivery**: Same day at **4:00 AM Paris time** (via `/api/sendDailyNudges`)

### Execution Flow
```
3:00 AM Paris (Mon-Sun) → Generate daily personality nudges
3:00 AM Paris (Monday)  → Generate weekly milestone reminders  
4:00 AM Paris (Mon-Sun) → Send all unsent notifications
```

### Vercel Cron Configuration
```json
{
  "crons": [
    {
      "path": "/api/generateNudges",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/weeklyMilestoneReminders", 
      "schedule": "0 2 * * 1"
    },
    {
      "path": "/api/sendDailyNudges",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Smart Email Delivery
- **Priority System**: Urgent milestones > weekly milestones > daily nudges
- **Duplicate Prevention**: Email status tracking prevents multiple sends
- **User Targeting**: Only users with `emailNudgesOptIn: true` receive emails
- **Content Matching**: Users receive milestone reminders only if they have active goals

## 📁 Key Files

### API Endpoints
- `/app/api/generateNudges/route.ts` - Daily nudge generation
- `/app/api/weeklyMilestoneReminders/route.ts` - Milestone reminder generation  
- `/app/api/sendDailyNudges/route.ts` - Email delivery trigger
- `/app/api/testMilestoneReminder/route.ts` - Testing utility

### Core Libraries
- `/lib/sendNudge.ts` - Enhanced email sending with duplicate prevention
- `/lib/notificationTracking.ts` - ✅ **NEW**: Email status tracking and prioritization
- `/lib/generateNudgeFromAI.ts` - Personality nudge AI generation
- `/lib/generateMilestoneNudgeFromAI.ts` - Milestone nudge AI generation
- `/lib/milestoneScheduler.ts` - Scheduling utilities

### UI Components
- `/app/nudge/[id]/page.tsx` - Notification display page
- `/Components/FeedbackForm.tsx` - User feedback interface

## 🔮 Future Enhancements

1. **✅ Enhanced Email Tracking**: ~~Delivery status~~ ✅ **COMPLETED** - open rates, click tracking remaining
2. **Smart Scheduling**: User timezone & preference-aware sending
3. **Advanced Analytics**: Engagement scoring and optimization
4. **A/B Testing**: Content variation testing  
5. **Unsubscribe Management**: Granular preference controls
6. **✅ Retry Logic**: ~~Failed delivery handling~~ ✅ **COMPLETED** - automatic retry capabilities remaining
7. **Batch Processing**: Efficient bulk email sending

## 📊 Enhanced Tracking Functions (NEW)

### Email Status Management
```typescript
// Get only unsent notifications for a user
const unsentNotifications = await getUnsentNotifications(userId);

// Prioritize by importance
const prioritized = prioritizeNotifications(notifications);

// Mark as sent after successful delivery
await markNotificationAsSent(notificationId);

// Log failed delivery attempts
await markNotificationSendFailed(notificationId, error);

// Get comprehensive notification statistics
const stats = await getNotificationStats(userId);
```

### Key Features
- **Smart Duplicate Prevention**: Email status tracking prevents multiple sends
- **Priority-Based Delivery**: Urgent milestones > weekly reminders > daily nudges  
- **Comprehensive Error Logging**: Failed send tracking with retry capability
- **Analytics Ready**: Full delivery and engagement statistics