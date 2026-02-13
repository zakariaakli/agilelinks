// app/api/plan/review-synthesize/route.ts
// PASS 4 + PASS 5: Review milestones and synthesize final version
// Target: < 9 seconds (Chat Completion + conditional Assistant run)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getPlanDocument, updatePlanWithFinal, updatePlanWithError } from '../../../../lib/planPersistence';
import { logTokenUsage } from '../../../../lib/simpleTracker';

// Set maximum execution time to 60 seconds for this route
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userEmail } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 PASS 4+5: Starting review-synthesize for planId:', planId);

    // Load plan document from Firestore
    const planDoc = await getPlanDocument(planId);

    if (!planDoc) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (planDoc.status !== 'drafted') {
      return NextResponse.json(
        { error: `Plan status is ${planDoc.status}, expected 'drafted'` },
        { status: 400 }
      );
    }

    if (!planDoc.draftMilestones || planDoc.draftMilestones.length === 0) {
      return NextResponse.json(
        { error: 'Plan missing draft milestones' },
        { status: 400 }
      );
    }

    console.log('✅ Plan document loaded');

    // PASS 4: Review milestones (Chat Completion - gpt-4o-mini)
    console.log('🔍 PASS 4: Reviewing milestones for quality...');
    const review = await reviewMilestones(
      planDoc.draftMilestones,
      planDoc.input.enneagramType,
      planDoc.assumptions!
    );
    console.log('✅ Review completed:', review);

    // PASS 5: Final Synthesis (Assistant API - gpt-4o) - only if corrections needed
    let finalMilestones = planDoc.draftMilestones;
    if (review.corrections.length > 0) {
      console.log('✨ PASS 5: Synthesizing final milestones with corrections...');
      finalMilestones = await synthesizeFinalMilestones(
        planDoc.draftMilestones,
        review.corrections,
        planDoc.input.enneagramType,
        planDoc.input.targetDate
      );
      console.log(`✅ Final milestones synthesized: ${finalMilestones.length} milestones`);
    } else {
      console.log('✅ No corrections needed, using draft milestones as final');
    }

    // Save final milestones to Firestore
    await updatePlanWithFinal(planId, finalMilestones, review.corrections);
    console.log('✅ Plan finalized');

    // Track token usage
    try {
      const email = userEmail || 'anonymous@example.com';
      await logTokenUsage('openai_enhanced_plan', email, 1000);
      console.log('✅ Token usage logged');
    } catch (trackingError) {
      console.error('❌ Token tracking failed:', trackingError);
    }

    return NextResponse.json({
      planId,
      finalMilestones,
      reviewNotes: review.corrections,
      status: 'finalized',
      generationMethod: '4-pass-enhanced',
    });

  } catch (error) {
    console.error('❌ Error in review-synthesize:', error);
    return NextResponse.json(
      {
        error: 'Failed to review and synthesize milestones',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
6. Overlapping or misordered dates (milestones must be strictly sequential - each milestone's startDate should be on or after the previous milestone's dueDate, with no overlapping date ranges)
7. Missing startDate or dueDate (every milestone MUST have both a startDate and a dueDate in YYYY-MM-DD format). If startDate is missing, set it to the day after the previous milestone's dueDate. If dueDate is missing, set it to the day before the next milestone's startDate.

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
- Fix any overlapping dates: milestones must be strictly sequential (each startDate = previous dueDate or day after), no overlapping ranges
- Fix missing dates: every milestone MUST have both startDate and dueDate. If startDate is missing, set it to the day after the previous milestone's dueDate (or ${today} for the first milestone). If dueDate is missing, set it to the day before the next milestone's startDate (or ${targetDate} for the last milestone)
- First milestone starts on ${today}, last milestone ends on or before ${targetDate}
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

    // Poll for completion with timeout protection (max 50 seconds to leave buffer for other operations)
    const startTime = Date.now();
    const maxWaitTime = 50000; // 50 seconds max

    while ((response.status === 'in_progress' || response.status === 'queued') && (Date.now() - startTime < maxWaitTime)) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every 1 second
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
