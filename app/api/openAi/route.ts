// app/api/openai-assistant/route.ts (for App Router)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { logTokenUsage } from '../../../lib/simpleTracker';
import { auth } from 'firebase-admin';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

// Helper function to get user from Firebase Auth token
async function getUserFromRequest(request: NextRequest): Promise<{ userId: string; userEmail: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth().verifyIdToken(token);
    
    return {
      userId: decodedToken.uid,
      userEmail: decodedToken.email || 'unknown@example.com'
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Replace your existing POST function with this:
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const assistantType = url.searchParams.get('type') || 'questions';

    // Get user information (optional - will proceed without if not available)
    const userInfo = await getUserFromRequest(request);

    if (assistantType === 'enhanced-plan') {
      return await handleEnhancedPlanRequest(body, userInfo);
    } else {
      return NextResponse.json(
        { error: 'Invalid assistant type. Use type=enhanced-plan' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PASS 1: Context Lock - Frame the goal with specificity (Chat Completion)
async function generateGoalFrame(
  goalDescription: string,
  targetDate: string,
  personalitySummary: string
): Promise<{ successCriteria: string; failureCriteria: string; mustAvoid: string[] }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a goal clarity expert. Your job is to force specificity and eliminate ambiguity.'
        },
        {
          role: 'user',
          content: `Summarize this goal in 3 lines:

Goal: ${goalDescription}
Target Date: ${targetDate}
${personalitySummary ? `Personality: ${personalitySummary}` : ''}

Explicitly state:
1. What success looks like (observable, measurable)
2. What failure looks like (concrete warning signs)
3. What must be avoided (anti-patterns, traps)

Return ONLY valid JSON:
{
  "successCriteria": "...",
  "failureCriteria": "...",
  "mustAvoid": ["...", "...", "..."]
}`
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error in generateGoalFrame:', error);
    return {
      successCriteria: 'Complete the goal by target date',
      failureCriteria: 'Miss the deadline or abandon the goal',
      mustAvoid: ['Procrastination', 'Lack of accountability', 'Unclear metrics']
    };
  }
}

// PASS 2: Assumption Builder - Infer constraints without asking questions (Chat Completion)
async function generateAssumptions(
  goalDescription: string,
  targetDate: string,
  hasTimePressure: boolean,
  personalitySummary: string,
  enneagramType: string
): Promise<{ constraints: string[]; risks: string[]; nonGoals: string[] }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an inference engine. You do NOT ask questions. You make explicit assumptions based on goal context and personality.'
        },
        {
          role: 'user',
          content: `Based on this goal, personality, and deadline, infer constraints and risks:

Goal: ${goalDescription}
Target Date: ${targetDate}
Time Pressure: ${hasTimePressure ? 'High (accelerated timeline)' : 'Normal pace'}
Personality: ${personalitySummary}
Enneagram Type: ${enneagramType}

Do NOT ask questions. Make explicit assumptions.

Infer:
- 3 realistic constraints (time, resources, dependencies)
- 2 personality-specific risks (what could derail this Type ${enneagramType} person)
- 2 non-goals (what NOT to optimize for, what to avoid overdoing)

Return ONLY valid JSON:
{
  "constraints": ["...", "...", "..."],
  "risks": ["...", "..."],
  "nonGoals": ["...", "..."]
}`
        }
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0].message.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error in generateAssumptions:', error);
    return {
      constraints: ['Limited time available', 'Must balance with other commitments', 'Need consistent effort'],
      risks: ['Loss of motivation midway', 'Overcommitment'],
      nonGoals: ['Perfectionism', 'Over-preparation']
    };
  }
}

// PASS 3: Draft Milestones - Generate high-quality initial milestones (Assistant API)
async function generateDraftMilestones(
  goalDescription: string,
  targetDate: string,
  hasTimePressure: boolean,
  enneagramType: string,
  goalFrame: { successCriteria: string; failureCriteria: string; mustAvoid: string[] },
  assumptions: { constraints: string[]; risks: string[]; nonGoals: string[] }
): Promise<any[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const thread = await openai.beta.threads.create();

    const systemPrompt = `You are an expert milestone architect. Create specific, actionable milestones with measurable outcomes.

GOAL: ${goalDescription}
TARGET DATE: ${targetDate}
TODAY: ${today}
TIME PRESSURE: ${hasTimePressure ? 'Accelerated timeline - create focused, efficient milestones' : 'Normal pace - allow appropriate time for each phase'}
ENNEAGRAM TYPE: ${enneagramType}

GOAL FRAME:
- Success looks like: ${goalFrame.successCriteria}
- Failure looks like: ${goalFrame.failureCriteria}
- Must avoid: ${goalFrame.mustAvoid.join(', ')}

ASSUMPTIONS:
- Constraints: ${assumptions.constraints.join(', ')}
- Risks to mitigate: ${assumptions.risks.join(', ')}
- Non-goals (don't optimize for): ${assumptions.nonGoals.join(', ')}

RULES FOR MILESTONE GENERATION:
1. Each milestone MUST produce a visible, tangible output
2. NO generic actions like "research", "prepare", "explore" - be specific
3. Each milestone MUST reduce a specific risk from the assumptions
4. Use exam-grade specificity - concrete deliverables
5. All dates must be ${today} or later (NEVER generate past dates)
6. Distribute milestones evenly from today to target date

For each milestone, provide:
- title: Action-oriented, specific (not vague)
- description: What gets produced, what the deliverable is
- startDate: YYYY-MM-DD format (today or later)
- dueDate: YYYY-MM-DD format (after startDate, on or before target date)
- blindSpotTip: Type ${enneagramType} specific warning for THIS milestone
- strengthHook: How Type ${enneagramType} can leverage their natural strength HERE
- measurableOutcome: Concrete, observable deliverable

Generate 5-7 milestones.

Return ONLY valid JSON in this exact format:
{
  "milestones": [
    {
      "id": "1",
      "title": "...",
      "description": "...",
      "startDate": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "blindSpotTip": "...",
      "strengthHook": "...",
      "measurableOutcome": "..."
    }
  ]
}`;

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_MILESTONE_GENERATOR_ID!,
    });

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === 'in_progress' || response.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (response.status === 'completed') {
      const messageList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messageList.data
        .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
        .pop();

      if (lastMessage && lastMessage.content && lastMessage.content.length > 0) {
        const firstContent = lastMessage.content[0];
        if (firstContent.type === 'text') {
          const content = firstContent.text.value;
          let cleaned = content.trim();

          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsed = JSON.parse(cleaned);
          return parsed.milestones || [];
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error in generateDraftMilestones:', error);
    return [];
  }
}

// PASS 4: Anti-Generic Review - Quality control (Chat Completion)
async function reviewMilestones(
  milestones: any[],
  enneagramType: string,
  assumptions: { risks: string[] }
): Promise<{ corrections: string[]; approved: boolean }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a ruthless milestone quality reviewer. You flag generic, vague, or unmeasurable milestones.'
        },
        {
          role: 'user',
          content: `Review these milestones for quality issues:

${JSON.stringify(milestones, null, 2)}

ENNEAGRAM TYPE: ${enneagramType}
RISKS TO AVOID: ${assumptions.risks.join(', ')}

Flag any milestone that has these problems:
1. Generic language (too broad, vague, could apply to any goal)
2. No measurable outcome (can't verify completion)
3. Would trigger Type ${enneagramType} blind spots (overdoing or avoiding)
4. Has dates in the past
5. Lacks specificity (what exactly gets done?)

For each flagged milestone, provide specific correction guidance.

Return ONLY valid JSON:
{
  "corrections": [
    "Milestone 1: Issue - specific fix needed",
    "Milestone 3: Issue - specific fix needed"
  ],
  "approved": false
}

If all milestones are good, return:
{
  "corrections": [],
  "approved": true
}`
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error in reviewMilestones:', error);
    return { corrections: [], approved: true };
  }
}

// PASS 5: Final Synthesis - Apply corrections and polish (Assistant API)
async function synthesizeFinalMilestones(
  draftMilestones: any[],
  corrections: string[],
  enneagramType: string,
  targetDate: string
): Promise<any[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const thread = await openai.beta.threads.create();

    const systemPrompt = `You are a milestone refinement expert. Apply reviewer feedback to create perfect milestones.

DRAFT MILESTONES:
${JSON.stringify(draftMilestones, null, 2)}

CORRECTIONS TO APPLY:
${corrections.join('\n')}

ENNEAGRAM TYPE: ${enneagramType}
TODAY: ${today}
TARGET DATE: ${targetDate}

Apply all corrections:
- Fix generic language → make specific and actionable
- Add measurable outcomes → concrete deliverables
- Increase behavioral pressure → make milestones non-negotiable
- Cut 20% verbosity → be concise
- Ensure dates are valid (${today} or later, before ${targetDate})
- Address Type ${enneagramType} blind spots in tips

Return the SAME JSON structure as draft milestones, but with improvements applied.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "milestones": [
    {
      "id": "1",
      "title": "...",
      "description": "...",
      "startDate": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "blindSpotTip": "...",
      "strengthHook": "...",
      "measurableOutcome": "..."
    }
  ]
}`;

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_GOAL_QST_GENERATOR_ID!,
    });

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === 'in_progress' || response.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (response.status === 'completed') {
      const messageList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messageList.data
        .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
        .pop();

      if (lastMessage && lastMessage.content && lastMessage.content.length > 0) {
        const firstContent = lastMessage.content[0];
        if (firstContent.type === 'text') {
          const content = firstContent.text.value;
          let cleaned = content.trim();

          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsed = JSON.parse(cleaned);
          return parsed.milestones || draftMilestones;
        }
      }
    }

    return draftMilestones;
  } catch (error) {
    console.error('Error in synthesizeFinalMilestones:', error);
    return draftMilestones;
  }
}

// Main handler for enhanced plan generation (4-pass architecture)
async function handleEnhancedPlanRequest(
  body: {
    goalDescription: string;
    targetDate: string;
    hasTimePressure: boolean;
    personalitySummary: string;
    enneagramType: string;
  },
  userInfo: { userId: string; userEmail: string } | null
) {
  try {
    const { goalDescription, targetDate, hasTimePressure, personalitySummary, enneagramType } = body;

    console.log('🚀 Starting 4-pass enhanced plan generation...');
    console.log('Goal:', goalDescription);
    console.log('Target:', targetDate);
    console.log('Type:', enneagramType);

    // PASS 1: Context Lock (Chat Completion - gpt-4o-mini)
    console.log('📋 PASS 1: Generating goal frame...');
    const goalFrame = await generateGoalFrame(goalDescription, targetDate, personalitySummary);
    console.log('✅ Goal frame:', goalFrame);

    // PASS 2: Assumption Builder (Chat Completion - gpt-4o-mini)
    console.log('🧠 PASS 2: Generating assumptions...');
    const assumptions = await generateAssumptions(
      goalDescription,
      targetDate,
      hasTimePressure,
      personalitySummary,
      enneagramType
    );
    console.log('✅ Assumptions:', assumptions);

    // PASS 3: Draft Milestones (Assistant API - gpt-4o)
    console.log('📝 PASS 3: Generating draft milestones...');
    const draftMilestones = await generateDraftMilestones(
      goalDescription,
      targetDate,
      hasTimePressure,
      enneagramType,
      goalFrame,
      assumptions
    );

    if (draftMilestones.length === 0) {
      console.error('❌ Failed to generate draft milestones');
      return NextResponse.json(
        { error: 'Failed to generate milestones' },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${draftMilestones.length} draft milestones`);

    // PASS 4: Anti-Generic Review (Chat Completion - gpt-4o-mini)
    console.log('🔍 PASS 4: Reviewing milestones for quality...');
    const review = await reviewMilestones(draftMilestones, enneagramType, assumptions);
    console.log('✅ Review:', review);

    // PASS 5: Final Synthesis (Assistant API - gpt-4o) - only if corrections needed
    let finalMilestones = draftMilestones;
    if (review.corrections.length > 0) {
      console.log('✨ PASS 5: Synthesizing final milestones with corrections...');
      finalMilestones = await synthesizeFinalMilestones(
        draftMilestones,
        review.corrections,
        enneagramType,
        targetDate
      );
      console.log(`✅ Final milestones synthesized: ${finalMilestones.length} milestones`);
    } else {
      console.log('✅ No corrections needed, using draft milestones as final');
    }

    // Track token usage (estimated: ~1000 tokens total across all passes)
    try {
      const userEmail = userInfo?.userEmail || 'anonymous@example.com';
      await logTokenUsage('openai_enhanced_plan', userEmail, 1000);
      console.log('✅ Token usage logged');
    } catch (trackingError) {
      console.error('❌ Token tracking failed:', trackingError);
    }

    console.log('🎉 Enhanced plan generation complete!');

    return NextResponse.json({
      milestones: finalMilestones,
      goalFrame,
      assumptions,
      reviewNotes: review.corrections,
      generationMethod: '4-pass-enhanced'
    });

  } catch (error) {
    console.error('❌ Error in enhanced plan generation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate enhanced plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}