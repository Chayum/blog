'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, BookOpen, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import PageTransition, { FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/PageTransition'
import NoteCard from '@/components/note/NoteCard'
import HeroSection from '@/components/hero/HeroSection'

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

  return (
    <PageTransition>
      {/* 英雄页 - 全屏 */}
      <HeroSection />

      {/* 第二屏 - 原有内容 */}
      <div className="relative z-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24 md:pb-16">
          {/* 统计信息 */}
          <FadeIn className="mb-16">
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
            <FadeIn delay={0.1} className="mb-16">
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
            <FadeIn delay={0.2} className="mb-16">
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
          <FadeIn delay={0.3}>
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
        </div>
      </div>
    </PageTransition>
  )
}
