import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { TYPE_INDICATORS, CENTERS_OVERVIEW } from '../../../../Data/enneagramAssessmentData';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

const EnneagramScoreSchema = z.object({
  enneagramType1: z.number().min(3).max(20),
  enneagramType2: z.number().min(3).max(20),
  enneagramType3: z.number().min(3).max(20),
  enneagramType4: z.number().min(3).max(20),
  enneagramType5: z.number().min(3).max(20),
  enneagramType6: z.number().min(3).max(20),
  enneagramType7: z.number().min(3).max(20),
  enneagramType8: z.number().min(3).max(20),
  enneagramType9: z.number().min(3).max(20),
  dominantType: z.number().min(1).max(9),
  summary: z.string(),
  coreMotivation: z.string(),
  keyStrengths: z.array(z.string()).min(2).max(4),
  growthAreas: z.array(z.string()).min(1).max(3),
  blindSpots: z.array(z.string()).min(1).max(3),
  coachNote: z.string(),
});

function buildScoringPrompt(): string {
  const typeDetails = Object.entries(TYPE_INDICATORS)
    .map(([typeNum, info]) => {
      return `TYPE ${typeNum} (${info.center.toUpperCase()} CENTER):
  Core Fear: ${info.coreFear}
  Core Desire: ${info.coreDesire}
  Core Motivation: ${info.coreMotivation}
  Defense Pattern: ${info.defensePattern}
  Under Stress: ${info.underStress}
  At Best: ${info.atBest}
  Key Interview Markers:
    ${info.keyInterviewMarkers.map((m) => `• ${m}`).join('\n    ')}
  Commonly Misidentified As: ${info.commonMisidentifications.join(', ')}`;
    })
    .join('\n\n');

  const centersDetail = Object.entries(CENTERS_OVERVIEW)
    .map(
      ([center, info]) =>
        `${center.toUpperCase()} CENTER (Types ${info.types.join(', ')}): ${info.coreIssue}. ${info.theme}`
    )
    .join('\n');

  return `You are an expert Enneagram analyst trained in the Riso-Hudson methodology. Your task is to analyze a typing interview transcript and produce accurate Enneagram scores for all 9 types.

CENTERS OF INTELLIGENCE:
${centersDetail}

COMPLETE TYPE REFERENCE:
${typeDetails}

SCORING INSTRUCTIONS:
1. Read the full transcript carefully, attending to HOW the person talks — word choices, what they avoid, what energizes them
2. Identify the most likely center first (gut/heart/head), then narrow to the specific type
3. Assign scores on a scale of 3–20 for each type:
   - Dominant type: 16–20
   - Secondary / wing candidates: 10–15
   - Plausible alternatives: 6–9
   - Unlikely types: 3–5
4. The scores should tell a story — realistic spread, not flat
5. The dominantType field must match the type with the highest score
6. summary: Write a 2-3 sentence description of who this person appears to be, based ONLY on what emerged in the conversation (no type jargon)
7. coreMotivation: What seems to drive this person at the deepest level (based on conversation evidence)
8. keyStrengths: What natural strengths appeared in how they engaged with questions
9. growthAreas: Where the patterns revealed suggest growth opportunities
10. blindSpots: What the conversation suggests this person may not fully see about themselves
11. coachNote: A 2-3 sentence note FOR THE COACH highlighting what to explore in the first session to validate/challenge the AI's hypothesis

IMPORTANT:
- Base scores on EVIDENCE from the transcript, not assumptions
- If the conversation is inconclusive, spread scores more evenly
- Never score a type 20 unless there is very clear, repeated evidence
- The coachNote should be specific to what emerged — not generic`;
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length < 4) {
      return NextResponse.json(
        { error: 'A transcript with at least 4 messages is required' },
        { status: 400 }
      );
    }

    // Format transcript for analysis
    const transcriptText = transcript
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role === 'user' ? 'PERSON' : 'INTERVIEWER'}: ${msg.content}`
      )
      .join('\n\n');

    const systemPrompt = buildScoringPrompt();

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please analyze this Enneagram typing interview transcript and provide scores for all 9 types:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.3,
      response_format: zodResponseFormat(EnneagramScoreSchema, 'enneagram_scores'),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      throw new Error('Failed to parse structured response');
    }

    // Track usage
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/track-openai-usage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
            operation: 'enneagram_scoring',
            userId: 'pre-auth',
            userEmail: 'pre-auth',
          }),
        }
      );
    } catch {
      // Non-critical
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in enneagram-score:', error);
    return NextResponse.json({ error: 'Failed to compute Enneagram scores' }, { status: 500 });
  }
}
