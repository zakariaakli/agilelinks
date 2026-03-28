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

interface StructuredContext {
  phase1?: { gut: number; head: number; heart: number };
  phase2?: { triad: string; scores: Record<string, number> };
  candidateTypes?: number[];
}

function buildScoringPrompt(structuredContext?: StructuredContext): string {
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

  let structuredEvidence = '';
  if (structuredContext) {
    const lines: string[] = ['STRUCTURED ASSESSMENT EVIDENCE (treat as high-confidence signal):'];

    if (structuredContext.phase1) {
      const { gut, head, heart } = structuredContext.phase1;
      const dominant = Object.entries({ gut, head, heart }).sort((a, b) => b[1] - a[1])[0];
      lines.push(`Phase 1 (Triad Detection): Gut=${gut}/5, Head=${head}/5, Heart=${heart}/5 → Dominant center: ${dominant[0].toUpperCase()}`);
    }

    if (structuredContext.phase2) {
      const { triad, scores } = structuredContext.phase2;
      const sortedTypes = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([type, score]) => `Type ${type}: ${score}/5`)
        .join(', ');
      lines.push(`Phase 2 (Within-Triad: ${triad.toUpperCase()}): ${sortedTypes}`);
    }

    if (structuredContext.candidateTypes?.length) {
      lines.push(`Top candidate types from structured phases: ${structuredContext.candidateTypes.map((t) => `Type ${t}`).join(', ')}`);
      lines.push('Weight these types significantly higher when assigning scores unless the Phase 3 transcript provides strong contradicting evidence.');
    }

    structuredEvidence = '\n\n' + lines.join('\n');
  }

  return `You are an expert Enneagram analyst trained in the Riso-Hudson methodology. Your task is to produce accurate Enneagram scores based on a 3-phase structured assessment.
${structuredEvidence}

CENTERS OF INTELLIGENCE:
${centersDetail}

COMPLETE TYPE REFERENCE:
${typeDetails}

SCORING INSTRUCTIONS:
1. Use the structured evidence above as your primary signal — it reflects forced-choice responses less susceptible to self-image bias
2. Use the Phase 3 conversation transcript as qualitative depth — it validates, nuances, or challenges the structured findings
3. Assign scores on a scale of 3–20 for each type:
   - Dominant type: 16–20
   - Secondary / wing candidates: 10–15
   - Plausible alternatives: 6–9
   - Unlikely types: 3–5
4. The dominantType field must match the type with the highest score
5. summary: 2-3 sentence description of who this person appears to be (no type jargon)
6. coreMotivation: What seems to drive this person at the deepest level
7. keyStrengths: Natural strengths that appeared across all phases
8. growthAreas: Where patterns suggest growth opportunities
9. blindSpots: What this person may not fully see about themselves
10. coachNote: 2-3 sentence note FOR THE COACH highlighting what to explore in session 1 to validate/challenge the hypothesis — reference specific moments from the assessment

IMPORTANT:
- If structured evidence clearly points to one type but the transcript is ambiguous, trust the structured evidence
- Never score a type 20 unless there is very clear, repeated evidence across multiple phases
- The coachNote should be specific — not generic`;
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, structuredContext } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length < 2) {
      return NextResponse.json(
        { error: 'A transcript with at least 2 messages is required' },
        { status: 400 }
      );
    }

    const transcriptText = transcript
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role === 'user' ? 'PERSON' : 'COACH'}: ${msg.content}`
      )
      .join('\n\n');

    const systemPrompt = buildScoringPrompt(structuredContext);

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please analyze this assessment and provide scores for all 9 types:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.3,
      response_format: zodResponseFormat(EnneagramScoreSchema, 'enneagram_scores'),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      throw new Error('Failed to parse structured response');
    }

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
