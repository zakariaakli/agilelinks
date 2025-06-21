import { NextResponse } from 'next/server'

export async function GET() {
  // Daily nudge generation has been disabled in favor of user-configurable milestone reminders
  return NextResponse.json({ 
    status: 'disabled', 
    message: 'Daily nudge generation has been disabled. Users can now choose between daily or weekly milestone reminders in their goal creation process.',
    created: 0 
  });
}
