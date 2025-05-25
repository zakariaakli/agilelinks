import { OpenAI } from 'openai';


export async function generateNudgeFromAI(input: { type: string, summary: string }) {

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY })
  try {
    const thread = await openai.beta.threads.create()

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Here is a user's dominant Enneagram type and profile summary. Generate a short daily nudge (1-2 sentences) that fits this personality.

Type: ${input.type}
Summary: ${input.summary}`
    })

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_NDG_GENERATOR_ID!,
    })

    let status = 'queued'
    while (status !== 'completed') {
      const result = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      status = result.status
      if (status === 'failed') throw new Error('Run failed')
      await new Promise(r => setTimeout(r, 1000))
    }

    const messages = await openai.beta.threads.messages.list(thread.id)
    const latest = messages.data[0]

    if (!latest || !latest.content || latest.content.length === 0) return null

    const firstContent = latest.content[0]
    if (firstContent.type === 'text') {
      return firstContent.text.value
    }

    return null
  } catch (err) {
    console.error('❌ OpenAI Assistant Error:', err)
    return null
  }
}