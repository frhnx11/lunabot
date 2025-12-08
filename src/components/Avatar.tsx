import { useRef, useEffect, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useGraph } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { CORRESPONDING_VISEME, VISEME_INTENSITY, EMOTION_FACE_MORPHS } from '../constants'
import type { AlignmentChar } from '../services/elevenLabs'
import type { Emotion } from '../constants'

// Animation file paths
const IDLE_ANIMATION = '/animations/F_Standing_Idle_001.glb'

// Emotion-specific talking animations (unmapped emotions use neutral)
const EMOTION_ANIMATIONS: Partial<Record<Emotion, string>> = {
  angry: '/animations/M_Standing_Expressions_016.glb',
  laughing: '/animations/M_Standing_Expressions_007.glb',
  sad: '/animations/M_Talking_Variations_003.glb',
  dancing: '/animations/M_Dances_001.glb',
}
const NEUTRAL_TALKING_ANIMATION = '/animations/F_Talking_Variations_002.glb'

interface AvatarProps {
  audioUrl: string | null
  alignment: AlignmentChar[]
  speak: boolean
  emotion: Emotion
  onSpeakEnd: () => void
  showClothing: boolean
  position?: [number, number, number]
}

export function Avatar({ audioUrl, alignment, speak, emotion, onSpeakEnd, showClothing, ...props }: AvatarProps) {
  const { scene } = useGLTF('/avatar.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes } = useGraph(clone)

  // Toggle clothing visibility
  useEffect(() => {
    const clothingMeshes = ['Wolf3D_Outfit_Top', 'Wolf3D_Outfit_Bottom', 'Wolf3D_Outfit_Footwear']
    clothingMeshes.forEach(meshName => {
      const mesh = nodes[meshName] as THREE.Mesh
      if (mesh) {
        mesh.visible = showClothing
      }
    })
  }, [nodes, showClothing])

  // Load idle animation
  const { animations: idleAnim } = useGLTF(IDLE_ANIMATION)

  // Load neutral talking animation (default for unmapped emotions)
  const { animations: neutralTalkingAnim } = useGLTF(NEUTRAL_TALKING_ANIMATION)

  // Load emotion-specific animations
  const { animations: emotionAngry } = useGLTF(EMOTION_ANIMATIONS.angry!)
  const { animations: emotionLaughing } = useGLTF(EMOTION_ANIMATIONS.laughing!)
  const { animations: emotionSad } = useGLTF(EMOTION_ANIMATIONS.sad!)
  const { animations: emotionDancing } = useGLTF(EMOTION_ANIMATIONS.dancing!)

  // Combine and name all animations
  const allAnimations = useMemo(() => {
    const animations: THREE.AnimationClip[] = []

    // Add idle animation
    if (idleAnim[0]) {
      const clip = idleAnim[0].clone()
      clip.name = 'idle'
      animations.push(clip)
    }

    // Add neutral talking animation
    if (neutralTalkingAnim[0]) {
      const clip = neutralTalkingAnim[0].clone()
      clip.name = 'talking_neutral'
      animations.push(clip)
    }

    // Add emotion-specific animations
    const emotionAnims: [THREE.AnimationClip[], string][] = [
      [emotionAngry, 'talking_angry'],
      [emotionLaughing, 'talking_laughing'],
      [emotionSad, 'talking_sad'],
      [emotionDancing, 'talking_dancing'],
    ]
    emotionAnims.forEach(([anims, name]) => {
      if (anims[0]) {
        const clip = anims[0].clone()
        clip.name = name
        animations.push(clip)
      }
    })

    return animations
  }, [idleAnim, neutralTalkingAnim, emotionAngry, emotionLaughing, emotionSad, emotionDancing])

  const group = useRef<THREE.Group>(null)
  const currentViseme = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentTalkingAnim = useRef<string | null>(null)
  const { actions } = useAnimations(allAnimations, group)

  // Play initial idle animation
  useEffect(() => {
    const idle = actions['idle']
    if (idle) {
      idle.reset().fadeIn(0.5).play()
      return () => { idle.fadeOut(0.5) }
    }
  }, [actions])

  // Switch between idle and talking animations based on speak state and emotion
  useEffect(() => {
    if (speak) {
      const idleAction = actions['idle']
      const neutralAction = actions['talking_neutral']

      // Get the appropriate talking animation for this emotion
      const talkingAnimName = `talking_${emotion}`
      const emotionAction = actions[talkingAnimName]

      if (idleAction) {
        idleAction.fadeOut(0.5)
      }

      // If there's an emotion-specific animation, play it once then transition to neutral
      if (emotionAction && talkingAnimName !== 'talking_neutral') {
        currentTalkingAnim.current = talkingAnimName

        // Set to play once (not loop)
        emotionAction.setLoop(THREE.LoopOnce, 1)
        emotionAction.clampWhenFinished = true
        emotionAction.reset().fadeIn(0.5).play()

        // When emotion animation finishes, crossfade to neutral talking
        const mixer = emotionAction.getMixer()
        const onFinished = (e: { action: THREE.AnimationAction }) => {
          if (e.action === emotionAction && neutralAction) {
            emotionAction.fadeOut(0.5)
            neutralAction.setLoop(THREE.LoopRepeat, Infinity)
            neutralAction.reset().fadeIn(0.5).play()
            currentTalkingAnim.current = 'talking_neutral'
          }
        }
        mixer.addEventListener('finished', onFinished)

        return () => {
          mixer.removeEventListener('finished', onFinished)
        }
      } else if (neutralAction) {
        // No emotion animation, just play neutral talking
        currentTalkingAnim.current = 'talking_neutral'
        neutralAction.setLoop(THREE.LoopRepeat, Infinity)
        neutralAction.reset().fadeIn(0.5).play()
      }
    } else {
      // Immediately return to idle when done talking
      const currentAnim = currentTalkingAnim.current
      if (currentAnim) {
        const talkingAction = actions[currentAnim]
        const idleAction = actions['idle']

        if (talkingAction) {
          talkingAction.fadeOut(0.3)
        }
        if (idleAction) {
          idleAction.reset().fadeIn(0.3).play()
        }
        currentTalkingAnim.current = null
      }
    }
  }, [speak, emotion, actions])

  // Handle Eleven Labs audio playback with lip sync
  useEffect(() => {
    if (!speak || !audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onplay = () => {
      startTimeRef.current = performance.now()
    }

    audio.onended = () => {
      currentViseme.current = null
      onSpeakEnd()
    }

    audio.play()

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [speak, audioUrl, onSpeakEnd])

  // Update viseme based on audio timing
  useEffect(() => {
    if (!speak || !audioRef.current || alignment.length === 0) return

    let animationFrame: number

    const updateViseme = () => {
      if (!audioRef.current || audioRef.current.ended) {
        currentViseme.current = null
        return
      }

      const currentTimeMs = audioRef.current.currentTime * 1000

      // Find the character being spoken at the current time
      // Limit viseme duration to max 150ms to prevent long holds
      const currentChar = alignment.find((char) => {
        const maxDuration = Math.min(char.end_time_ms - char.start_time_ms, 150)
        return currentTimeMs >= char.start_time_ms && currentTimeMs < char.start_time_ms + maxDuration
      })

      if (currentChar && currentChar.character.trim()) {
        // Skip spaces and only process actual characters
        const viseme = CORRESPONDING_VISEME[currentChar.character.toUpperCase()]
        if (viseme) {
          currentViseme.current = viseme
        } else {
          currentViseme.current = null
        }
      } else {
        currentViseme.current = null
      }

      animationFrame = requestAnimationFrame(updateViseme)
    }

    animationFrame = requestAnimationFrame(updateViseme)

    return () => {
      cancelAnimationFrame(animationFrame)
      currentViseme.current = null
    }
  }, [speak, alignment])

  // Animate morph targets with smooth transitions (lip sync + emotion expressions)
  useFrame(() => {
    const head = nodes.Wolf3D_Head as THREE.SkinnedMesh
    const teeth = nodes.Wolf3D_Teeth as THREE.SkinnedMesh

    if (!head?.morphTargetDictionary || !head?.morphTargetInfluences) return

    // Track which morphs are being actively set this frame
    const activeMorphs = new Set<string>()

    // Only apply emotion morphs and lip sync while speaking
    if (speak) {
      // Get emotion-based facial morphs
      const emotionMorphs = EMOTION_FACE_MORPHS[emotion] || {}

      // Apply emotion-based facial expressions
      Object.entries(emotionMorphs).forEach(([morphName, targetValue]) => {
        const index = head.morphTargetDictionary![morphName]
        if (index !== undefined) {
          activeMorphs.add(morphName)
          head.morphTargetInfluences![index] = THREE.MathUtils.lerp(
            head.morphTargetInfluences![index],
            targetValue,
            0.1 // Slower lerp for smoother expression changes
          )
        }
      })

      // Apply lip sync visemes (these take priority for mouth shapes)
      if (currentViseme.current) {
        const index = head.morphTargetDictionary[currentViseme.current]
        if (index !== undefined) {
          activeMorphs.add(currentViseme.current)
          const baseIntensity = 0.35
          const visemeModifier = VISEME_INTENSITY[currentViseme.current] || 1.0
          const targetIntensity = baseIntensity * visemeModifier

          head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            head.morphTargetInfluences[index],
            targetIntensity,
            0.2
          )
          if (teeth?.morphTargetInfluences) {
            teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              teeth.morphTargetInfluences[index],
              targetIntensity,
              0.2
            )
          }
        }
      }
    }

    // Smoothly return all morphs to neutral (when not speaking, or inactive morphs)
    Object.keys(head.morphTargetDictionary).forEach((key) => {
      if (!activeMorphs.has(key)) {
        const index = head.morphTargetDictionary![key]
        head.morphTargetInfluences![index] = THREE.MathUtils.lerp(
          head.morphTargetInfluences![index],
          0,
          0.15
        )
        if (teeth?.morphTargetInfluences) {
          teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            teeth.morphTargetInfluences[index],
            0,
            0.15
          )
        }
      }
    })
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clone} />
    </group>
  )
}
