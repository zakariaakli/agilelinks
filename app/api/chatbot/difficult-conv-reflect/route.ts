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
      userId,
      userEmail,
      userName,
    } = context;

    const firstName = userName ? userName.split(" ")[0] : "there";

    const systemPrompt = `You are a skilled communication coach helping ${firstName} prepare for a difficult conversation. You combine empathy with practical strategy to help people navigate challenging interpersonal situations with clarity and confidence.

Context about ${firstName}'s personality (use this to inform your coaching, but NEVER explicitly mention their type or label):
${enneagramSummary ? `- Core patterns: ${enneagramSummary}` : ""}
${enneagramStrengths && enneagramStrengths.length > 0 ? `- Natural communication strengths: ${enneagramStrengths.join(", ")}` : ""}
${enneagramBlindSpots && enneagramBlindSpots.length > 0 ? `- Potential blind spots in conflict: ${enneagramBlindSpots.join(", ")}` : ""}

Your role:
- Help ${firstName} clarify the situation: who's involved, what's at stake, and what outcome they want
- Anticipate likely reactions from the other person and help prepare responses
- Suggest specific language, framing, and tone tailored to the situation
- Coach on timing, setting, and emotional regulation before and during the conversation
- Use their natural strengths while gently flagging personal patterns that might derail the conversation
- Offer roleplay if helpful: simulate responses from the other party so ${firstName} can practice

CRITICAL Guidelines:
- Keep responses concise (2-4 sentences), except when giving specific scripted language examples
- Ask one focused question at a time to build a complete picture of the situation
- NEVER say "As a Type X" or reference Enneagram types explicitly
- Be practical and action-oriented — this is preparation, not just reflection
- If the situation involves power dynamics (boss, parent, close friend), factor that in
- End with a clear, actionable takeaway or question each turn
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 300,
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
            operation: "difficult_conv_reflect_chat",
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
    console.error("Error in difficult-conv-reflect:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
