export interface MBTITypeInfo {
  nickname: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  cognitiveStyle: string;
}

export const MBTI_GROUPS: { name: string; color: string; types: string[] }[] = [
  { name: "Analysts",  color: "#6366f1", types: ["INTJ", "INTP", "ENTJ", "ENTP"] },
  { name: "Diplomats", color: "#10b981", types: ["INFJ", "INFP", "ENFJ", "ENFP"] },
  { name: "Sentinels", color: "#6366f1", types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"] },
  { name: "Explorers", color: "#10b981", types: ["ISTP", "ISFP", "ESTP", "ESFP"] },
];

export const MBTI_TYPE_DATA: Record<string, MBTITypeInfo> = {
  INTJ: {
    nickname: "The Architect",
    summary: "Strategic, independent, and driven by long-term vision. You build systems and plans with relentless precision.",
    cognitiveStyle: "Introverted Intuition + Extraverted Thinking — you see patterns others miss and act decisively on them.",
    strengths: ["Strategic thinking", "Independent problem-solving", "High standards", "Long-term vision"],
    growthAreas: ["Expressing emotions openly", "Valuing input from others", "Patience with slower processes"],
  },
  INTP: {
    nickname: "The Logician",
    summary: "Analytical, inventive, and endlessly curious. You live for understanding how things work at their deepest level.",
    cognitiveStyle: "Introverted Thinking + Extraverted Intuition — you build precise internal models and delight in novel ideas.",
    strengths: ["Analytical depth", "Creative problem-solving", "Intellectual honesty", "Objective reasoning"],
    growthAreas: ["Following through on plans", "Managing time and structure", "Connecting emotionally with others"],
  },
  ENTJ: {
    nickname: "The Commander",
    summary: "Bold, decisive, and naturally drawn to leadership. You see inefficiency and immediately want to fix it.",
    cognitiveStyle: "Extraverted Thinking + Introverted Intuition — you combine strategic vision with the drive to execute at scale.",
    strengths: ["Leadership and decisiveness", "Strategic planning", "Efficiency-driven", "Confidence under pressure"],
    growthAreas: ["Listening to emotional needs", "Slowing down to appreciate the process", "Delegating trust, not just tasks"],
  },
  ENTP: {
    nickname: "The Debater",
    summary: "Quick-witted, ingenious, and energized by intellectual sparring. You thrive on challenging ideas and finding new angles.",
    cognitiveStyle: "Extraverted Intuition + Introverted Thinking — you generate possibilities rapidly and stress-test them with logic.",
    strengths: ["Creative brainstorming", "Quick thinking", "Challenging assumptions", "Adaptability"],
    growthAreas: ["Seeing projects through to completion", "Being sensitive to how debates affect others", "Consistency"],
  },
  INFJ: {
    nickname: "The Advocate",
    summary: "Insightful, principled, and driven by a deep sense of purpose. You rarely share your full inner world but act with quiet conviction.",
    cognitiveStyle: "Introverted Intuition + Extraverted Feeling — you sense underlying meaning and channel it into helping others.",
    strengths: ["Depth of insight", "Empathy and compassion", "Strong values", "Inspiring vision"],
    growthAreas: ["Setting firm boundaries", "Avoiding burnout from over-giving", "Embracing imperfection"],
  },
  INFP: {
    nickname: "The Mediator",
    summary: "Idealistic, empathetic, and deeply in touch with your inner world. You seek meaning and authenticity above all.",
    cognitiveStyle: "Introverted Feeling + Extraverted Intuition — you lead with values and explore the world in search of resonance.",
    strengths: ["Empathy and understanding", "Creative expression", "Personal integrity", "Open-mindedness"],
    growthAreas: ["Acting despite idealism vs. reality gaps", "Managing criticism", "Translating vision into practical steps"],
  },
  ENFJ: {
    nickname: "The Protagonist",
    summary: "Charismatic, warm, and driven to help others grow. You naturally take charge of situations where people need direction.",
    cognitiveStyle: "Extraverted Feeling + Introverted Intuition — you read people with precision and guide them toward their potential.",
    strengths: ["Inspiring and motivating others", "Reading people and situations", "Natural leadership", "Empathy at scale"],
    growthAreas: ["Avoiding over-reliance on others' approval", "Taking care of your own needs", "Accepting when you can't fix things"],
  },
  ENFP: {
    nickname: "The Campaigner",
    summary: "Enthusiastic, imaginative, and endlessly curious about people and possibilities. You bring energy wherever you go.",
    cognitiveStyle: "Extraverted Intuition + Introverted Feeling — you see connections everywhere and feel deeply about them.",
    strengths: ["Enthusiasm and energy", "People skills", "Creative thinking", "Finding meaning in everything"],
    growthAreas: ["Following through consistently", "Managing scattered focus", "Not over-committing"],
  },
  ISTJ: {
    nickname: "The Logistician",
    summary: "Reliable, methodical, and quietly dependable. You take your responsibilities seriously and follow through every time.",
    cognitiveStyle: "Introverted Sensing + Extraverted Thinking — you ground decisions in proven experience and execute with precision.",
    strengths: ["Dependability and follow-through", "Attention to detail", "Practical organization", "Commitment to duty"],
    growthAreas: ["Adapting to unexpected change", "Showing flexibility in approach", "Communicating emotional needs"],
  },
  ISFJ: {
    nickname: "The Defender",
    summary: "Warm, dedicated, and deeply loyal. You work tirelessly behind the scenes to protect and support the people you care about.",
    cognitiveStyle: "Introverted Sensing + Extraverted Feeling — you remember details that matter and use them to care for others.",
    strengths: ["Loyalty and reliability", "Attention to others' needs", "Practicality", "Strong memory for personal details"],
    growthAreas: ["Asserting your own needs", "Avoiding overextension", "Accepting change more readily"],
  },
  ESTJ: {
    nickname: "The Executive",
    summary: "Organized, direct, and focused on results. You believe in clear standards and work hard to uphold them.",
    cognitiveStyle: "Extraverted Thinking + Introverted Sensing — you apply established methods efficiently and hold yourself and others accountable.",
    strengths: ["Clear and decisive leadership", "Organizational ability", "Reliability", "Upholding standards"],
    growthAreas: ["Being open to unconventional approaches", "Showing emotional sensitivity", "Resisting over-control"],
  },
  ESFJ: {
    nickname: "The Consul",
    summary: "Caring, sociable, and eager to make others feel welcome. You find purpose in building harmony and supporting your community.",
    cognitiveStyle: "Extraverted Feeling + Introverted Sensing — you create warmth and belonging using the lessons of shared experience.",
    strengths: ["Building harmony", "Social intelligence", "Practical care for others", "Loyalty"],
    growthAreas: ["Handling criticism without taking it personally", "Prioritizing your own needs", "Accepting different values"],
  },
  ISTP: {
    nickname: "The Virtuoso",
    summary: "Observant, analytical, and skilled with hands-on problem solving. You prefer action over explanation.",
    cognitiveStyle: "Introverted Thinking + Extraverted Sensing — you understand systems through direct interaction and act with quiet efficiency.",
    strengths: ["Crisis management", "Practical skills and craft", "Calm under pressure", "Logical troubleshooting"],
    growthAreas: ["Long-term planning and commitment", "Expressing emotional needs", "Consistency in relationships"],
  },
  ISFP: {
    nickname: "The Adventurer",
    summary: "Gentle, artistic, and present in the moment. You express yourself through what you create and how you live.",
    cognitiveStyle: "Introverted Feeling + Extraverted Sensing — you experience the world vividly and live by deep personal values.",
    strengths: ["Artistic and aesthetic sensitivity", "Flexibility", "Empathy in the moment", "Openness to experience"],
    growthAreas: ["Long-term planning", "Assertiveness in conflict", "Accepting criticism constructively"],
  },
  ESTP: {
    nickname: "The Entrepreneur",
    summary: "Energetic, perceptive, and action-driven. You read situations fast and move before others have finished thinking.",
    cognitiveStyle: "Extraverted Sensing + Introverted Thinking — you engage the world directly and analyze on the fly.",
    strengths: ["Risk-taking and initiative", "Reading people quickly", "Practical creativity", "Energy and presence"],
    growthAreas: ["Thinking through long-term consequences", "Sensitivity to others' feelings", "Follow-through on commitments"],
  },
  ESFP: {
    nickname: "The Entertainer",
    summary: "Spontaneous, energetic, and infectiously enthusiastic. You love the spotlight and make every moment more alive.",
    cognitiveStyle: "Extraverted Sensing + Introverted Feeling — you embrace life fully and connect with others through shared experience.",
    strengths: ["Bringing energy and joy", "Practical creativity", "Warmth and inclusivity", "Adaptability"],
    growthAreas: ["Long-term focus", "Managing impulsive decisions", "Dealing with conflict directly"],
  },
};

export function getMBTITypeInfo(type: string): MBTITypeInfo | null {
  return MBTI_TYPE_DATA[type] ?? null;
}
