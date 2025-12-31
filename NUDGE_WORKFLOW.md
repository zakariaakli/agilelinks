# Nudge Workflow - Product Documentation

## Overview

This document explains how our intelligent notification system works, covering the complete journey from notification generation to user delivery.

## What Are Nudges?

Nudges are AI-powered, personalized notifications that help users stay engaged with their personal development goals.

**Milestone Reminders** - Progress check-ins for active goal milestones, personalized using Enneagram personality insights, feedback history, and progress tracking. Users can choose to receive reminders **daily** or **weekly** based on their preference.

---

## The Complete Workflow

### Timeline: Daily at 7:00 AM UTC

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  7:00 AM UTC - GitHub Actions Workflow Starts                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Find Users Who Need Reminders (< 10 seconds)              │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  What happens:                                                      │
│  • Scan all active goal plans in the system                        │
│  • Find milestones where today's date is between start & due date  │
│  • Check if user already received a reminder this week             │
│  • Create "pending" notification records (no content yet)          │
│                                                                     │
│  What the user sees:                                                │
│  • Nothing yet - this happens in the background                    │
│                                                                     │
│  Example:                                                           │
│  User Sarah has an active goal "Get promoted to Senior PM"         │
│  with a milestone "Complete stakeholder interviews"                │
│  (Start: Dec 20, Due: Jan 5)                                       │
│  → System creates a pending notification for Sarah                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Generate Personalized Content (30-60 sec per user)        │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  For each pending notification, we gather context:                 │
│                                                                     │
│  📊 User's Personality (Enneagram)                                  │
│     • What type are they? (Type 3, Type 9, etc.)                   │
│     • What are their strengths and blind spots?                    │
│                                                                     │
│  📈 Milestone Progress                                              │
│     • How many days into the milestone are they?                   │
│     • How many days remaining?                                      │
│     • What's the milestone goal?                                    │
│                                                                     │
│  💬 Past Feedback                                                   │
│     • What did user say about previous nudges for this milestone?  │
│     • "Too generic" → AI makes it more specific                    │
│     • "Perfect!" → AI maintains that style                         │
│                                                                     │
│  🎯 Type-Specific Advice                                            │
│     • Milestone tips tailored to their Enneagram type              │
│     • e.g., Type 3s get advice on avoiding burnout                 │
│                                                                     │
│  Then we generate personalized content using AI:                   │
│  • OpenAI Assistant creates custom message (2-3 sentences)         │
│  • Includes personality-aware encouragement                        │
│  • Adds actionable weekly question                                 │
│  • If AI fails → fallback to smart template                        │
│                                                                     │
│  Example output for Sarah (Type 3 - The Achiever):                 │
│  "Week 2 of your stakeholder interviews! As a Type 3, remember     │
│   that genuine connection matters more than efficient completion.  │
│   You've got 10 days left - which stakeholder conversation could   │
│   reveal the most valuable insights this week?"                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Send Email Notification (if opted in)                     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Check user preferences:                                            │
│  • Is email notifications enabled?                                 │
│  • Do we have their email address?                                 │
│  • Are they opted in to milestone reminders?                       │
│                                                                     │
│  If yes → Send beautiful HTML email via Resend API                 │
│                                                                     │
│  Email contains:                                                    │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Subject: 🎯 Your Milestone Check-in: [Title]       │           │
│  │                                                     │           │
│  │ Hi Sarah,                                           │           │
│  │                                                     │           │
│  │ [AI-generated personalized message]                │           │
│  │                                                     │           │
│  │ ⚠️ Blind Spot Alert:                               │           │
│  │ Type 3s may rush through conversations to          │           │
│  │ check them off the list. Slow down.                │           │
│  │                                                     │           │
│  │ 💪 Leverage Your Strength:                         │           │
│  │ Your natural charisma helps people open up         │           │
│  │ quickly. Use it!                                    │           │
│  │                                                     │           │
│  │ [View Full Reminder Button]                        │           │
│  │                                                     │           │
│  │ Progress: Day 12 of 17                             │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  Track delivery:                                                    │
│  • Mark notification as "sent" with timestamp                      │
│  • Log any delivery failures for troubleshooting                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: User Engages with Notification                            │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  User receives email and clicks "View Full Reminder"               │
│  → Opens web page at /nudge/[notification-id]                      │
│                                                                     │
│  On the page, they see:                                             │
│  • Full personalized message                                        │
│  • Milestone timeline visualization                                │
│  • Blind spot tip (personality-specific warning)                   │
│  • Strength hook (personality-specific advantage)                  │
│  • Feedback options to rate the nudge                              │
│                                                                     │
│  User provides feedback:                                            │
│  • "I like this nudge" ✅                                          │
│  • "You can do better" ⚠️                                          │
│  • "I don't relate" ❌                                             │
│  • Optional text feedback                                           │
│                                                                     │
│  This feedback is saved and used to improve next week's nudge!     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Product Features

### 1. Smart Duplicate Prevention

**Problem**: Users shouldn't get spammed with multiple reminders for the same milestone.

**Solution**:

- System respects user's frequency preference (daily or weekly)
- Daily frequency: checks last 1 day for duplicates
- Weekly frequency: checks last 7 days for duplicates
- Only sends one reminder per configured period per milestone
- Exception: Test users can receive more frequent reminders for QA purposes

### 2. Continuous Learning from Feedback

**Problem**: Generic reminders feel impersonal and get ignored.

**Solution**:

- Every time user provides feedback, it's stored with the notification
- Next time AI generates a nudge for that milestone, it reads ALL previous feedback
- AI adapts: "User said last nudge was too vague → make this one more specific"
- Result: Nudges get better over time for each individual user

### 3. Personality-Aware Messaging

**Problem**: One-size-fits-all motivation doesn't work for everyone.

**Solution**:

- System knows user's Enneagram personality type
- Each type gets different advice:
  - **Type 3 (Achiever)**: "Don't sacrifice quality for speed"
  - **Type 9 (Peacemaker)**: "Your opinion matters - speak up in meetings"
  - **Type 1 (Perfectionist)**: "Done is better than perfect this week"
- Includes blind spot warnings specific to their type
- Highlights strengths they can leverage

### 4. Progress-Aware Content

**Problem**: Week 1 of a milestone needs different messaging than week 4.

**Solution**:

- System calculates exact progress: days elapsed vs. total days
- AI adjusts tone based on timeline:
  - Early in milestone: "You're building momentum!"
  - Middle of milestone: "You're halfway there - what's working?"
  - Near deadline: "Final push - what's the most critical task?"

### 5. Graceful AI Fallback

**Problem**: AI services can fail or timeout.

**Solution**:

- If OpenAI Assistant fails to generate content within 30 seconds
- System automatically falls back to a smart template
- Template still includes personality tips, progress info, and milestone details
- User still gets a valuable reminder, just less personalized

---

## User Journey Example

### Meet Alex - Type 6 (The Loyalist)

**Alex's Goal**: "Launch my side business"
**Current Milestone**: "Create product landing page" (Jan 1 - Jan 14)
**Today**: January 8 (Day 8 of 14)

#### 7:00 AM UTC - System detects Alex needs a reminder

- Last reminder was January 1 (7 days ago) ✅
- Milestone is active (not completed) ✅
- Today is between start and due date ✅
- Creates pending notification for Alex

#### 7:05 AM UTC - AI generates Alex's personalized nudge

System gathers:

- Alex's Enneagram Type 6 profile
- Previous feedback: "Last week's nudge helped me overcome analysis paralysis"
- Progress: 8 days in, 6 days remaining
- Blind spot for Type 6: Overthinking and seeking too many opinions

AI generates:

> "Week 2 of building your landing page! As a Type 6, you mentioned last week's nudge helped you move past analysis paralysis - that's huge progress. You're 8 days in with 6 remaining. What's one design decision you can make today without seeking more feedback?"

#### 7:10 AM UTC - Email sent

Alex receives email with:

- Personalized message above
- **Blind Spot Alert**: "Type 6s often seek too much validation before launching. Trust your judgment."
- **Strength Hook**: "Your attention to detail ensures quality - but remember, version 1.0 doesn't need to be perfect."
- Link to view full reminder

#### 9:30 AM - Alex engages

- Opens email during morning coffee
- Clicks "View Full Reminder"
- Reads personalized message
- Sees progress: "Day 8 of 14"
- Provides feedback: "I like this nudge ✅ - The reminder to stop seeking feedback was exactly what I needed"

#### Next Week (January 15)

- System will use Alex's positive feedback
- AI will maintain the "direct decision-making encouragement" style
- Alex gets progressively better nudges tailored to their journey

---

## Opt-In & Privacy

### User Control

Users can control notifications via settings:

- **Email Notifications Toggle**: On/Off
- **Milestone Reminders**: Can disable just these
- **Email Address**: Can update or remove

## Success Metrics (Currently Tracked)

Basic notification statistics are tracked in the system:

### Available Metrics

- **Total Notifications**: Count of all milestone reminders created
- **Delivery Success Rate**: % of emails successfully sent vs. failed
  - Tracked via `emailStatus.sent` and `emailStatus.deliveryStatus`
- **Notification Views**: Count of users who viewed the notification
  - Tracked via `read` field
- **Feedback Collection**: Count of users who provided feedback
  - Tracked via `feedback` field (text responses stored)

### How to Access

Query the `getNotificationStats()` function in [lib/notificationTracking.ts](lib/notificationTracking.ts) to retrieve:

```typescript
{
  total: number,              // Total notifications
  sent: number,               // Successfully delivered
  pending: number,            // Awaiting delivery
  failed: number,             // Failed deliveries
  milestone_reminders: number, // All are milestone reminders
  read: number,               // Viewed by users
  feedback_given: number      // Users who provided feedback
}
```

### Metrics Not Yet Implemented

The following metrics are planned but not yet implemented:

- **Email Open Rate** - Requires Resend webhook integration
- **Click-Through Rate** - Infrastructure exists (`clicked` status) but not tracked
- **Positive vs. Negative Feedback** - Feedback is stored but not categorized
- **Improvement Over Time** - No time-series analysis
- **AI Success Rate** - Not tracking AI vs. fallback usage
- **Goal Completion Correlation** - Milestone completion not linked to nudge effectiveness
- **Engagement Retention** - No user activity timeline tracking

---

## Troubleshooting Common Issues

### "I didn't receive my reminder"

**Possible causes**:

1. Email notifications disabled in settings
2. Already received reminder this week (7-day coolback)
3. No active milestones during the date range
4. Email delivery failure (check spam folder)

**How to verify**:

- Check companionSettings collection for `emailNudgesOptIn`
- Query notifications collection for recent entries
- Check GitHub Actions logs for delivery status

### "The reminder doesn't feel personalized"

**Possible causes**:

1. User hasn't completed Enneagram assessment
2. No previous feedback to learn from (first reminder)
3. AI generation failed and fallback template used

**How to verify**:

- Check if user has enneagramResult in Firestore
- Query notification history for feedback entries
- Check GitHub Actions logs for AI generation errors

### "I'm getting too many reminders"

**Possible causes**:

1. User is a test user (bypasses frequency limits)
2. Multiple active milestones in same date range
3. Bug in duplicate detection logic

**How to verify**:

- Check if userId in test user list (route.ts)
- Count active milestones overlapping with today
- Query notifications for duplicate entries

---

## Future Enhancements

### Near-Term (Next Quarter)

1. **Smart Send Time**: Send at user's optimal engagement time (not fixed 7 AM UTC)
2. **A/B Testing**: Test different message styles to find what resonates
3. **Click Tracking**: See which users engage with email links
4. **Unsubscribe Flow**: Granular control (disable milestone reminders but keep personality nudges)

### Medium-Term (6-12 Months)

1. **Push Notifications**: Mobile app notifications in addition to email
2. **SMS Option**: Text reminders for users who prefer them
3. **Slack Integration**: Send reminders directly in Slack
4. **Advanced Analytics Dashboard**: See engagement patterns per user type

### Long-Term (12+ Months)

1. **Predictive Nudging**: AI predicts when user needs motivation most
2. **Community Features**: "3 other Type 6s completed this milestone this week"
3. **Voice Nudges**: Audio reminders in user's preferred voice
4. **Multi-Language Support**: Nudges in user's native language

---

## Appendix: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DATA                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Enneagram    │  │ Active Plans │  │ Past Feedback│          │
│  │ Profile      │  │ & Milestones │  │ History      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────┬──────────────┬────────────────┬───────────────────┘
             │              │                │
             └──────────────┴────────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │   AI PERSONALIZATION ENGINE │
             │   (OpenAI Assistant)        │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   PERSONALIZED NUDGE        │
             │   • Custom message          │
             │   • Personality tips        │
             │   • Progress context        │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   EMAIL DELIVERY            │
             │   (Resend API)              │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   USER INBOX                │
             │   📧 New Reminder           │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   WEB APP                   │
             │   /nudge/[id]               │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   USER FEEDBACK             │
             │   Saved for next cycle      │
             └─────────────────────────────┘
```

---
