# Goal Wizard - Product Documentation

## Overview

The Goal Wizard is an AI-powered interface that guides users through creating actionable, personalized goal plans with smart milestones. It transforms vague aspirations into structured roadmaps tailored to each user's personality and timeline.

**Location**: [/app/profile/companion/page.tsx](app/profile/companion/page.tsx)

---

## 🎯 What It Does

The Goal Wizard takes users through a guided process to:

1. Define their goal with clarity
2. Set realistic deadlines
3. Choose engagement preferences
4. Receive AI-generated milestones with personality-specific guidance

**End Result**: A complete goal plan with 5-7 sequential milestones, each containing personalized blind-spot warnings and strength-leverage tips based on the user's Enneagram personality type.

---

## 📋 User Journey

---

### Step 1: Goal Description

**User Action**: Describe their goal in detail

**Input Field**: Multi-line text area (auto-expanding)

**Examples**:

- "Land a consulting offer at a top-tier firm by June 2026"
- "Transition from IC to Engineering Manager within 12 months"
- "Launch my SaaS product and get 100 paying customers"

---

### Step 2: Target Date

**User Action**: Set final completion deadline

**Input**: Date picker

**Validation**: Must be a future date

**System Behavior**:

- All milestones are calculated backward from this target date
- Milestone distribution adjusts based on time pressure setting

---

### Step 3: Time Pressure

**User Action**: Indicate if they need an accelerated timeline

**Options**:

- ☑️ "I have a tight deadline" (checked = high time pressure)
- ☐ Normal pace (unchecked)

**Impact on Milestones**:

- **High Pressure**: Milestones are condensed, focused on critical-path tasks only
- **Normal Pace**: Milestones allow breathing room and comprehensive preparation

---

### Step 4: Nudge Frequency

**User Action**: Choose how often they want milestone reminders

**Options**:

- **Daily** - Receive nudges every day for active milestones
- **Weekly** - Receive nudges once per week for active milestones

**Default**: Weekly

**What Happens**:

- Daily: Users get a motivational nudge every morning at 9 AM UTC
- Weekly: Users get a nudge once per week (system prevents duplicates within 7 days)

---

### Step 5: AI Milestone Generation

**User Action**: Click "Generate My Plan"

**System Process** (user sees loading state):

1. **Context Lock** - AI clarifies what success and failure look like
2. **Assumption Builder** - AI infers constraints, risks, and non-goals
3. **Milestone Draft** - AI generates 5-7 sequential milestones with dates
4. **Quality Review** - AI validates milestone quality and flags generic language
5. **Final Synthesis** - AI applies corrections and polishes milestones

**User Sees**:

- Loading indicator with status messages
- Generated milestones appear one by one
- Each milestone shows:
  - **Title** (concise action phase)
  - **Description** (what to accomplish)
  - **Start Date** (when to begin)
  - **Due Date** (deadline for completion)
  - **Blind Spot Tip** (personality-specific warning)
  - **Strength Hook** (personality advantage to leverage)
  - **Measurable Outcome** (how to know it's done)

---

### Step 6: Milestone Customization

**User Action**: Review and optionally edit milestones

**Editing Options**:

- ✏️ Edit milestone titles and descriptions
- 📅 Adjust start and due dates
- ➕ Add new milestones
- ❌ Delete milestones
- 🔄 Reorder milestones (drag-and-drop)

**Validation**:

- Dates must be sequential (start date ≤ due date)
- Start date of next milestone should be after previous milestone's due date
- All milestones must fall between today and target date

---

### Step 7: Plan Activation

**User Action**: Click "Save Plan"

**System Actions**:

1. ✅ Saves plan to Firestore (`plans` collection)
2. 🎁 Awards user **200 XP** for plan creation
3. 📊 Updates user's plan count
4. 🔄 Redirects to profile dashboard

**User Sees**:

- Success toast: "Plan created successfully!"
- New plan card appears in dashboard
- Milestone timeline visible
- Current milestone highlighted (if applicable)

---

## 🎨 Visual Design

### UI Components

**Progress Indicator**:

- Shows which step user is on
- Displays step titles
- Visual breadcrumb trail

**Milestone Cards**:

- Clean card layout with rounded corners
- Color-coded by status:
  - 🟢 **Current** - Green border
  - ⚪ **Future** - Gray border
  - ✅ **Completed** - Checkmark icon

**Personality Integration**:

- Blind Spot Tips displayed with ⚠️ warning icon
- Strength Hooks displayed with 💪 strength icon
- Subtle personality-type badge

**Mobile Optimization**:

- Fully responsive design
- Touch-friendly date pickers
- Swipeable milestone cards
- Auto-expanding text areas

---

## 🧠 AI Personalization

### How Personality Shapes Milestones

The system uses the user's **Enneagram personality type** to customize:

1. **Blind Spot Tips** - Warnings about personality-based challenges

   - **Example (Type 3)**: "Watch out for overcommitting to impress others"
   - **Example (Type 5)**: "Avoid over-researching and delaying action"

2. **Strength Hooks** - Leverage points for personality advantages

   - **Example (Type 8)**: "Use your decisiveness to make bold moves early"
   - **Example (Type 2)**: "Leverage your networking skills to build relationships"

3. **Milestone Pacing** - Adjusted for personality tendencies
   - **Type 7s** get shorter milestones to maintain excitement
   - **Type 1s** get buffer time for quality standards
   - **Type 9s** get clear accountability checkpoints

---

## 📊 Success Metrics

### What Users Get

**Immediate Value**:

- ✅ Clear roadmap with specific action items
- 📅 Realistic timeline with sequential milestones
- 🎯 Personality-aware guidance and warnings
- 🔔 Automated reminders to stay on track

**Long-Term Benefits**:

- 📈 Higher goal completion rates (tracked via milestone progress)
- 🧭 Reduced overwhelm through bite-sized phases
- 🎓 Self-awareness from personality-specific insights
- 🏆 Gamified progress (XP rewards for milestones and feedback)

---

## 🚀 Template vs. Custom Goals

### Pre-Built Templates

**Consultant Template**:

1. Target-firm networking
2. Master core cases
3. Craft fit-interview stories
4. Mock interview sprint
5. Submit applications
6. First-round interviews
7. Partner/final interviews

**Manager Template**:

1. Assess leadership gaps
2. Build team communication skills
3. Ownership of a project
4. Deliver a project end-to-end
5. Mentor a junior teammate
6. Stakeholder management practice
7. Formal leadership role

**Advantages**:

- ✅ Battle-tested milestone sequences
- ✅ Pre-calculated date offsets
- ✅ Industry-specific best practices
- ✅ Faster setup (no AI generation wait)

**Limitations**:

- ⚠️ Less flexibility for unique situations
- ⚠️ Generic descriptions (though still personalized with blind spots/strengths)

---

### Custom Goals

**Best For**:

- Unique career transitions
- Side projects and entrepreneurship
- Personal development goals
- Non-traditional career paths

**AI Generation Process**:

- Fully personalized milestones
- Context-aware based on goal description
- Adaptive to time pressure and personality
- Original blind spot tips and strength hooks

**Trade-offs**:

- ⏱️ Requires 10-30 seconds for AI generation
- 🎲 Quality depends on goal description clarity
- 💰 Higher OpenAI API costs per plan

---

## 💡 Best Practices (User-Facing)

### For Goal Descriptions

**Good Examples** ✅:

- "Land a Product Manager role at a Series B+ startup by Q2 2026"
- "Launch my meal-prep app with 500 active users in 6 months"
- "Get promoted to Senior Engineer by hitting all performance targets"

**Vague Examples** ❌:

- "Get a better job"
- "Start a business"
- "Be more productive"

**Why It Matters**: Specific goals generate better, more actionable milestones.

---

### For Date Selection

**Tips**:

- 🗓️ Choose realistic deadlines (AI can't defy physics)
- ⏰ Account for holidays, personal commitments, existing workload
- 📈 Add buffer time for unexpected delays

**Warning**: If target date is too soon (e.g., 2 weeks for "land a consulting offer"), AI will compress milestones but quality may suffer.

---

### For Nudge Frequency

**Choose Daily If**:

- You need high accountability
- Goal has tight deadline
- You respond well to frequent reminders

**Choose Weekly If**:

- You prefer autonomy
- Milestones take multiple days
- Daily emails feel overwhelming

**Can Change Later**: Users can update nudge frequency in companion settings.

---

## 🎁 Rewards System

### XP Awards

**Plan Creation**: +200 XP

- Awarded immediately after saving plan
- Encourages users to create their first plan

**Milestone Completion**: +100 XP per milestone

- Manual completion via dashboard toggle
- Celebrates progress and momentum

**Nudge Feedback**: +25 XP per response

- Encourages engagement with AI nudges
- Bonus +10 XP for consecutive daily responses (streak)

---

## 🔄 Plan Management

### After Creation

**Users Can**:

- ✏️ Edit milestone titles, descriptions, dates
- ✅ Mark milestones as completed
- ⏸️ Pause plan (stops automated nudges)
- 🗑️ Delete plan (removes from dashboard)
- 📧 Opt in/out of email nudges

**System Automatically**:

- 🔔 Sends nudges for current milestones (based on frequency)
- 📊 Tracks progress and completion percentage
- 🎯 Highlights current milestone on dashboard
- 📈 Updates XP when milestones are completed

---

## 🎯 Key Differentiators

### What Makes This Unique

1. **Personality-Driven** - First goal planner to use Enneagram for milestone customization
2. **Zero-Question Onboarding** - No lengthy questionnaires; AI infers context
3. **Automated Accountability** - Set-and-forget reminder system
4. **Gamified Progress** - XP rewards and streak tracking
5. **Template + Custom Hybrid** - Best of both worlds
6. **Quality Control** - 5-pass AI system ensures non-generic, actionable milestones

---

## 🛠️ Error Handling

### User-Facing Errors

**Scenario**: AI generation fails

**User Sees**:

- Toast notification: "AI generation failed. Using fallback milestones."
- Generic milestones displayed (still functional, less personalized)

**Fallback Behavior**:

- System uses template-based milestones if available
- Custom goals get generic milestone structure
- User can manually edit and improve milestones

**Scenario**: Network timeout

**User Sees**:

- Toast notification: "Connection lost. Please try again."
- Form data preserved (no data loss)
- Retry button appears

---

## ✅ Success Checklist

### For Product Managers

When evaluating goal wizard effectiveness, check:

- [ ] Users complete wizard without drop-off
- [ ] Milestones are actionable and time-bound
- [ ] Personality tips resonate with users (feedback scores)
- [ ] Users edit milestones minimally (indicates quality)
- [ ] Users activate plans (vs. abandoning in draft)
- [ ] Users opt into email nudges (indicates trust)
- [ ] Milestone completion rates are trending upward
- [ ] XP rewards drive engagement (analytics confirm)

### For User Research

Key questions to validate:

- Do users understand each milestone's purpose?
- Are blind spot tips perceived as helpful or intrusive?
- Do users prefer templates or custom goals? (by goal type)
- What's the optimal nudge frequency for different user segments?
- Are milestone dates realistic or too aggressive?
- Do users want more control over AI generation parameters?

---

## 📚 Related Documentation

- [GOAL_WIZARD_ARCHITECTURE.md](GOAL_WIZARD_ARCHITECTURE.md) - Technical implementation details
- [PLAN_LIFECYCLE.md](../PLAN_LIFECYCLE.md) - Complete plan automation system
- [NUDGE_WORKFLOW.md](../NUDGE_WORKFLOW.md) - How milestone nudges are generated and delivered
- [DASHBOARD_DOCUMENTATION.md](../DASHBOARD_DOCUMENTATION.md) - How plans are displayed and managed
