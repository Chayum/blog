'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ParticleType = 'stars' | 'fire' | 'bubbles' | 'snow'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

const THEMES: Record<ParticleType, { name: string; colors: string[] }> = {
  stars: {
    name: '星空',
    colors: ['#FFD700', '#FF69B4', '#00BFFF', '#FFF', '#C0C0C0']
  },
  fire: {
    name: '火焰',
    colors: ['#FF4500', '#FF6347', '#FFD700', '#FF8C00']
  },
  bubbles: {
    name: '泡泡',
    colors: ['#87CEEB', '#98D8C8', '#B0E0E6', '#ADD8E6', '#E0FFFF']
  },
  snow: {
    name: '雪花',
    colors: ['#FFF', '#E0E0E0', '#F0F8FF', '#E6E6FA']
  }
}

export default function ParticleTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, isMoving: false })
  const animationRef = useRef<number>()
  const [theme, setTheme] = useState<ParticleType>('stars')
  const [isEnabled, setIsEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 确保客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    // 设置全屏 canvas - 不使用 DPR 缩放，直接使用 CSS 像素
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 鼠标追踪 - 使用 clientX/clientY 相对于视口
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isMoving: true }
      
      if (!isEnabled) return
      
      // 添加新粒子 - 直接使用 client 坐标，不再缩放
      for (let i = 0; i < 3; i++) {
        const colors = THEMES[theme].colors
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 60 + Math.random() * 60,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (!isEnabled) return
      
      // 点击爆炸效果
      const colors = THEMES[theme].colors
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20
        const speed = 3 + Math.random() * 3
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 40 + Math.random() * 40,
          size: 3 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    // 使用捕获阶段确保事件被正确接收
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })

    // 动画循环
    const animate = () => {
      // 清空画布 - 使用 CSS 尺寸
      const width = window.innerWidth
      const height = window.innerHeight
      ctx.clearRect(0, 0, width, height)

      // 更新和绘制粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 1 / particle.maxLife
        particle.vx *= 0.98
        particle.vy *= 0.98

        if (particle.life <= 0) return false

        // 绘制粒子
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2)
        ctx.fill()

        // 发光效果
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color

        return true
      })

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [theme, isEnabled, mounted])

  return (
    <div className="flex flex-col items-center">
      {/* 控制面板 */}
      <div className="w-full space-y-3">
        {/* 开关 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-secondary">粒子特效</span>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              isEnabled ? 'bg-accent' : 'bg-background-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 主题选择 */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(THEMES) as ParticleType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                theme === t
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary text-foreground-secondary hover:bg-border'
              }`}
            >
              {THEMES[t].name}
            </button>
          ))}
        </div>

        {/* 说明 */}
        <p className="text-[10px] text-foreground-secondary/60 text-center">
          移动鼠标产生粒子，点击爆炸
        </p>
      </div>

      {/* 全屏 Canvas（使用 Portal 渲染到 body，避免父元素样式影响） */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <canvas
          ref={canvasRef}
          className="pointer-events-none"
          style={{ 
            opacity: isEnabled ? 1 : 0,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            border: 'none',
            display: 'block',
            zIndex: 9999
          }}
        />,
        document.body
      )}
    </div>
  )
}
