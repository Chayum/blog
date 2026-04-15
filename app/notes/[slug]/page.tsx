'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeShiki from '@shikijs/rehype'
import { ArrowLeft, Edit, Calendar, Clock, Share2, Check, Download, Trash2, ArrowUp } from 'lucide-react'
import { useNotesStore } from '@/store/notesStore'
import { useToast } from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import Link from 'next/link'
import clsx from 'clsx'

interface TocItem {
  level: number
  text: string
  id: string
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  // 检测 Zustand hydration 是否完成
  const hasHydrated = useNotesStore((state) => state._hasHydrated)
  const notes = useNotesStore((state) => state.notes)
  const deleteNote = useNotesStore((state) => state.deleteNote)

  // 查找笔记 - 支持 slug 或 id 匹配（增强容错）
  const note = useMemo(() => {
    // 先尝试用 slug 匹配
    const bySlug = notes.find((n) => n.slug === slug)
    if (bySlug) return bySlug

    // 如果 slug 匹配失败，尝试用 id 匹配（备用方案）
    const byId = notes.find((n) => n.id === slug)
    if (byId) return byId

    // 最后尝试解码后的 slug 匹配（处理URL编码差异）
    try {
      const decodedSlug = decodeURIComponent(slug)
      return notes.find((n) => n.slug === decodedSlug || n.id === decodedSlug)
    } catch {
      return undefined
    }
  }, [notes, slug])
  
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  // 目录容器和目录项的 ref
  const tocContainerRef = useRef<HTMLDivElement>(null)
  const tocItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  // 提取目录
  const toc = useMemo(() => {
    if (!note) return []
    
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(note.content)) !== null) {
      items.push({
        level: match[1].length,
        text: match[2],
        id: match[2].toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      })
    }

    return items
  }, [note])

  // 计算字数
  const wordCount = note ? note.content.replace(/\s/g, '').length : 0

  // 滚动进度、高亮目录、回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      setReadProgress(progress)

      // 显示/隐藏回到顶部按钮
      setShowBackToTop(scrollTop > 300)

      // 基于滚动位置计算当前高亮标题
      const scrollPosition = window.scrollY + 150
      let currentHeading = ''

      for (const item of toc) {
        const element = document.getElementById(item.id)
        if (element) {
          const offsetTop = element.offsetTop
          if (offsetTop <= scrollPosition) {
            currentHeading = item.id
          } else {
            break
          }
        }
      }

      setActiveHeading(currentHeading)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [toc])

  // 自动滚动目录，使高亮项保持在可视区域中央
  useEffect(() => {
    if (!activeHeading || !tocContainerRef.current) return
    
    const activeElement = tocItemRefs.current.get(activeHeading)
    if (!activeElement) return
    
    const container = tocContainerRef.current
    const containerHeight = container.clientHeight
    const elementTop = activeElement.offsetTop
    const elementHeight = activeElement.clientHeight
    
    const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
    
    container.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    })
  }, [activeHeading])

  // 复制链接
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('链接已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  // 导出为Markdown文件
  const exportMarkdown = () => {
    if (!note) return
    
    const markdown = `# ${note.title}\n\n${note.tags.map(t => `> ${t}`).join(' ')}\n\n${note.content}`
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已导出为 Markdown 文件')
  }

  // 删除笔记并返回列表
  const handleDelete = () => {
    if (!note) return
    setDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!note) return
    deleteNote(note.id)
    toast.success('笔记已删除')
    router.push('/notes')
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // hydration 未完成时显示加载状态
  if (!hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-foreground-secondary">加载中...</div>
      </div>
    )
  }

  // 笔记不存在
  if (!note) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-4">笔记不存在</h2>
          <p className="text-foreground-secondary mb-6">该笔记可能已被删除或不存在</p>
          <div className="flex gap-3">
            <Link href="/notes" className="btn btn-primary">
              返回笔记列表
            </Link>
            <Link href="/write" className="btn btn-secondary">
              写新笔记
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-8">
      {/* 阅读进度条 */}
      <div className="fixed top-16 left-0 right-0 h-1 z-50 bg-background-secondary">
        <motion.div
          className="h-full bg-accent"
          style={{ width: `${readProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* 顶部导航 */}
      <FadeIn className="mb-8 flex items-center justify-between">
        <Link
          href="/notes"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          返回笔记列表
        </Link>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="btn btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            title="删除笔记"
          >
            <Trash2 size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={exportMarkdown}
            className="btn btn-ghost"
            title="导出"
          >
            <Download size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyLink}
            className="btn btn-ghost"
            title="分享"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
          </motion.button>
          <Link href={`/write?edit=${note.id}`} className="btn btn-secondary">
            <Edit size={16} />
            编辑
          </Link>
        </div>
      </FadeIn>

      {/* 主布局 */}
      <div className="flex gap-8">
        {/* 主内容 */}
        <FadeIn delay={0.1} className="flex-1 min-w-0">
          {/* 文章头部 */}
          <header className="mb-12">
            {/* 标签 */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map((tag) => (
                  <Link key={tag} href={`/notes?tag=${encodeURIComponent(tag)}`}>
                    <span className="tag">#{tag}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* 标题 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {note.title}
            </h1>

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-secondary">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(note.createdAt)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                共 {wordCount} 字
              </div>
            </div>
          </header>

          {/* 文章内容 */}
          <article className="markdown-content text-lg leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeRaw,
                [rehypeShiki, { theme: 'github-dark' }]
              ]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className="bg-background-secondary px-1.5 py-0.5 rounded font-mono text-base" {...props}>
                        {children}
                      </code>
                    )
                  }

                  return (
                    <div className="relative group my-6">
                      {/* 左上角：语言标识 */}
                      {match && (
                        <div className="absolute left-2 -top-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                            {match[1]}
                          </span>
                        </div>
                      )}
                      {/* 右上角：复制按钮 */}
                      <div className="absolute right-2 -top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children))
                            toast.success('代码已复制')
                          }}
                          className="text-xs py-1 px-2 bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors"
                        >
                          复制
                        </button>
                      </div>
                      <pre className="!bg-[#0d1117] rounded-lg overflow-x-auto">
                        <code className={`${className}`} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  )
                },
                h1: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                  return <h1 id={id}>{children}</h1>
                },
                h2: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                  return <h2 id={id}>{children}</h2>
                },
                h3: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                  return <h3 id={id}>{children}</h3>
                }
              }}
            >
              {note.content}
            </ReactMarkdown>
          </article>

          {/* 文章底部 */}
          <footer className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">
                共计 {wordCount} 字 · 最后更新于 {formatDate(note.updatedAt)}
              </span>
              <div className="flex items-center gap-2">
                <Link href="/notes" className="btn btn-ghost text-sm">
                  ← 返回笔记列表
                </Link>
              </div>
            </div>
          </footer>
        </FadeIn>

        {/* 侧边目录 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div 
              ref={tocContainerRef}
              className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              <h3 className="text-sm font-semibold mb-4 text-foreground-secondary uppercase tracking-wider sticky top-0 bg-background py-2">
                目录
              </h3>
              <nav className="space-y-1 pb-4">
                {toc.map((item, idx) => {
                  const isActive = activeHeading === item.id
                  return (
                    <a
                      key={idx}
                      ref={(el) => {
                        if (el) {
                          tocItemRefs.current.set(item.id, el)
                        }
                      }}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        const element = document.getElementById(item.id)
                        if (element) {
                          const offset = 100
                          const elementPosition = element.getBoundingClientRect().top + window.scrollY
                          window.scrollTo({
                            top: elementPosition - offset,
                            behavior: 'smooth'
                          })
                          window.history.pushState(null, '', `#${item.id}`)
                        }
                      }}
                      className={clsx(
                        'block text-sm py-1.5 pr-2 border-l-2 transition-all duration-200',
                        isActive
                          ? 'border-accent text-accent font-medium'
                          : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
                      )}
                      style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                    >
                      {item.text}
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* 底部留白 */}
      <div className="h-16" />

      {/* 回到顶部按钮 */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteModal}
        title="删除笔记"
        message={note ? `确定要删除笔记"${note.title}"吗？此操作不可恢复。` : '确定要删除这篇笔记吗？'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(false)}
        type="danger"
        confirmText="删除"
        cancelText="取消"
      />
    </PageTransition>
  )
}
