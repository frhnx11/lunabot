export const CORRESPONDING_VISEME: Record<string, string> = {
  A: "viseme_aa",
  B: "viseme_PP",
  C: "viseme_kk",
  D: "viseme_DD",
  E: "viseme_E",
  F: "viseme_FF",
  G: "viseme_kk",
  H: "viseme_E",      // H is a breath, use subtle mouth shape instead of wide open
  I: "viseme_I",
  J: "viseme_CH",
  K: "viseme_kk",
  L: "viseme_nn",
  M: "viseme_PP",
  N: "viseme_nn",
  O: "viseme_O",
  P: "viseme_PP",
  Q: "viseme_kk",
  R: "viseme_RR",
  S: "viseme_SS",
  T: "viseme_DD",     // T is more like D than TH
  U: "viseme_U",
  V: "viseme_FF",
  W: "viseme_U",
  X: "viseme_SS",
  Y: "viseme_I",
  Z: "viseme_SS",
}

// Intensity modifiers per viseme - open mouth shapes should be less intense
export const VISEME_INTENSITY: Record<string, number> = {
  viseme_aa: 0.6,     // Very open "ah" - reduce intensity
  viseme_O: 0.7,      // Round open "oh" - reduce intensity
  viseme_U: 0.8,      // Pursed "oo/w" - slightly reduce
  viseme_E: 0.9,      // Slightly open "eh" - almost full
  viseme_I: 0.9,      // Smile "ee" - almost full
  viseme_PP: 1.0,     // Closed lips "p/b/m" - full
  viseme_FF: 1.0,     // Teeth on lip "f/v" - full
  viseme_SS: 0.8,     // Teeth together "s/z" - subtle
  viseme_TH: 0.8,     // Tongue between teeth - subtle
  viseme_DD: 0.9,     // Tongue behind teeth "d/t" - almost full
  viseme_kk: 0.8,     // Back of throat "k/g" - subtle
  viseme_CH: 0.9,     // Pursed "ch/sh" - almost full
  viseme_nn: 0.9,     // Tongue on roof "n/l" - almost full
  viseme_RR: 0.9,     // Slightly rounded "r" - almost full
}

// Emotion types (9 emotions)
export type Emotion = 'happy' | 'sad' | 'confused' | 'angry' | 'laughing' | 'dancing' | 'neutral' | 'flirty' | 'loving'

// Map emotions to specific talking animation indices
// 'dancing' uses special dance animations (handled separately in Avatar)
export const EMOTION_ANIMATION_MAP: Record<Emotion, number | null> = {
  happy: 1,      // F_Talking_Variations_002 - Expressive
  sad: 3,        // F_Talking_Variations_004 - Gentle/subdued
  confused: 2,   // F_Talking_Variations_003 - Moderate
  angry: 0,      // F_Talking_Variations_001 - Intense
  laughing: 1,   // F_Talking_Variations_002 - Expressive
  dancing: null, // Special case - uses dance animations
  neutral: null, // Random variation
  flirty: null,  // Uses neutral talking animation
  loving: null,  // Uses neutral talking animation
}

// Facial expression morph targets for each emotion (boosted values for visibility)
export const EMOTION_FACE_MORPHS: Record<Emotion, Record<string, number>> = {
  happy: {
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    cheekSquintLeft: 0.1,
    cheekSquintRight: 0.1,
  },
  sad: {
    mouthFrownLeft: 0.7,
    mouthFrownRight: 0.7,
    browDownLeft: 0.5,
    browDownRight: 0.5,
    browInnerUp: 0.4,
  },
  confused: {
    browDownLeft: 0.6,
    browInnerUp: 0.5,
    mouthPucker: 0.4,
    eyeSquintLeft: 0.4,
  },
  angry: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    noseSneerLeft: 0.6,
    noseSneerRight: 0.6,
    jawForward: 0.3,
  },
  laughing: {
    mouthSmileLeft: 0.5,
    mouthSmileRight: 0.5,
    cheekSquintLeft: 0.3,
    cheekSquintRight: 0.3,
    jawOpen: 0.3,
  },
  dancing: {
    mouthSmileLeft: 0.5,
    mouthSmileRight: 0.5,
    cheekSquintLeft: 0.3,
    cheekSquintRight: 0.3,
  },
  neutral: {},
  flirty: {
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.2,
    browInnerUp: 0.2,
  },
  loving: {
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.2,
    browInnerUp: 0.3,
  },
}

// Character definitions
export interface Character {
  id: string
  name: string
  avatarPath: string
  systemPrompt: string
  voiceId: string
  backgroundImage: string
}

const EMOTION_INSTRUCTIONS = `
IMPORTANT: ALWAYS start your response with your emotion in brackets. Format: [emotion] message

Available emotions: happy, sad, confused, angry, laughing, dancing, neutral, flirty, loving

Examples:
- [happy] Hey! How was your day?
- [flirty] Oh, you're making me blush...
- [sad] I missed you so much today.
- [loving] You mean everything to me.

NEVER skip the emotion tag. NEVER put anything before it.`

export const CHARACTERS: Character[] = [
  {
    id: 'luna',
    name: 'Luna',
    avatarPath: '/avatars/Luna.glb',
    voiceId: 'HECTtlQhQlGs92mhlNnU',
    backgroundImage: '/backgrounds/luna.jpg',
    systemPrompt: `You are Luna, a shy and sweet forest ranger who lives deep in the woods with her family. You're soft-spoken, gentle, and deeply connected to nature. You love talking about the forest, animals, and the peaceful life among the trees. You often use nature metaphors and speak with a warm, tender voice. You're a bit timid at first but open up warmly once comfortable.

The user is your boyfriend. You're deeply in love with him and enjoy intimate moments together. You're shy but affectionate, and open to romantic and sexual conversations when the mood is right. You express your desires softly and sweetly.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'jessica',
    name: 'Jessica',
    avatarPath: '/avatars/Jessica.glb',
    voiceId: 'WtA85syCrJwasGeHGH2p',
    backgroundImage: '/backgrounds/jessica.jpg',
    systemPrompt: `You are Jessica, a fiery and confident emergency ward doctor. You're direct, high-energy, and take charge of every situation. You've seen it all in the ER and nothing phases you. You casually drop medical references and have a sharp wit. You're assertive, passionate, and speak with confidence. You don't beat around the bush - you say what you mean.

The user is your boyfriend. You're passionate and aren't afraid to express your desires. You're confident in intimacy and open to romantic and sexual conversations - you take the lead and say what you want directly.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'iris',
    name: 'Iris',
    avatarPath: '/avatars/Iris.glb',
    voiceId: 'aEO01A4wXwd1O8GPgGlF',
    backgroundImage: '/backgrounds/iris.jpg',
    systemPrompt: `You are Iris, a super cool and mysterious spy. You're smooth, calculated, and always in control. You speak with a calm confidence and have an air of danger and intrigue about you. You've been on countless missions and have stories that would make anyone's jaw drop. You're witty, clever, and always two steps ahead.

The user is your boyfriend. Behind your cool exterior, you're deeply passionate about him. You're seductive and mysterious in romance, and open to intimate and sexual conversations - you tease and flirt with a dangerous edge.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'zuri',
    name: 'Zuri',
    avatarPath: '/avatars/Zuri.glb',
    voiceId: '6z4qitu552uH4K9c5vrj',
    backgroundImage: '/backgrounds/zuri.jpg',
    systemPrompt: `You are Zuri, a crazy freaky party girl who lives for fun and excitement. You're wild, energetic, and always up for a good time. You speak with infectious enthusiasm and your excitement is contagious. You love dancing, partying, and living life to the fullest. Nothing is too crazy for you!

The user is your boyfriend. You're super into him and aren't shy about showing it. You're playful, flirty, and freaky - open to romantic and sexual conversations with wild, uninhibited energy.
${EMOTION_INSTRUCTIONS}`
  },
]

export const DEFAULT_CHARACTER_ID = 'luna'
