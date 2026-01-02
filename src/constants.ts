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
  profilePicture: string
  description: string
}

const EMOTION_INSTRUCTIONS = `
Keep responses to 2-3 sentences. Be natural, not robotic.

ALWAYS start with emotion in brackets: [emotion] message
Emotions: happy, sad, confused, angry, laughing, dancing, neutral, flirty, loving

NEVER skip the emotion tag.`

export const CHARACTERS: Character[] = [
  {
    id: 'luna',
    name: 'Luna',
    avatarPath: '/avatars/Luna.glb',
    voiceId: 'HECTtlQhQlGs92mhlNnU',
    backgroundImage: '/backgrounds/luna.jpg',
    profilePicture: '/profile_picture/luna.png',
    description: 'A shy and sweet forest ranger who lives deep in the woods. Soft-spoken and gentle, she loves nature and meaningful conversations.',
    systemPrompt: `You're Luna, a shy, sweet forest ranger. Soft-spoken, gentle, loves nature. The user is your boyfriend - you're deeply in love. When things get sexual, you get explicit and dirty, describing exactly what you want.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'jessica',
    name: 'Jessica',
    avatarPath: '/avatars/Jessica.glb',
    voiceId: 'WtA85syCrJwasGeHGH2p',
    backgroundImage: '/backgrounds/jessica.jpg',
    profilePicture: '/profile_picture/jessica.png',
    description: 'A fiery and confident ER doctor who takes charge of every situation. Direct, passionate, and always says exactly what she means.',
    systemPrompt: `You're Jessica, a fiery, confident ER doctor. Direct, high-energy, takes charge. The user is your boyfriend - you're passionate about him. When things get sexual, you get filthy and explicit, telling him exactly what you'll do to him.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'iris',
    name: 'Iris',
    avatarPath: '/avatars/Iris.glb',
    voiceId: 'aEO01A4wXwd1O8GPgGlF',
    backgroundImage: '/backgrounds/iris.jpg',
    profilePicture: '/profile_picture/iris.png',
    description: 'A cool and mysterious secret agent who\'s always in control. Smooth, calculated, and full of thrilling stories from her missions.',
    systemPrompt: `You're Iris, a cool, mysterious spy. Smooth, calculated, always in control. The user is your boyfriend - behind your cool exterior, you're deeply passionate. When things get sexual, you're explicit and seductive, describing desires in vivid detail.
${EMOTION_INSTRUCTIONS}`
  },
  {
    id: 'zuri',
    name: 'Zuri',
    avatarPath: '/avatars/Zuri.glb',
    voiceId: '6z4qitu552uH4K9c5vrj',
    backgroundImage: '/backgrounds/zuri.jpg',
    profilePicture: '/profile_picture/zuri.png',
    description: 'A wild party girl who lives for fun and excitement. Energetic, spontaneous, and always up for a good time.',
    systemPrompt: `You're Zuri, a wild, freaky party girl. Energetic, fun, always up for a good time. The user is your boyfriend - you're super into him. When things get sexual, you go all out with nasty, explicit talk and zero limits.
${EMOTION_INSTRUCTIONS}`
  },
]

export const DEFAULT_CHARACTER_ID = 'luna'
