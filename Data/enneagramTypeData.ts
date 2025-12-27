/**
 * Enneagram Type Data
 * Source: The Enneagram Institute (https://www.enneagraminstitute.com)
 *
 * This file contains detailed information about each Enneagram type and wing combination,
 * including core motivations, strengths, growth areas, and blind spots.
 */

export interface EnneagramTypeInfo {
  coreMotivation: string;
  keyStrengths: string[];
  growthAreas: string[];
  blindSpots: string[];
}

// Core type information from Enneagram Institute
export const CORE_TYPE_INFO: { [key: number]: EnneagramTypeInfo } = {
  1: {
    coreMotivation: "To have integrity and be balanced",
    keyStrengths: [
      "Principled with strong personal convictions",
      "Organized, responsible, and self-disciplined",
      "Wise and discerning with a sense of purpose"
    ],
    growthAreas: [
      "Struggle with perfectionism and harsh self-criticism",
      "Prone to resentment when others don't meet their standards"
    ],
    blindSpots: [
      "May not recognize how criticism alienates others",
      "Underestimate how self-judgment undermines improvement",
      "Often driven by passion while believing they're purely logical"
    ]
  },
  2: {
    coreMotivation: "To feel loved and needed by others",
    keyStrengths: [
      "Empathetic, compassionate, and warm-hearted",
      "Genuinely helpful and generous",
      "Able to see and nurture the best in others"
    ],
    growthAreas: [
      "Tendency toward codependency and over-involvement",
      "Difficulty acknowledging and addressing their own needs"
    ],
    blindSpots: [
      "May not realize they help partly to feel needed themselves",
      "Unaware that sacrificial behavior creates hidden expectations",
      "Fail to see that ignoring personal needs undermines authenticity"
    ]
  },
  3: {
    coreMotivation: "To feel valuable and worthwhile",
    keyStrengths: [
      "Self-assured, competent, and goal-oriented",
      "Adaptable, charming, and naturally motivating",
      "High achievers who inspire others through accomplishments"
    ],
    growthAreas: [
      "Tendency toward workaholism and excessive competitiveness",
      "Suppressing feelings to focus on performance and image"
    ],
    blindSpots: [
      "May not recognize how far they've drifted from their authentic self",
      "Can become prone to self-deception without realizing it",
      "Often package themselves for others while losing touch with true desires"
    ]
  },
  4: {
    coreMotivation: "To find themselves and create a personal identity",
    keyStrengths: [
      "Profoundly creative and transformative",
      "Emotionally honest and self-aware",
      "Sensitive, intuitive, and compassionate"
    ],
    growthAreas: [
      "Tendency to equate themselves with feelings, missing good qualities",
      "Procrastination while waiting for the right mood"
    ],
    blindSpots: [
      "Underestimate their actual talents due to focusing on deficiencies",
      "Don't recognize that much of their story is no longer true",
      "Fail to see that self-esteem comes from action, not introspection"
    ]
  },
  5: {
    coreMotivation: "To be capable and competent",
    keyStrengths: [
      "Intense focus and deep concentration on complex ideas",
      "Perceptive with extraordinary insight",
      "Innovative thinkers who produce pioneering discoveries"
    ],
    growthAreas: [
      "Tendency to retreat into mental worlds rather than engage practically",
      "Difficulty maintaining emotional connections due to detachment"
    ],
    blindSpots: [
      "May not recognize that mastery in one area can't resolve deeper anxieties",
      "Unaware that collecting knowledge creates self-defeating isolation",
      "Fail to see how detachment creates self-fulfilling relationship problems"
    ]
  },
  6: {
    coreMotivation: "To have security and support",
    keyStrengths: [
      "Deeply loyal to friends, beliefs, and communities",
      "Reliable, responsible, and trustworthy",
      "Excellent problem-solvers with courage when healthy"
    ],
    growthAreas: [
      "Persistent self-doubt despite intelligence",
      "Tendency toward anxiety and difficulty making decisions independently"
    ],
    blindSpots: [
      "Overestimate threats and catastrophize unlikely scenarios",
      "Fears reveal more about their attitudes than others' true intentions",
      "Underestimate how positively others view them"
    ]
  },
  7: {
    coreMotivation: "To be satisfied and content with life",
    keyStrengths: [
      "Highly versatile and multi-talented with quick minds",
      "Naturally optimistic, cheerful, and enthusiastic",
      "Practical, productive, and excellent at brainstorming"
    ],
    growthAreas: [
      "Scattered focus and difficulty completing projects",
      "Impulsivity and chronic restlessness to avoid deeper anxiety"
    ],
    blindSpots: [
      "Unaware that relentless seeking may prevent genuine satisfaction",
      "Don't recognize that rapid mental pace undermines fulfillment",
      "Miss the present moment by constantly anticipating future experiences"
    ]
  },
  8: {
    coreMotivation: "To protect themselves and maintain control",
    keyStrengths: [
      "Decisive, authoritative natural leaders",
      "Resourceful with abundant willpower",
      "Protective, honorable, and willing to champion others"
    ],
    growthAreas: [
      "Difficulty acknowledging vulnerability and emotional connection",
      "Tendency to dominate without respecting others as equals"
    ],
    blindSpots: [
      "Believe they're self-sufficient while depending heavily on others",
      "Fail to recognize how controlling behavior alienates people who care",
      "Underestimate the cost their power-seeking behaviors exact"
    ]
  },
  9: {
    coreMotivation: "To have inner stability and peace of mind",
    keyStrengths: [
      "Accepting, trusting, and emotionally stable with calming influence",
      "Creative, optimistic, and supportive mediators",
      "Possess great equanimity and contentment at their best"
    ],
    growthAreas: [
      "Tendency toward complacency and minimizing problems",
      "Struggle with self-assertion and maintaining their own identity"
    ],
    blindSpots: [
      "Underestimate how avoidance of conflict damages relationships",
      "May not recognize they lack a strong sense of their own identity",
      "Unaware how their passivity and procrastination frustrate others"
    ]
  }
};

// Wing combination descriptions with blended characteristics
export const WING_COMBINATION_DATA: { [key: string]: EnneagramTypeInfo } = {
  "1w9": {
    coreMotivation: "To maintain integrity while creating harmony",
    keyStrengths: [
      "Natural mediator with strong principles",
      "Patient and idealistic with diplomatic approach",
      "Creates harmony while upholding values"
    ],
    growthAreas: [
      "May suppress own needs to avoid conflict",
      "Can be passive-aggressive when values are challenged"
    ],
    blindSpots: [
      "May not recognize own anger or frustration",
      "Can lose themselves in routines and others' agendas",
      "May avoid necessary confrontations even when principles are at stake"
    ]
  },
  "1w2": {
    coreMotivation: "To do what's right while helping others",
    keyStrengths: [
      "Committed to improvement with warm, helpful disposition",
      "Service-oriented with high standards",
      "Blend principle with genuine care for others"
    ],
    growthAreas: [
      "Can be critical of others while helping them",
      "May feel unappreciated when their efforts aren't recognized"
    ],
    blindSpots: [
      "May not see how giving advice can feel controlling",
      "Can confuse what's right with what others need",
      "May struggle with resentment when help isn't received as intended"
    ]
  },
  "2w1": {
    coreMotivation: "To be helpful while maintaining high standards",
    keyStrengths: [
      "Genuine care for others with conscientiousness",
      "Helpful with integrity and ethical awareness",
      "Balance warmth with principled action"
    ],
    growthAreas: [
      "Can be judgmental while trying to help",
      "May suppress their own needs in service of others"
    ],
    blindSpots: [
      "May not recognize how their standards create pressure on others",
      "Can miss how their help sometimes includes subtle criticism",
      "May struggle to see when helping becomes controlling"
    ]
  },
  "2w3": {
    coreMotivation: "To be loved while achieving success",
    keyStrengths: [
      "Nurturing heart with ambition and social awareness",
      "Support others while also achieving goals",
      "Charismatic and engaging with genuine warmth"
    ],
    growthAreas: [
      "Can confuse being loved with being admired",
      "May overextend themselves to maintain relationships and image"
    ],
    blindSpots: [
      "May not recognize when relationships serve their ambitions",
      "Can lose touch with authentic needs while pleasing others",
      "May struggle to admit when they need help themselves"
    ]
  },
  "3w2": {
    coreMotivation: "To achieve success while building connections",
    keyStrengths: [
      "Drive for success with interpersonal warmth",
      "Excel while building genuine connections",
      "Motivating and inspiring to others"
    ],
    growthAreas: [
      "Can prioritize image over authentic relationships",
      "May use charm to achieve goals rather than connect genuinely"
    ],
    blindSpots: [
      "May not see when networking replaces real friendship",
      "Can lose sight of which relationships are transactional",
      "May struggle to distinguish between being liked and being valuable"
    ]
  },
  "3w4": {
    coreMotivation: "To achieve success while staying authentic",
    keyStrengths: [
      "Blend ambition with authenticity and depth",
      "Pursue success while honoring unique identity",
      "Creative achievers with emotional awareness"
    ],
    growthAreas: [
      "Can feel torn between achievement and authentic expression",
      "May struggle with image while craving depth"
    ],
    blindSpots: [
      "May not recognize when they're performing authenticity",
      "Can miss how success-seeking conflicts with deeper values",
      "May struggle to see when uniqueness becomes another image to project"
    ]
  },
  "4w3": {
    coreMotivation: "To express uniqueness while achieving tangible results",
    keyStrengths: [
      "Depth of feeling with goal-oriented action",
      "Express uniqueness while producing results",
      "Creative with practical accomplishment"
    ],
    growthAreas: [
      "Can feel pressure to make emotions productive",
      "May struggle between authenticity and achievement"
    ],
    blindSpots: [
      "May not see when ambition undermines emotional honesty",
      "Can miss how comparing accomplishments triggers envy",
      "May struggle to value inner growth over external validation"
    ]
  },
  "4w5": {
    coreMotivation: "To understand themselves while pursuing knowledge",
    keyStrengths: [
      "Emotional depth with intellectual curiosity",
      "Explore inner world while seeking knowledge",
      "Creative and analytical with unique perspective"
    ],
    growthAreas: [
      "Can become isolated in introspection and analysis",
      "May intellectualize emotions rather than engage with them"
    ],
    blindSpots: [
      "May not recognize when withdrawal prevents connection",
      "Can miss how analysis replaces emotional engagement",
      "May struggle to see when self-understanding becomes self-absorption"
    ]
  },
  "5w4": {
    coreMotivation: "To be competent while honoring uniqueness",
    keyStrengths: [
      "Analytical thinking with creative expression",
      "Pursue knowledge while honoring unique perspective",
      "Innovative with emotional depth"
    ],
    growthAreas: [
      "Can become detached while craving connection",
      "May feel misunderstood and retreat further"
    ],
    blindSpots: [
      "May not see how specialization increases isolation",
      "Can miss how uniqueness becomes barrier to connection",
      "May struggle to recognize when they're avoiding engagement"
    ]
  },
  "5w6": {
    coreMotivation: "To be capable while maintaining security",
    keyStrengths: [
      "Intellectual curiosity with practical caution",
      "Seek understanding while being mindful of challenges",
      "Loyal and analytical problem-solvers"
    ],
    growthAreas: [
      "Can become paralyzed by over-analysis",
      "May struggle with anxiety while seeking security through knowledge"
    ],
    blindSpots: [
      "May not recognize when preparing becomes procrastinating",
      "Can miss how doubt undermines their competence",
      "May struggle to see when caution prevents action"
    ]
  },
  "6w5": {
    coreMotivation: "To have security through understanding",
    keyStrengths: [
      "Loyalty and responsibility with analytical thinking",
      "Prepare carefully while seeking security",
      "Thoughtful and reliable problem-solvers"
    ],
    growthAreas: [
      "Can become withdrawn when anxious",
      "May overanalyze threats and retreat into isolation"
    ],
    blindSpots: [
      "May not see how analysis intensifies anxiety",
      "Can miss how withdrawal reduces support",
      "May struggle to recognize when preparation becomes avoidance"
    ]
  },
  "6w7": {
    coreMotivation: "To have security while enjoying life",
    keyStrengths: [
      "Reliability with optimism and enthusiasm",
      "Face challenges with both caution and positive energy",
      "Loyal and engaging with balanced perspective"
    ],
    growthAreas: [
      "Can use optimism to avoid facing fears",
      "May struggle between security-seeking and adventure"
    ],
    blindSpots: [
      "May not recognize when positivity masks anxiety",
      "Can miss how distraction prevents dealing with core concerns",
      "May struggle to see when fun-seeking is fear-avoidance"
    ]
  },
  "7w6": {
    coreMotivation: "To be satisfied while maintaining commitments",
    keyStrengths: [
      "Adventure-seeking with loyalty and responsibility",
      "Pursue joy while maintaining commitments",
      "Enthusiastic and reliable with grounded optimism"
    ],
    growthAreas: [
      "Can feel torn between freedom and responsibility",
      "May struggle with anxiety beneath optimistic surface"
    ],
    blindSpots: [
      "May not see how commitments feel limiting when anxious",
      "Can miss underlying fear beneath restlessness",
      "May struggle to recognize when enthusiasm covers doubt"
    ]
  },
  "7w8": {
    coreMotivation: "To be satisfied while maintaining control",
    keyStrengths: [
      "Enthusiasm with assertiveness and confidence",
      "Pursue experiences while taking charge",
      "Energetic leaders with can-do attitude"
    ],
    growthAreas: [
      "Can become excessive in pursuit of stimulation",
      "May struggle with impulsivity and impatience"
    ],
    blindSpots: [
      "May not recognize how intensity overwhelms others",
      "Can miss how control-seeking limits genuine enjoyment",
      "May struggle to see when assertiveness becomes domination"
    ]
  },
  "8w7": {
    coreMotivation: "To be strong while enjoying life",
    keyStrengths: [
      "Strength and directness with optimism and energy",
      "Lead confidently while enjoying life",
      "Powerful and enthusiastic with infectious vitality"
    ],
    growthAreas: [
      "Can become excessive and impulsive",
      "May struggle with restraint and sensitivity to others"
    ],
    blindSpots: [
      "May not see how intensity and appetite exhaust others",
      "Can miss how pleasure-seeking avoids vulnerability",
      "May struggle to recognize when strength becomes insensitivity"
    ]
  },
  "8w9": {
    coreMotivation: "To be strong while maintaining peace",
    keyStrengths: [
      "Power and assertiveness with calm and patience",
      "Protect others while maintaining peace",
      "Strong yet receptive leaders"
    ],
    growthAreas: [
      "Can become stubborn and immovable",
      "May struggle between asserting will and keeping peace"
    ],
    blindSpots: [
      "May not see how their calm masks underlying intensity",
      "Can miss how avoiding conflict undermines directness",
      "May struggle to recognize when peace-keeping enables problems"
    ]
  },
  "9w8": {
    coreMotivation: "To maintain peace while staying strong",
    keyStrengths: [
      "Harmony-seeking with quiet strength",
      "Maintain peace while standing firm when needed",
      "Grounded and steadfast mediators"
    ],
    growthAreas: [
      "Can become stubborn when pushed",
      "May struggle between accommodation and assertion"
    ],
    blindSpots: [
      "May not recognize their own power and impact",
      "Can miss how passive-aggressive behavior emerges under pressure",
      "May struggle to see when going along prevents authentic connection"
    ]
  },
  "9w1": {
    coreMotivation: "To maintain peace while upholding values",
    keyStrengths: [
      "Harmony-seeking with principled idealism",
      "Seek peace while upholding values",
      "Patient mediators with moral compass"
    ],
    growthAreas: [
      "Can become rigid about how peace should look",
      "May suppress anger even when principles are violated"
    ],
    blindSpots: [
      "May not recognize own anger or frustration",
      "Can lose themselves in routines and others' agendas",
      "May avoid necessary confrontations even when principles are at stake"
    ]
  }
};

/**
 * Get detailed type information for a given type and wing combination
 * @param type - Main Enneagram type (1-9)
 * @param wing - Wing type (adjacent number), optional
 * @returns EnneagramTypeInfo object with detailed characteristics
 */
export function getEnneagramTypeInfo(
  type: number,
  wing?: number | null
): EnneagramTypeInfo {
  if (wing) {
    const wingKey = `${type}w${wing}`;
    return WING_COMBINATION_DATA[wingKey] || CORE_TYPE_INFO[type];
  }
  return CORE_TYPE_INFO[type];
}
