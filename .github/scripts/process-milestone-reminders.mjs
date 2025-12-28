#!/usr/bin/env node

/**
 * GitHub Actions Script: Process Pending Milestone Reminders
 *
 * This script runs in GitHub Actions to process pending notifications with AI.
 * It queries Firebase for notifications with empty prompts, generates AI content,
 * updates the notifications, and sends emails.
 *
 * Environment variables required:
 * - FIREBASE_SERVICE_ACCOUNT: Firebase service account JSON
 * - OPENAI_API_KEY: OpenAI API key
 * - RESEND_API_KEY: Resend API key for sending emails
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import { Resend } from 'resend';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate AI nudge message for a milestone
 */
async function generateMilestoneNudge(milestone, goalContext, userEmail) {
  console.log(`🤖 Generating AI nudge for milestone: ${milestone.title}`);

  const today = new Date();
  const startDate = new Date(milestone.startDate);
  const dueDate = new Date(milestone.dueDate);
  const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const prompt = `You are a personalized AI coach helping someone achieve their goal: "${goalContext}".

Current milestone: "${milestone.title}"
Days in progress: ${daysInProgress}
Days remaining: ${daysRemaining}
${milestone.blindSpotTip ? `Blind spot to avoid: ${milestone.blindSpotTip}` : ''}
${milestone.strengthHook ? `Strength to leverage: ${milestone.strengthHook}` : ''}

Generate a motivating, personalized nudge (2-3 sentences) that:
1. Acknowledges their progress
2. ${milestone.blindSpotTip ? 'Gently reminds them of their blind spot' : 'Encourages them'}
3. ${milestone.strengthHook ? 'Reminds them to leverage their strength' : 'Motivates action'}
4. Ends with a specific question to prompt reflection

Keep it warm, personal, and actionable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    });

    const nudgeMessage = completion.choices[0].message.content.trim();
    console.log(`✅ AI nudge generated (${completion.usage.total_tokens} tokens)`);

    return nudgeMessage;
  } catch (error) {
    console.error(`❌ AI generation failed:`, error);
    return null;
  }
}

/**
 * Generate fallback nudge if AI fails
 */
function generateFallbackNudge(milestone) {
  const today = new Date();
  const startDate = new Date(milestone.startDate);
  const dueDate = new Date(milestone.dueDate);
  const daysInProgress = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const encouragements = [
    "You're making great progress!",
    "Keep up the momentum!",
    "You've got this - stay focused!",
    "Every step forward counts!",
    "You're on the right track!",
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  let message = `Week ${Math.ceil(daysInProgress / 7)} of your "${milestone.title}" milestone! ${randomEncouragement} You have ${daysRemaining} days remaining to achieve this goal.`;

  if (milestone.blindSpotTip) {
    message += ` Keep in mind: ${milestone.blindSpotTip}`;
  }

  if (milestone.strengthHook) {
    message += ` Leverage your strength: ${milestone.strengthHook}`;
  }

  message += " What's one key action you can take this week to move closer to completion?";

  return message;
}

/**
 * Send milestone reminder email
 */
async function sendMilestoneEmail(userId, notificationData) {
  console.log(`📧 Sending email to user ${userId}`);

  try {
    // Get user's email from companionSettings
    const settingsDoc = await db.collection('companionSettings').doc(userId).get();

    if (!settingsDoc.exists) {
      console.log(`⚠️ No companion settings found for user ${userId}`);
      return false;
    }

    const settings = settingsDoc.data();

    if (!settings.emailNudgesOptIn) {
      console.log(`⏭️ User ${userId} has opted out of email notifications`);
      return false;
    }

    if (!settings.email) {
      console.log(`⚠️ No email address found for user ${userId}`);
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'Stepiva <nudges@stepiva.com>',
      to: [settings.email],
      subject: `Milestone Reminder: ${notificationData.milestoneTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">${notificationData.milestoneTitle}</h2>
          <p style="font-size: 16px; line-height: 1.6;">${notificationData.prompt}</p>
          ${notificationData.blindSpotTip ? `<p style="background: #FEF3C7; padding: 12px; border-radius: 8px;"><strong>💡 Blind Spot:</strong> ${notificationData.blindSpotTip}</p>` : ''}
          ${notificationData.strengthHook ? `<p style="background: #D1FAE5; padding: 12px; border-radius: 8px;"><strong>💪 Your Strength:</strong> ${notificationData.strengthHook}</p>` : ''}
          <p style="margin-top: 24px;">
            <a href="https://stepiva.vercel.app/profile" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View in Dashboard</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`❌ Email sending failed:`, error);
      return false;
    }

    console.log(`✅ Email sent successfully (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Email sending error:`, error);
    return false;
  }
}

/**
 * Main processing function
 */
async function processPendingNotifications() {
  console.log('🔄 Starting processing of pending notifications...\n');

  try {
    // Query all notifications with empty prompts
    const pendingQuery = await db.collection('notifications')
      .where('prompt', '==', '')
      .where('type', '==', 'milestone_reminder')
      .get();

    if (pendingQuery.empty) {
      console.log('✅ No pending notifications to process');
      return;
    }

    console.log(`📋 Found ${pendingQuery.size} pending notifications\n`);

    let processed = 0;
    let failed = 0;

    for (const notifDoc of pendingQuery.docs) {
      const notifData = notifDoc.data();
      console.log(`\n📝 Processing notification ${notifDoc.id}:`);
      console.log(`   Milestone: ${notifData.milestoneTitle}`);
      console.log(`   User: ${notifData.userId}`);

      try {
        // Get user email for AI tracking
        const userDoc = await db.collection('users').doc(notifData.userId).get();
        const userEmail = userDoc.exists ? (userDoc.data().email || 'unknown@system.com') : 'unknown@system.com';

        // Generate AI nudge
        const milestone = {
          title: notifData.milestoneTitle,
          startDate: notifData.startDate,
          dueDate: notifData.dueDate,
          blindSpotTip: notifData.blindSpotTip,
          strengthHook: notifData.strengthHook,
        };

        let aiNudge = await generateMilestoneNudge(milestone, notifData.goalContext, userEmail);

        // Use fallback if AI fails
        if (!aiNudge) {
          console.log('   ⚠️ Using fallback nudge');
          aiNudge = generateFallbackNudge(milestone);
        }

        // Update notification with AI-generated prompt
        await notifDoc.ref.update({
          prompt: aiNudge,
          'emailStatus.deliveryStatus': 'pending'
        });

        console.log('   ✅ Notification updated with AI content');

        // Send email
        const emailSent = await sendMilestoneEmail(notifData.userId, {
          ...notifData,
          prompt: aiNudge
        });

        // Update email status
        if (emailSent) {
          await notifDoc.ref.update({
            'emailStatus.sent': true,
            'emailStatus.sentAt': Timestamp.now(),
            'emailStatus.deliveryStatus': 'sent'
          });
          console.log('   ✅ Email sent and status updated');
        } else {
          await notifDoc.ref.update({
            'emailStatus.deliveryStatus': 'failed'
          });
          console.log('   ⚠️ Email not sent (user opted out or no email)');
        }

        processed++;
      } catch (error) {
        console.error(`   ❌ Failed to process notification ${notifDoc.id}:`, error);
        failed++;
      }
    }

    console.log(`\n✅ Processing complete!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
processPendingNotifications()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
