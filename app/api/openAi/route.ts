// app/api/openai-assistant/route.ts (for App Router)

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

interface RequestBody {
  objective: string;
  personalitySummary: string;
}

interface MilestoneRequestBody {
  goalType: string;
  goalSummary: string;
  targetDate: string;
  enneagramType: string;
  personalitySummary: string;
  paceInfo: { hasTimePressure: boolean };
  qaPairs: Array<{ question: string; answer: string }>;
  goalTemplate: Array<{
    id: string;
    title: string;
    description: string;
    defaultOffsetDays: number;
  }>;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

// Replace your existing POST function with this:
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const assistantType = url.searchParams.get('type') || 'questions';

    if (assistantType === 'questions') {
      return await handleQuestionsRequest(body);
    } else if (assistantType === 'milestones') {
      return await handleMilestonesRequest(body);
    } else {
      return NextResponse.json(
        { error: 'Invalid assistant type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Keep your existing handleQuestionsRequest logic (rename your current logic to this function)
async function handleQuestionsRequest(body: RequestBody) {
  const { objective, personalitySummary } = body;

  if (!objective) {
    return NextResponse.json(
      { questions: [], error: 'Objective is required' },
      { status: 400 }
    );
  }

  try {
    // Your existing question generation logic here...
    const thread = await openai.beta.threads.create();

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

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_GOAL_QST_GENERATOR_ID!,
    });

    // Wait for completion and return response (your existing logic)
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === 'in_progress' || response.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (response.status === 'completed') {
      const messageList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messageList.data
        .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
        .pop();

      if (lastMessage) {
        const content = lastMessage.content[0]['text'].value;
        const questions = content
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && q.includes('?'))
          .slice(0, 6);

        return NextResponse.json({ questions });
      }
    }

    // Fallback questions
    const fallbackQuestions = [
      'What specific skills do you need to develop to achieve this goal?',
      'What resources or support do you currently have available?',
      'What potential obstacles do you anticipate?',
      'How will you measure success and track your progress?'
    ];

    return NextResponse.json({ questions: fallbackQuestions });

  } catch (error) {
    console.error('Error calling OpenAI Questions Assistant:', error);
    const fallbackQuestions = [
      'What specific skills do you need to develop to achieve this goal?',
      'What resources or support do you currently have available?',
      'What potential obstacles do you anticipate?',
      'How will you measure success and track your progress?'
    ];
    return NextResponse.json({ questions: fallbackQuestions });
  }
}

// Add this new function for milestone generation
async function handleMilestonesRequest(body: MilestoneRequestBody) {
  try {
    const thread = await openai.beta.threads.create();

    const systemPrompt = `You are a milestone generation assistant. Create personalized milestones based on the user's goal and personality profile.

Context:
- Goal Type: ${body.goalType}
- Goal: ${body.goalSummary}
- Target Date: ${body.targetDate}
- Personality Type: ${body.enneagramType}
- Personality Summary: ${body.personalitySummary}
- Time Pressure: ${body.paceInfo.hasTimePressure ? 'Yes' : 'No'}
- Q&A Pairs: ${JSON.stringify(body.qaPairs)}
- Goal Template: ${JSON.stringify(body.goalTemplate)}

Instructions:
1. Generate 4-8 specific, actionable milestones
2. Include personality-specific tips for blind spots and strengths
3. Adjust timeline based on time pressure preference
4. Return JSON format with milestones array containing: id, title, description, dueDate, blindSpotTip, strengthHook`;

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_MILESTONE_GENERATOR_ID!, // Add this env variable
    });

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === 'in_progress' || response.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (response.status === 'completed') {
      const messageList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messageList.data
        .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
        .pop();

      if (lastMessage) {
        const content = lastMessage.content[0]['text'].value;
        try {
          const parsedContent = JSON.parse(content);
          return NextResponse.json(parsedContent);
        } catch (parseError) {
          console.error('Error parsing milestone response:', parseError);
          return generateFallbackMilestonesResponse(body.targetDate);
        }
      }
    }

    return generateFallbackMilestonesResponse(body.targetDate);

  } catch (error) {
    console.error('Error calling OpenAI Milestones Assistant:', error);
    return generateFallbackMilestonesResponse(body.targetDate);
  }
}

// Add this helper function
function generateFallbackMilestonesResponse(targetDate: string) {
  const today = new Date();
  const endDate = new Date(targetDate);
  const timeSpan = endDate.getTime() - today.getTime();
  const quarterSpan = timeSpan / 4;

  const fallbackMilestones = [
    {
      id: '1',
      title: 'Research and Planning Phase',
      description: 'Conduct market research and create detailed action plan',
      dueDate: new Date(today.getTime() + quarterSpan).toISOString().split('T')[0],
      blindSpotTip: 'Don\'t get stuck in analysis paralysis',
      strengthHook: 'Use your natural planning abilities'
    },
    {
      id: '2',
      title: 'Skill Development',
      description: 'Complete necessary training and skill building activities',
      dueDate: new Date(today.getTime() + quarterSpan * 2).toISOString().split('T')[0],
      blindSpotTip: 'Set specific learning goals',
      strengthHook: 'Leverage your learning style'
    },
    {
      id: '3',
      title: 'Implementation Phase',
      description: 'Execute the main activities towards achieving the goal',
      dueDate: new Date(today.getTime() + quarterSpan * 3).toISOString().split('T')[0],
      blindSpotTip: 'Stay consistent with daily actions',
      strengthHook: 'Focus on your key strengths'
    },
    {
      id: '4',
      title: 'Final Push and Evaluation',
      description: 'Complete final steps and evaluate progress',
      dueDate: targetDate,
      blindSpotTip: 'Don\'t neglect the final details',
      strengthHook: 'Use your determination to finish strong'
    }
  ];

  return NextResponse.json({ milestones: fallbackMilestones });
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}