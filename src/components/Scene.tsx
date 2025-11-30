import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { Avatar } from './Avatar'
import type { AlignmentChar } from '../services/elevenLabs'
import type { Emotion } from '../constants'

interface SceneProps {
  audioUrl: string | null
  alignment: AlignmentChar[]
  speak: boolean
  emotion: Emotion
  onSpeakEnd: () => void
}

export function Scene({ audioUrl, alignment, speak, emotion, onSpeakEnd }: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={null}>
        <Avatar
          audioUrl={audioUrl}
          alignment={alignment}
          speak={speak}
          emotion={emotion}
          onSpeakEnd={onSpeakEnd}
          position={[0, -1, 0]}
        />
      </Suspense>
      <OrbitControls target={[0, 0.5, 0]} />
    </Canvas>
  )
}
