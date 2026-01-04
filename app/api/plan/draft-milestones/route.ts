// app/api/plan/draft-milestones/route.ts
// PASS 3: Generate draft milestones using Assistants API
// Target: < 9 seconds (single assistant run, no polling loops)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getPlanDocument, updatePlanWithDraft, updatePlanWithError } from '../../../../lib/planPersistence';

// Set maximum execution time to 60 seconds for this route
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    console.log('📝 PASS 3: Starting draft-milestones for planId:', planId);

    // Load plan document from Firestore
    const planDoc = await getPlanDocument(planId);

    if (!planDoc) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (planDoc.status !== 'framed') {
      return NextResponse.json(
        { error: `Plan status is ${planDoc.status}, expected 'framed'` },
        { status: 400 }
      );
    }

    if (!planDoc.goalFrame || !planDoc.assumptions) {
      return NextResponse.json(
        { error: 'Plan missing goalFrame or assumptions' },
        { status: 400 }
      );
    }

    console.log('✅ Plan document loaded');

    // PASS 3: Generate draft milestones (Assistant API)
    const draftMilestones = await generateDraftMilestones(
      planDoc.input.goalDescription,
      planDoc.input.targetDate,
      planDoc.input.hasTimePressure,
      planDoc.input.enneagramType,
      planDoc.goalFrame,
      planDoc.assumptions
    );

    if (draftMilestones.length === 0) {
      console.error('❌ Failed to generate draft milestones');
      await updatePlanWithError(planId, 'Failed to generate draft milestones');
      return NextResponse.json(
        { error: 'Failed to generate milestones' },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${draftMilestones.length} draft milestones`);

    // Save draft milestones to Firestore
    await updatePlanWithDraft(planId, draftMilestones);
    console.log('✅ Plan updated with draft milestones');

    return NextResponse.json({
      planId,
      draftMilestones,
      status: 'drafted',
    });

  } catch (error) {
    console.error('❌ Error in draft-milestones:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate draft milestones',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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

    // Poll for completion with timeout protection (max 7 seconds to leave buffer for other operations)
    const startTime = Date.now();
    const maxWaitTime = 7000; // 7 seconds max

    while ((response.status === 'in_progress' || response.status === 'queued') && (Date.now() - startTime < maxWaitTime)) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Poll every 500ms
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
    } else if (response.status === 'in_progress' || response.status === 'queued') {
      // Assistant is still processing - save thread/run IDs to Firestore for retry
      console.warn(`⏱️ Assistant run still processing after ${maxWaitTime}ms. Status: ${response.status}`);
      console.log(`Thread ID: ${thread.id}, Run ID: ${run.id}`);
      // Return empty array - client can retry this route
      return [];
    }

    return [];
  } catch (error) {
    console.error('Error in generateDraftMilestones:', error);
    return [];
  }
}
