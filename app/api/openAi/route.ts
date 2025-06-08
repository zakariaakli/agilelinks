// app/api/openai-assistant/route.ts (for App Router)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

interface RequestBody {
  objective: string;
  personalitySummary: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { objective, personalitySummary } = body;

    if (!objective) {
      return NextResponse.json(
        { questions: [], error: 'Objective is required' },
        { status: 400 }
      );
    }

    // Create a thread for this specific goal-setting conversation
    const thread = await openai.beta.threads.create();

    // Create the system message that will guide the assistant
    const systemPrompt = `You are a goal-setting coach assistant. Your task is to generate 4-6 personalized clarifying questions that will help the user create a more specific and actionable plan for their goal.

Context:
- User's Goal: ${objective}
${personalitySummary ? `- User's Personality Profile: ${personalitySummary}` : ''}

Instructions:
1. Generate 4-6 thoughtful questions that will help clarify the goal
2. Questions should be specific, actionable, and relevant to the stated objective
3. If personality information is provided, tailor questions to that personality type
4. Focus on practical aspects like skills needed, resources, obstacles, timeline, and success metrics
5. Make questions open-ended to encourage detailed responses
6. Return ONLY the questions, one per line, without numbering or bullet points

Examples of good questions:
- What specific skills do you need to develop to achieve this goal?
- What resources or support do you currently have available?
- What potential obstacles do you anticipate and how might you overcome them?
- How will you measure progress and success along the way?
- What would achieving this goal mean for your personal or professional life?
- What is your backup plan if your primary approach doesn't work?`;

    // Send the request to the assistant
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_GOAL_QST_GENERATOR_ID!,
    });

    // Wait for the assistant to complete
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === 'in_progress' || response.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (response.status === 'completed') {
      // Get the assistant's response
      const messageList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messageList.data
        .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
        .pop();

      if (lastMessage) {
        const content = lastMessage.content[0]['text'].value;

        // Parse the response to extract individual questions
        const questions = content
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && q.includes('?'))
          .slice(0, 6); // Limit to 6 questions max

        return NextResponse.json({ questions });
      }
    }

    // Fallback if assistant doesn't respond properly
    const fallbackQuestions = [
      'What specific skills do you need to develop to achieve this goal?',
      'What resources or support do you currently have available?',
      'What potential obstacles do you anticipate?',
      'How will you measure success and track your progress?'
    ];

    return NextResponse.json({ questions: fallbackQuestions });

  } catch (error) {
    console.error('Error calling OpenAI Assistant:', error);

    // Return fallback questions in case of error
    const fallbackQuestions = [
      'What specific skills do you need to develop to achieve this goal?',
      'What resources or support do you currently have available?',
      'What potential obstacles do you anticipate?',
      'How will you measure success and track your progress?'
    ];

    return NextResponse.json({ questions: fallbackQuestions });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}