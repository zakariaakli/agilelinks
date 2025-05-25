import { db } from '../../../firebase'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { generateNudgeFromAI } from '../../../lib/generateNudgeFromAI'
import { NextResponse } from 'next/server'

export async function GET() {
  const snapshot = await getDocs(collection(db, 'users'))
  let created = 0

  for (const docSnap of snapshot.docs) {
    const userId = docSnap.id
    const data = docSnap.data()

    const result = data.enneagramResult
    const email = data.email
    if (!result || !email || !result.summary) continue

    const summary = result.summary

    const typeLabels: Record<string, string> = {
      '1': 'The Reformer',
      '2': 'The Helper',
      '3': 'The Achiever',
      '4': 'The Individualist',
      '5': 'The Investigator',
      '6': 'The Loyalist',
      '7': 'The Enthusiast',
      '8': 'The Challenger',
      '9': 'The Peacemaker',
    }

    const types = Object.entries(result)
      .filter(([key]) => key.startsWith('enneagramType'))
      .map(([key, value]) => ({
        type: key.replace('enneagramType', ''),
        score: Number(value),
      }))

    const maxScore = Math.max(...types.map(t => t.score))

    const dominantTypes = types
      .filter(t => t.score === maxScore)
      .map(t => `${t.type}: ${typeLabels[t.type]}`)

    const typeString = dominantTypes.join(', ')

    const prompt = await generateNudgeFromAI({ type: typeString, summary })
    if (!prompt) continue

    const notifRef = doc(collection(db, 'notifications'))
    await setDoc(notifRef, {
      userId,
      type: typeString,
      prompt,
      createdAt: new Date(),
      read: false,
      feedback: null,
    })

    created++
  }

  return NextResponse.json({ status: 'success', created })
}
