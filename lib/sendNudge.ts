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
        const { prompt, type } = notif.data()
        const notifId = notif.id

        console.log(`📨 Sending email to ${email} for notif ${notifId}`)

        const emailHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px;">
            <h2 style="color:#111827;">✨ Today’s Reflection for <em>${type}</em></h2>
            <p style="font-size:16px;line-height:1.6;margin:20px 0;">${prompt}</p>
            <a href="https://agilelinks.vercel.app/nudge/${notifId}"
              style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:20px;font-weight:bold;">
              View Your Daily Tip →
            </a>
          </div>
        `

        await sgMail.send({
          to: email,
          from: 'zakaria.akli.ensa@gmail.com',
          subject: `🧠 Your Enneagram Tip for Today`,
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
