# GitHub Actions Scripts

## Milestone Reminder Processing

### Overview
This script processes pending milestone reminder notifications with advanced AI personalization.

### How It Works

**Two-Phase Architecture:**

1. **Phase 1 (Vercel API)**: `/api/milestoneReminders` creates notifications with empty prompts
2. **Phase 2 (GitHub Actions)**: This script fills in AI content and sends emails

### Features

The script provides **advanced personalization** beyond simple AI prompting:

- ✅ **Enneagram Personality Integration** - Fetches user's personality type and full summary
- ✅ **Personalized Growth Advice** - Retrieves type-specific milestone guidance from Firestore
- ✅ **Feedback History Learning** - Includes ALL previous nudge feedback for continuous improvement
- ✅ **OpenAI Assistants API** - Uses sophisticated assistant-based prompting (not simple chat)
- ✅ **Progress Timeline Awareness** - Days in progress, total days, days remaining
- ✅ **Blind Spot & Strength Tips** - Personality-driven insights
- ✅ **Email Delivery** - Sends via Resend API with delivery tracking

### Required Environment Variables

Add these to your GitHub repository secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK credentials (JSON) | `{"type": "service_account", ...}` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `NEXT_PUBLIC_REACT_NDG_GENERATOR_ID` | OpenAI Assistant ID for nudge generation | `asst_...` |

### Schedule

Runs daily at **7:00 AM UTC** via GitHub Actions (see `.github/workflows/milestone-reminders.yml`)

### Manual Testing

Trigger manually via GitHub Actions UI:
1. Go to Actions tab
2. Select "Daily Milestone Reminders"
3. Click "Run workflow"

### Dependencies

```json
{
  "firebase-admin": "^12.0.0",
  "openai": "^4.20.0",
  "resend": "^3.0.0"
}
```

### Files

- `process-milestone-reminders.mjs` - Main processing script
- `package.json` - Dependencies configuration
- `.github/workflows/milestone-reminders.yml` - GitHub Actions workflow

### Architecture Benefits

**Why GitHub Actions instead of Vercel?**

1. ✅ **No timeout limits** - Vercel has 10-second limit, AI processing takes 30-60s per notification
2. ✅ **Unlimited execution time** - Can process hundreds of notifications
3. ✅ **Better error handling** - Full logs and retry capabilities
4. ✅ **Cost efficiency** - GitHub Actions minutes are cheaper than Vercel compute time
5. ✅ **Scheduled execution** - Built-in cron support

### Monitoring

Check execution logs:
1. Go to repository → Actions
2. Click on latest "Daily Milestone Reminders" run
3. View "Process notifications with AI" step logs

### Error Handling

- **AI Failure**: Falls back to template-based nudge
- **Email Failure**: Logs error, marks notification status as failed
- **Firebase Error**: Continues processing other notifications
