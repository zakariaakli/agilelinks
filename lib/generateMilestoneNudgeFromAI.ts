import { OpenAI } from 'openai';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';

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

interface AssistantInput {
  goalContext: string;
  milestone: {
    title: string;
    description: string;
    blindSpotTip: string | null;
    strengthHook: string | null;
    daysInProgress: number;
    totalDays: number;
    daysRemaining: number;
  };
  personalityContext: string;
  growthAdvice: string;
  previousNudge: string;
  userFeedback: string;
}

export async function generateMilestoneNudgeFromAI(input: GenerateMilestoneNudgeInput) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY
  });

  try {
    console.log('=== MILESTONE NUDGE PERSONALIZATION DEBUG ===');
    console.log('Input userId:', input.userId);

    // Get user's personality data for personalization
    const userDocRef = doc(db, 'users', input.userId);
    const userDoc = await getDoc(userDocRef);
    let personalityContext = '';
    let enneagramTypeNumber = '';

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const enneagramResult = userData.enneagramResult;
      if (enneagramResult && enneagramResult.summary) {
        personalityContext = enneagramResult.summary;
        console.log('Personality context found:', personalityContext);

        // Extract Enneagram type number from summary
        const typeMatch = personalityContext.match(/enneagram type (\d+)/i);
        if (typeMatch) {
          enneagramTypeNumber = typeMatch[1];
          console.log('Extracted Enneagram type number:', enneagramTypeNumber);
        }
      }
    }

    // Query Firebase personalization data for milestone_nudge
    let growthAdvice = '';
    if (enneagramTypeNumber) {
      try {
        console.log('Querying Firebase for milestone_nudge personalization...');
        const personalizationQuery = query(
          collection(db, 'personalization'),
          where('topic', '==', 'milestone_nudge'),
          where('type', '==', enneagramTypeNumber),
          limit(1)
        );

        const querySnapshot = await getDocs(personalizationQuery);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          growthAdvice = doc.data().summary || '';
          console.log('Retrieved growth advice:', growthAdvice);
        } else {
          console.log('No personalization data found for milestone_nudge');
        }
      } catch (firebaseError) {
        console.error('Error fetching milestone_nudge personalization:', firebaseError);
      }
    }

    // Query for the most recent notification for this milestone
    let previousNudge = '';
    let userFeedback = '';
    try {
      console.log('Querying for previous nudge for milestone:', input.milestone.id);
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', input.userId),
        where('milestoneId', '==', input.milestone.id),
        where('type', '==', 'milestone_reminder'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      if (!notificationsSnapshot.empty) {
        const notificationDoc = notificationsSnapshot.docs[0];
        const notificationData = notificationDoc.data();
        previousNudge = notificationData.prompt || notificationData.message || '';
        userFeedback = notificationData.feedback || '';
        console.log('Retrieved previous nudge:', previousNudge);
        console.log('Retrieved user feedback:', userFeedback);
      } else {
        console.log('No previous nudge found for this milestone');
      }
    } catch (firebaseError) {
      console.error('Error fetching previous nudge:', firebaseError);
    }

    const thread = await openai.beta.threads.create();

    // Calculate milestone timeline context
    const today = new Date();
    const startDate = new Date(input.milestone.startDate);
    const dueDate = new Date(input.milestone.dueDate);
    const totalDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare assistant input in the exact format requested
    const assistantInput: AssistantInput = {
      goalContext: input.goalContext,
      milestone: {
        title: input.milestone.title,
        description: input.milestone.description,
        blindSpotTip: input.milestone.blindSpotTip || null,
        strengthHook: input.milestone.strengthHook || null,
        daysInProgress,
        totalDays,
        daysRemaining
      },
      personalityContext,
      growthAdvice,
      previousNudge,
      userFeedback
    };

    console.log('Sending to assistant:', JSON.stringify(assistantInput, null, 2));
    console.log('=== END MILESTONE NUDGE PERSONALIZATION DEBUG ===');

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: JSON.stringify(assistantInput)
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_MILESTONE_NDG_GENERATOR_ID!,
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