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
