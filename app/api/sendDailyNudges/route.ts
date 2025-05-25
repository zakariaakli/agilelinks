import { NextResponse } from 'next/server';
import { sendDailyNudges } from '../../../lib/sendNudge';

export async function GET() {
  try {
    await sendDailyNudges();
    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err });
  }
}