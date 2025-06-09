import { OpenAI } from 'openai';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
}

interface GenerateMilestoneNudgeInput {
  milestone: Milestone;
  goalContext: string;
  userId: string;
}

export async function generateMilestoneNudgeFromAI(input: GenerateMilestoneNudgeInput) {
  const openai = new OpenAI({ 
    apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY 
  });

  try {
    // Get user's personality data for personalization
    const userDocRef = doc(db, 'users', input.userId);
    const userDoc = await getDoc(userDocRef);
    let personalityContext = '';
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const enneagramResult = userData.enneagramResult;
      if (enneagramResult && enneagramResult.summary) {
        personalityContext = `Personality Profile: ${enneagramResult.summary}`;
      }
    }

    const thread = await openai.beta.threads.create();

    // Calculate milestone timeline context
    const today = new Date();
    const startDate = new Date(input.milestone.startDate);
    const dueDate = new Date(input.milestone.dueDate);
    const totalDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const promptContent = `Generate a gentle, motivating weekly reminder for a current milestone. Be encouraging and supportive, helping the user stay on track.

Context:
- Goal: ${input.goalContext}
- Milestone: ${input.milestone.title}
- Description: ${input.milestone.description}
- Timeline: Day ${daysInProgress} of ${totalDays} (${daysRemaining} days remaining)
- Started: ${input.milestone.startDate}
- Due: ${input.milestone.dueDate}
- Blind Spot Warning: ${input.milestone.blindSpotTip || 'None provided'}
- Strength to Leverage: ${input.milestone.strengthHook || 'None provided'}
${personalityContext}

Instructions:
1. Create a warm, encouraging reminder (2-3 sentences)
2. Reference the milestone progress and timeline context
3. If available, incorporate the blind spot tip as a gentle warning
4. If available, suggest leveraging the strength hook
5. Keep the tone supportive and motivational
6. Make it actionable - suggest a specific next step for this week
7. Personalize based on personality profile if available

Example tone: "You're ${daysInProgress} days into your ${input.milestone.title} journey! Here's how to make the most of this week..."`;

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: promptContent
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_NDG_GENERATOR_ID!,
    });

    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (status !== 'completed' && attempts < maxAttempts) {
      const result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = result.status;
      
      if (status === 'failed') {
        console.error('OpenAI run failed for milestone nudge generation');
        throw new Error('AI run failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (status !== 'completed') {
      console.error('OpenAI run timed out for milestone nudge generation');
      return generateFallbackNudge(input.milestone, daysInProgress, daysRemaining);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const latest = messages.data[0];

    if (!latest || !latest.content || latest.content.length === 0) {
      console.warn('No response from OpenAI, using fallback');
      return generateFallbackNudge(input.milestone, daysInProgress, daysRemaining);
    }

    const firstContent = latest.content[0];
    if (firstContent.type === 'text') {
      return firstContent.text.value;
    }

    return generateFallbackNudge(input.milestone, daysInProgress, daysRemaining);

  } catch (error) {
    console.error('❌ OpenAI Milestone Nudge Generation Error:', error);
    const today = new Date();
    const startDate = new Date(input.milestone.startDate);
    const dueDate = new Date(input.milestone.dueDate);
    const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return generateFallbackNudge(input.milestone, daysInProgress, daysRemaining);
  }
}

// Fallback nudge generation when AI is unavailable
function generateFallbackNudge(milestone: Milestone, daysInProgress: number, daysRemaining: number): string {
  const encouragements = [
    "You're making great progress!",
    "Keep up the momentum!",
    "You've got this - stay focused!",
    "Every step forward counts!",
    "You're on the right track!"
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  
  let message = `Week ${Math.ceil(daysInProgress / 7)} of your "${milestone.title}" milestone! ${randomEncouragement} You have ${daysRemaining} days remaining to achieve this goal.`;

  // Add blind spot tip if available
  if (milestone.blindSpotTip) {
    message += ` Keep in mind: ${milestone.blindSpotTip}`;
  }

  // Add strength hook if available
  if (milestone.strengthHook) {
    message += ` Leverage your strength: ${milestone.strengthHook}`;
  }

  message += " What's one key action you can take this week to move closer to completion?";

  return message;
}