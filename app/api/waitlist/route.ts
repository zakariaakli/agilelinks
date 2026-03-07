import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_SEGMENTS = ['coach', 'organization'] as const;
type Segment = (typeof VALID_SEGMENTS)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, segment } = body;

    if (!email || !segment) {
      return NextResponse.json({ error: 'Missing required fields: email and segment' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!VALID_SEGMENTS.includes(segment as Segment)) {
      return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Prevent duplicate entries for the same email + segment
    const existing = await db
      .collection('waitlist')
      .where('email', '==', email.toLowerCase().trim())
      .where('segment', '==', segment)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, message: 'Already on the waitlist' });
    }

    await db.collection('waitlist').add({
      email: email.toLowerCase().trim(),
      segment,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Added to waitlist' });
  } catch (error) {
    console.error('Error saving waitlist entry:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
