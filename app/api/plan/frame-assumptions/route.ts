// app/api/plan/frame-assumptions/route.ts
// PASS 1 + PASS 2: Frame goal and generate assumptions
// Target: < 3 seconds (uses only gpt-4o-mini Chat Completions)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createPlanDocument, updatePlanWithFrame, GoalFrame, Assumptions, PlanInput } from '../../../../lib/planPersistence';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalDescription, targetDate, hasTimePressure, personalitySummary, enneagramType, userId } = body;

    // Generate unique plan ID
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 PASS 1+2: Starting frame-assumptions for planId:', planId);

    // Create initial plan document
    const input: PlanInput = {
      goalDescription,
      targetDate,
      hasTimePressure,
      personalitySummary,
      enneagramType,
      userId,
    };

    await createPlanDocument(planId, input);
    console.log('✅ Plan document created');

    // PASS 1: Generate goal frame + goal name + date realism (Chat Completion - gpt-4o-mini)
    console.log('📋 PASS 1: Generating goal frame, name, and date realism...');
    const { goalFrame, goalName, dateRealism } = await generateGoalFrame(goalDescription, targetDate, personalitySummary);
    console.log('✅ Goal frame and name generated. Date realism:', dateRealism.verdict);

    // PASS 2: Generate assumptions (Chat Completion - gpt-4o-mini)
    console.log('🧠 PASS 2: Generating assumptions...');
    const assumptions = await generateAssumptions(
      goalDescription,
      targetDate,
      hasTimePressure,
      personalitySummary,
      enneagramType
    );
    console.log('✅ Assumptions generated');

    // Save to Firestore
    await updatePlanWithFrame(planId, goalFrame, assumptions, goalName);
    console.log('✅ Plan updated with frame, assumptions, and goal name');

    return NextResponse.json({
      planId,
      goalFrame,
      assumptions,
      goalName,
      dateRealism,
      status: 'framed',
    });

  } catch (error) {
    console.error('❌ Error in frame-assumptions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate goal frame and assumptions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PASS 1: Context Lock - Frame the goal with specificity + generate concise name + date realism (Chat Completion)
async function generateGoalFrame(
  goalDescription: string,
  targetDate: string,
  personalitySummary: string
): Promise<{ goalFrame: GoalFrame; goalName: string; dateRealism: { verdict: string; warningMessage: string } }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const daysUntilTarget = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a goal clarity expert. Your job is to force specificity, eliminate ambiguity, and assess timeline realism.'
        },
        {
          role: 'user',
          content: `Summarize this goal in 3 lines:

Goal: ${goalDescription}
Target Date: ${targetDate}
Today: ${today}
Days available: ${daysUntilTarget}
${personalitySummary ? `Personality: ${personalitySummary}` : ''}

Generate:
1. **Goal Name**: A concise, action-oriented title (3-5 words max) that captures the essence.
   - Start with an action verb (Launch, Secure, Finish, Reach, Build, Run, Get)
   - Include key metric or deliverable
   - Sound natural and conversational
   Examples: "Finish capstone project", "Secure first 3 clients", "Reach 10k MRR", "Run first marathon"

2. **Success Criteria**: What success looks like (observable, measurable)

3. **Failure Criteria**: What failure looks like (concrete warning signs)

4. **Must Avoid**: Anti-patterns, traps (3 items)

5. **Date Realism**: Assess whether ${daysUntilTarget} days is realistic for this specific goal.
   - "too_short": The timeline is unrealistically tight for this type of goal (e.g. becoming a consultant in 2 weeks)
   - "reasonable": The timeline is achievable with focused effort
   - "generous": The timeline has plenty of buffer
   If "too_short", provide a brief, friendly warning message explaining why and suggesting a more realistic timeframe.

Return ONLY valid JSON:
{
  "goalName": "...",
  "successCriteria": "...",
  "failureCriteria": "...",
  "mustAvoid": ["...", "...", "..."],
  "dateRealism": {
    "verdict": "too_short" | "reasonable" | "generous",
    "warningMessage": "..."
  }
}`
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    return {
      goalFrame: {
        successCriteria: parsed.successCriteria,
        failureCriteria: parsed.failureCriteria,
        mustAvoid: parsed.mustAvoid
      },
      goalName: parsed.goalName || "Personal Goal",
      dateRealism: parsed.dateRealism || { verdict: 'reasonable', warningMessage: '' }
    };
  } catch (error) {
    console.error('Error in generateGoalFrame:', error);
    return {
      goalFrame: {
        successCriteria: 'Complete the goal by target date',
        failureCriteria: 'Miss the deadline or abandon the goal',
        mustAvoid: ['Procrastination', 'Lack of accountability', 'Unclear metrics']
      },
      goalName: "Personal Goal",
      dateRealism: { verdict: 'reasonable', warningMessage: '' }
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
): Promise<Assumptions> {
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
