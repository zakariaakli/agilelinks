import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../../../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { MatrixAction, Quadrant } from '../../../../Models/PriorityMatrix';
import { toISODate } from '../../../../lib/matrixPeriod';
import { trackFirebaseRead, trackFirebaseWrite } from '../../../../lib/firebaseTracker';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
});

const IMPORTANT_QUADRANTS = new Set<Quadrant>(['urgent_important', 'not_urgent_important']);

/** 0..1 — fraction of logged effort that landed in important quadrants. */
function computeWorthItScore(
  mappedActions: Array<{ quadrant: Quadrant; effortMinutes: number }>
): number {
  const total = mappedActions.reduce((s, a) => s + a.effortMinutes, 0);
  if (total === 0) return 0;
  const important = mappedActions
    .filter(a => IMPORTANT_QUADRANTS.has(a.quadrant))
    .reduce((s, a) => s + a.effortMinutes, 0);
  return important / total;
}

/**
 * POST /api/chatbot/matrix-daily-summarize
 *
 * Body: {
 *   matrixId: string
 *   userId: string
 *   userEmail?: string
 *   reportedText: string          // free-form "what I did today"
 *   enneagramType?: string        // for personality-aware tone
 * }
 *
 * Returns: {
 *   mappedActions: Array<{ actionId, title, effortMinutes, quadrant }>
 *   proposedActions: Array<{ title, suggestedQuadrant }>   // unmatched items
 *   aiSummary: string
 *   worthItScore: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { matrixId, userId, userEmail, reportedText, enneagramType } =
      await request.json();

    if (!matrixId || !userId || !reportedText) {
      return NextResponse.json(
        { error: 'matrixId, userId, and reportedText are required' },
        { status: 400 }
      );
    }

    // Fetch open actions for the matrix
    const actionsSnap = await getDocs(
      collection(db, 'priorityMatrices', matrixId, 'actions')
    );
    await trackFirebaseRead(
      'priorityMatrices/actions',
      actionsSnap.docs.length,
      userId,
      userEmail || '',
      'client',
      'matrix_daily_summarize_fetch_actions'
    );

    const openActions: MatrixAction[] = actionsSnap.docs
      .filter(d => d.data().status === 'open')
      .map(d => ({ id: d.id, ...d.data() } as MatrixAction));

    const actionList = openActions
      .map(a => `- id:${a.id} quadrant:${a.quadrant} "${a.title}"`)
      .join('\n');

    const systemPrompt = `You are a productivity AI that maps a user's daily work report to their Priority Matrix actions.

OPEN ACTIONS:
${actionList || '(none)'}

USER REPORT:
"${reportedText}"

${enneagramType ? `User's Enneagram type: ${enneagramType} (use this to calibrate coaching tone in aiSummary — never name the type explicitly).` : ''}

TASK:
1. For each item the user mentions doing, find the best matching open action (fuzzy match is fine).
2. Estimate effort in minutes for each matched action (be reasonable; default 30 if unclear).
3. List any items in the report that don't match any open action as proposedActions (suggest a quadrant for each).
4. Write a 2-sentence aiSummary reflecting on their day and the effort concentration.

Respond ONLY with valid JSON:
{
  "mappedActions": [
    { "actionId": "<id from list>", "effortMinutes": <number> }
  ],
  "proposedActions": [
    { "title": "<item title>", "suggestedQuadrant": "<quadrant key>" }
  ],
  "aiSummary": "<2 sentences>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content || '{}';
    let parsed: {
      mappedActions: Array<{ actionId: string; effortMinutes: number }>;
      proposedActions: Array<{ title: string; suggestedQuadrant: string }>;
      aiSummary: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { mappedActions: [], proposedActions: [], aiSummary: raw.slice(0, 200) };
    }

    const { mappedActions = [], proposedActions = [], aiSummary = '' } = parsed;

    // Enrich mapped actions with quadrant from open actions
    const enrichedMapped = mappedActions
      .map(m => {
        const action = openActions.find(a => a.id === m.actionId);
        if (!action) return null;
        return {
          actionId: m.actionId,
          title: action.title,
          effortMinutes: Math.max(0, Math.round(m.effortMinutes)),
          quadrant: action.quadrant,
        };
      })
      .filter(Boolean) as Array<{
        actionId: string;
        title: string;
        effortMinutes: number;
        quadrant: Quadrant;
      }>;

    const worthItScore = computeWorthItScore(enrichedMapped);
    const today = toISODate(new Date());

    // Write dailyLog
    await addDoc(collection(db, 'priorityMatrices', matrixId, 'dailyLogs'), {
      id: today,
      reportedText,
      mappedActions: enrichedMapped.map(({ actionId, effortMinutes, quadrant }) => ({
        actionId,
        effortMinutes,
        quadrant,
      })),
      aiSummary,
      worthItScore,
      createdAt: Timestamp.now(),
    });

    await trackFirebaseWrite(
      'priorityMatrices/dailyLogs',
      1,
      userId,
      userEmail || '',
      'client',
      'matrix_daily_summarize_write_log'
    );

    // Update effortMinutes + lastWorkedOn on matched actions
    for (const { actionId, effortMinutes } of enrichedMapped) {
      await updateDoc(
        doc(db, 'priorityMatrices', matrixId, 'actions', actionId),
        {
          effortMinutes: increment(effortMinutes),
          lastWorkedOn: today,
          updatedAt: Timestamp.now(),
        }
      );
    }

    if (enrichedMapped.length > 0) {
      await trackFirebaseWrite(
        'priorityMatrices/actions',
        enrichedMapped.length,
        userId,
        userEmail || '',
        'client',
        'matrix_daily_summarize_update_efforts'
      );
    }

    return NextResponse.json({
      mappedActions: enrichedMapped,
      proposedActions,
      aiSummary,
      worthItScore,
    });
  } catch (error) {
    console.error('POST /api/chatbot/matrix-daily-summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize daily report', details: String(error) },
      { status: 500 }
    );
  }
}
