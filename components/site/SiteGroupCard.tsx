'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FolderOpen, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { SiteGroup } from '@/store/sitesStore'
import SiteCard from './SiteCard'
import { useSitesStore } from '@/store/sitesStore'
import { useToast } from '@/components/ui/Toast'

interface SiteGroupCardProps {
  group: SiteGroup
  sites: ReturnType<typeof useSitesStore.getState>['sites']
  searchQuery?: string
  onEditSite: (site: any) => void
  onDeleteSite: (id: string) => void
}

export default function SiteGroupCard({
  group,
  sites,
  searchQuery = '',
  onEditSite,
  onDeleteSite
}: SiteGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { updateGroup, deleteGroup } = useSitesStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const toast = useToast()

  // 过滤站点（如果有搜索）
  const filteredSites = searchQuery
    ? sites.filter(
        (site) =>
          site.groupId === group.id &&
          (site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            site.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sites.filter((site) => site.groupId === group.id)

  // 处理分组名称编辑
  const handleNameSubmit = async () => {
    if (editName.trim() && editName !== group.name) {
      const result = await updateGroup(group.id, { name: editName.trim() })
      if (result.success) {
        toast.success('分组名称已更新')
      } else {
        toast.error(result.error || '更新失败，请先登录管理员')
      }
    }
    setIsEditing(false)
  }

  // 处理删除分组
  const handleDelete = async () => {
    if (confirm(`确定要删除"${group.name}"分组吗？分组内的网站也会被删除。`)) {
      const result = await deleteGroup(group.id)
      if (result.success) {
        toast.success('分组已删除')
      } else {
        toast.error(result.error || '删除失败，请先登录管理员')
      }
    }
  }

  if (filteredSites.length === 0 && searchQuery) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* 分组标题 */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold group"
        >
          <span className="text-2xl">{group.icon}</span>
          {isExpanded ? (
            <ChevronDown size={18} className="text-foreground-secondary" />
          ) : (
            <ChevronRight size={18} className="text-foreground-secondary" />
          )}
          
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="input py-1 px-2 text-lg font-semibold w-40"
              autoFocus
            />
          ) : (
            <span className="group-hover:text-accent transition-colors">
              {group.name}
            </span>
          )}
          
          <span className="text-sm text-foreground-secondary font-normal">
            ({filteredSites.length})
          </span>
        </motion.button>

        {/* 分组操作 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-foreground-secondary hover:text-accent hover:bg-background-secondary transition-colors"
            title="编辑分组"
          >
            <Edit2 size={14} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="删除分组"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>

      {/* 网站网格 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {filteredSites.map((site, idx) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <SiteCard
                  site={site}
                  onEdit={onEditSite}
                  onDelete={onDeleteSite}
                />
              </motion.div>
            ))}

            {/* 添加网站按钮 */}
            <AddSiteCard groupId={group.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 添加网站卡片
function AddSiteCard({ groupId }: { groupId: string }) {
  const { addSite } = useSitesStore()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !url.trim()) return
    
    // favicon 现在通过 API 动态获取，不再需要预生成
    const domain = url.startsWith('http') ? url : `https://${url}`

    addSite({
      name: name.trim(),
      url: domain,
      description: description.trim(),
      groupId
    })

    setName('')
    setUrl('')
    setDescription('')
    setIsOpen(false)
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="card card-hover cursor-pointer flex flex-col items-center justify-center min-h-[140px] border-dashed border-2 border-border/50 hover:border-accent/50"
      >
        <Plus size={24} className="text-foreground-secondary mb-2" />
        <span className="text-sm text-foreground-secondary">添加网站</span>
      </motion.div>

      {/* 添加弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-xl border border-border p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">添加网站</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="GitHub"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">网址</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">描述</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="代码托管平台"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button onClick={() => setIsOpen(false)} className="btn btn-secondary">
                  取消
                </button>
                <button onClick={handleSubmit} className="btn btn-primary">
                  添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
