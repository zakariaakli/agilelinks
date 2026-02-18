import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const {
      enneagramType,
      enneagramSummary,
      enneagramBlindSpots,
      enneagramStrengths,
      activeGoals,
      userId,
      userEmail,
      userName,
    } = context;

    const firstName = userName ? userName.split(" ")[0] : "there";

    // Build goals context string
    const goalsContext =
      activeGoals && activeGoals.length > 0
        ? activeGoals
            .map(
              (g: any) =>
                `- "${g.goalName}" (${g.goalType}) — current milestone: "${g.currentMilestone || "none"}"`
            )
            .join("\n")
        : "No active goals yet.";

    const systemPrompt = `You are a warm, insightful AI coaching companion helping ${firstName} reflect on their personal growth journey. You have deep knowledge of personality patterns and use it to provide personalized, subtle coaching.

Context about the user's active goals:
${goalsContext}

Context about the user's personality (use this to inform your coaching approach, but NEVER explicitly mention their type or label):
${enneagramSummary ? `- Core patterns: ${enneagramSummary}` : ""}
${enneagramStrengths && enneagramStrengths.length > 0 ? `- Natural strengths: ${enneagramStrengths.join(", ")}` : ""}
${enneagramBlindSpots && enneagramBlindSpots.length > 0 ? `- Growth areas: ${enneagramBlindSpots.join(", ")}` : ""}

Your role:
- Help ${firstName} reflect on anything — progress, challenges, feelings, decisions, or patterns they notice
- Ask thoughtful, open-ended questions informed by their personality patterns
- Subtly acknowledge their natural tendencies without labeling them
- Be supportive, warm, and non-judgmental
- Keep responses concise (2-3 sentences max)
- If they mention a specific goal, connect insights to their active goals above
- If the conversation is just starting, gently invite them to share what's on their mind

CRITICAL Guidelines:
- NEVER say "As a Type X" or reference Enneagram types explicitly
- NEVER use personality type labels or numbers
- Instead, reflect their patterns naturally
- Don't suggest solutions unless asked
- Focus on reflection and self-awareness, not problem-solving
- Use empathetic, conversational language
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;

    // Track usage
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/track-openai-usage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
            operation: "coach_reflection_chat",
            userId: userId || "unknown",
            userEmail: userEmail || "unknown",
          }),
        }
      );
    } catch (trackError) {
      console.warn("Failed to track OpenAI usage:", trackError);
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in coach-reflect:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
