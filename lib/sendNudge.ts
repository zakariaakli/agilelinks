// ✅ FILE: /lib/sendNudge.ts
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import sgMail from '@sendgrid/mail'
import { 
  getUnsentNotifications,
  prioritizeNotifications,
  markNotificationAsSent,
  markNotificationSendFailed
} from './notificationTracking'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendDailyNudges() {
  try {
    const settingsSnap = await getDocs(collection(db, 'companionSettings'))
    console.log(`🔍 Scanned ${settingsSnap.docs.length} user settings`)

    for (const docSnap of settingsSnap.docs) {
      const userId = docSnap.id
      const { email, emailNudgesOptIn } = docSnap.data()

      if (!email || !emailNudgesOptIn) {
        console.log(`⏭️ Skipping ${userId} — opt-out or missing email`)
        continue
      }

      console.log(`🔍 Fetching unsent notifications for ${userId}`)

      try {
        // Get unsent notifications using new tracking system
        const unsentNotifications = await getUnsentNotifications(userId)
        
        if (unsentNotifications.length === 0) {
          console.log(`⚠️ No unsent notifications found for ${userId}`)
          continue
        }

        // Prioritize notifications (urgent_milestone > weekly_milestone > daily_nudge)
        const prioritizedNotifications = prioritizeNotifications(unsentNotifications)
        
        // Send only the highest priority notification
        const notificationToSend = prioritizedNotifications[0]
        const { prompt, type, milestoneTitle, blindSpotTip, strengthHook } = notificationToSend
        const notifId = notificationToSend.id!

        console.log(`📨 Sending ${type} email to ${email} for notif ${notifId}`)

        try {
          // Get base URL from environment variable
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://agilelinks.vercel.app';
          
          // Determine email content based on notification type
          let emailHtml = ''
          let subject = ''

          if (type === 'milestone_reminder') {
            // Milestone reminder email
            subject = `🎯 Milestone Reminder: ${milestoneTitle}`
            emailHtml = `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px;">
                <h2 style="color:#111827;">🎯 Milestone Check-in</h2>
                <h3 style="color:#6366f1;margin:16px 0;">${milestoneTitle}</h3>
                <p style="font-size:16px;line-height:1.6;margin:20px 0;">${prompt}</p>
                ${blindSpotTip ? `
                  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:8px;">
                    <strong style="color:#92400e;">⚠️ Blind Spot Alert:</strong>
                    <p style="margin:8px 0 0 0;color:#78350f;">${blindSpotTip}</p>
                  </div>
                ` : ''}
                ${strengthHook ? `
                  <div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px;margin:20px 0;border-radius:8px;">
                    <strong style="color:#047857;">💪 Leverage Your Strength:</strong>
                    <p style="margin:8px 0 0 0;color:#065f46;">${strengthHook}</p>
                  </div>
                ` : ''}
                <a href="${baseUrl}/nudge/${notifId}"
                  style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:20px;font-weight:bold;">
                  View Full Reminder →
                </a>
              </div>
            `
          } else {
            // Regular personality-based nudge
            subject = `🧠 Your Enneagram Tip for Today`
            emailHtml = `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px;">
                <h2 style="color:#111827;">✨ Today's Reflection for <em>${type}</em></h2>
                <p style="font-size:16px;line-height:1.6;margin:20px 0;">${prompt}</p>
                <a href="${baseUrl}/nudge/${notifId}"
                  style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:20px;font-weight:bold;">
                  View Your Daily Tip →
                </a>
              </div>
            `
          }

          await sgMail.send({
            to: email,
            from: 'zakaria.akli.ensa@gmail.com',
            subject,
            html: emailHtml
          })

          // Mark notification as successfully sent
          await markNotificationAsSent(notifId)
          console.log(`✅ Email sent to ${email} for notification ${notifId}`)
          
        } catch (emailError) {
          console.error(`❌ Failed to send notification ${notifId} for ${userId}:`, emailError)
          
          // Mark notification send as failed
          await markNotificationSendFailed(notifId, emailError as Error)
        }
        
      } catch (notifError) {
        console.error(`❌ Failed to fetch/process notifications for ${userId}:`, notifError)
        continue
      }
    }

    console.log('✅ sendDailyNudges finished')
  } catch (err) {
    console.error('🔥 Global error in sendDailyNudges()', err)
    throw err
  }
}