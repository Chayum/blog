'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Moon, Sun, Monitor, Download, Trash2, ChevronRight, 
  Upload, Image as ImageIcon, X, Plus, RotateCcw, GripVertical
} from 'lucide-react'
import { useSettingsStore, DEFAULT_TYPEWRITER_TEXTS } from '@/store/settingsStore'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import clsx from 'clsx'

// 预设背景选项
const PRESET_BACKGROUNDS = [
  { id: 'gradient-1', name: '赛博紫', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-2', name: '日落橙', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-3', name: '极光绿', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gradient-4', name: '深海蓝', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { id: 'gradient-5', name: '暗夜黑', gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)' },
]

export default function SettingsPage() {
  // 检测各 store 的 hydration 是否完成
  const notesHydrated = useNotesStore((state) => state._hasHydrated)
  const sitesHydrated = useSitesStore((state) => state._hasHydrated)
  const isHydrated = notesHydrated && sitesHydrated
  
  const { 
    theme, setTheme, 
    heroBackground, setHeroBackground,
    typewriterTexts, setTypewriterTexts, resetTypewriterTexts
  } = useSettingsStore()
  const notes = useNotesStore((state) => state.notes)
  const sites = useSitesStore((state) => state.sites)
  const groups = useSitesStore((state) => state.groups)
  const toast = useToast()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newText, setNewText] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  // hydration 未完成时显示加载状态
  if (!isHydrated) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-background-secondary rounded mb-8" />
        <div className="space-y-6">
          <div className="h-40 bg-background-secondary rounded-xl" />
          <div className="h-40 bg-background-secondary rounded-xl" />
        </div>
      </div>
    )
  }

  // 处理文件上传
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    // 检查文件大小 (限制 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB')
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setHeroBackground(base64)
      setIsUploading(false)
      toast.success('背景图片已上传')
    }
    reader.onerror = () => {
      setIsUploading(false)
      toast.error('上传失败')
    }
    reader.readAsDataURL(file)

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [setHeroBackground, toast])

  // 选择预设背景
  const selectPresetBackground = (gradient: string) => {
    setHeroBackground(gradient)
    toast.success('背景已更新')
  }

  // 清除背景
  const clearBackground = () => {
    setHeroBackground(null)
    toast.success('背景已重置')
  }

  // 添加打字机文字
  const addTypewriterText = () => {
    if (!newText.trim()) return
    setTypewriterTexts([...typewriterTexts, newText.trim()])
    setNewText('')
    toast.success('已添加')
  }

  // 删除打字机文字
  const removeTypewriterText = (index: number) => {
    const newTexts = typewriterTexts.filter((_, i) => i !== index)
    setTypewriterTexts(newTexts)
  }

  // 开始编辑
  const startEdit = (index: number, text: string) => {
    setEditingIndex(index)
    setEditText(text)
  }

  // 保存编辑
  const saveEdit = () => {
    if (editingIndex === null || !editText.trim()) return
    const newTexts = [...typewriterTexts]
    newTexts[editingIndex] = editText.trim()
    setTypewriterTexts(newTexts)
    setEditingIndex(null)
    setEditText('')
    toast.success('已更新')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(null)
    setEditText('')
  }

  // 导出数据
  const exportData = () => {
    const data = {
      notes,
      sites,
      groups,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blogpro-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('数据已导出')
  }

  // 清除所有数据
  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：所有笔记和网站数据都将被删除！')) {
        localStorage.clear()
        toast.success('数据已清除，请刷新页面')
        setTimeout(() => window.location.reload(), 1000)
      }
    }
  }

  // 主题选项
  const themeOptions = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor }
  ] as const

  // 判断当前是否为预设背景
  const isPresetBackground = heroBackground?.startsWith('linear-gradient')
  const currentPreset = PRESET_BACKGROUNDS.find(b => b.gradient === heroBackground)

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-8">
      {/* 页面标题 */}
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-foreground-secondary">
          自定义你的博客体验
        </p>
      </FadeIn>

      <div className="max-w-2xl space-y-6">
        {/* 英雄页设置 */}
        <FadeIn delay={0.05}>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">英雄页</h2>
            
            <div className="space-y-6">
              {/* 背景图片设置 */}
              <div>
                <label className="text-sm font-medium text-foreground-secondary mb-3 block">
                  背景图片
                </label>
                
                {/* 当前背景预览 */}
                {heroBackground && (
                  <div className="mb-4 relative">
                    <div 
                      className="h-32 rounded-xl bg-cover bg-center"
                      style={{ background: heroBackground }}
                    />
                    <button
                      onClick={clearBackground}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="mt-2 text-sm text-foreground-secondary">
                      {isPresetBackground ? `预设: ${currentPreset?.name}` : '自定义图片'}
                    </div>
                  </div>
                )}

                {/* 上传按钮 */}
                <div className="flex gap-3 mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-accent/50 transition-colors disabled:opacity-50"
                  >
                    <Upload size={18} />
                    {isUploading ? '上传中...' : '上传图片'}
                  </motion.button>
                  <span className="text-xs text-foreground-secondary self-center">
                    支持 JPG、PNG，最大 2MB
                  </span>
                </div>

                {/* 预设背景 */}
                <div>
                  <label className="text-xs text-foreground-secondary mb-2 block">
                    或选择预设渐变
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_BACKGROUNDS.map((bg) => (
                      <motion.button
                        key={bg.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectPresetBackground(bg.gradient)}
                        className={clsx(
                          'h-12 rounded-lg transition-all',
                          heroBackground === bg.gradient 
                            ? 'ring-2 ring-accent ring-offset-2' 
                            : 'hover:opacity-80'
                        )}
                        style={{ background: bg.gradient }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 打字机文字设置 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground-secondary">
                    打字机文字
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetTypewriterTexts}
                    className="text-xs text-foreground-secondary hover:text-accent flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    重置默认
                  </motion.button>
                </div>

                {/* 文字列表 */}
                <div className="space-y-2 mb-4">
                  <AnimatePresence>
                    {typewriterTexts.map((text, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-background-secondary group"
                      >
                        <GripVertical size={16} className="text-foreground-secondary/50" />
                        
                        {editingIndex === index ? (
                          <>
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 bg-transparent border-none outline-none text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit()
                                if (e.key === 'Escape') cancelEdit()
                              }}
                            />
                            <button
                              onClick={saveEdit}
                              className="p-1 hover:text-accent transition-colors"
                            >
                              保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span 
                              className="flex-1 text-sm cursor-pointer hover:text-accent transition-colors"
                              onClick={() => startEdit(index, text)}
                            >
                              {text}
                            </span>
                            <button
                              onClick={() => removeTypewriterText(index)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* 添加新文字 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="输入新的打字机文字..."
                    className="flex-1 input text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTypewriterText()
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addTypewriterText}
                    disabled={!newText.trim()}
                    className="btn btn-primary px-3 disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 主题设置 */}
        <FadeIn delay={0.1}>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">外观</h2>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground-secondary mb-3 block">
                主题模式
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = theme === option.value
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(option.value)}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                        isActive
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border hover:border-accent/50'
                      )}
                    >
                      <motion.div
                        animate={{ rotate: theme === option.value ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon size={24} />
                      </motion.div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 数据管理 */}
        <FadeIn delay={0.2}>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">数据管理</h2>
            
            <div className="space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background-secondary text-center">
                  <div className="text-2xl font-bold text-accent">{notes.length}</div>
                  <div className="text-xs text-foreground-secondary">笔记</div>
                </div>
                <div className="p-4 rounded-lg bg-background-secondary text-center">
                  <div className="text-2xl font-bold text-accent">{sites.length}</div>
                  <div className="text-xs text-foreground-secondary">网站</div>
                </div>
                <div className="p-4 rounded-lg bg-background-secondary text-center">
                  <div className="text-2xl font-bold text-accent">{groups.length}</div>
                  <div className="text-xs text-foreground-secondary">分组</div>
                </div>
              </div>

              {/* 导出数据 */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={exportData}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Download size={20} className="text-accent" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">导出数据</div>
                    <div className="text-sm text-foreground-secondary">
                      下载 JSON 格式的备份文件
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-foreground-secondary group-hover:text-accent transition-colors" />
              </motion.button>

              {/* 清除数据 */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={clearAllData}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-red-500">清除所有数据</div>
                    <div className="text-sm text-foreground-secondary">
                      删除所有笔记和网站数据
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-foreground-secondary group-hover:text-red-500 transition-colors" />
              </motion.button>
            </div>
          </div>
        </FadeIn>

        {/* 关于 */}
        <FadeIn delay={0.3}>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">关于</h2>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                B
              </div>
              <div>
                <div className="font-bold text-lg">BlogPro</div>
                <div className="text-sm text-foreground-secondary">
                  版本 1.0.0
                </div>
                <div className="text-xs text-foreground-secondary mt-1">
                  一个简洁、优雅的个人笔记博客系统
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-foreground-secondary">
              <p>使用 Next.js + Tailwind CSS + Zustand 构建</p>
              <p className="mt-1">数据存储在浏览器本地 · 不会上传到任何服务器</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* 底部留白 */}
      <div className="h-16" />
    </PageTransition>
  )
}
