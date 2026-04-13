'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote, X, Plus, Trash2 } from 'lucide-react'
import { useCasualNotesStore, CasualNote } from '@/store/casualNotesStore'
import { useToast } from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function CasualNotes() {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noteId: string | null }>({ isOpen: false, noteId: null })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()
  
  const notes = useCasualNotesStore((state) => state.notes)
  const addNote = useCasualNotesStore((state) => state.addNote)
  const deleteNote = useCasualNotesStore((state) => state.deleteNote)
  const hasHydrated = useCasualNotesStore((state) => state._hasHydrated)

  // 聚焦时展开
  const handleFocus = () => {
    setIsExpanded(true)
  }

  // 保存笔记
  const handleSave = () => {
    if (!content.trim()) {
      toast.error('请输入内容')
      return
    }
    
    addNote(content)
    setContent('')
    setIsExpanded(false)
    toast.success('随笔已保存')
  }

  // 取消
  const handleCancel = () => {
    if (content.trim() && !confirm('确定要放弃当前内容吗？')) {
      return
    }
    setContent('')
    setIsExpanded(false)
  }

  // 删除笔记
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({ isOpen: true, noteId: id })
  }

  const handleConfirmDelete = () => {
    if (deleteModal.noteId) {
      deleteNote(deleteModal.noteId)
      toast.success('已删除')
    }
    setDeleteModal({ isOpen: false, noteId: null })
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  if (!hasHydrated) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-background-secondary rounded-xl mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-40 h-32 bg-background-secondary rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <StickyNote size={20} className="text-accent" />
        <h2 className="text-lg font-semibold">随笔便签</h2>
        <span className="text-xs text-foreground-secondary ml-2">
          {notes.length} 条
        </span>
      </div>

      {/* 输入区域 */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '80px' }}
        className="relative mb-6"
      >
        <div
          className="relative rounded-xl overflow-hidden shadow-sm border border-border hover:border-accent/50 transition-colors"
          style={{
            background: isExpanded ? '#fef3c7' : '#fef3c7'
          }}
        >
          {/* 便签纹理 */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.03) 25px)',
              backgroundSize: '100% 25px'
            }}
          />
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleFocus}
            placeholder="随时记录你的想法..."
            className="w-full bg-transparent p-4 resize-none outline-none text-foreground placeholder:text-foreground-secondary/50 relative z-10"
            style={{ 
              minHeight: isExpanded ? '120px' : '80px',
              lineHeight: '25px'
            }}
          />

          {/* 操作按钮 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-end gap-2 p-3 pt-0 relative z-10"
              >
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!content.trim()}
                  className="px-4 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  保存
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 已有便签列表 */}
      {notes.length > 0 && (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent -mx-4 px-4">
            {notes.slice(0, 8).map((note, index) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onDelete={handleDeleteClick}
                index={index}
                formatTime={formatTime}
              />
            ))}
          </div>
          
          {/* 左/右渐变遮罩提示可滚动 */}
          <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      )}
      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="删除随笔"
        message="确定要删除这条随笔吗？此操作不可恢复。"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, noteId: null })}
        type="warning"
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  )
}

// 便签卡片组件
function NoteCard({ 
  note, 
  onDelete, 
  index,
  formatTime 
}: { 
  note: CasualNote
  onDelete: (id: string, e: React.MouseEvent) => void
  index: number
  formatTime: (date: string) => string
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // 随机旋转角度
  const rotation = [-3, -1, 2, -2, 1, 3][index % 6]
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.05, 
        rotate: 0,
        zIndex: 10,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative flex-shrink-0 w-44 cursor-pointer group"
      style={{ 
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {/* 便签纸效果 */}
      <div
        className="rounded-lg p-4 shadow-md transition-shadow duration-200 min-h-[120px] flex flex-col"
        style={{ 
          backgroundColor: note.color,
          boxShadow: isHovered 
            ? '0 10px 25px -5px rgba(0,0,0,0.2)' 
            : '0 2px 5px rgba(0,0,0,0.1)'
        }}
      >
        {/* 内容 */}
        <p className="text-sm text-gray-800 line-clamp-4 flex-1 leading-relaxed whitespace-pre-wrap">
          {note.content}
        </p>
        
        {/* 时间和删除按钮 */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/10">
          <span 
            className="text-[10px] text-gray-600 cursor-default" 
            title={new Date(note.createdAt).toLocaleString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          >
            {formatTime(note.createdAt)}
          </span>
          
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={(e) => onDelete(note.id, e)}
                className="p-1 rounded-full bg-white/80 hover:bg-white text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* 胶带效果 */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          transform: `translateX(-50%) rotate(${-rotation}deg)`
        }}
      />
    </motion.div>
  )
}
