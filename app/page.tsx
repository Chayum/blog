'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, BookOpen, Globe, Zap } from 'lucide-react'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import PageTransition, { FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/PageTransition'
import NoteCard from '@/components/note/NoteCard'
import { useMemo } from 'react'

export default function HomePage() {
  // 检测 Zustand hydration 是否完成
  const notesHydrated = useNotesStore((state) => state._hasHydrated)
  const sitesHydrated = useSitesStore((state) => state._hasHydrated)
  
  // 响应式订阅
  const notes = useNotesStore((state) => state.notes)
  const groups = useSitesStore((state) => state.groups)

  // hydration 是否全部完成
  const isHydrated = notesHydrated && sitesHydrated

  const pinnedNotes = useMemo(() => {
    // 只有 hydration 完成后才计算
    if (!isHydrated) return []
    return notes.filter((note) => note.isPinned && note.isPublic)
  }, [isHydrated, notes])

  const recentNotes = useMemo(() => {
    if (!isHydrated) return []
    return notes
      .filter((note) => note.isPublic)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [isHydrated, notes])

  const tags = useMemo(() => {
    if (!isHydrated) return []
    const tagSet = new Set<string>()
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [isHydrated, notes])

  const publicNotesCount = useMemo(() => notes.filter((n) => n.isPublic).length, [notes])

  // hydration 未完成时显示加载状态
  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-foreground-secondary">加载中...</div>
      </div>
    )
  }

  return (
    <PageTransition>
      {/* 英雄区 */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-accent/30">
            B
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
        >
          我的<span className="text-gradient">笔记空间</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-foreground-secondary max-w-2xl mb-8"
        >
          记录思考、分享知识、整理生活。在这里，每一篇笔记都是一颗星辰。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <Link href="/write" className="btn btn-primary">
            <Sparkles size={18} />
            开始写作
          </Link>
          <Link href="/notes" className="btn btn-secondary">
            浏览笔记
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        {/* 装饰性几何图形 */}
        <div className="absolute top-40 left-10 w-32 h-32 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl" />
      </section>

      {/* 统计信息 */}
      <FadeIn delay={0.4} className="mb-16">
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-card border border-border">
            <div className="text-3xl font-bold text-accent mb-1">{publicNotesCount}</div>
            <div className="text-sm text-foreground-secondary">笔记</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-card border border-border">
            <div className="text-3xl font-bold text-accent mb-1">{tags.length}</div>
            <div className="text-sm text-foreground-secondary">标签</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-card border border-border">
            <div className="text-3xl font-bold text-accent mb-1">{groups.length}</div>
            <div className="text-sm text-foreground-secondary">导航分组</div>
          </div>
        </div>
      </FadeIn>

      {/* 置顶笔记 */}
      {pinnedNotes.length > 0 && (
        <FadeIn delay={0.5} className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles size={24} className="text-accent" />
              置顶笔记
            </h2>
            <Link
              href="/notes"
              className="text-sm text-foreground-secondary hover:text-accent transition-colors flex items-center gap-1"
            >
              查看全部
              <ArrowRight size={14} />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <StaggerItem key={note.id}>
                <NoteCard note={note} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* 最近笔记 */}
      {recentNotes.length > 0 && (
        <FadeIn delay={0.6} className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen size={24} className="text-accent" />
              最近笔记
            </h2>
            <Link
              href="/notes"
              className="text-sm text-foreground-secondary hover:text-accent transition-colors flex items-center gap-1"
            >
              查看全部
              <ArrowRight size={14} />
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.map((note) => (
              <StaggerItem key={note.id}>
                <NoteCard note={note} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      )}

      {/* 快捷入口 */}
      <FadeIn delay={0.7}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe size={24} className="text-accent" />
            快捷导航
          </h2>
          <Link
            href="/sites"
            className="text-sm text-foreground-secondary hover:text-accent transition-colors flex items-center gap-1"
          >
            管理导航
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {groups.slice(0, 4).map((group) => (
            <Link key={group.id} href={`/sites?group=${group.id}`}>
              <motion.div
                whileHover={{ y: -4 }}
                className="card card-hover p-4 text-center"
              >
                <div className="text-3xl mb-2">{group.icon}</div>
                <div className="font-medium text-sm">{group.name}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </FadeIn>

      {/* 底部留白 */}
      <div className="h-16" />
    </PageTransition>
  )
}
