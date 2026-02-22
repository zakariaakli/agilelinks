/**
 * Diagnostic Script: Check User Plans and Milestone Status
 *
 * This script helps diagnose why certain plans are not progressing
 * by checking milestone dates, status, and notification history.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (use your service account)
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('⚠️  Could not initialize Firebase Admin. Make sure serviceAccountKey.json exists.');
    console.log('Please provide user email or UID to diagnose:');
    process.exit(1);
  }
}

const db = admin.firestore();

async function diagnoseUserPlans(userIdentifier) {
  console.log('\n🔍 Diagnosing plans for user:', userIdentifier);
  console.log('='.repeat(80));

  try {
    // Find user by email or UID
    let userId;
    if (userIdentifier.includes('@')) {
      // Search by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', userIdentifier)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        console.error('❌ User not found with email:', userIdentifier);
        return;
      }

      userId = usersSnapshot.docs[0].id;
      console.log('✅ Found user ID:', userId);
    } else {
      userId = userIdentifier;
    }

    // Get all plans for this user (check both root userId and input.userId)
    const [rootSnapshot, inputSnapshot] = await Promise.all([
      db.collection('plans').where('userId', '==', userId).get(),
      db.collection('plans').where('input.userId', '==', userId).get(),
    ]);

    // Merge and deduplicate
    const seenIds = new Set();
    const allDocs = [];
    for (const snapshot of [rootSnapshot, inputSnapshot]) {
      for (const doc of snapshot.docs) {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          allDocs.push(doc);
        }
      }
    }

    if (allDocs.length === 0) {
      console.log('❌ No plans found for this user');
      return;
    }

    // Create a mock snapshot-like object for iteration
    const plansSnapshot = { docs: allDocs, empty: allDocs.length === 0 };

    console.log(`\n📋 Found ${plansSnapshot.docs.length} plan(s)\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Analyze each plan
    for (const planDoc of plansSnapshot.docs) {
      const plan = planDoc.data();
      const planId = planDoc.id;

      console.log('\n' + '─'.repeat(80));
      console.log(`📌 PLAN: ${plan.goalType || 'Unknown'} - ${plan.goal.substring(0, 60)}...`);
      console.log(`   ID: ${planId}`);
      console.log(`   Status: ${plan.status}`);
      console.log(`   Target Date: ${plan.targetDate}`);
      console.log(`   Nudge Frequency: ${plan.nudgeFrequency || 'NOT SET (defaulting to weekly)'}`);
      console.log(`   Created: ${plan.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}`);

      if (plan.status !== 'active') {
        console.log(`   ⚠️  ISSUE: Plan status is "${plan.status}" - only "active" plans get reminders!`);
      }

      console.log(`\n   📍 MILESTONES (${plan.milestones?.length || 0}):`);

      if (!plan.milestones || plan.milestones.length === 0) {
        console.log('      ❌ No milestones found in this plan!');
        continue;
      }

      // Analyze each milestone
      for (let i = 0; i < plan.milestones.length; i++) {
        const milestone = plan.milestones[i];
        const startDate = new Date(milestone.startDate);
        startDate.setHours(0, 0, 0, 0);

        const dueDate = new Date(milestone.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const isCompleted = milestone.completed;
        const isFuture = startDate > today;
        const isCurrent = startDate <= today && today <= dueDate && !isCompleted;
        const isOverdue = dueDate < today && !isCompleted;

        let status = '❓ Unknown';
        let statusEmoji = '❓';

        if (isCompleted) {
          status = 'Completed';
          statusEmoji = '✅';
        } else if (isFuture) {
          status = 'Future';
          statusEmoji = '📅';
        } else if (isCurrent) {
          status = 'CURRENT (Should get reminders)';
          statusEmoji = '🔔';
        } else if (isOverdue) {
          status = 'OVERDUE (Should get reminders)';
          statusEmoji = '⚠️';
        }

        console.log(`\n      ${statusEmoji} Milestone ${i + 1}: ${milestone.title}`);
        console.log(`         Status: ${status}`);
        console.log(`         Start: ${milestone.startDate} ${isFuture ? '(in future)' : ''}`);
        console.log(`         Due: ${milestone.dueDate} ${isOverdue ? '(overdue!)' : ''}`);
        console.log(`         Completed: ${isCompleted ? 'Yes' : 'No'}`);

        // Check for recent notifications
        if (isCurrent || isOverdue) {
          const lookbackDays = plan.nudgeFrequency === 'daily' ? 1 : 7;
          const lookbackDate = new Date();
          lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

          const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('planId', '==', plan.id)
            .where('milestoneId', '==', milestone.id)
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lookbackDate))
            .get();

          console.log(`         Recent Notifications (last ${lookbackDays} days): ${notificationsSnapshot.size}`);

          if (notificationsSnapshot.size === 0) {
            console.log(`         🔴 SHOULD RECEIVE REMINDER on next cron run!`);
          } else {
            const lastNotif = notificationsSnapshot.docs[0].data();
            const lastNotifDate = lastNotif.createdAt?.toDate();
            console.log(`         Last reminder: ${lastNotifDate?.toLocaleString() || 'Unknown'}`);
            console.log(`         ✅ Already received reminder within lookback period`);
          }
        }

        // Check for personality tips
        if (!milestone.blindSpotTip && !milestone.strengthHook) {
          console.log(`         ⚠️  Missing personality tips (blindSpotTip & strengthHook)`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 DIAGNOSIS SUMMARY:\n');

    // Summary recommendations
    console.log('Possible reasons plans are not progressing:');
    console.log('1. ❌ Plan status is not "active"');
    console.log('2. 📅 No milestones have start dates that include today');
    console.log('3. ✅ All current milestones are marked as completed');
    console.log('4. 🔔 Recent reminders already sent (within lookback period)');
    console.log('5. ⏰ Cron job not running (check vercel.json and deployment logs)');
    console.log('6. 🚫 nudgeFrequency not set (defaults to weekly)');

    console.log('\n💡 RECOMMENDATIONS:\n');
    console.log('- Ensure plan status is "active"');
    console.log('- Verify milestone start/due dates are correctly set');
    console.log('- Check that cron job is running: GET /api/milestoneReminders');
    console.log('- Verify user has companionSettings with emailNudgesOptIn: true');
    console.log('- Check Vercel deployment logs for cron execution');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Run diagnosis
const userIdentifier = process.argv[2] || 'zakariaakli@gmail.com';

if (!userIdentifier) {
  console.log('Usage: node scripts/diagnose-user-plans.js <email or userId>');
  console.log('Example: node scripts/diagnose-user-plans.js user@example.com');
  process.exit(1);
}

diagnoseUserPlans(userIdentifier)
  .then(() => {
    console.log('\n✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
