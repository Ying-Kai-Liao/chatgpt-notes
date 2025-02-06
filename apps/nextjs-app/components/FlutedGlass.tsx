import { ReactNode } from 'react'

export type FlutedGlassType = 'fluted' | 'cross' | 'romb' | 'circle'

interface FlutedGlassProps {
  type?: FlutedGlassType
  angle?: number
  className?: string
  children?: ReactNode
}

export function FlutedGlass({ type = 'fluted', angle, className = '', children }: FlutedGlassProps) {
  function createGroove(grooveAngle: number) {
    if (type === 'circle') {
      return `repeating-radial-gradient(circle at 50%,
        black 0px,
        black 1px,
        transparent 3px,
        transparent 6px)`
    }
    return `repeating-linear-gradient(${grooveAngle}deg,
        black 0px,
        black 1px,
        transparent 3px,
        transparent 6px)`
  }

  function createDiffusion(diffusionAngle: number) {
    if (type === 'circle') {
      return `repeating-radial-gradient(circle at 50%,
        transparent 0px,
        transparent 3px,
        black 4px,
        black 5px,
        transparent 6px)`
    }
    return `repeating-linear-gradient(${diffusionAngle}deg,
        transparent 0px,
        transparent 3px,
        black 4px,
        black 5px,
        transparent 6px)`
  }

  const groovesAngle = angle ?? (type === 'romb' ? 45 : 90)
  const grooves = [createGroove(groovesAngle)]
  
  if (type !== 'fluted') {
    grooves.push(createGroove(groovesAngle + 90))
  }

  return (
    <div className={`relative w-full h-full rounded-2xl ${className}`}>
      <div className="h-full w-full backdrop-blur-[5px] rounded-2xl overflow-hidden bg-stone-200/10 shadow-xl" />

      <div
        className="absolute h-full w-full top-0 left-0 right-0 bottom-0 rounded-2xl overflow-hidden bg-zinc-400/10 backdrop-blur-[5px]"
        style={{
          WebkitMaskImage: grooves.join(', '),
          maskImage: grooves.join(', ')
        }}
      />

      <div
        className="absolute h-full w-full top-0 left-0 right-0 bottom-0 rounded-2xl overflow-hidden bg-indigo-300/10"
        style={{
          WebkitMaskImage: createDiffusion(groovesAngle),
          maskImage: createDiffusion(groovesAngle)
        }}
      />

      <div className="absolute h-full w-full top-0 left-0 right-0 bottom-0 rounded-2xl overflow-hidden border-[1px] border-stone-300/20 z-20 flex justify-center items-center">
        {children}
      </div>
    </div>
  )
}
