/**
 * Enneagram Assessment Data
 * Knowledge base for the AI typing interview system prompt.
 *
 * Sources:
 * - Riso & Hudson, "The Wisdom of the Enneagram" (1999)
 * - The Enneagram Institute (enneagraminstitute.com)
 * - Beatrice Chestnut, "The Complete Enneagram" (2013)
 */

export interface TypeIndicators {
  coreFear: string;
  coreDesire: string;
  coreMotivation: string;
  center: 'gut' | 'heart' | 'head';
  defensePattern: string;
  underStress: string;
  atBest: string;
  keyInterviewMarkers: string[];
  commonMisidentifications: string[];
}

export const TYPE_INDICATORS: { [key: number]: TypeIndicators } = {
  1: {
    coreFear: 'Being corrupt, evil, or defective',
    coreDesire: 'To be good, balanced, and have integrity',
    coreMotivation: 'To improve themselves and the world; to justify themselves; to avoid anger and maintain self-control',
    center: 'gut',
    defensePattern: 'Reaction formation — converts unacceptable impulses into their opposite',
    underStress: 'Becomes moody, irrational, withdrawn (moves toward Type 4 patterns)',
    atBest: 'Wise, discerning, realistic, accepting of self and others (integrates toward Type 7)',
    keyInterviewMarkers: [
      'Strong inner critic — notices flaws in themselves and others',
      'Suppresses anger, experiences it as resentment or frustration',
      'High standards; feels responsible for doing things "the right way"',
      'Difficulty relaxing; feels guilty when not being productive',
      'Frequent use of "should," "ought," "must," "proper"',
      'Believes there is a right and wrong way to do everything',
    ],
    commonMisidentifications: ['Type 6 (both conscientious)', 'Type 3 (both driven)', 'Type 8 (both assertive)'],
  },
  2: {
    coreFear: 'Being unloved or unwanted for themselves alone',
    coreDesire: 'To feel loved and appreciated',
    coreMotivation: 'To be loved; to express feelings; to be needed; to get others to respond to them',
    center: 'heart',
    defensePattern: 'Repression — keeps own needs and feelings out of awareness',
    underStress: 'Becomes aggressive, domineering, entitled (moves toward Type 8 patterns)',
    atBest: 'Unconditionally loving, gives freely without expectation (integrates toward Type 4)',
    keyInterviewMarkers: [
      'Attunes to others\' needs almost automatically; reads the room',
      'Difficulty identifying or expressing own needs',
      'Feels indispensable; pride in being needed or depended on',
      'Gives generously but may feel resentful when not reciprocated',
      'Strong sense of what others need, less clear about what they themselves need',
      'Identity built around relationships and being helpful',
    ],
    commonMisidentifications: ['Type 9 (both people-oriented)', 'Type 6 (both relationship-focused)', 'Type 4 (both emotional)'],
  },
  3: {
    coreFear: 'Being worthless or without value apart from achievements',
    coreDesire: 'To feel valuable and worthwhile',
    coreMotivation: 'To be affirmed; to distinguish themselves from others; to have attention, admiration, and be impressive',
    center: 'heart',
    defensePattern: 'Identification — merges with roles and achievements; confuses who they are with what they do',
    underStress: 'Becomes disengaged, detached, secretive (moves toward Type 9 patterns)',
    atBest: 'Authentic, humble, charitable, deeply admirable (integrates toward Type 6)',
    keyInterviewMarkers: [
      'Image-conscious; adapts persona to the audience or context',
      'Strongly identifies with accomplishments and success',
      'Feelings seem secondary to getting things done',
      'Competitive; compares themselves to others\' achievements',
      'Efficiency-oriented; dislikes wasted effort',
      'Discomfort sitting with emotions without doing something',
    ],
    commonMisidentifications: ['Type 1 (both achievement-oriented)', 'Type 7 (both driven)', 'Type 8 (both confident)'],
  },
  4: {
    coreFear: 'Having no personal significance; being fundamentally defective',
    coreDesire: 'To find themselves and create a unique identity',
    coreMotivation: 'To express themselves and their individuality; to create and surround themselves with beauty; to maintain their feelings',
    center: 'heart',
    defensePattern: 'Introjection — takes in and holds on to negative experiences and feelings',
    underStress: 'Becomes over-involved with others, clingy (moves toward Type 2 patterns)',
    atBest: 'Inspired, highly creative, emotionally balanced, life-giving (integrates toward Type 1)',
    keyInterviewMarkers: [
      'Intense longing for something they feel is missing',
      'Strong sense of being different or misunderstood by others',
      'Deep emotional life; feels emotions more intensely than most',
      'Romanticizes the past or idealizes what\'s absent',
      'Values authenticity; dislikes superficiality',
      'May feel envy but frames it as yearning for what others have',
    ],
    commonMisidentifications: ['Type 2 (both emotional)', 'Type 9 (both withdrawn at times)', 'Type 6 (both anxious)'],
  },
  5: {
    coreFear: 'Being helpless, incompetent, or incapable',
    coreDesire: 'To be capable and competent',
    coreMotivation: 'To possess knowledge; to understand the environment; to remain isolated from threat',
    center: 'head',
    defensePattern: 'Isolation — separates feelings from thinking; compartmentalizes',
    underStress: 'Becomes scattered, hyperactive, impulsive (moves toward Type 7 patterns)',
    atBest: 'Visionary, pioneering, open-minded, ahead of their time (integrates toward Type 8)',
    keyInterviewMarkers: [
      'Strong desire for privacy and personal space',
      'Manages energy carefully; social interactions feel draining',
      'Prefers to observe before engaging; dislikes being put on the spot',
      'Accumulates knowledge as a defense against feeling unprepared',
      'Feelings processed privately, often after the fact',
      'Clear sense of how much time/energy can be given before needing to recharge',
    ],
    commonMisidentifications: ['Type 4 (both withdrawn)', 'Type 1 (both analytical)', 'Type 9 (both non-confrontational)'],
  },
  6: {
    coreFear: 'Being without support or guidance; being alone',
    coreDesire: 'To have security and feel supported',
    coreMotivation: 'To have security; to feel supported by others; to test others\' attitudes toward them; to fight against anxiety',
    center: 'head',
    defensePattern: 'Projection — displaces own feelings onto others and the external world',
    underStress: 'Becomes competitive, arrogant, grandiose (moves toward Type 3 patterns)',
    atBest: 'Self-reliant, courageous, takes action on own values (integrates toward Type 9)',
    keyInterviewMarkers: [
      'Questions authority but also may seek reassurance from authorities',
      'Anticipates what could go wrong; plans contingencies',
      'Loyalty is core; distrusts easily but very devoted when trust is established',
      'Inner doubt even when appearing confident (counterphobic variant can seem like Type 8)',
      'Strong "us vs. them" awareness; seeks alliances',
      'Fear-based thinking even when not consciously anxious',
    ],
    commonMisidentifications: ['Type 1 (both rule-aware)', 'Type 2 (both relationship-focused)', 'Type 8 (counterphobic 6 vs 8)'],
  },
  7: {
    coreFear: 'Being deprived, trapped, or in pain',
    coreDesire: 'To be satisfied and content; to have needs met',
    coreMotivation: 'To maintain freedom and happiness; to avoid missing out; to keep themselves stimulated and occupied',
    center: 'head',
    defensePattern: 'Rationalization — reframes negative experiences as positive or manageable',
    underStress: 'Becomes perfectionistic, critical, inflexible (moves toward Type 1 patterns)',
    atBest: 'Focused, grateful, joyful; fully present and appreciative (integrates toward Type 5)',
    keyInterviewMarkers: [
      'Mind constantly generating options, ideas, connections',
      'Reframes negatives into positives almost automatically',
      'Fear of boredom, routine, or being stuck with no exit',
      'Starts many things; finishing is harder',
      'Enthusiasm is genuine but can skip over depth for breadth',
      'Avoids pain by keeping busy, planning, or staying positive',
    ],
    commonMisidentifications: ['Type 3 (both driven and image-conscious)', 'Type 4 (both intense)', 'Type 8 (both bold)'],
  },
  8: {
    coreFear: 'Being harmed, controlled, or violated',
    coreDesire: 'To protect themselves and be in control of their own life',
    coreMotivation: 'To be self-reliant; to prove strength and resist weakness; to be important in the world',
    center: 'gut',
    defensePattern: 'Denial — pushes past vulnerability and weakness; refuses to acknowledge limitation',
    underStress: 'Becomes secretive, withdrawn, isolated (moves toward Type 5 patterns)',
    atBest: 'Heroic, magnanimous, uses strength to protect and empower others (integrates toward Type 2)',
    keyInterviewMarkers: [
      'Directness; says exactly what they mean, expects the same',
      'Comfort with conflict; tension energizes rather than discomforts',
      'Strong protector instinct toward people they care about',
      'Intense dislike of being controlled, restricted, or patronized',
      'Body-based energy; makes decisions instinctively and confidently',
      'Vulnerability is carefully guarded; appears when safety is proven',
    ],
    commonMisidentifications: ['Type 6 (counterphobic)', 'Type 3 (both assertive)', 'Type 1 (both principled and direct)'],
  },
  9: {
    coreFear: 'Loss, separation, fragmentation',
    coreDesire: 'To have inner stability and peace of mind',
    coreMotivation: 'To create harmony; to avoid conflicts and tension; to preserve things as they are; to resist whatever would agitate them',
    center: 'gut',
    defensePattern: 'Narcotization — numbs out, goes on autopilot; attention drifts to less essential tasks',
    underStress: 'Becomes anxious, worried, suspicious (moves toward Type 6 patterns)',
    atBest: 'Deeply receptive, dynamic, alive, fully present, inclusive (integrates toward Type 3)',
    keyInterviewMarkers: [
      'Strong ability to see multiple perspectives; difficulty choosing their own',
      'Conflict feels physically uncomfortable; will avoid or smooth over',
      'Merging: adopts preferences and views of those around them',
      'Energy dissipated in low-priority tasks; procrastinates on meaningful work',
      'Anger exists but is suppressed; may manifest as passive resistance',
      'Deep desire for comfort, routine, and minimal disruption',
    ],
    commonMisidentifications: ['Type 5 (both withdrawn)', 'Type 2 (both accommodating)', 'Type 4 (both introverted at times)'],
  },
};

export const CENTERS_OVERVIEW = {
  gut: {
    types: [8, 9, 1],
    coreIssue: 'Anger and autonomy — these types have an instinctive, body-based way of knowing the world',
    theme: 'They struggle with the proper use of their instinctual energy: expressing it (8), repressing it (9), or redirecting it (1)',
    recognitionMarkers: [
      'First response is physical/instinctive rather than emotional or analytical',
      'Issues of control, independence, and resistance are prominent',
      'Anger is a key undercurrent — whether expressed, suppressed, or redirected',
    ],
  },
  heart: {
    types: [2, 3, 4],
    coreIssue: 'Shame and identity — these types are focused on feelings, image, and self-concept',
    theme: 'They struggle with authentic identity: helping as identity (2), achieving as identity (3), uniqueness as identity (4)',
    recognitionMarkers: [
      'First response involves feelings and how this relates to relationships',
      'Image and how others perceive them is significant',
      'Underlying shame or feeling of not being enough drives behavior',
    ],
  },
  head: {
    types: [5, 6, 7],
    coreIssue: 'Fear and security — these types rely on thinking to navigate the world',
    theme: 'They deal with underlying fear by withdrawing and gathering (5), projecting and seeking allies (6), or planning for options (7)',
    recognitionMarkers: [
      'First response is to think, analyze, or gather information',
      'Concerns about the future, security, or what could go wrong',
      'Inner anxiety that may or may not be apparent on the surface',
    ],
  },
};

export const DIFFERENTIATING_QUESTION_BANK = {
  openingQuestions: [
    'When something important is at stake — personally or professionally — what tends to happen inside you? What is your first impulse?',
    'Think of a situation where you felt completely in your element. What was it about that situation that felt right?',
    'When something in your life or environment feels "off," how do you typically respond?',
  ],
  centerIdentification: [
    'When you face a new challenge or decision, what do you do first — think it through, check in with your feelings, or act on gut instinct?',
    'What matters more to you: getting things right, being authentic in how you feel, or understanding the situation fully?',
    'Think about the last time something felt unfair or wrong. What happened in you — was it a physical reaction, an emotional response, or a flood of thoughts?',
  ],
  gutCenter: [
    'How do you relate to conflict? Does it feel energizing, something to minimize, or something to resolve correctly?',
    'When someone tells you what to do without your agreement, what happens inside you?',
    'How important is it to you that things are done the right way? Who decides what "right" means?',
  ],
  heartCenter: [
    'How much does other people\'s perception of you influence your choices or actions?',
    'Tell me about your relationship with your own feelings — do you spend a lot of time with them, or do you tend to move past them quickly?',
    'When you help someone, and they don\'t acknowledge it, what comes up for you?',
  ],
  headCenter: [
    'When you face uncertainty, what is your first move — gather more information, look for support, or look for options and possibilities?',
    'How do you relate to planning and preparation? Do you tend to over-prepare, seek reassurance, or keep multiple options open?',
    'Tell me about your relationship with anxiety or worry — is it something you experience often, and what triggers it for you?',
  ],
  motivationDepthQuestions: [
    'At your deepest level, what is most important to you — beyond goals or roles?',
    'What would you most want to avoid in your life, if you\'re honest about it?',
    'Think of a time when you felt most yourself — what were the conditions? What made it feel real?',
  ],
};
