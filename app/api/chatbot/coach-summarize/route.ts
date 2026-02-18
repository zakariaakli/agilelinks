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

    // Build conversation text
    const conversationText = transcript
      .map(
        (msg: any) =>
          `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`
      )
      .join("\n");

    const systemPrompt = `Summarize the following coaching reflection conversation in 2-3 sentences. Capture:
1. Key insights ${firstName} shared
2. Main themes or patterns
3. Any actionable takeaways (if mentioned)

Be concise and use a neutral, personal tone. Refer to the person as "${firstName}" (not "the user").

Conversation:
${conversationText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.5,
      max_tokens: 150,
    });

    const summary =
      completion.choices[0].message.content || "Reflection completed.";

    // Calculate chat duration
    const chatStartTime = transcript[0]?.timestamp
      ? new Date(transcript[0].timestamp)
      : new Date();
    const chatEndTime = new Date();
    const chatDuration = Math.floor(
      (chatEndTime.getTime() - chatStartTime.getTime()) / 1000
    );

    // Save coaching session to Firestore
    if (userId) {
      try {
        await addDoc(collection(db, "coaching_sessions"), {
          userId,
          userEmail: userEmail || null,
          userName: userName || null,
          summary,
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
            operation: "coach_reflection_summary",
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
    console.error("Error in coach-summarize:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
