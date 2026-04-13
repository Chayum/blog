'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Site } from '@/store/sitesStore'

interface SiteCardProps {
  site: Site
  onEdit?: (site: Site) => void
  onDelete?: (id: string) => void
}

export default function SiteCard({ site, onEdit, onDelete }: SiteCardProps) {
  return (
    <motion.a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="card card-hover group cursor-pointer block relative"
    >
      {/* 操作按钮 */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(site)
              }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur text-foreground-secondary hover:text-accent transition-colors text-xs"
            >
              编辑
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(site.id)
              }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur text-foreground-secondary hover:text-red-500 transition-colors text-xs"
            >
              删除
            </motion.button>
          )}
        </div>
      )}

      {/* 图标 */}
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 overflow-hidden">
        <img
          src={`/api/favicon?url=${encodeURIComponent(site.url)}`}
          alt={site.name}
          width={28}
          height={28}
          className="object-contain"
          onError={(e) => {
            // 如果 API 返回默认图标也失败，显示首字母
            const target = e.currentTarget as HTMLImageElement
            target.style.display = 'none'
            const fallback = target.nextElementSibling as HTMLElement
            if (fallback) {
              fallback.style.display = 'flex'
            }
          }}
        />
        <span className="hidden text-lg font-bold text-accent">
          {site.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* 名称 */}
      <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors flex items-center gap-1.5">
        {site.name}
        <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      </h3>

      {/* 描述 */}
      <p className="text-sm text-foreground-secondary line-clamp-2">
        {site.description}
      </p>
    </motion.a>
  )
}
