import { TrackedFirestore } from '../../../lib/trackedFirestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ status: 'error', message: 'Missing id' });

  const data = await req.formData();
  const feedback = data.get('feedback');
  const note = data.get('note');

  try {
    await TrackedFirestore.doc(`notifications/${id}`).update({
      feedback: note ? `${feedback} | Note: ${note}` : feedback,
      read: true,
    }, {
      source: 'feedback_api',
      functionName: 'update_notification_feedback'
    });
    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err });
  }
}
