import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase-admin';

const VALID_SETS = [
  'phase1',
  'phase2_gut',
  'phase2_head',
  'phase2_heart',
  'phase2_mixed_gut_head',
  'phase2_mixed_gut_heart',
  'phase2_mixed_head_heart',
] as const;

type QuestionSet = (typeof VALID_SETS)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const set = searchParams.get('set') as QuestionSet | null;

  if (!set || !VALID_SETS.includes(set as QuestionSet)) {
    return NextResponse.json({ error: 'Invalid or missing set parameter' }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const snap = await db.collection('assessmentConfig').doc('enneagram').get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Assessment config not found' }, { status: 404 });
    }

    const data = snap.data();
    const questions = data?.[set];

    if (!questions) {
      return NextResponse.json({ error: `Question set "${set}" not found` }, { status: 404 });
    }

    return NextResponse.json(
      { questions },
      {
        headers: {
          // Cache for 1 hour — questions rarely change
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching assessment config:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
