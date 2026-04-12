'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, FolderOpen } from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'
import PageTransition, { FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/PageTransition'
import SiteGroupCard from '@/components/site/SiteGroupCard'
import { Site } from '@/store/sitesStore'

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('📁')
  
  // 检测 Zustand hydration 是否完成
  const hasHydrated = useSitesStore((state) => state._hasHydrated)
  // 响应式订阅
  const groups = useSitesStore((state) => state.groups)
  const sites = useSitesStore((state) => state.sites)
  const addGroup = useSitesStore((state) => state.addGroup)
  const deleteSite = useSitesStore((state) => state.deleteSite)

  // 添加分组
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    addGroup(newGroupName.trim(), newGroupIcon)
    setNewGroupName('')
    setNewGroupIcon('📁')
    setShowAddGroup(false)
  }

  // 预设图标
  const iconOptions = ['📁', '🔧', '💼', '📚', '🎮', '🎨', '🎵', '🎬', '📱', '💻', '🌐', '☁️', '🔒', '📊', '🛠️']

  // hydration 未完成时显示加载状态
  if (!hasHydrated) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-background-secondary rounded mb-8" />
        <div className="h-12 bg-background-secondary rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-background-secondary rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      {/* 页面标题 */}
      <FadeIn className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">网站导航</h1>
            <p className="text-foreground-secondary">
              快速访问你常用的网站
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddGroup(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            添加分组
          </motion.button>
        </div>
      </FadeIn>

      {/* 搜索栏 */}
      <FadeIn delay={0.1} className="mb-8">
        <div className="relative max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索网站..."
            className="input pl-12 pr-4 py-3"
          />
        </div>
      </FadeIn>

      {/* 分组列表 */}
      {groups.length > 0 ? (
        <StaggerContainer>
          {groups
            .sort((a, b) => a.order - b.order)
            .map((group) => (
              <StaggerItem key={group.id}>
                <SiteGroupCard
                  group={group}
                  sites={sites}
                  searchQuery={searchQuery}
                  onEditSite={(site) => {
                    console.log('Edit site:', site)
                  }}
                  onDeleteSite={deleteSite}
                />
              </StaggerItem>
            ))}
        </StaggerContainer>
      ) : (
        <FadeIn delay={0.2}>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
              <FolderOpen size={32} className="text-foreground-secondary" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无分组</h3>
            <p className="text-foreground-secondary mb-6">
              创建第一个分组来管理你的网站
            </p>
            <button onClick={() => setShowAddGroup(true)} className="btn btn-primary">
              添加分组
            </button>
          </div>
        </FadeIn>
      )}

      {/* 添加分组弹窗 */}
      {showAddGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAddGroup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-xl border border-border p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">添加新分组</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">图标</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <motion.button
                      key={icon}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNewGroupIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        newGroupIcon === icon
                          ? 'bg-accent/20 ring-2 ring-accent'
                          : 'bg-background-secondary hover:bg-border'
                      }`}
                    >
                      {icon}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">分组名称</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例如：技术工具"
                  className="input"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddGroup(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 底部留白 */}
      <div className="h-16" />
    </PageTransition>
  )
}
