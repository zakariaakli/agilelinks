import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "../../../../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, userId, userEmail, userName, enneagramType } =
      await request.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const firstName = userName ? userName.split(" ")[0] : "The user";

    const conversationText = transcript
      .map(
        (msg: any) =>
          `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`
      )
      .join("\n");

    const systemPrompt = `Analyze the following conversation where ${firstName} was preparing for a difficult conversation. Extract:

1. SCENARIO: A one-sentence description of the situation (who, what, why it's difficult)
2. SUMMARY: 2-3 sentences capturing the key context, ${firstName}'s main concern, and their desired outcome
3. KEY_TACTICS: A JSON array of 2-4 specific actionable tactics or scripts that were identified (e.g. "Start with: 'I want to understand your perspective before sharing mine'")

Respond ONLY in this exact JSON format:
{
  "scenario": "...",
  "summary": "...",
  "keyTactics": ["...", "..."]
}

Conversation:
${conversationText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 400,
    });

    const rawContent = completion.choices[0].message.content || "{}";

    let scenario = "";
    let summary = "Difficult conversation session completed.";
    let keyTactics: string[] = [];

    try {
      const parsed = JSON.parse(rawContent);
      scenario = parsed.scenario || "";
      summary = parsed.summary || summary;
      keyTactics = Array.isArray(parsed.keyTactics) ? parsed.keyTactics : [];
    } catch {
      // Fallback: use raw content as summary if JSON parse fails
      summary = rawContent.slice(0, 300);
    }

    // Calculate chat duration
    const chatStartTime = transcript[0]?.timestamp
      ? new Date(transcript[0].timestamp)
      : new Date();
    const chatEndTime = new Date();
    const chatDuration = Math.floor(
      (chatEndTime.getTime() - chatStartTime.getTime()) / 1000
    );

    // Save to dedicated difficult_conversations collection
    if (userId) {
      try {
        await addDoc(collection(db, "difficult_conversations"), {
          userId,
          userEmail: userEmail || null,
          userName: userName || null,
          scenario,
          summary,
          keyTactics,
          messageCount: transcript.length,
          chatDuration,
          chatStartTime: Timestamp.fromDate(chatStartTime),
          chatEndTime: Timestamp.fromDate(chatEndTime),
          enneagramType: enneagramType || null,
          createdAt: Timestamp.fromDate(new Date()),
        });
      } catch (firestoreError) {
        console.error("Firestore save error:", firestoreError);
      }
    }

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
            operation: "difficult_conv_summarize",
            userId: userId || "unknown",
            userEmail: userEmail || "unknown",
          }),
        }
      );
    } catch (trackError) {
      console.warn("Failed to track OpenAI usage:", trackError);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error in difficult-conv-summarize:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
