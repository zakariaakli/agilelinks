#!/usr/bin/env node

/**
 * Test Script: Resend Email with Verified Domain
 *
 * Usage:
 *   node scripts/test-email.mjs
 *
 * Sends a test milestone reminder email to verify that Resend can deliver
 * to external recipients using the verified nudges@stepiva.ai domain.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = 'aznag95@gmail.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://agilelinks.vercel.app';

console.log('📧 Sending test email to:', TO_EMAIL);
console.log('🔑 Using API key:', process.env.RESEND_API_KEY?.slice(0, 8) + '...');

const { data, error } = await resend.emails.send({
  from: 'Stepiva <nudges@stepiva.ai>',
  to: TO_EMAIL,
  subject: '🎯 Test: Milestone Reminder from Stepiva',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #111827; margin: 0; font-size: 24px;">🎯 Milestone Check-in</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">This is a test email from Stepiva</p>
      </div>

      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
        <h2 style="color: #6366f1; margin: 0 0 16px 0; font-size: 20px;">Complete your first milestone</h2>
        <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #374151;">
          This week, focus on defining the three key habits that will help you reach your goal.
          Small consistent steps lead to big results — you've got this!
        </p>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
          <strong style="color: #92400e; font-size: 14px;">BLIND SPOT ALERT</strong>
        </div>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.4;">
          Watch out for perfectionism slowing you down. Progress over perfection.
        </p>
      </div>

      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 18px; margin-right: 8px;">💪</span>
          <strong style="color: #047857; font-size: 14px;">LEVERAGE YOUR STRENGTH</strong>
        </div>
        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.4;">
          Your analytical mindset is your superpower here — use it to track your progress daily.
        </p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${BASE_URL}"
          style="display: inline-block; background: #6366F1; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          View Full Reminder →
        </a>
      </div>

      <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This is a test email sent from Stepiva's verified domain nudges@stepiva.ai
        </p>
      </div>
    </div>
  `,
});

if (error) {
  console.error('❌ Failed to send email:', error);
  process.exit(1);
}

console.log('✅ Email sent successfully!');
console.log('📬 Email ID:', data?.id);
