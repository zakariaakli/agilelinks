import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  TYPE_INDICATORS,
  CENTERS_OVERVIEW,
  DIFFERENTIATING_QUESTION_BANK,
} from '../../../../Data/enneagramAssessmentData';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

// ── Phase 3: AI challenge layer for top candidate types ──────────────────────

function buildPhase3Prompt(candidateTypes: number[], turnCount: number): string {
  const candidates = candidateTypes
    .map((t) => {
      const info = TYPE_INDICATORS[t as keyof typeof TYPE_INDICATORS];
      return `Type ${t}: Core fear = "${info.coreFear}" | Core desire = "${info.coreDesire}" | Defense = "${info.defensePattern}"`;
    })
    .join('\n');

  const isConverging = turnCount >= 6;

  return `You are an elite Enneagram coach running the final validation phase of a typing assessment. The person has already answered structured questions and their responses point to one of these candidate types:

${candidates}

YOUR ROLE:
- Ask ONE scenario-based question at a time that forces the person to choose between what feels more true
- Target their blind spots and core fears — not their self-image
- Use real-life situations, not abstract concepts
- Create slight discomfort / productive friction (like a real coaching session)
- NEVER mention type numbers, Enneagram jargon, or center names
- Keep responses short: 2-3 sentences max, then ONE question

${isConverging
  ? `FINAL PHASE (turns 6+): You have enough data. Ask one decisive question that cuts to the core motivation — the deepest "why" behind their patterns. Make them choose between the fundamental fears of the candidate types.`
  : `DIFFERENTIATION PHASE: Probe the specific tension between candidate types. Look for what they avoid, what drains them, and what their automatic reactions reveal about core motivation.`
}

If they give a vague or abstract answer, push gently: "What does that look like in practice — can you give me a specific situation?"

Keep the tone: curious, slightly challenging, never judgmental.`;
}

// ── Tiebreaker: single AI-generated question for tied Phase 1 centers ────────

function buildTiebreakerPrompt(tiedCenters: string[]): string {
  const centerDescriptions: Record<string, string> = {
    gut: 'instinct, body reactions, control, anger, action — Types 8, 9, 1',
    head: 'thinking, analysis, fear, preparation, certainty — Types 5, 6, 7',
    heart: 'emotion, image, connection, shame, relationships — Types 2, 3, 4',
  };

  const centers = tiedCenters
    .map((c) => `${c.toUpperCase()} center (${centerDescriptions[c] ?? c})`)
    .join(' vs ');

  return `You are an expert Enneagram assessor. A person has tied between the following centers of intelligence: ${centers}.

Generate ONE short, decisive forced-choice question that helps distinguish which center is truly dominant for this person. The question must:
- Present a real-life scenario or instinctive reaction
- Offer exactly 2 options (A and B), one clearly representing each tied center
- Use no Enneagram jargon or type numbers
- Be slightly uncomfortable to answer — it should require genuine self-reflection
- Be 2-3 sentences max

Respond with ONLY the question and its two options in this exact format:
QUESTION: [the question]
A: [option for first center: ${tiedCenters[0]}]
B: [option for second center: ${tiedCenters[1]}]`;
}

// ── Legacy open-ended interview (kept for fallback) ──────────────────────────

function buildInterviewPrompt(turnCount: number): string {
  const typeFramework = Object.entries(TYPE_INDICATORS)
    .map(([typeNum, info]) => {
      return `Type ${typeNum} (${info.center} center):
  Core Fear: ${info.coreFear}
  Core Desire: ${info.coreDesire}
  Defense: ${info.defensePattern}
  Key markers: ${info.keyInterviewMarkers.slice(0, 3).join('; ')}`;
    })
    .join('\n\n');

  const centersGuide = Object.entries(CENTERS_OVERVIEW)
    .map(
      ([center, info]) =>
        `${center.toUpperCase()} CENTER (Types ${info.types.join(', ')}): ${info.theme}. Markers: ${info.recognitionMarkers[0]}`
    )
    .join('\n');

  const isConverging = turnCount >= 10;

  return `You are an expert Enneagram typing practitioner with 20+ years of experience conducting typing interviews. Your goal is to identify someone's core Enneagram type through a natural, empathetic conversation — NOT through a quiz or direct questioning about Enneagram types.

ENNEAGRAM FRAMEWORK:
${centersGuide}

TYPE INDICATORS:
${typeFramework}

CONVERSATION STRATEGY:
Phase 1 (turns 1-3): Use open questions to identify the person's center of intelligence (gut/heart/head)
Phase 2 (turns 4-10): Narrow to the specific type within the center
Phase 3 (turns 10+): ${isConverging ? 'CONVERGING — ask the final clarifying questions about core fears and what matters most at the deepest level.' : 'Continue deepening into what you have discovered so far.'}

CRITICAL RULES:
- Ask EXACTLY ONE question at a time — never ask multiple questions in one message
- Keep responses warm, conversational, and concise (2-4 sentences max)
- NEVER mention Enneagram types, numbers, or labels
- NEVER use psychological jargon
- Focus on WHY they do things, not just WHAT they do

SAMPLE APPROACHES (adapt to their actual words):
Opening: "${DIFFERENTIATING_QUESTION_BANK.openingQuestions[0]}"
Center ID: "${DIFFERENTIATING_QUESTION_BANK.centerIdentification[0]}"
Motivation depth: "${DIFFERENTIATING_QUESTION_BANK.motivationDepthQuestions[0]}"`;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages, turnCount = 0, mode = 'interview', candidateTypes = [], tiedCenters = [] } =
      await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    let systemPrompt: string;

    if (mode === 'phase3') {
      systemPrompt = buildPhase3Prompt(candidateTypes, turnCount);
    } else if (mode === 'tiebreaker') {
      systemPrompt = buildTiebreakerPrompt(tiedCenters);
    } else {
      systemPrompt = buildInterviewPrompt(turnCount);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: mode === 'tiebreaker' ? 0.5 : 0.7,
      max_tokens: mode === 'tiebreaker' ? 200 : 220,
    });

    const response = completion.choices[0].message.content;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/track-openai-usage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
            operation: `enneagram_${mode}`,
            userId: 'pre-auth',
            userEmail: 'pre-auth',
          }),
        }
      );
    } catch {
      // Non-critical
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in enneagram-assess:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
