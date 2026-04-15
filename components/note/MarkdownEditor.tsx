'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import {
  Bold, Italic, Heading1, Heading2, Heading3, Link2, Image,
  List, ListOrdered, Quote, Code, Eye, Edit3, Save, EyeOff, ChevronDown
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import clsx from 'clsx'

interface MarkdownEditorProps {
  initialTitle?: string
  initialContent?: string
  initialTags?: string[]
  initialIsPublic?: boolean
  onSave: (data: { title: string; content: string; tags: string[]; isPublic: boolean }) => void
  onCancel?: () => void
  isSaving?: boolean
}

export default function MarkdownEditor({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  initialIsPublic = true,
  onSave,
  onCancel,
  isSaving = false
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPreview, setIsPreview] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [codeLangMenuOpen, setCodeLangMenuOpen] = useState(false)
  
  // 代码块语言列表
  const languages = [
    { value: '', label: '无（纯文本）' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'bash', label: 'Bash' },
  ]
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()

  // 自动保存提示
  useEffect(() => {
    if (lastSaved) {
      toast.success('笔记已保存')
    }
  }, [lastSaved])

  // 插入文本到光标位置
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end) || placeholder

    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end)

    setContent(newContent)

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(
        start + before.length,
        newCursorPos
      )
    }, 0)
  }, [content])

  // 工具栏按钮配置
  const tools = [
    { icon: Heading1, action: () => insertText('\n# ', '', '标题'), title: '一级标题' },
    { icon: Heading2, action: () => insertText('\n## ', '', '标题'), title: '二级标题' },
    { icon: Heading3, action: () => insertText('\n### ', '', '标题'), title: '三级标题' },
    { type: 'divider' as const },
    { icon: Bold, action: () => insertText('**', '**', '粗体'), title: '粗体' },
    { icon: Italic, action: () => insertText('*', '*', '斜体'), title: '斜体' },
    { type: 'divider' as const },
    // 代码块按钮改为带下拉菜单
    { icon: Link2, action: () => insertText('[', '](url)', '链接'), title: '链接' },
    { icon: Image, action: () => insertText('![', '](url)', '图片'), title: '图片' },
    { type: 'divider' as const },
    { icon: List, action: () => insertText('\n- ', '', '列表项'), title: '无序列表' },
    { icon: ListOrdered, action: () => insertText('\n1. ', '', '列表项'), title: '有序列表' },
    { icon: Quote, action: () => insertText('\n> ', '', '引用'), title: '引用' },
  ]

  // 处理标签输入
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // 处理保存
  const handleSave = () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }
    if (!content.trim()) {
      toast.error('请输入笔记内容')
      return
    }
    onSave({ title: title.trim(), content, tags, isPublic })
    setLastSaved(new Date())
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* 预览切换 */}
          <div className="flex bg-background-secondary rounded-lg p-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPreview(false)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                !isPreview
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              <Edit3 size={14} />
              编辑
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPreview(true)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                isPreview
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              <Eye size={14} />
              预览
            </motion.button>
          </div>

          {/* 分割线 */}
          <div className="w-px h-6 bg-border mx-2" />

          {/* 格式工具 */}
          {!isPreview && (
            <div className="hidden md:flex items-center gap-0.5">
              {tools.map((tool, idx) => {
                if (tool.type === 'divider') {
                  return <div key={idx} className="w-px h-5 bg-border mx-1" />
                }
                const ToolIcon = tool.icon!
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={tool.action}
                    title={tool.title}
                    className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                  >
                    <ToolIcon size={16} />
                  </motion.button>
                )
              })}
              
              {/* 代码块按钮 - 带下拉菜单 */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCodeLangMenuOpen(!codeLangMenuOpen)}
                  title="代码块"
                  className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors flex items-center gap-1"
                >
                  <Code size={16} />
                  <ChevronDown size={12} />
                </motion.button>
                
                {/* 下拉菜单 */}
                {codeLangMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setCodeLangMenuOpen(false)} 
                    />
                    <div className="absolute top-full left-0 mt-1 w-40 max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            const langMark = lang.value ? `\n\`\`\`${lang.value}\n` : '\n```\n'
                            const endMark = '\n```\n'
                            insertText(langMark, endMark, '代码')
                            setCodeLangMenuOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-background-secondary transition-colors"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2">
          {/* 发布开关 */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              isPublic
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-background-secondary text-foreground-secondary'
            )}
          >
            {isPublic ? '🌐 公开' : '🔒 私密'}
          </button>

          {onCancel && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="btn btn-secondary"
            >
              取消
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </motion.button>
        </div>
      </div>

      {/* 标题输入 */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="在这里写下笔记标题..."
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-foreground-secondary/50"
        />
      </div>

      {/* 标签输入 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <motion.span
            key={tag}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="tag flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </motion.span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="添加标签，按回车确认..."
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-foreground-secondary/50"
        />
      </div>

      {/* 编辑器/预览区 */}
      <div className="flex-1 min-h-0">
        {isPreview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full overflow-auto rounded-xl bg-card border border-border p-6"
          >
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {content || '*暂无内容*'}
              </ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="使用 Markdown 语法书写...\n\n# 一级标题\n## 二级标题\n\n**粗体** *斜体*\n\n- 列表项\n\n> 引用\n\n```代码块```"
            className="w-full h-full min-h-[400px] resize-none rounded-xl bg-card border border-border p-6 font-mono text-sm leading-relaxed outline-none placeholder:text-foreground-secondary/50 focus:border-accent/50 transition-colors"
          />
        )}
      </div>

      {/* 底部提示 */}
      <div className="mt-4 flex items-center justify-between text-xs text-foreground-secondary">
        <span>支持 Markdown 语法</span>
        <span>
          {content.length} 字符 ·{' '}
          {Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)} 分钟阅读
        </span>
      </div>
    </div>
  )
}
