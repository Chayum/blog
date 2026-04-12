'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Monitor, Download, Trash2, Info, ChevronRight } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import clsx from 'clsx'

export default function SettingsPage() {
  // 检测各 store 的 hydration 是否完成
  const notesHydrated = useNotesStore((state) => state._hasHydrated)
  const sitesHydrated = useSitesStore((state) => state._hasHydrated)
  const isHydrated = notesHydrated && sitesHydrated
  
  const { theme, setTheme } = useSettingsStore()
  const notes = useNotesStore((state) => state.notes)
  const sites = useSitesStore((state) => state.sites)
  const groups = useSitesStore((state) => state.groups)
  const toast = useToast()

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

  return (
    <PageTransition>
      {/* 页面标题 */}
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-foreground-secondary">
          自定义你的博客体验
        </p>
      </FadeIn>

      <div className="max-w-2xl space-y-6">
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
