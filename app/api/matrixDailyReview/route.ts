import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  getDefaultEmailStatus,
  getDefaultNotificationMeta,
} from '../../../lib/notificationTracking';
import { trackFirebaseRead, trackFirebaseWrite } from '../../../lib/firebaseTracker';
import { toISODate } from '../../../lib/matrixPeriod';

/**
 * GET /api/matrixDailyReview
 *
 * Cron-triggered (evening, e.g. 0 19 * * *).
 * For each user with an active matrix, creates one 'daily_action_review'
 * notification — unless one was already created today.
 *
 * Mirrors the two-stage pattern of /api/milestoneReminders:
 * this route creates pending notifications fast; the actual chat content
 * is handled client-side on /profile/matrix.
 */
export async function GET(request: Request) {
  try {
    console.log('🔄 Starting matrix daily review check…');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active matrices
    const matricesSnap = await getDocs(
      query(collection(db, 'priorityMatrices'), where('status', '==', 'active'))
    );

    await trackFirebaseRead(
      'priorityMatrices',
      matricesSnap.docs.length,
      'system',
      'system@daily-review.cron',
      'server',
      'matrix_daily_review_fetch_matrices'
    );

    console.log(`📋 Found ${matricesSnap.docs.length} active matrices`);

    const today = toISODate(new Date());
    let created = 0;
    let skipped = 0;

    for (const matrixDoc of matricesSnap.docs) {
      const matrixData = matrixDoc.data();
      const userId: string = matrixData.userId;

      if (!userId) {
        console.log(`⏭️ Skipping matrix ${matrixDoc.id} — no userId`);
        continue;
      }

      // Dedup: skip if we already created a daily_action_review for this user today
      const existingSnap = await getDocs(
        query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('type', '==', 'daily_action_review'),
          where('createdAt', '>=', Timestamp.fromDate(new Date(`${today}T00:00:00.000Z`)))
        )
      );

      await trackFirebaseRead(
        'notifications',
        existingSnap.docs.length,
        userId,
        '',
        'server',
        'matrix_daily_review_dedup_check'
      );

      if (!existingSnap.empty) {
        console.log(`⏭️ Daily review already created for user ${userId} today`);
        skipped++;
        continue;
      }

      // Create the pending notification
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'daily_action_review',
        matrixId: matrixDoc.id,
        prompt: '',  // No AI text needed — the matrix page is the UX
        createdAt: Timestamp.now(),
        read: false,
        feedback: null,
        emailStatus: getDefaultEmailStatus(),
        notificationMeta: getDefaultNotificationMeta('daily_action_review'),
      });

      await trackFirebaseWrite(
        'notifications',
        1,
        userId,
        '',
        'server',
        'matrix_daily_review_create'
      );

      console.log(`✅ Created daily review notification for user ${userId}`);
      created++;
    }

    console.log(`🏁 Done: ${created} created, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: matricesSnap.docs.length,
    });
  } catch (error) {
    console.error('GET /api/matrixDailyReview error:', error);
    return NextResponse.json(
      { error: 'Failed to create daily review notifications', details: String(error) },
      { status: 500 }
    );
  }
}
