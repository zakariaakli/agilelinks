import { db } from '../../../firebase'
import { doc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ status: 'error', message: 'Missing id' });

  const data = await req.formData();
  const feedback = data.get('feedback');
  const note = data.get('note');

  try {
    await updateDoc(doc(db, 'notifications', id), {
      feedback: note ? `${feedback} | Note: ${note}` : feedback,
      read: true,
    });
    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err });
  }
}
