# Goal Wizard - Technical Architecture

## Overview

This document details the technical implementation of the Goal Wizard, including API calls, data structures, AI integration, and system architecture.

**Primary Files**:
- Frontend: [/app/profile/companion/page.tsx](app/profile/companion/page.tsx)
- Backend: [/app/api/openAi/route.ts](app/api/openAi/route.ts)

---

## 🏗️ System Architecture

### High-Level Flow

```
User Input → Frontend Validation → API Call → 5-Pass AI System → Firestore Storage → Dashboard Display
```

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Backend**: Next.js API Routes (serverless)
- **AI Provider**: OpenAI (GPT-4o-mini + Custom Assistants)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Tracking**: Custom Firebase usage tracker

---

## 📡 API Architecture

### Endpoint

**Route**: `/api/openAi?type=enhanced-plan`

**Method**: `POST`

**Authentication**: Firebase ID Token (Bearer)

**Request Body**:
```typescript
{
  goalDescription: string;
  targetDate: string;
  hasTimePressure: boolean;
  enneagramType: string;
  personalitySummary: string;
  userId: string;
}
```

**Response**:
```typescript
{
  goalFrame: {
    successCriteria: string;
    failureCriteria: string;
    mustAvoid: string[];
  };
  assumptions: {
    constraints: string[];
    risks: string[];
    nonGoals: string[];
  };
  milestones: Milestone[];
  metadata: {
    totalPasses: number;
    correctionsMade: number;
    approved: boolean;
  };
}
```

---

## 🤖 5-Pass AI Generation System

### Pass 1: Context Lock (Chat Completion)

**Purpose**: Force specificity and eliminate ambiguity

**Model**: `gpt-4o-mini`

**API Type**: Chat Completions API

**Temperature**: `0.3` (low = more deterministic)

**Input**:
```typescript
{
  goalDescription: string;
  targetDate: string;
  personalitySummary: string;
}
```

**Prompt Strategy**:
```
You are a goal clarity expert. Force specificity and eliminate ambiguity.

Explicitly state:
1. What success looks like (observable, measurable)
2. What failure looks like (concrete warning signs)
3. What must be avoided (anti-patterns, traps)
```

**Output**:
```typescript
{
  successCriteria: string;
  failureCriteria: string;
  mustAvoid: string[];
}
```

**Cost**: ~500-800 tokens per request

---

### Pass 2: Assumption Builder (Chat Completion)

**Purpose**: Infer constraints without asking questions

**Model**: `gpt-4o-mini`

**API Type**: Chat Completions API

**Temperature**: `0.5` (balanced creativity)

**Input**:
```typescript
{
  goalDescription: string;
  targetDate: string;
  hasTimePressure: boolean;
  personalitySummary: string;
  enneagramType: string;
}
```

**Prompt Strategy**:
```
You are an inference engine. You do NOT ask questions.
Make explicit assumptions based on goal context and personality.

Infer:
- 3 realistic constraints (time, resources, dependencies)
- 2 personality-specific risks (what could derail this Type X person)
- 2 non-goals (what NOT to optimize for, what to avoid overdoing)
```

**Output**:
```typescript
{
  constraints: string[];  // 3 items
  risks: string[];        // 2 items
  nonGoals: string[];     // 2 items
}
```

**Cost**: ~700-1000 tokens per request

---

### Pass 3: Draft Milestones (Assistant API)

**Purpose**: Generate high-quality initial milestones

**Model**: Custom Assistant (ID from `NEXT_PUBLIC_REACT_MILESTONE_GENERATOR_ID`)

**API Type**: Assistants API (Threads + Runs)

**Input**:
```typescript
{
  goalDescription: string;
  targetDate: string;
  hasTimePressure: boolean;
  enneagramType: string;
  goalFrame: { successCriteria, failureCriteria, mustAvoid };
  assumptions: { constraints, risks, nonGoals };
}
```

**Prompt Strategy**:
```
You are an expert milestone architect. Create specific, actionable milestones.

RULES FOR MILESTONE GENERATION:
1. Each milestone MUST produce a visible, tangible output
2. NO generic actions like "research", "prepare", "explore" - be specific
3. Each milestone MUST reduce a specific risk from the assumptions
4. Use exam-grade specificity - concrete deliverables
5. All dates must be TODAY or later (NEVER generate past dates)
6. Distribute milestones evenly from today to target date

For each milestone, provide:
- title: Action-oriented, specific
- description: What gets produced, what the deliverable is
- startDate: YYYY-MM-DD (today or later)
- dueDate: YYYY-MM-DD (after startDate, before target)
- blindSpotTip: Type-specific warning for THIS milestone
- strengthHook: How Type X can leverage their strength HERE
- measurableOutcome: Concrete, observable deliverable

Generate 5-7 milestones.
```

**Output**:
```typescript
{
  milestones: [
    {
      id: string;
      title: string;
      description: string;
      startDate: string;  // YYYY-MM-DD
      dueDate: string;    // YYYY-MM-DD
      blindSpotTip: string;
      strengthHook: string;
      measurableOutcome: string;
    }
  ]
}
```

**Implementation Details**:
```typescript
// Create thread
const thread = await openai.beta.threads.create();

// Add message to thread
await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: systemPrompt,
});

// Create run
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: process.env.NEXT_PUBLIC_REACT_MILESTONE_GENERATOR_ID!,
});

// Poll for completion
let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
while (response.status === 'in_progress' || response.status === 'queued') {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}

// Extract response
if (response.status === 'completed') {
  const messageList = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messageList.data
    .filter((msg) => msg.run_id === run.id && msg.role === 'assistant')
    .pop();
  // Parse JSON from message content
}
```

**Cost**: ~2000-3000 tokens per request

---

### Pass 4: Anti-Generic Review (Chat Completion)

**Purpose**: Quality control - flag generic, vague, or unmeasurable milestones

**Model**: `gpt-4o-mini`

**API Type**: Chat Completions API

**Temperature**: `0.3` (strict reviewer)

**Input**:
```typescript
{
  milestones: Milestone[];
  enneagramType: string;
  assumptions: { risks: string[] };
}
```

**Prompt Strategy**:
```
You are a ruthless milestone quality reviewer.
Flag generic, vague, or unmeasurable milestones.

Flag any milestone that has these problems:
1. Generic language (too broad, could apply to any goal)
2. No measurable outcome (can't verify completion)
3. Would trigger Type X blind spots (overdoing or avoiding)
4. Has dates in the past
5. Lacks specificity (what exactly gets done?)

For each flagged milestone, provide specific correction guidance.
```

**Output**:
```typescript
{
  corrections: string[];  // e.g., "Milestone 1: Too vague - specify exact deliverable"
  approved: boolean;      // true if all milestones pass quality check
}
```

**Cost**: ~1000-1500 tokens per request

---

### Pass 5: Final Synthesis (Assistant API)

**Purpose**: Apply corrections and polish milestones

**Model**: Custom Assistant (ID from `NEXT_PUBLIC_REACT_GOAL_QST_GENERATOR_ID`)

**API Type**: Assistants API (Threads + Runs)

**Input**:
```typescript
{
  draftMilestones: Milestone[];
  corrections: string[];
  enneagramType: string;
  targetDate: string;
}
```

**Prompt Strategy**:
```
You are a milestone refinement expert.
Apply reviewer feedback to create perfect milestones.

Apply all corrections:
- Fix generic language → make specific and actionable
- Add measurable outcomes → concrete deliverables
- Increase behavioral pressure → make milestones non-negotiable
- Cut 20% verbosity → be concise
- Ensure dates are valid (today or later, before target)
- Address Type X blind spots in tips

Return the SAME JSON structure as draft milestones,
but with improvements applied.
```

**Output**:
```typescript
{
  milestones: Milestone[];  // Refined version
}
```

**Cost**: ~2000-3000 tokens per request

---

## 💾 Data Structures

### Plan Object (Firestore)

**Collection**: `plans`

**Document Schema**:
```typescript
interface PlanData {
  id?: string;
  userId: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency: "daily" | "weekly";

  goalFrame?: {
    successCriteria: string;
    failureCriteria: string;
    mustAvoid: string[];
  };

  assumptions?: {
    constraints: string[];
    risks: string[];
    nonGoals: string[];
  };

  milestones: Milestone[];
  createdAt: Timestamp;
  status: "active" | "completed" | "paused";
}
```

**Indexes Required**:
- `userId` (for user plan queries)
- `status` (for active plan queries)
- `createdAt` (for sorting)

---

### Milestone Object

```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;           // YYYY-MM-DD
  dueDate: string;             // YYYY-MM-DD
  completed: boolean;
  blindSpotTip?: string;       // Personality-specific warning
  strengthHook?: string;       // Personality-specific leverage point
  measurableOutcome?: string;  // Concrete deliverable
}
```

**Field Constraints**:
- `startDate` ≤ `dueDate`
- `startDate` ≥ today
- `dueDate` ≤ plan's `targetDate`
- `title`: max 100 characters
- `description`: max 500 characters

---

### User Enneagram Data

**Collection**: `users`

**Relevant Fields**:
```typescript
interface EnneagramResult {
  enneagramType1: number;  // Score 0-100
  enneagramType2: number;
  // ... types 3-9
  summary: string;         // AI-generated personality summary
  name: string;
  email: string;
}
```

**How It's Used**:
- `summary` → Passed to all AI generation calls
- Dominant type (highest score) → Used for blind spot tips and strength hooks

---

## 🔐 Authentication & Authorization

### Frontend Authentication

```typescript
// Get current user
const [user, setUser] = useState<FirebaseUser | null>(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });
  return () => unsubscribe();
}, []);
```

### API Authentication

```typescript
// Extract Bearer token from request
const authHeader = request.headers.get('authorization');
const token = authHeader.split('Bearer ')[1];

// Verify with Firebase Admin SDK
const decodedToken = await auth().verifyIdToken(token);
const userId = decodedToken.uid;
const userEmail = decodedToken.email;
```

**Security**:
- All API calls require valid Firebase ID token
- Token is verified server-side
- User ID is extracted from token (can't be spoofed)

---

## 📊 Cost Tracking

### Firebase Operation Tracking

**Library**: [/lib/trackedFirestoreClient.ts](lib/trackedFirestoreClient.ts)

**Tracked Operations**:
- Document reads
- Document writes
- Collection queries
- Batch operations

**Implementation**:
```typescript
import { TrackedFirestoreClient } from '@/lib/trackedFirestoreClient';

const trackedDb = new TrackedFirestoreClient(db, {
  userId: user.uid,
  userEmail: user.email,
  operationContext: 'goal_wizard_plan_creation'
});

await trackedDb.addDoc(collection(db, 'plans'), planData);
// Automatically logs: userId, operation type, timestamp, context
```

### OpenAI Token Tracking

**Library**: [/lib/simpleTracker.ts](lib/simpleTracker.ts)

**Function**: `logTokenUsage()`

**Usage**:
```typescript
await logTokenUsage({
  userId: userInfo.userId,
  userEmail: userInfo.userEmail,
  model: 'gpt-4o-mini',
  promptTokens: 500,
  completionTokens: 300,
  totalTokens: 800,
  operation: 'goal_wizard_context_lock',
  metadata: {
    goalType: 'custom',
    enneagramType: '3'
  }
});
```

**Logged Data**:
- User attribution (userId, email)
- Model used
- Token consumption (prompt, completion, total)
- Operation context
- Timestamp
- Custom metadata

---

## 🔄 Template-Based Milestones

### Goal Template Structure

```typescript
interface GoalTemplateItem {
  id: string;
  title: string;
  description: string;
  defaultOffsetDays: number;  // Days before target date
}
```

### Pre-Built Templates

**Consultant Template**:
```typescript
const consultantTemplate: GoalTemplateItem[] = [
  {
    id: "network",
    title: "Target-firm networking",
    description: "Schedule coffee chats with alumni and recruiters.",
    defaultOffsetDays: -120
  },
  {
    id: "case_core",
    title: "Master core cases",
    description: "Drill 20 profitability and market-entry cases.",
    defaultOffsetDays: -90
  },
  // ... 5 more milestones
];
```

**Manager Template**: Similar structure with 7 milestones

### Template Processing

```typescript
function generateMilestonesFromTemplate(
  template: GoalTemplateItem[],
  targetDate: Date
): Milestone[] {
  return template.map((item) => {
    const dueDate = new Date(targetDate);
    dueDate.setDate(dueDate.getDate() + item.defaultOffsetDays);

    const startDate = new Date(dueDate);
    startDate.setDate(startDate.getDate() - 14); // 2 weeks before due date

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      completed: false
    };
  });
}
```

**Note**: Template milestones still get personality-specific `blindSpotTip` and `strengthHook` added during AI generation.

---

## ⚡ Performance Optimizations

### 1. Parallel AI Calls

Some passes can run in parallel:

```typescript
// Run Pass 1 and Pass 2 in parallel
const [goalFrame, assumptions] = await Promise.all([
  generateGoalFrame(goalDescription, targetDate, personalitySummary),
  generateAssumptions(goalDescription, targetDate, hasTimePressure, personalitySummary, enneagramType)
]);
```

### 2. Caching User Data

```typescript
// Cache Enneagram results in frontend state to avoid repeated Firestore reads
const [enneagramData, setEnneagramData] = useState<EnneagramResult | null>(null);

useEffect(() => {
  if (user) {
    const cachedData = sessionStorage.getItem('enneagram_data');
    if (cachedData) {
      setEnneagramData(JSON.parse(cachedData));
    } else {
      fetchEnneagramData(user.uid).then((data) => {
        setEnneagramData(data);
        sessionStorage.setItem('enneagram_data', JSON.stringify(data));
      });
    }
  }
}, [user]);
```

### 3. Optimistic UI Updates

```typescript
// Show milestones immediately after generation (before Firestore save)
setGeneratedMilestones(milestones);

// Save to Firestore in background
savePlan(planData).catch((error) => {
  // Rollback UI if save fails
  setGeneratedMilestones(null);
  showError("Failed to save plan. Please try again.");
});
```

---

## 🔥 Error Handling

### AI Generation Failures

**Fallback Strategy**:
```typescript
try {
  const milestones = await generateDraftMilestones(...);
  if (milestones.length === 0) {
    throw new Error('No milestones generated');
  }
  return milestones;
} catch (error) {
  console.error('AI generation failed:', error);

  // Fallback to template if available
  if (goalType === 'consultant' || goalType === 'manager') {
    return generateMilestonesFromTemplate(
      goalTemplateItems[goalType],
      new Date(targetDate)
    );
  }

  // Generic fallback for custom goals
  return generateGenericMilestones(targetDate);
}
```

### JSON Parsing Errors

```typescript
try {
  const cleaned = content.trim()
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '');
  return JSON.parse(cleaned);
} catch (error) {
  console.error('JSON parse error:', error);
  console.error('Raw content:', content);

  // Return safe fallback
  return {
    successCriteria: 'Complete the goal by target date',
    failureCriteria: 'Miss the deadline',
    mustAvoid: ['Procrastination']
  };
}
```

### Firestore Write Failures

```typescript
try {
  await trackedDb.addDoc(collection(db, 'plans'), planData);
  showToast('Plan created successfully!', 'success');
  router.push('/profile');
} catch (error) {
  console.error('Firestore write failed:', error);
  showToast('Failed to save plan. Please try again.', 'error');
  // Keep form data intact for retry
}
```

---

## 🧪 Testing Considerations

### Unit Tests

**Test Coverage**:
- Date calculation logic (milestone distribution)
- Template processing (offset calculations)
- JSON parsing and cleaning
- Validation functions (date ranges, field lengths)

**Example Test**:
```typescript
describe('generateMilestonesFromTemplate', () => {
  it('should calculate correct dates from offsets', () => {
    const targetDate = new Date('2026-06-30');
    const milestones = generateMilestonesFromTemplate(
      consultantTemplate,
      targetDate
    );

    expect(milestones[0].dueDate).toBe('2026-03-02'); // -120 days
    expect(milestones[1].dueDate).toBe('2026-04-01'); // -90 days
  });
});
```

### Integration Tests

**Test Scenarios**:
- Full plan creation flow (with mocked OpenAI responses)
- Authentication token verification
- Firestore write operations
- Error handling and fallbacks

### Manual QA Checklist

- [ ] Consultant template generates 7 milestones
- [ ] Manager template generates 7 milestones
- [ ] Custom goals generate 5-7 milestones
- [ ] Blind spot tips are personality-specific
- [ ] All dates are in the future
- [ ] Dates are sequential (start ≤ due)
- [ ] Milestones are non-generic (specific deliverables)
- [ ] Plan saves to Firestore with correct userId
- [ ] User receives 200 XP after plan creation
- [ ] Redirect to dashboard works

---

## 📁 Key Files Reference

### Frontend

- [/app/profile/companion/page.tsx](app/profile/companion/page.tsx) - Main wizard UI
- [/Components/AutoExpandingTextarea.tsx](Components/AutoExpandingTextarea.tsx) - Goal description input
- [/Components/Toast.tsx](Components/Toast.tsx) - User feedback notifications

### Backend

- [/app/api/openAi/route.ts](app/api/openAi/route.ts) - Main API handler with 5-pass system
- [/lib/simpleTracker.ts](lib/simpleTracker.ts) - OpenAI token usage tracking
- [/lib/trackedFirestoreClient.ts](lib/trackedFirestoreClient.ts) - Firestore operation tracking

### Configuration

- [/firebase.ts](firebase.ts) - Firebase initialization
- Environment variables:
  - `NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY` - OpenAI API key
  - `NEXT_PUBLIC_REACT_MILESTONE_GENERATOR_ID` - Assistant ID for Pass 3
  - `NEXT_PUBLIC_REACT_GOAL_QST_GENERATOR_ID` - Assistant ID for Pass 5

---

## 💰 Cost Analysis

### Per Plan Creation (Custom Goal)

**OpenAI Costs**:
- Pass 1 (Context Lock): ~$0.001
- Pass 2 (Assumptions): ~$0.002
- Pass 3 (Draft Milestones): ~$0.005
- Pass 4 (Review): ~$0.002
- Pass 5 (Synthesis): ~$0.005

**Total AI Cost**: ~$0.015 per plan

**Firestore Costs**:
- 1 write (plan creation): $0.00006
- 1 read (user Enneagram data): $0.00001

**Total Per Plan**: ~$0.015 (primarily OpenAI)

### Per Plan Creation (Template Goal)

**OpenAI Costs**: $0 (uses pre-built templates)

**Firestore Costs**: ~$0.00007

**Total Per Plan**: <$0.001

---

## 🔮 Future Architecture Improvements

### 1. Caching Layer

**Proposal**: Cache AI responses for common goal patterns

```typescript
// Check cache before calling OpenAI
const cacheKey = `milestones:${goalType}:${enneagramType}:${hasTimePressure}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Generate and cache
const milestones = await generateDraftMilestones(...);
await redis.setex(cacheKey, 3600, JSON.stringify(milestones)); // 1 hour TTL
```

**Benefit**: Reduce AI costs by 30-50% for common patterns

---

### 2. Streaming Responses

**Proposal**: Stream milestones as they're generated

```typescript
// Use OpenAI streaming API
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    // Send to frontend via Server-Sent Events
    res.write(`data: ${content}\n\n`);
  }
}
```

**Benefit**: Perceived performance improvement, faster TTFB

---

### 3. Background Processing

**Proposal**: Move AI generation to background job queue

```typescript
// Frontend initiates plan creation
const jobId = await createPlanJob({
  userId: user.uid,
  goalDescription,
  targetDate,
  ...
});

// Poll for completion
const plan = await pollForPlanCompletion(jobId);
```

**Benefit**: Avoid API route timeouts, better error handling

---

## 📚 Related Documentation

- [GOAL_WIZARD.md](GOAL_WIZARD.md) - Product documentation for non-technical stakeholders
- [PLAN_LIFECYCLE.md](../PLAN_LIFECYCLE.md) - Complete plan automation lifecycle
- [NUDGE_WORKFLOW.md](../NUDGE_WORKFLOW.md) - How milestone reminders are generated