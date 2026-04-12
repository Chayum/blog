'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Settings, GripVertical } from 'lucide-react'
import { WidgetConfig, WidgetType } from '@/store/settingsStore'
import clsx from 'clsx'

interface WidgetContainerProps {
  config: WidgetConfig
  onUpdate: (config: Partial<WidgetConfig>) => void
  children: ReactNode
  title: string
  defaultPosition: 'left' | 'right'
}

const WIDGET_TITLES: Record<WidgetType, string> = {
  pet: '数字宠物',
  particles: '粒子特效',
  game: '小游戏',
  terminal: '终端',
  none: '空'
}

export default function WidgetContainer({
  config,
  onUpdate,
  children,
  title,
  defaultPosition
}: WidgetContainerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  // 移动端隐藏
  if (isMobile) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y
    
    // 限制在可视区域内
    const maxX = window.innerWidth - 270
    const maxY = window.innerHeight - 100
    
    onUpdate({
      position: {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(60, Math.min(y, maxY))
      }
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  if (!config.isOpen || config.type === 'none') {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => onUpdate({ isOpen: true })}
        className={clsx(
          'fixed z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center',
          'hover:bg-accent/90 transition-colors',
          defaultPosition === 'left' ? 'left-4' : 'right-4'
        )}
        style={{ top: `${config.position.y}px` }}
      >
        <Settings size={20} />
      </motion.button>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: defaultPosition === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: defaultPosition === 'left' ? -50 : 50 }}
      className={clsx(
        'fixed z-40 w-[220px] bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl',
        'transition-shadow duration-200',
        isDragging && 'shadow-2xl cursor-grabbing'
      )}
      style={{
        left: defaultPosition === 'left' ? `${config.position.x}px` : 'auto',
        right: defaultPosition === 'right' ? `${config.position.x}px` : 'auto',
        top: `${config.position.y}px`
      }}
    >
      {/* 标题栏 */}
      <div
        onMouseDown={handleMouseDown}
        className={clsx(
          'flex items-center justify-between px-3 py-2 border-b border-border/50',
          'cursor-grab active:cursor-grabbing select-none'
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-foreground-secondary/50" />
          <span className="text-xs font-medium text-foreground-secondary">
            {WIDGET_TITLES[config.type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ isExpanded: !config.isExpanded })}
            className="p-1 rounded hover:bg-background-secondary transition-colors"
          >
            <Minus size={12} className="text-foreground-secondary" />
          </button>
          <button
            onClick={() => onUpdate({ isOpen: false })}
            className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={12} className="text-foreground-secondary" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <AnimatePresence>
        {config.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
