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

function buildSystemPrompt(turnCount: number): string {
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
- What is their first response — instinctive action, feelings/relationships, or analysis/information?
Phase 2 (turns 4-10): Narrow to the specific type within the center
- Explore core fears, motivations, and behavioral patterns
- Follow threads from what they actually say — don't jump to new topics
Phase 3 (turns 10+): ${isConverging ? 'CONVERGING — ask the final clarifying questions about core fears and what matters most at the deepest level. Make sure you have explored their relationship with control/anger (gut), shame/image (heart), or anxiety/security (head).' : 'Continue deepening into what you have discovered so far.'}

CRITICAL RULES:
- Ask EXACTLY ONE question at a time — never ask multiple questions in one message
- Keep responses warm, conversational, and concise (2-4 sentences max)
- NEVER mention Enneagram types, numbers, or labels
- NEVER use psychological jargon (centers, triads, integration, etc.)
- NEVER tell them what type they are or hint at it
- Follow the thread of what THEY say — let their words guide your next question
- When they say something revealing, dig into THAT specifically
- Focus on WHY they do things, not just WHAT they do
- Be genuinely curious and non-judgmental
- If they ask what you're doing, say you're exploring how they naturally navigate life

SAMPLE APPROACHES (adapt to their actual words):
Opening: "${DIFFERENTIATING_QUESTION_BANK.openingQuestions[0]}"
Center ID: "${DIFFERENTIATING_QUESTION_BANK.centerIdentification[0]}"
Motivation depth: "${DIFFERENTIATING_QUESTION_BANK.motivationDepthQuestions[0]}"

The conversation should feel like talking to a wise, curious friend — not answering a questionnaire.`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, turnCount = 0 } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(turnCount);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;

    // Track usage
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
            operation: 'enneagram_typing_interview',
            userId: 'pre-auth',
            userEmail: 'pre-auth',
          }),
        }
      );
    } catch {
      // Non-critical — don't fail the request
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in enneagram-assess:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
