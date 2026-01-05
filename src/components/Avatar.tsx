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
}

export function Avatar({ audioUrl, alignment, speak, onSpeakEnd, avatarPath, ...props }: AvatarProps) {
  const { scene } = useGLTF(avatarPath)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes } = useGraph(clone)

  // Load animations
  const { animations: idleAnim } = useGLTF(IDLE_ANIMATION)
  const { animations: talkingAnim } = useGLTF(TALKING_ANIMATION)

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

    return animations
  }, [idleAnim, talkingAnim])

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
  }, [speak, actions])

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
