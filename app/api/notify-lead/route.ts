import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = 'zakli@stepiva.ai';

export async function POST(request: NextRequest) {
  try {
    const { email, dominantType, candidateTypes, phase1Scores, completedAt } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const typeLabel = dominantType ? `Type ${dominantType}` : 'Unknown';
    const candidates = candidateTypes?.length
      ? candidateTypes.map((t: number) => `Type ${t}`).join(', ')
      : '—';
    const scores = phase1Scores
      ? `Gut ${phase1Scores.gut ?? 0} / Head ${phase1Scores.head ?? 0} / Heart ${phase1Scores.heart ?? 0}`
      : '—';
    const date = completedAt || new Date().toISOString();

    await resend.emails.send({
      from: 'Stepiva <nudges@stepiva.ai>',
      to: NOTIFY_EMAIL,
      subject: `New lead — Enneagram test completed by ${email}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: auto; background: #fafafa; padding: 28px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 20px; font-size: 20px; color: #111827;">New Enneagram Test Lead</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; width: 40%;">Email</td>
              <td style="padding: 10px 0;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600;">Dominant hypothesis</td>
              <td style="padding: 10px 0;">${typeLabel}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600;">Candidate types</td>
              <td style="padding: 10px 0;">${candidates}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600;">Phase 1 scores</td>
              <td style="padding: 10px 0;">${scores}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600;">Completed at</td>
              <td style="padding: 10px 0;">${new Date(date).toLocaleString('en-GB', { timeZone: 'Europe/Paris' })}</td>
            </tr>
          </table>
          <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
            Full assessment detail is available in the Stepiva admin dashboard under Leads / Users.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending lead notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
