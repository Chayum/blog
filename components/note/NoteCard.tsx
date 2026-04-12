'use client'

import { motion } from 'framer-motion'
import { Pin } from 'lucide-react'
import Link from 'next/link'
import { Note } from '@/store/notesStore'
import clsx from 'clsx'

interface NoteCardProps {
  note: Note
  showPin?: boolean
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
}

export default function NoteCard({ note, showPin = false, onDelete, onTogglePin }: NoteCardProps) {
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card card-hover group relative"
    >
      {/* 置顶标识 */}
      {note.isPinned && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <Pin size={14} className="text-accent" />
        </div>
      )}

      <Link href={`/notes/${note.id}`} className="block">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-2 line-clamp-2">
          {note.title}
        </h3>

        {/* 摘要 */}
        <p className="text-sm text-foreground-secondary mb-4 line-clamp-3">
          {getExcerpt(note.content)}
        </p>
      </Link>

      {/* 元信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-foreground-secondary">
          <span>{formatDate(note.updatedAt)}</span>
          <span>·</span>
          <span>{note.readingTime} 分钟阅读</span>
        </div>

        {/* 操作按钮 */}
        {showPin && (onDelete || onTogglePin) && (
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
