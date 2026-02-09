#!/usr/bin/env node

/**
 * GitHub Actions Script: Process Pending Milestone Reminders
 *
 * This script runs in GitHub Actions to process pending notifications with AI.
 * It queries Firebase for notifications with empty prompts, generates AI content,
 * updates the notifications, and sends emails.
 *
 * Uses advanced AI personalization with:
 * - User's Enneagram personality type
 * - Personalized growth advice
 * - AI-generated reflection summaries from previous nudges
 * - OpenAI Assistants API for sophisticated prompting
 *
 * Environment variables required:
 * - FIREBASE_SERVICE_ACCOUNT: Firebase service account JSON
 * - OPENAI_API_KEY: OpenAI API key
 * - RESEND_API_KEY: Resend API key for sending emails
 * - NEXT_PUBLIC_REACT_NDG_GENERATOR_ID: OpenAI Assistant ID for nudge generation
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";
import { Resend } from "resend";
import webPush from "web-push";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure web-push with VAPID details
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_SUBJECT) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push configured with VAPID keys');
} else {
  console.log('⚠️ Web Push not configured - VAPID keys missing');
}

/**
 * Build steps context from milestone steps array
 */
function buildStepsContext(steps = []) {
  const now = new Date();

  const activeSteps = steps
    .filter(s => !s.completed)
    .map(s => {
      const createdAt = s.createdAt?.toDate?.() || new Date(s.createdAt) || new Date();
      const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        title: s.title,
        daysOld: Math.max(0, daysOld)
      };
    });

  const recentlyCompleted = steps
    .filter(s => s.completed && s.completedAt)
    .map(s => {
      const completedAt = s.completedAt?.toDate?.() || new Date(s.completedAt) || new Date();
      const completedDaysAgo = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        title: s.title,
        completedDaysAgo: Math.max(0, completedDaysAgo)
      };
    })
    .filter(s => s.completedDaysAgo <= 7); // Last 7 days only

  return {
    active: activeSteps,
    recentlyCompleted,
    totalCompleted: steps.filter(s => s.completed).length
  };
}

/**
 * Parse the AI response to extract suggested step if present
 */
function parseNudgeResponse(response) {
  const stepMatch = response.match(/\[SUGGESTED_STEP:\s*(.+?)\]/);

  if (stepMatch) {
    return {
      nudgeText: response.replace(/\[SUGGESTED_STEP:\s*.+?\]/, '').trim(),
      suggestedStep: stepMatch[1].trim()
    };
  }

  return { nudgeText: response, suggestedStep: null };
}

/**
 * Generate AI nudge message for a milestone using OpenAI Assistants API
 * with personalization based on user's Enneagram type and feedback history
 */
async function generateMilestoneNudge(
  milestone,
  goalContext,
  userId,
  userEmail
) {
  console.log(`🤖 Generating AI nudge for milestone: ${milestone.title}`);
  console.log(`   User: ${userId}`);

  try {
    // Calculate milestone timeline context
    const today = new Date();
    const startDate = new Date(milestone.startDate);
    const dueDate = new Date(milestone.dueDate);
    const totalDays = Math.ceil(
      (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysInProgress = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get user's personality data for personalization
    let personalityContext = "";
    let enneagramTypeNumber = "";

    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const enneagramResult = userData.enneagramResult;
      if (enneagramResult && enneagramResult.summary) {
        personalityContext = enneagramResult.summary;
        console.log(`   ✅ Personality context found`);

        // Extract Enneagram type number from summary
        const typeMatch = personalityContext.match(/enneagram type (\d+)/i);
        if (typeMatch) {
          enneagramTypeNumber = typeMatch[1];
          console.log(`   ✅ Enneagram type: ${enneagramTypeNumber}`);
        }
      }
    }

    // Query Firebase personalization data for milestone_nudge
    let growthAdvice = "";
    if (enneagramTypeNumber) {
      try {
        const personalizationSnapshot = await db
          .collection("personalization")
          .where("topic", "==", "milestone_nudge")
          .where("type", "==", enneagramTypeNumber)
          .limit(1)
          .get();

        if (!personalizationSnapshot.empty) {
          const doc = personalizationSnapshot.docs[0];
          growthAdvice = doc.data().summary || "";
          console.log(`   ✅ Growth advice retrieved`);
        } else {
          console.log(
            `   ⚠️ No personalization data found for type ${enneagramTypeNumber}`
          );
        }
      } catch (firebaseError) {
        console.error(
          `   ⚠️ Error fetching personalization:`,
          firebaseError.message
        );
      }
    }

    // Query for previous notifications with AI summaries
    let feedbackHistory = [];
    try {
      const notificationsSnapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("planId", "==", milestone.planId)
        .where("milestoneId", "==", milestone.id)
        .where("type", "==", "milestone_reminder")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (!notificationsSnapshot.empty) {
        feedbackHistory = notificationsSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const aiSummary = data.feedbackDetails?.aiSummary;

            if (!aiSummary) return null; // Skip if no AI summary

            const daysAgo = Math.floor(
              (today.getTime() - data.createdAt?.toDate?.().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              nudge: data.prompt || data.message || "",
              feedback: aiSummary,  // Use AI summary instead of radio button
              daysAgo,
            };
          })
          .filter(item => item !== null);

        console.log(
          `   ✅ Found ${feedbackHistory.length} previous reflection(s) with AI summaries`
        );
      }
    } catch (firebaseError) {
      console.error(
        `   ⚠️ Error fetching feedback history:`,
        firebaseError.message
      );
      // Continue with empty array
    }

    // Build steps context from milestone steps
    const stepsContext = buildStepsContext(milestone.steps || []);
    console.log(`   📋 Steps context: ${stepsContext.active.length} active, ${stepsContext.totalCompleted} completed`);

    // Prepare assistant input in the exact format expected
    const assistantInput = {
      goalContext: goalContext,
      milestone: {
        title: milestone.title,
        description: milestone.description || "",
        blindSpotTip: milestone.blindSpotTip || null,
        strengthHook: milestone.strengthHook || null,
        daysInProgress,
        totalDays,
        daysRemaining,
      },
      personalityContext,
      growthAdvice,
      feedbackHistory,
      steps: stepsContext,
    };

    console.log(`   🧠 Sending to OpenAI Assistant with personalization data`);

    // Log the complete request payload
    console.log(`\n📤 AI REQUEST PAYLOAD:`);
    console.log(`   Thread: New thread will be created`);
    console.log(`   Assistant ID: ${process.env.NEXT_PUBLIC_REACT_NDG_GENERATOR_ID}`);
    console.log(`   User: ${userId} (${userEmail})`);
    console.log(`   Input Data:`, JSON.stringify(assistantInput, null, 2));

    // Create thread and send message to OpenAI Assistants API
    const thread = await openai.beta.threads.create();
    console.log(`   Thread Created: ${thread.id}`);

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: JSON.stringify(assistantInput),
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_NDG_GENERATOR_ID,
    });
    console.log(`   Run Started: ${run.id}`);

    // Poll for completion
    let status = "queued";
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let finalResult = null;

    while (status !== "completed" && attempts < maxAttempts) {
      finalResult = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = finalResult.status;

      if (status === "failed") {
        console.error(`   ❌ OpenAI run failed:`, finalResult.last_error);
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (status !== "completed") {
      console.error(`   ❌ OpenAI run timed out after ${maxAttempts} seconds`);
      return null;
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const latest = messages.data[0];

    if (!latest || !latest.content || latest.content.length === 0) {
      console.warn(`   ⚠️ No response from OpenAI`);
      return null;
    }

    const firstContent = latest.content[0];
    if (firstContent.type === "text") {
      const nudgeMessage = firstContent.text.value;

      // Log the complete response
      console.log(`\n📥 AI RESPONSE RECEIVED:`);
      console.log(`   Thread ID: ${thread.id}`);
      console.log(`   Run ID: ${run.id}`);
      console.log(`   Status: ${status}`);
      if (finalResult && finalResult.usage) {
        console.log(`   📊 Token Usage:`);
        console.log(`      - Prompt tokens: ${finalResult.usage.prompt_tokens || 0}`);
        console.log(`      - Completion tokens: ${finalResult.usage.completion_tokens || 0}`);
        console.log(`      - Total tokens: ${finalResult.usage.total_tokens}`);
      }
      console.log(`   Response Content:`);
      console.log(`   ${nudgeMessage.split('\n').join('\n   ')}`);
      console.log(`\n   ✅ AI nudge generated with personalization`);

      return nudgeMessage;
    }

    return null;
  } catch (error) {
    console.error(`   ❌ AI generation failed:`, error.message);
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
  const daysInProgress = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const encouragements = [
    "You're making great progress!",
    "Keep up the momentum!",
    "You've got this - stay focused!",
    "Every step forward counts!",
    "You're on the right track!",
  ];

  const randomEncouragement =
    encouragements[Math.floor(Math.random() * encouragements.length)];

  let message = `Week ${Math.ceil(daysInProgress / 7)} of your "${milestone.title}" milestone! ${randomEncouragement} You have ${daysRemaining} days remaining to achieve this goal.`;

  if (milestone.blindSpotTip) {
    message += ` Keep in mind: ${milestone.blindSpotTip}`;
  }

  if (milestone.strengthHook) {
    message += ` Leverage your strength: ${milestone.strengthHook}`;
  }

  message +=
    " What's one key action you can take this week to move closer to completion?";

  return message;
}

/**
 * Send milestone reminder email
 */
async function sendMilestoneEmail(userId, notificationData) {
  console.log(`📧 Sending email to user ${userId}`);

  try {
    // Get user's email from companionSettings
    const settingsDoc = await db
      .collection("companionSettings")
      .doc(userId)
      .get();

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
      from: "Stepiva - Your AI Goal Coach <onboarding@resend.dev>",
      to: [settings.email],
      subject: `🎯 Your Milestone Check-in: ${notificationData.milestoneTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">${notificationData.milestoneTitle}</h2>
          <p style="font-size: 16px; line-height: 1.6;">${notificationData.prompt}</p>
          ${notificationData.blindSpotTip ? `<p style="background: #FEF3C7; padding: 12px; border-radius: 8px;"><strong>💡 Blind Spot:</strong> ${notificationData.blindSpotTip}</p>` : ""}
          ${notificationData.strengthHook ? `<p style="background: #D1FAE5; padding: 12px; border-radius: 8px;"><strong>💪 Your Strength:</strong> ${notificationData.strengthHook}</p>` : ""}
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
 * Send push notification to user
 */
async function sendPushNotification(userId, notificationData, notificationId) {
  try {
    // Get user's push subscription from Firestore
    const subscriptionDoc = await db.collection('pushSubscriptions').doc(userId).get();

    if (!subscriptionDoc.exists) {
      console.log(`   ℹ️ No push subscription found for user`);
      return false;
    }

    const subscriptionData = subscriptionDoc.data();

    if (!subscriptionData || !subscriptionData.active || !subscriptionData.subscription) {
      console.log(`   ℹ️ Push subscription inactive or invalid`);
      return false;
    }

    const subscription = subscriptionData.subscription;

    // Validate subscription has required fields
    if (!subscription.endpoint || !subscription.keys) {
      console.log(`   ⚠️ Invalid subscription format`);
      return false;
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: `🎯 ${notificationData.milestoneTitle}`,
      body: notificationData.prompt.substring(0, 100) + '...',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      url: `https://stepiva.vercel.app/nudge/${notificationId}`,
      notificationId: notificationId,
      tag: 'milestone-nudge',
      vibrate: [200, 100, 200],
      data: {
        url: `https://stepiva.vercel.app/nudge/${notificationId}`,
        notificationId: notificationId
      }
    });

    // Send push notification
    await webPush.sendNotification(subscription, payload);

    // Update lastUsed timestamp
    await db.collection('pushSubscriptions').doc(userId).update({
      lastUsed: Timestamp.now()
    });

    console.log(`   ✅ Push notification sent successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error sending push notification:`, error.message);

    // Handle expired or invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`   ⚠️ Subscription expired, marking as inactive`);
      try {
        await db.collection('pushSubscriptions').doc(userId).update({
          active: false
        });
      } catch (updateError) {
        console.error('   ❌ Error updating subscription status:', updateError);
      }
    }

    return false;
  }
}

/**
 * Main processing function
 */
async function processPendingNotifications() {
  console.log("🔄 Starting processing of pending notifications...\n");

  try {
    // Query all notifications with empty prompts
    const pendingQuery = await db
      .collection("notifications")
      .where("prompt", "==", "")
      .where("type", "==", "milestone_reminder")
      .get();

    if (pendingQuery.empty) {
      console.log("✅ No pending notifications to process");
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
        const userDoc = await db
          .collection("users")
          .doc(notifData.userId)
          .get();
        const userEmail = userDoc.exists
          ? userDoc.data().email || "unknown@system.com"
          : "unknown@system.com";

        // Fetch plan to get milestone steps
        let milestoneSteps = [];
        try {
          const planDoc = await db.collection("plans").doc(notifData.planId).get();
          if (planDoc.exists) {
            const planData = planDoc.data();
            const milestoneData = planData.milestones?.find(m => m.id === notifData.milestoneId);
            if (milestoneData && milestoneData.steps) {
              milestoneSteps = milestoneData.steps;
              console.log(`   📋 Found ${milestoneSteps.length} steps for milestone`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️ Could not fetch milestone steps: ${err.message}`);
        }

        // Generate AI nudge
        const milestone = {
          id: notifData.milestoneId,
          planId: notifData.planId,
          title: notifData.milestoneTitle,
          description: notifData.milestoneDescription || "",
          startDate: notifData.startDate,
          dueDate: notifData.dueDate,
          blindSpotTip: notifData.blindSpotTip,
          strengthHook: notifData.strengthHook,
          steps: milestoneSteps,
        };

        let aiNudge = await generateMilestoneNudge(
          milestone,
          notifData.goalContext,
          notifData.userId,
          userEmail
        );

        // Use fallback if AI fails
        if (!aiNudge) {
          console.log("   ⚠️ Using fallback nudge");
          aiNudge = generateFallbackNudge(milestone);
        }

        // Parse response to extract suggested step
        const { nudgeText, suggestedStep } = parseNudgeResponse(aiNudge);

        if (suggestedStep) {
          console.log(`   💡 Suggested step extracted: "${suggestedStep}"`);
        }

        // Update notification with AI-generated prompt and suggested step
        await notifDoc.ref.update({
          prompt: nudgeText,
          suggestedStep: suggestedStep || null,
          "emailStatus.deliveryStatus": "pending",
        });

        console.log("   ✅ Notification updated with AI content");

        // Send email
        const emailSent = await sendMilestoneEmail(notifData.userId, {
          ...notifData,
          prompt: nudgeText,
        });

        // Update email status
        if (emailSent) {
          await notifDoc.ref.update({
            "emailStatus.sent": true,
            "emailStatus.sentAt": Timestamp.now(),
            "emailStatus.deliveryStatus": "sent",
          });
          console.log("   ✅ Email sent and status updated");
        } else {
          await notifDoc.ref.update({
            "emailStatus.deliveryStatus": "failed",
          });
          console.log("   ⚠️ Email not sent (user opted out or no email)");
        }

        // Send push notification
        console.log("   📱 Attempting to send push notification...");
        await sendPushNotification(notifData.userId, {
          ...notifData,
          prompt: nudgeText,
        }, notifDoc.id);

        processed++;
      } catch (error) {
        console.error(
          `   ❌ Failed to process notification ${notifDoc.id}:`,
          error
        );
        failed++;
      }
    }

    console.log(`\n✅ Processing complete!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Failed: ${failed}`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
processPendingNotifications()
  .then(() => {
    console.log("\n🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
