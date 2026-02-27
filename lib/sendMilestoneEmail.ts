/**
 * MILESTONE EMAIL SYSTEM
 * 
 * This module handles sending milestone reminder emails to users.
 * 
 * IMPORTANT CHANGES:
 * - No longer sends daily nudges (deprecated feature)
 * - Focuses exclusively on milestone reminder emails
 * - Sends emails immediately when notifications are created
 * - Integrates directly with the milestone creation process
 * 
 * HOW IT WORKS:
 * 1. Called from milestoneReminders API after notification creation
 * 2. Checks if user has opted in for email notifications
 * 3. Sends milestone reminder email using Resend
 * 4. Updates notification email status in database
 * 
 * DEPENDENCIES:
 * - Resend for email delivery
 * - Firebase for user settings and notification tracking
 * - notificationTracking.ts for email status management
 */

import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Resend } from 'resend'
import {
  markNotificationAsSent,
  markNotificationSendFailed
} from './notificationTracking'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY!)

/**
 * SEND MILESTONE EMAIL
 * 
 * Sends a milestone reminder email for a specific notification.
 * This function is called immediately after a milestone notification is created.
 * 
 * @param notificationId - The ID of the notification to send email for
 * @param userId - The user ID who should receive the email
 * @param notificationData - The notification data (prompt, milestone title, etc.)
 * 
 * FLOW:
 * 1. Check if user has email notifications enabled
 * 2. Get user's email address from companionSettings
 * 3. Send milestone reminder email via Resend
 * 4. Update notification email status in database
 * 
 * ERROR HANDLING:
 * - Logs errors but doesn't throw (to avoid breaking notification creation)
 * - Marks notification as failed if email sending fails
 * - Continues gracefully if user hasn't opted in or email is missing
 */
export async function sendMilestoneEmail(
  notificationId: string, 
  userId: string, 
  notificationData: {
    prompt: string;
    milestoneTitle: string;
    blindSpotTip?: string | null;
    strengthHook?: string | null;
  }
) {
  try {
    console.log(`📧 [EMAIL] Checking email settings for user ${userId}, notification ${notificationId}`);

    // Get user's email settings from companionSettings collection
    const userSettingsRef = doc(db, 'companionSettings', userId);
    const userSettingsDoc = await getDoc(userSettingsRef);

    if (!userSettingsDoc.exists()) {
      console.log(`⏭️ [EMAIL] No companion settings found for user ${userId} - skipping email`);
      return;
    }

    const { email, emailNudgesOptIn } = userSettingsDoc.data();

    // Check if user has opted in for email notifications
    if (!emailNudgesOptIn) {
      console.log(`⏭️ [EMAIL] User ${userId} has opted out of email notifications - skipping email`);
      return;
    }

    // Check if user has provided an email address
    if (!email) {
      console.log(`⏭️ [EMAIL] No email address found for user ${userId} - skipping email`);
      return;
    }

    console.log(`📨 [EMAIL] Sending milestone reminder email to ${email} for notification ${notificationId}`);

    // Prepare email content
    const { prompt, milestoneTitle, blindSpotTip, strengthHook } = notificationData;
    
    // Get base URL for the notification link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://agilelinks.vercel.app';
    
    // Email subject
    const subject = `🎯 Milestone Reminder: ${milestoneTitle}`;
    
    // Email HTML content with enhanced styling and structure
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #111827; margin: 0; font-size: 24px;">🎯 Milestone Check-in</h1>
        </div>
        
        <!-- Milestone Title -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
          <h2 style="color: #6366f1; margin: 0 0 16px 0; font-size: 20px;">${milestoneTitle}</h2>
          <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #374151;">${prompt}</p>
        </div>
        
        ${blindSpotTip ? `
          <!-- Blind Spot Alert -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
              <strong style="color: #92400e; font-size: 14px;">BLIND SPOT ALERT</strong>
            </div>
            <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.4;">${blindSpotTip}</p>
          </div>
        ` : ''}
        
        ${strengthHook ? `
          <!-- Strength Hook -->
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 18px; margin-right: 8px;">💪</span>
              <strong style="color: #047857; font-size: 14px;">LEVERAGE YOUR STRENGTH</strong>
            </div>
            <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.4;">${strengthHook}</p>
          </div>
        ` : ''}
        
        <!-- Call to Action -->
        <div style="text-align: center; margin-top: 32px;">
          <a href="${baseUrl}/nudge/${notificationId}"
            style="display: inline-block; background: #6366F1; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
            View Full Reminder →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            You're receiving this because you've opted in for milestone reminders.<br>
            <a href="${baseUrl}/profile/companion" style="color: #6366f1; text-decoration: none;">Manage your notification preferences</a>
          </p>
        </div>
      </div>
    `;

    // Send email via Resend
    await resend.emails.send({
      from: 'Stepiva <nudges@stepiva.ai>',
      to: email,
      subject,
      html: emailHtml
    });

    // Mark notification as successfully sent in database
    await markNotificationAsSent(notificationId);
    
    console.log(`✅ [EMAIL] Milestone reminder email sent successfully to ${email} for notification ${notificationId}`);

  } catch (error) {
    console.error(`❌ [EMAIL] Failed to send milestone email for notification ${notificationId}:`, error);
    
    // Mark notification send as failed in database
    // This helps with debugging and prevents retry loops
    try {
      await markNotificationSendFailed(notificationId, error as Error);
    } catch (markError) {
      console.error(`❌ [EMAIL] Failed to mark notification ${notificationId} as failed:`, markError);
    }
  }
}

