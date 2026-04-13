'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload } from 'lucide-react'
import { useNotesStore } from '@/store/notesStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import MarkdownEditor from '@/components/note/MarkdownEditor'
import Link from 'next/link'

function WritePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { notes, addNote, updateNote } = useNotesStore()
  const toast = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingNote = editId ? notes.find((n) => n.id === editId) : null

  const handleSave = useCallback(
    (data: { title: string; content: string; tags: string[]; isPublic: boolean }) => {
      setIsSaving(true)

      try {
        if (existingNote) {
          updateNote(existingNote.id, data)
          toast.success('笔记已更新')
        } else {
          addNote(data)
          toast.success('笔记已创建')
        }

        setTimeout(() => {
          router.push('/notes')
        }, 500)
      } catch (error) {
        toast.error('保存失败')
      } finally {
        setIsSaving(false)
      }
    },
    [existingNote, addNote, updateNote, router, toast]
  )

  // 导入Markdown文件
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (!content) {
        toast.error('读取文件失败')
        return
      }

      // 尝试从markdown内容提取标题和标签
      const lines = content.split('\n')
      let title = ''
      const tags: string[] = []
      let actualContent = content

      // 第一行通常是标题
      const firstLine = lines[0]
      if (firstLine?.startsWith('# ')) {
        title = firstLine.substring(2).trim()
        actualContent = lines.slice(1).join('\n').trim()
      }

      // 提取标签（> 开头的行）
      const tagRegex = /^>\s*(.+)/gm
      let match
      while ((match = tagRegex.exec(actualContent)) !== null) {
        const tag = match[1].trim()
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      }
      // 移除标签行
      actualContent = actualContent.replace(/^>.*$/gm, '').trim()

      // 如果没有标题，使用文件名
      if (!title) {
        title = file.name.replace(/\.md$/i, '')
      }

      // 创建笔记
      const newNote = await addNote({
        title,
        content: actualContent,
        tags,
        isPublic: true
      })
      toast.success(`已导入: ${title}`)
      // 使用 URL 参数传递高亮信息，并强制刷新确保数据同步
      if (newNote?.id) {
        setTimeout(() => {
          window.location.href = `/notes?highlight=${newNote.id}`
        }, 100)
      }
    }
    reader.onerror = () => {
      toast.error('读取文件失败')
    }
    reader.readAsText(file)

    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addNote, router, toast])

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-8">
      <FadeIn className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/notes"
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            返回笔记列表
          </Link>
          
          {/* 导入按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost text-sm"
            title="导入Markdown文件"
          >
            <Upload size={16} />
            导入
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <h1 className="text-xl font-bold">
          {existingNote ? '编辑笔记' : '写新笔记'}
        </h1>

        <div className="w-24" />
      </FadeIn>

      <FadeIn delay={0.1} className="h-[calc(100vh-180px)]">
        <MarkdownEditor
          initialTitle={existingNote?.title || ''}
          initialContent={existingNote?.content || ''}
          initialTags={existingNote?.tags || []}
          initialIsPublic={existingNote?.isPublic ?? true}
          onSave={handleSave}
          onCancel={() => router.back()}
          isSaving={isSaving}
        />
      </FadeIn>
    </PageTransition>
  )
}

function WritePageLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-32 bg-background-secondary rounded" />
        <div className="h-6 w-24 bg-background-secondary rounded" />
        <div className="w-24" />
      </div>
      <div className="h-[calc(100vh-180px)] bg-background-secondary rounded-xl" />
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<WritePageLoading />}>
      <WritePageContent />
    </Suspense>
  )
}
