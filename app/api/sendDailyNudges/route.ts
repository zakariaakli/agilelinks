import { NextResponse } from 'next/server';

export async function GET() {
  // Daily nudges have been disabled in favor of user-configurable milestone reminders
  return NextResponse.json({ 
    status: 'disabled', 
    message: 'Daily nudges have been disabled. Users can now choose between daily or weekly milestone reminders.' 
  });
}