import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const {
      nudgeText,
      feedbackChoice,
      milestoneTitle,
      milestoneDescription,
      milestoneDueDate,
      milestoneStartDate,
      goalType,
      enneagramType,
      enneagramSummary,
      enneagramBlindSpots,
      enneagramStrengths,
      goDeeper,
      userId,
      userEmail,
    } = context;

    // Build system prompt with Enneagram context
    const systemPrompt = `You are a supportive AI reflection coach helping users process their thoughts about productivity nudges. You have deep knowledge of personality patterns and use it to provide personalized, subtle coaching.

Context about the nudge:
- Nudge: "${nudgeText}"
- User's initial reaction: "${feedbackChoice}"
- Milestone: "${milestoneTitle}" (${milestoneStartDate} → ${milestoneDueDate})
- Description: "${milestoneDescription}"
- Goal Type: "${goalType}"

Context about the user's personality (use this to inform your coaching approach, but NEVER explicitly mention their type or label):
${enneagramSummary ? `- Core patterns: ${enneagramSummary}` : ''}
${enneagramStrengths && enneagramStrengths.length > 0 ? `- Natural strengths: ${enneagramStrengths.join(', ')}` : ''}
${enneagramBlindSpots && enneagramBlindSpots.length > 0 ? `- Growth areas: ${enneagramBlindSpots.join(', ')}` : ''}

Your role:
- Ask thoughtful, open-ended questions informed by their personality patterns
- Help users articulate their feelings and insights
- Subtly acknowledge their natural tendencies without labeling them (e.g., "It sounds like harmony is important to you" instead of "As a Type 9...")
- Be supportive and non-judgmental
- Keep responses concise (2-3 sentences max)
- Adapt tone based on their feedback choice:
  * "I like this nudge" → Explore what worked and how it aligns with their natural strengths
  * "You can do better next time" → Understand what could improve given their tendencies
  * "I really do not relate to that" → Discover the disconnect (may relate to their growth areas)

CRITICAL Guidelines:
- NEVER say "As a Type X" or reference Enneagram types explicitly
- NEVER use personality type labels or numbers in your responses
- Instead, reflect their patterns naturally (e.g., "It seems like you value peace and avoiding conflict" rather than "Type 9s seek peace")
- Don't suggest solutions unless asked
- Focus on reflection, not problem-solving
- Use empathetic, conversational language that feels personalized but not clinical
${goDeeper ? '- The user wants to go deeper. Ask more probing, insightful questions that connect to their personality patterns and growth areas.' : ''}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;

    // Track usage
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/track-openai-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          operation: 'nudge_reflection_chat',
          userId: userId || 'unknown',
          userEmail: userEmail || 'unknown',
        }),
      });
    } catch (trackError) {
      console.warn('Failed to track OpenAI usage:', trackError);
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in nudge-reflect:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
