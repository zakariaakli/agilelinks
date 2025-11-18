# Gen Z User Experience Optimization Guide

**Last Updated:** 2025-01-18
**Audience:** Gen Z / Gen Alpha (18-27 years old)
**Goal:** Maximize engagement, retention, and email open rates

---

## Core Philosophy

Gen Z wants:
- ✅ **Direct action** over reflective questions
- ✅ **Scannable content** over walls of text
- ✅ **Instant value** over motivational fluff
- ✅ **Authenticity** over corporate speak
- ✅ **Visual hierarchy** over uniform paragraphs

They DON'T want:
- ❌ "Consider doing..." → Too passive
- ❌ "As a Type X..." every paragraph → Repetitive
- ❌ Open-ended questions → Decision paralysis
- ❌ Generic encouragement → Feels fake

---

## 1. LLM Prompt Strategy (OpenAI Assistant)

### Current Settings
- **Model:** gpt-4o
- **Temperature:** 0.9 (high variety)
- **Top P:** 0.95
- **Max Tokens:** 350

### Prompt Structure (see ASSISTANT_PROMPT.md)

**Key Rules:**
1. Lead with ONE action (not 3 options)
2. Use short paragraphs (1-2 sentences max)
3. Provide exact steps, templates, or scripts
4. Create urgency with deadlines ("Do this before 6pm")
5. Format for scanning (bold text, line breaks, numbered lists)

**Example Output Format:**

```
Day 5/14. You have 9 days left.

Type 5s research forever—you're breaking that pattern today.

**Here's your action:**
1. Calendar: Block Tue 2pm, Thu 4pm for case practice
2. Message 5 people this exact text: "Practicing profitability cases. 45 min session. Tuesday 2pm work?"
3. First person who says yes = you're locked in

Do this before dinner or you're stuck in research mode forever.
```

---

## 2. UI Formatting Components

### NudgeFormatter Component

Located: `Components/NudgeFormatter.tsx`

**What it does:**
- Converts LLM markdown to Gen Z-friendly HTML
- Detects `**bold text**` → styled emphasis
- Formats numbered lists with visual badges
- Creates copy-paste template boxes
- Adds proper spacing and hierarchy

**Features:**
1. **Bold Emphasis Blocks**
   - Background gradient
   - Left border accent
   - Larger font size

2. **Numbered Action Lists**
   - Circular number badges
   - Hover effects
   - Clear visual separation

3. **Copyable Templates**
   - Dark code-style boxes
   - "Copy & paste this:" label
   - Monospace font
   - User-select all for easy copying

### CSS Styling

Located: `Styles/nudgeFormatter.module.css`

**Design Principles:**
- Short paragraphs with 1.25rem spacing
- Line height 1.6-1.7 for readability
- Bold text in primary color for emphasis
- Hover effects on action items
- Mobile-responsive font sizes

---

## 3. Email Formatting (Resend)

Located: `lib/sendMilestoneEmail.ts`

### Current Email Structure

```html
<!-- Header -->
<h1 style="color: #111827;">🎯 Milestone Check-in</h1>

<!-- Milestone Title -->
<div style="border-left: 4px solid #6366f1;">
  <h2>{milestoneTitle}</h2>
  <p>{formattedPrompt}</p>
</div>

<!-- CTA Button -->
<a href="/nudge/{id}" style="background: #6366F1;">
  View Full Reminder →
</a>
```

### Recommendations for Gen Z Email Engagement

**Subject Lines:**
- ❌ "Your weekly milestone check-in"
- ✅ "Day 5/14: One action to take today"
- ✅ "You have 9 days left. Here's what to do."

**Preheader Text:**
- First 40 characters of nudge (shows in inbox preview)
- Should create curiosity or urgency

**Email Body:**
- Keep same formatting as web (use NudgeFormatter logic)
- Use real line breaks (`<br><br>`)
- Bold text for **THE ACTION**
- Numbered lists with styled `<ol>`

**Example:**

```html
<p><strong>Day 5/14.</strong> You have 9 days left.</p>

<p>Type 5s research forever—you're breaking that pattern today.</p>

<div style="background: #eef2ff; padding: 1rem; border-left: 4px solid #6366f1; margin: 1rem 0;">
  <strong>Here's your action:</strong>
</div>

<ol style="margin: 1rem 0;">
  <li style="margin-bottom: 0.5rem;">Calendar: Block Tue 2pm, Thu 4pm for case practice</li>
  <li style="margin-bottom: 0.5rem;">Message 5 people this exact text: "Practicing profitability cases..."</li>
</ol>

<p style="font-weight: 600;">Do this before dinner.</p>
```

---

## 4. Engagement Metrics to Track

### Email Metrics
- **Open rate** (target: >40% for Gen Z)
- **Click-through rate** to nudge page (target: >25%)
- **Time from email send to page view** (faster = more urgent)

### On-Page Metrics
- **Feedback submission rate** (target: >60%)
- **Positive feedback ratio** ("I like this" vs "Do better")
- **Return visit rate** (did they come back after feedback?)

### Behavioral Signals

**Good signs:**
- Feedback notes with specific requests
- Multiple nudge page visits per week
- Quick email opens (<1 hour)
- Sharing nudges (if you add share feature)

**Warning signs:**
- "I really do not relate" >30% of time
- Email opens declining over time
- Long gaps between feedback submissions
- Generic feedback without notes

---

## 5. A/B Testing Ideas

### Test 1: Urgency Level
- **A:** "Do this today"
- **B:** "Do this before 6pm"
- **C:** "Do this in the next 2 hours"

**Hypothesis:** Specific deadlines increase action rate

### Test 2: Template Style
- **A:** Full message template in quotes
- **B:** Message template in dark code box
- **C:** Message template with [fill in the blank] format

**Hypothesis:** Dark code box = higher copy rate

### Test 3: Opener Style
- **A:** "Day 5/14. 9 days left."
- **B:** "You're halfway through. Here's what's next."
- **C:** "While you're planning, someone else just..."

**Hypothesis:** FOMO opener increases engagement

### Test 4: Action Count
- **A:** ONE action per nudge
- **B:** 2-3 actions per nudge
- **C:** One action + one reflection question

**Hypothesis:** Single action = higher completion rate

---

## 6. Future Enhancements

### Phase 1: Visual Elements
- [ ] Add progress bars to emails
- [ ] Emoji reactions instead of text feedback
- [ ] Streak counters (🔥 5-day action streak!)
- [ ] Social proof ("127 users completed this milestone")

### Phase 2: Gamification
- [ ] Achievement badges for feedback streaks
- [ ] Leaderboard (optional, privacy-conscious)
- [ ] Unlockable advanced nudge styles
- [ ] "Challenge mode" with harder deadlines

### Phase 3: Personalization++
- [ ] User picks nudge style (direct vs supportive)
- [ ] Custom deadline preferences (morning vs evening)
- [ ] Opt-in for "roast mode" (extra direct nudges)
- [ ] Integration with calendar for auto-scheduling

### Phase 4: Community Features
- [ ] Share nudge with accountability partner
- [ ] Anonymous feedback showcase (with permission)
- [ ] "This week's best action" highlights
- [ ] Group challenges for cohorts

---

## 7. Writing Guidelines for Manual Nudges

If you ever write nudges manually, follow these rules:

**DO:**
- Start with progress context (Day X, Y days left)
- Give ONE specific action
- Include exact templates or scripts
- Set a deadline (today, 6pm, before dinner)
- Use bold text for **THE ACTION**
- Keep paragraphs under 2 sentences
- End with a command, not a question

**DON'T:**
- Ask open-ended questions
- Say "Consider doing..." or "You might want to..."
- Use "As a Type X..." more than once
- Give 3+ options to choose from
- Write walls of text without breaks
- Be vague ("reach out to someone")
- Over-praise ("You're doing amazing!")

**Example Comparison:**

❌ **Bad:**
"As a Type 9, you have a natural ability to create harmony in your planning process. Consider reaching out to some SKEMA alumni who might be able to provide insights into the consulting interview process. What's one question you could ask them to help move your plan forward? Remember, your goal is to secure a consulting offer, and networking is an important part of that journey."

✅ **Good:**
"Day 3/3. Last day of planning phase.

Type 9s overthink the perfect plan. You need real intel, not more research.

**Today's move:**
LinkedIn → Search "SKEMA + Consulting + 2024"
Message 3 people: "Quick Q from fellow SKEMA—how'd you prep for case interviews?"

Send before 8pm or you'll spend another day planning to plan."

---

## 8. Technical Implementation Checklist

- [x] Update OpenAI Assistant prompt (ASSISTANT_PROMPT.md)
- [x] Increase temperature to 0.9
- [x] Create NudgeFormatter component
- [x] Create nudgeFormatter.module.css
- [x] Integrate NudgeFormatter in nudge page
- [x] Update feedback history to include ALL previous nudges
- [ ] Apply formatting to email HTML (lib/sendMilestoneEmail.ts)
- [ ] Add email preheader text based on first sentence
- [ ] Test with real Gen Z users
- [ ] A/B test urgency levels
- [ ] Monitor open rates and feedback quality

---

## 9. Quick Reference

**When nudge feels too soft:**
→ Add deadline, remove questions, increase directness

**When nudge feels too harsh:**
→ Add one Enneagram insight, keep action but soften closer

**When feedback says "too vague":**
→ Next nudge must include exact template/script

**When feedback says "do not relate":**
→ Avoid similar phrasing, try different personality angle

**When email open rates drop:**
→ Test edgier subject lines, increase urgency

**When on-page time is low:**
→ Content too long - shorten paragraphs, add more breaks

---

## Questions?

Check these files:
- **Prompt:** `ASSISTANT_PROMPT.md`
- **Formatter:** `Components/NudgeFormatter.tsx`
- **Email:** `lib/sendMilestoneEmail.ts`
- **Nudge Page:** `app/nudge/[id]/page.tsx`
