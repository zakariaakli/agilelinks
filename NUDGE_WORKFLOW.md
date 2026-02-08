# Nudge Workflow - Product Documentation

## Overview

This document explains how our intelligent notification system works, covering the complete journey from notification generation to user delivery.

## What Are Nudges?

Nudges are AI-powered, personalized notifications that help users stay engaged with their personal development goals.

**Milestone Reminders** - Progress check-ins for active goal milestones, personalized using Enneagram personality insights, feedback history, and progress tracking. Users can choose their preferred schedule: **daily**, **weekly**, or **custom days** (e.g., Sunday and Wednesday).

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
│  • Check if today matches user's nudge schedule (nudgeDays)        │
│  • Check if user already received a reminder in last 24 hours      │
│  • Create "pending" notification records (no content yet)          │
│                                                                     │
│  What the user sees:                                                │
│  • Nothing yet - this happens in the background                    │
│                                                                     │
│  Example:                                                           │
│  User Sarah has an active goal "Get promoted to Senior PM"         │
│  with a milestone "Complete stakeholder interviews"                │
│  (Start: Dec 20, Due: Jan 5)                                       │
│  Her nudge schedule: Sunday + Wednesday                            │
│  Today is Wednesday → System creates a pending notification        │
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
│     • Core motivation (what drives them)                           │
│     • Key strengths (natural abilities)                            │
│     • Growth areas (improvement opportunities)                     │
│     • Blind spots (unconscious patterns)                           │
│                                                                     │
│  📈 Milestone Progress                                              │
│     • How many days into the milestone are they?                   │
│     • How many days remaining?                                      │
│     • What's the milestone goal?                                    │
│                                                                     │
│  💬 Past Feedback & Reflections                                     │
│     • Previous nudge feedback for this milestone                   │
│     • AI coaching chat summaries from past reflections             │
│     • Used to personalize future nudges                            │
│                                                                     │
│  🎯 Type-Specific Advice                                            │
│     • Milestone tips tailored to their personality                 │
│     • Blind spot warnings and strength hooks                       │
│                                                                     │
│  Then we generate personalized content using AI:                   │
│  • OpenAI Assistant creates custom message (2-3 sentences)         │
│  • Includes personality-aware encouragement (without type labels)  │
│  • Adds actionable weekly question                                 │
│  • If AI fails → fallback to smart template                        │
│                                                                     │
│  Example output for Sarah:                                         │
│  "Week 2 of your stakeholder interviews! Remember that genuine     │
│   connection matters more than efficient completion. You've got    │
│   10 days left - which stakeholder conversation could reveal the   │
│   most valuable insights this week?"                               │
│                                                                     │
│  Note: AI never mentions Enneagram type numbers explicitly.        │
│  Instead, it reflects patterns naturally.                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Send Notifications (Email + Push)                         │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📧 EMAIL (if opted in via Resend API)                              │
│                                                                     │
│  Check user preferences:                                            │
│  • Is email notifications enabled?                                 │
│  • Do we have their email address?                                 │
│  • Are they opted in to milestone reminders?                       │
│                                                                     │
│  If yes → Send HTML email containing:                              │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Subject: 🎯 Your Milestone Check-in: [Title]       │           │
│  │                                                     │           │
│  │ Hi Sarah,                                           │           │
│  │                                                     │           │
│  │ [AI-generated personalized message]                │           │
│  │                                                     │           │
│  │ ⚠️ Blind Spot Alert:                               │           │
│  │ You may rush through conversations to check        │           │
│  │ them off the list. Slow down.                      │           │
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
│  🔔 PUSH NOTIFICATION (if subscribed via Web Push)                  │
│                                                                     │
│  • Title: "🎯 Complete stakeholder interviews"                     │
│  • Body: First 100 characters of nudge message                     │
│  • Click opens nudge page in app                                   │
│  • Auto-deactivates expired subscriptions                          │
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
│  User receives email/push and clicks to open                       │
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
│  🤖 AI REFLECTION CHATBOT (Optional)                                │
│                                                                     │
│  User can open an AI coaching chat to reflect deeper:              │
│  • Multi-turn conversation about the nudge                         │
│  • AI asks context-aware questions using personality insights      │
│  • Reflects patterns naturally without mentioning type numbers     │
│  • At end, generates a summary of key insights                     │
│  • Summary is saved and used to improve future nudges!             │
│                                                                     │
│  This creates a continuous learning loop.                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Product Features

### 1. Flexible Scheduling

**Problem**: Users have different preferences for when they receive reminders.

**Solution**:

| Frequency | Description | Example |
|-----------|-------------|---------|
| Daily | Every day | All 7 days |
| Weekly | Once per week | Monday only |
| Custom | User picks specific days | Sunday + Wednesday (default) |

- Users configure their preferred nudge days
- System checks if today matches their schedule
- Only sends on configured days
- Prevents notification fatigue

### 2. Smart Duplicate Prevention

**Problem**: Users shouldn't get spammed with multiple reminders for the same milestone.

**Solution**:

- System checks for existing reminders within last 24 hours
- Only sends one reminder per day per milestone
- Works with any frequency setting
- Exception: Test users can receive more frequent reminders for QA purposes

### 3. Continuous Learning from Feedback

**Problem**: Generic reminders feel impersonal and get ignored.

**Solution**:

- Every time user provides feedback, it's stored with the notification
- AI reflection chat summaries are saved for future reference
- Next time AI generates a nudge, it reads ALL previous feedback and reflections
- AI adapts: "User's last reflection focused on time management → address that"
- Result: Nudges get better over time for each individual user

### 4. Personality-Aware Messaging

**Problem**: One-size-fits-all motivation doesn't work for everyone.

**Solution**:

- System knows user's Enneagram personality profile:
  - **Core motivation**: What drives them psychologically
  - **Key strengths**: Natural abilities to leverage
  - **Growth areas**: Opportunities for improvement
  - **Blind spots**: Unconscious patterns to watch for
- AI crafts messages that resonate with their personality
- Never mentions type numbers explicitly (e.g., "Type 3")
- Instead, reflects patterns naturally (e.g., "You seem to value efficiency...")
- Includes blind spot warnings and strength hooks

### 5. Progress-Aware Content

**Problem**: Week 1 of a milestone needs different messaging than week 4.

**Solution**:

- System calculates exact progress: days elapsed vs. total days
- AI adjusts tone based on timeline:
  - Early in milestone: "You're building momentum!"
  - Middle of milestone: "You're halfway there - what's working?"
  - Near deadline: "Final push - what's the most critical task?"

### 6. AI Reflection Coaching

**Problem**: Quick feedback doesn't capture deeper insights.

**Solution**:

- Optional AI coaching chatbot on each nudge page
- Multi-turn conversation to explore the nudge topic
- AI uses personality context for relevant questions
- Generates summary at the end
- Summary feeds into next nudge's generation context

### 7. Multi-Channel Delivery

**Problem**: Users have different notification preferences.

**Solution**:

- **Email**: Rich HTML with full content, blind spots, strengths
- **Push Notifications**: Quick alerts via Web Push API
- Both link to the same nudge page
- Users can opt in/out of each channel independently

### 8. Graceful AI Fallback

**Problem**: AI services can fail or timeout.

**Solution**:

- If OpenAI Assistant fails to generate content within 30 seconds
- System automatically falls back to a smart template
- Template still includes personality tips, progress info, and milestone details
- User still gets a valuable reminder, just less personalized

---

## User Journey Example

### Meet Alex - The Loyalist Personality

**Alex's Goal**: "Launch my side business"
**Current Milestone**: "Create product landing page" (Jan 1 - Jan 14)
**Today**: January 8 (Day 8 of 14)
**Nudge Schedule**: Sunday + Wednesday

#### 7:00 AM UTC - System detects Alex needs a reminder

- Today is Wednesday ✅ (matches Alex's schedule)
- Last reminder was Sunday (3 days ago) ✅
- Milestone is active (not completed) ✅
- Today is between start and due date ✅
- Creates pending notification for Alex

#### 7:05 AM UTC - AI generates Alex's personalized nudge

System gathers:

- Alex's personality profile (values security, thorough planning)
- Previous reflection: "Last week's chat helped me overcome analysis paralysis"
- Progress: 8 days in, 6 days remaining
- Blind spot: Overthinking and seeking too many opinions

AI generates:

> "Week 2 of building your landing page! You mentioned last week that moving past analysis paralysis was a breakthrough - that's huge progress. You're 8 days in with 6 remaining. What's one design decision you can make today without seeking more feedback?"

Note: The AI doesn't say "As a Type 6..." - it reflects the pattern naturally.

#### 7:10 AM UTC - Notifications sent

**Email** with:

- Personalized message above
- **Blind Spot Alert**: "You may be seeking too much validation before launching. Trust your judgment."
- **Strength Hook**: "Your attention to detail ensures quality - but remember, version 1.0 doesn't need to be perfect."
- Link to view full reminder

**Push Notification**:

- "🎯 Create product landing page"
- "Week 2 of building your landing page!..."

#### 9:30 AM - Alex engages

- Opens email during morning coffee
- Clicks "View Full Reminder"
- Reads personalized message
- Sees progress: "Day 8 of 14"
- Provides feedback: "I like this nudge ✅"
- Opens AI Reflection Chat:
  - AI: "What made the nudge resonate today?"
  - Alex: "The reminder to stop seeking feedback hit home"
  - AI: "What's one decision you've been putting off?"
  - Alex: "Choosing the hero image..."
  - (conversation continues)
- AI generates summary: "Alex recognized a pattern of over-validation. Committed to deciding on hero image today without external input."

#### Next Wednesday (January 15)

- System reads Alex's reflection summary
- AI incorporates: "Last time, Alex committed to making decisions independently"
- New nudge builds on that progress
- Continuous improvement cycle continues

---

## Opt-In & Privacy

### User Control

Users can control notifications via settings:

- **Email Notifications Toggle**: On/Off
- **Push Notifications**: Subscribe/Unsubscribe
- **Nudge Schedule**: Daily, Weekly, or Custom days
- **Milestone Reminders**: Can disable just these
- **Email Address**: Can update or remove

### Data Privacy

- Personality data stays within our Firebase database
- OpenAI only sees: milestone title/description, personality summary (no identifiers)
- We do NOT send to OpenAI: real name, email, full goal details

---

## Success Metrics (Currently Tracked)

Basic notification statistics are tracked in the system:

### Available Metrics

- **Total Notifications**: Count of all milestone reminders created
- **Delivery Success Rate**: % of emails/push successfully sent vs. failed
  - Tracked via `emailStatus.sent` and `emailStatus.deliveryStatus`
- **Notification Views**: Count of users who viewed the notification
  - Tracked via `read` field
- **Feedback Collection**: Count of users who provided feedback
  - Tracked via `feedback` field (text responses stored)
- **Reflection Engagement**: Users who opened AI coaching chat
  - Tracked via `feedbackDetails.chatTranscript`

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
- **Reflection Completion Rate** - Chat started vs. summary generated

---

## Troubleshooting Common Issues

### "I didn't receive my reminder"

**Possible causes**:

1. Email/push notifications disabled in settings
2. Today doesn't match user's nudge schedule
3. Already received reminder in last 24 hours
4. No active milestones during the date range
5. Email delivery failure (check spam folder)
6. Push subscription expired

**How to verify**:

- Check companionSettings collection for `emailNudgesOptIn`
- Check user's `nudgeDays` array matches today
- Query notifications collection for recent entries
- Check pushSubscriptions for `active` status
- Check GitHub Actions logs for delivery status

### "The reminder doesn't feel personalized"

**Possible causes**:

1. User hasn't completed Enneagram assessment
2. No previous feedback or reflections to learn from (first reminder)
3. AI generation failed and fallback template used

**How to verify**:

- Check if user has enneagramResult in Firestore
- Query notification history for feedback entries and chat transcripts
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

### "Push notifications stopped working"

**Possible causes**:

1. Browser subscription expired
2. User revoked notification permissions
3. Subscription marked inactive after failed delivery

**How to verify**:

- Check pushSubscriptions collection for user's subscription status
- Verify `active` field is true
- Check for 410/404 errors in delivery logs

---

## Future Enhancements

### Near-Term (Next Quarter)

1. **Smart Send Time**: Send at user's optimal engagement time (not fixed 7 AM UTC)
2. **A/B Testing**: Test different message styles to find what resonates
3. **Click Tracking**: See which users engage with email links
4. **Granular Unsubscribe**: Disable specific notification types independently

### Medium-Term (6-12 Months)

1. **Mobile App Push**: Native iOS/Android notifications
2. **SMS Option**: Text reminders for users who prefer them
3. **Slack Integration**: Send reminders directly in Slack
4. **Advanced Analytics Dashboard**: See engagement patterns per personality type

### Long-Term (12+ Months)

1. **Predictive Nudging**: AI predicts when user needs motivation most
2. **Community Features**: "3 others with your personality completed this milestone this week"
3. **Voice Nudges**: Audio reminders in user's preferred voice
4. **Multi-Language Support**: Nudges in user's native language

---

## Appendix: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DATA                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Enneagram    │  │ Active Plans │  │ Past Feedback│          │
│  │ Profile      │  │ & Milestones │  │ & Reflections│          │
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
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│   EMAIL DELIVERY    │   │   PUSH NOTIFICATION │
│   (Resend API)      │   │   (Web Push)        │
└─────────────────────┘   └─────────────────────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   USER ENGAGEMENT           │
             │   /nudge/[id]               │
             └─────────────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│   QUICK FEEDBACK    │   │   AI REFLECTION     │
│   (emoji + text)    │   │   CHATBOT           │
└─────────────────────┘   └─────────────────────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   FEEDBACK STORED           │
             │   → Improves next nudge     │
             └─────────────────────────────┘
```

---
