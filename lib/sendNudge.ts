// ✅ FILE: /lib/sendNudge.ts
import { db } from '../firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import sgMail from '@sendgrid/mail'

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

      console.log(`🔍 Fetching latest notification for ${userId}`)

      try {
        const notifQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(1)
        )

        const notifSnap = await getDocs(notifQuery)
        if (notifSnap.empty) {
          console.log(`⚠️ No notifications found for ${userId}`)
          continue
        }

        const notif = notifSnap.docs[0]
        const notifData = notif.data()
        const { prompt, type, milestoneTitle, blindSpotTip, strengthHook } = notifData
        const notifId = notif.id

        console.log(`📨 Sending email to ${email} for notif ${notifId}`)

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
              <a href="https://agilelinks.vercel.app/nudge/${notifId}"
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
              <a href="https://agilelinks.vercel.app/nudge/${notifId}"
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

        console.log(`✅ Email sent to ${email}`)
      } catch (notifError) {
        console.error(`❌ Failed to fetch/send notification for ${userId}`, notifError)
        continue
      }
    }

    console.log('✅ sendDailyNudges finished')
  } catch (err) {
    console.error('🔥 Global error in sendDailyNudges()', err)
    throw err
  }
}