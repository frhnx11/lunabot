import { useRef, useEffect, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useGraph } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { CORRESPONDING_VISEME, VISEME_INTENSITY } from '../constants'
import type { AlignmentChar } from '../services/inworld'

// Animation file paths
const IDLE_ANIMATION = '/animations/F_Standing_Idle_001.glb'
const TALKING_ANIMATION = '/animations/F_Talking_Variations_002.glb'

// Dance animation file paths
const DANCE_ANIMATIONS: Record<string, string> = {
  dance1: '/animations/F_Dances_005.glb',
  dance2: '/animations/F_Dances_006.glb',
  dance3: '/animations/F_Dances_007.glb',
}

// Gentle smile morph values (applied when speaking)
const GENTLE_SMILE = {
  mouthSmileLeft: 0.2,
  mouthSmileRight: 0.2,
}

interface AvatarProps {
  audioUrl: string | null
  alignment: AlignmentChar[]
  speak: boolean
  onSpeakEnd: () => void
  avatarPath: string
  position?: [number, number, number]
  danceAnimation: string | null
  onDanceEnd: () => void
}

export function Avatar({ audioUrl, alignment, speak, onSpeakEnd, avatarPath, danceAnimation, onDanceEnd, ...props }: AvatarProps) {
  const { scene } = useGLTF(avatarPath)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes } = useGraph(clone)

  // Load animations
  const { animations: idleAnim } = useGLTF(IDLE_ANIMATION)
  const { animations: talkingAnim } = useGLTF(TALKING_ANIMATION)

  // Load dance animations
  const { animations: dance1Anim } = useGLTF(DANCE_ANIMATIONS.dance1)
  const { animations: dance2Anim } = useGLTF(DANCE_ANIMATIONS.dance2)
  const { animations: dance3Anim } = useGLTF(DANCE_ANIMATIONS.dance3)

  // Combine and name animations
  const allAnimations = useMemo(() => {
    const animations: THREE.AnimationClip[] = []

    if (idleAnim[0]) {
      const clip = idleAnim[0].clone()
      clip.name = 'idle'
      animations.push(clip)
    }

    if (talkingAnim[0]) {
      const clip = talkingAnim[0].clone()
      clip.name = 'talking'
      animations.push(clip)
    }

    // Add dance animations
    if (dance1Anim[0]) {
      const clip = dance1Anim[0].clone()
      clip.name = 'dance1'
      animations.push(clip)
    }

    if (dance2Anim[0]) {
      const clip = dance2Anim[0].clone()
      clip.name = 'dance2'
      animations.push(clip)
    }

    if (dance3Anim[0]) {
      const clip = dance3Anim[0].clone()
      clip.name = 'dance3'
      animations.push(clip)
    }

    return animations
  }, [idleAnim, talkingAnim, dance1Anim, dance2Anim, dance3Anim])

  const group = useRef<THREE.Group>(null)
  const currentViseme = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const { actions } = useAnimations(allAnimations, group)

  // Play initial idle animation
  useEffect(() => {
    const idle = actions['idle']
    if (idle) {
      idle.reset().fadeIn(0.5).play()
      return () => { idle.fadeOut(0.5) }
    }
  }, [actions])

  // Switch between idle and talking animations
  useEffect(() => {
    // Don't switch to talking if a dance is playing
    if (danceAnimation) return

    const idleAction = actions['idle']
    const talkingAction = actions['talking']

    if (speak) {
      if (idleAction) {
        idleAction.fadeOut(0.5)
      }
      if (talkingAction) {
        talkingAction.setLoop(THREE.LoopRepeat, Infinity)
        talkingAction.reset().fadeIn(0.5).play()
      }
    } else {
      if (talkingAction) {
        talkingAction.fadeOut(0.3)
      }
      if (idleAction) {
        idleAction.reset().fadeIn(0.3).play()
      }
    }
  }, [speak, actions, danceAnimation])

  // Handle dance animation playback (one-shot)
  useEffect(() => {
    if (!danceAnimation || !actions[danceAnimation]) return

    const idleAction = actions['idle']
    const talkingAction = actions['talking']
    const danceAction = actions[danceAnimation]

    // Fade out current animations
    if (idleAction) idleAction.fadeOut(0.3)
    if (talkingAction) talkingAction.fadeOut(0.3)

    // Configure dance to play once
    danceAction.setLoop(THREE.LoopOnce, 1)
    danceAction.clampWhenFinished = true
    danceAction.reset().fadeIn(0.3).play()

    // Listen for animation finish
    const mixer = danceAction.getMixer()
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if (e.action === danceAction) {
        danceAction.fadeOut(0.3)
        if (idleAction) {
          idleAction.reset().fadeIn(0.3).play()
        }
        onDanceEnd()
      }
    }

    mixer.addEventListener('finished', onFinished)

    return () => {
      mixer.removeEventListener('finished', onFinished)
    }
  }, [danceAnimation, actions, onDanceEnd])

  // Handle audio playback with lip sync
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
      const currentChar = alignment.find((char) => {
        const maxDuration = Math.min(char.end_time_ms - char.start_time_ms, 150)
        return currentTimeMs >= char.start_time_ms && currentTimeMs < char.start_time_ms + maxDuration
      })

      if (currentChar && currentChar.character.trim()) {
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

  // Animate morph targets with smooth transitions (lip sync + gentle smile)
  useFrame(() => {
    const head = nodes.Wolf3D_Head as THREE.SkinnedMesh
    const teeth = nodes.Wolf3D_Teeth as THREE.SkinnedMesh

    if (!head?.morphTargetDictionary || !head?.morphTargetInfluences) return

    // Track which morphs are being actively set this frame
    const activeMorphs = new Set<string>()

    // Apply gentle smile and lip sync while speaking
    if (speak) {
      // Apply gentle smile
      Object.entries(GENTLE_SMILE).forEach(([morphName, targetValue]) => {
        const index = head.morphTargetDictionary![morphName]
        if (index !== undefined) {
          activeMorphs.add(morphName)
          head.morphTargetInfluences![index] = THREE.MathUtils.lerp(
            head.morphTargetInfluences![index],
            targetValue,
            0.1
          )
        }
      })

      // Apply lip sync visemes
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

    // Smoothly return all morphs to neutral when not speaking
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
