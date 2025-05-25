import admin from 'firebase-admin'

// ✅ Replace this with your actual full JSON string from Vercel env var
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

async function seedData() {
  const userId = 'testUser123'
  const enneagramType = '7'
  const email = 'test.user@example.com'

  // Create companionSettings
  await db.collection('companionSettings').doc(userId).set({
    enneagramType,
    emailNudgesOptIn: true,
    email,
  })

  // Create prompts collection
  const prompts = {
    1: "You don't have to be perfect to be valuable.",
    2: "Start your day by setting boundaries with love.",
    3: "Pause to reflect, not just perform.",
    4: "Your emotions are valid—but not your whole story.",
    5: "Knowledge is power, but connection gives it purpose.",
    6: "Trust yourself as much as others trust you.",
    7: "Slow down and savor one joyful moment today.",
    8: "Let vulnerability be a strength today.",
    9: "Your voice matters. Speak up once today.",
  }

  const batch = db.batch()
  for (const [type, prompt] of Object.entries(prompts)) {
    const ref = db.collection('prompts').doc(type)
    batch.set(ref, { prompt })
  }

  await batch.commit()

  console.log('✅ companionSettings and prompts seeded!')
}

seedData()
