## Technical Architecture (Simplified)

### Why Two Phases?

**Phase 1 (Fast)**: Create notification records

- Takes < 10 seconds
- No AI processing yet
- Avoids timeout limits

**Phase 2 (Thorough)**: Add personalized content and send

- Takes 30-60 seconds per user
- Fetches personality data
- Generates AI content
- Sends emails
- No timeout restrictions

**Why this matters**: Without this split, the system would timeout when processing 50+ users simultaneously. This architecture scales to thousands of users.

### Error Handling

If something goes wrong at any step:

**Step 1 Failure** (User detection):

- Entire workflow fails
- GitHub Actions sends alert
- Product team investigates
- No user impact (they don't know a reminder was supposed to come)

**Step 2 Failure** (AI generation):

- System logs error
- Falls back to template
- User still gets reminder (just less personalized)
- No email sent if fallback also fails

**Step 3 Failure** (Email delivery):

- Marks notification as "failed" with error details
- Notification still visible in web app
- Can be retried manually if needed
- User can view it by logging into app

---

### Data Usage

The system accesses:

- User's Enneagram assessment results
- Active goal plans and milestones
- Previous notification feedback
- Email preferences

All data stays within our Firebase database. OpenAI sees only:

- Milestone title/description
- Personality type summary (no personal identifiers)
- Generic feedback text

We do NOT send to OpenAI:

- User's real name
- Email address
- Full goal details
- Any other personal information

---
