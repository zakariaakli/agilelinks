import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../../../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      transcript,
      notifId,
      feedbackChoice,
      userId,
      userEmail,
      milestoneTitle,
      goalType,
      enneagramType,
    } = await request.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Build conversation text
    const conversationText = transcript
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `Summarize the following reflection conversation in 2-3 sentences. Capture:
1. Key insights the user shared
2. Main themes or patterns
3. Any actionable takeaways (if mentioned)

Be concise and focus on the user's perspective.

Conversation:
${conversationText}`;

    // Call OpenAI for summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.5,
      max_tokens: 150,
    });

    const summary = completion.choices[0].message.content || 'Reflection completed.';

    // Calculate chat duration
    const chatStartTime = transcript[0]?.timestamp ? new Date(transcript[0].timestamp) : new Date();
    const chatEndTime = new Date();
    const chatDuration = Math.floor((chatEndTime.getTime() - chatStartTime.getTime()) / 1000);

    // Save to Firestore
    if (notifId) {
      try {
        const notificationRef = doc(db, 'notifications', notifId);
        await updateDoc(notificationRef, {
          feedback: feedbackChoice,
          feedbackDetails: {
            aiSummary: summary,
            chatStartTime: Timestamp.fromDate(chatStartTime),
            chatEndTime: Timestamp.fromDate(chatEndTime),
            chatDuration,
            messageCount: transcript.length,
            contextUsed: {
              enneagramType: enneagramType || null,
              milestoneTitle: milestoneTitle || null,
              goalType: goalType || null,
            },
          },
          read: true,
        });
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        // Continue even if Firestore fails
      }
    }

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
          operation: 'nudge_reflection_summary',
          userId: userId || 'unknown',
          userEmail: userEmail || 'unknown',
        }),
      });
    } catch (trackError) {
      console.warn('Failed to track OpenAI usage:', trackError);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in nudge-summarize:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
