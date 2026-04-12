'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, X, SortAsc, BookOpen, Trash2 } from 'lucide-react'
import { useNotesStore } from '@/store/notesStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/PageTransition'
import NoteCard from '@/components/note/NoteCard'
import Link from 'next/link'
import clsx from 'clsx'

type SortBy = 'updatedAt' | 'createdAt' | 'title'

function NotesPageContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 检测 Zustand hydration 是否完成
  const hasHydrated = useNotesStore((state) => state._hasHydrated)
  // 响应式订阅 notes 和 deleteNote
  const notes = useNotesStore((state) => state.notes)
  const deleteNote = useNotesStore((state) => state.deleteNote)
  const toast = useToast()

  // 读取 URL 参数中的高亮 ID
  useEffect(() => {
    const highlight = searchParams.get('highlight')
    if (highlight) {
      setHighlightId(highlight)
      // 3秒后清除高亮和 URL 参数
      const timer = setTimeout(() => {
        setHighlightId(null)
        router.replace('/notes')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  // 过滤和排序笔记
  const filteredNotes = useMemo(() => {
    // hydration 未完成时返回空数组
    if (!hasHydrated) return []
    
    let result = notes.filter((note) => note.isPublic)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter((note) =>
        selectedTags.every((tag) => note.tags.includes(tag))
      )
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN')
        default:
          return 0
      }
    })

    return result
  }, [hasHydrated, notes, searchQuery, selectedTags, sortBy])

  // 获取所有标签
  const allTags = useMemo(() => {
    if (!hasHydrated) return []
    const tags = new Set<string>()
    notes.forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [hasHydrated, notes])

  // 切换标签
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  // 删除笔记
  const handleDelete = (id: string) => {
    const note = notes.find((n) => n.id === id)
    if (!note) return
    
    if (confirm(`确定要删除笔记"${note.title}"吗？此操作不可恢复。`)) {
      deleteNote(id)
      toast.success('笔记已删除')
    }
  }

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-8">
      {/* 页面标题 */}
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-bold mb-2">笔记列表</h1>
        <p className="text-foreground-secondary">
          共 {filteredNotes.length} 篇笔记
        </p>
      </FadeIn>

      {/* 搜索和筛选栏 */}
      <FadeIn delay={0.1} className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索笔记标题、内容或标签..."
            className="input pl-12 pr-4 py-3"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background-secondary rounded"
            >
              <X size={16} className="text-foreground-secondary" />
            </button>
          )}
        </div>

        {/* 标签筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-foreground-secondary mr-2">
            <Filter size={14} />
            标签:
          </div>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(tag)}
              className={clsx(
                'tag text-xs transition-all',
                selectedTags.includes(tag)
                  ? 'bg-accent text-white'
                  : 'bg-accent/10 text-accent tag-hover'
              )}
            >
              #{tag}
            </motion.button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-foreground-secondary hover:text-accent ml-2"
            >
              清除
            </button>
          )}
        </div>

        {/* 排序 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SortAsc size={16} className="text-foreground-secondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-sm bg-transparent border-none outline-none text-foreground-secondary cursor-pointer"
            >
              <option value="updatedAt">按更新时间</option>
              <option value="createdAt">按创建时间</option>
              <option value="title">按标题</option>
            </select>
          </div>

          {(searchQuery || selectedTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-foreground-secondary hover:text-accent flex items-center gap-1"
            >
              <X size={14} />
              清除筛选
            </button>
          )}
        </div>
      </FadeIn>

      {/* 笔记列表 */}
      {filteredNotes.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <StaggerItem key={note.id}>
              <motion.div
                initial={highlightId === note.id ? { scale: 0.95, opacity: 0 } : false}
                animate={highlightId === note.id ? { scale: 1, opacity: 1 } : {}}
                className={clsx(
                  'rounded-xl transition-all duration-500',
                  highlightId === note.id && 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                )}
              >
                <NoteCard note={note} onDelete={handleDelete} />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <FadeIn delay={0.2}>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
              <BookOpen size={32} className="text-foreground-secondary" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无笔记</h3>
            <p className="text-foreground-secondary mb-6">
              {searchQuery || selectedTags.length > 0
                ? '没有找到符合条件的笔记'
                : '开始创作你的第一篇笔记吧'}
            </p>
            <Link href="/write" className="btn btn-primary">
              写笔记
            </Link>
          </div>
        </FadeIn>
      )}

      {/* 底部留白 */}
      <div className="h-16" />
    </PageTransition>
  )
}

function NotesPageLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 bg-background-secondary rounded mb-8" />
      <div className="h-12 bg-background-secondary rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-background-secondary rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesPageLoading />}>
      <NotesPageContent />
    </Suspense>
  )
}
