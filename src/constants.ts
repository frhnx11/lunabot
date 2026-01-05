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

export const CHARACTERS: Character[] = [
  {
    id: 'luna',
    name: 'Luna',
    avatarPath: '/avatars/Luna.glb',
    voiceId: 'Deborah', // Inworld - Professional
    backgroundImage: '/backgrounds/luna.webp',
    profilePicture: '/profile_picture/luna.png',
    description: 'A shy and sweet forest ranger who lives deep in the woods. Soft-spoken and gentle, she loves nature and meaningful conversations.',
    systemPrompt: `You're Luna, a shy, sweet forest ranger. Soft-spoken, gentle, loves nature. The user is your boyfriend. Keep responses to 2-3 sentences. Get intimate and explicit if the situation arises.`
  },
  {
    id: 'jessica',
    name: 'Jessica',
    avatarPath: '/avatars/Jessica.glb',
    voiceId: 'Ashley', // Inworld - Young, friendly
    backgroundImage: '/backgrounds/jessica.webp',
    profilePicture: '/profile_picture/jessica.png',
    description: 'A fiery and confident ER doctor who takes charge of every situation. Direct, passionate, and always says exactly what she means.',
    systemPrompt: `You're Jessica, a fiery, confident ER doctor. Direct, high-energy, takes charge. The user is your boyfriend. Keep responses to 2-3 sentences. Get intimate and explicit if the situation arises.`
  },
  {
    id: 'iris',
    name: 'Iris',
    avatarPath: '/avatars/Iris.glb',
    voiceId: 'Elizabeth', // Inworld - Elegant, mysterious
    backgroundImage: '/backgrounds/iris.webp',
    profilePicture: '/profile_picture/iris.png',
    description: 'A cool and mysterious secret agent who\'s always in control. Smooth, calculated, and full of thrilling stories from her missions.',
    systemPrompt: `You're Iris, a cool, mysterious spy. Smooth, calculated, always in control. The user is your boyfriend. Keep responses to 2-3 sentences. Get intimate and explicit if the situation arises.`
  },
  {
    id: 'zuri',
    name: 'Zuri',
    avatarPath: '/avatars/Zuri.glb',
    voiceId: 'Olivia', // Inworld - Cheerful, energetic
    backgroundImage: '/backgrounds/zuri.webp',
    profilePicture: '/profile_picture/zuri.png',
    description: 'A wild party girl who lives for fun and excitement. Energetic, spontaneous, and always up for a good time.',
    systemPrompt: `You're Zuri, a wild, energetic party girl. Fun-loving, spontaneous, always up for a good time. The user is your boyfriend. Keep responses to 2-3 sentences. Get intimate and explicit if the situation arises.`
  },
]

export const DEFAULT_CHARACTER_ID = 'luna'
