'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import { Pin, Check } from 'lucide-react'
import Link from 'next/link'
import { Note } from '@/store/notesStore'
import clsx from 'clsx'

interface NoteCardProps {
  note: Note
  showPin?: boolean
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  isBatchMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export default function NoteCard({ 
  note, 
  showPin = false, 
  onDelete, 
  onTogglePin, 
  isBatchMode = false,
  isSelected = false,
  onToggleSelect
}: NoteCardProps) {
  // 3D 倾斜效果
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { stiffness: 300, damping: 30 }
  const rotateX = useSpring(y, springConfig)
  const rotateY = useSpring(x, springConfig)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isBatchMode) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    x.set(mouseX / 10)
    y.set(-mouseY / 10)
  }
  
  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  // 提取摘要
  const getExcerpt = (content: string): string => {
    // 移除markdown语法
    const plain = content
      .replace(/#+\s/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/>\s/g, '')
      .replace(/-\s/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    return plain.slice(0, 120) + (plain.length > 120 ? '...' : '')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d"
      }}
      animate={isBatchMode ? {} : { y: isHovered ? -8 : 0 }}
      transition={{ duration: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "card group relative cursor-pointer",
        !isBatchMode && "card-hover",
        isSelected && "ring-2 ring-accent ring-offset-2"
      )}
      onClick={isBatchMode && onToggleSelect ? () => onToggleSelect(note.id) : undefined}
    >
      {/* 批量选择框 */}
      {isBatchMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className={clsx(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
            isSelected 
              ? "bg-accent border-accent" 
              : "border-foreground/20 bg-background"
          )}>
            {isSelected && <Check size={14} className="text-white" />}
          </div>
        </div>
      )}

      {/* 置顶标识 */}
      {note.isPinned && !isBatchMode && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <Pin size={14} className="text-accent" />
        </div>
      )}

      <Link href={isBatchMode ? '#' : `/notes/${note.id}`} className="block" onClick={isBatchMode ? (e) => e.preventDefault() : undefined}>
        {/* 标题 */}
        <h3 className={clsx(
          "text-lg font-semibold mb-2 line-clamp-2",
          isBatchMode ? "pl-8" : "",
          isBatchMode ? "" : "text-foreground group-hover:text-accent transition-colors"
        )}>
          {note.title}
        </h3>

        {/* 摘要 */}
        <p className={clsx(
          "text-sm text-foreground-secondary mb-4 line-clamp-3",
          isBatchMode && "pl-8"
        )}>
          {getExcerpt(note.content)}
        </p>
      </Link>

      {/* 元信息 */}
      <div className={clsx(
        "flex items-center justify-between",
        isBatchMode && "pl-8"
      )}>
        <div className="flex items-center gap-3 text-xs text-foreground-secondary">
          <span>{formatDate(note.updatedAt)}</span>
          <span>·</span>
          <span>共 {note.content.replace(/\s/g, '').length} 字</span>
        </div>

        {/* 操作按钮 */}
        {!isBatchMode && showPin && (onDelete || onTogglePin) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onTogglePin && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onTogglePin(note.id)}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  note.isPinned
                    ? 'text-accent bg-accent/10'
                    : 'text-foreground-secondary hover:bg-background-secondary'
                )}
                title={note.isPinned ? '取消置顶' : '置顶'}
              >
                <Pin size={14} />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(note.id)}
                className="p-1.5 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="删除"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* 标签 */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {note.tags.map((tag) => (
            <Link key={tag} href={`/notes?tag=${encodeURIComponent(tag)}`}>
              <span className="tag tag-hover text-xs">
                #{tag}
              </span>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}
