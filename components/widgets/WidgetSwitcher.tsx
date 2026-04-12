'use client'

import { motion } from 'framer-motion'
import { Gamepad2, Terminal, Sparkles, Ghost, X } from 'lucide-react'
import { WidgetType } from '@/store/settingsStore'
import clsx from 'clsx'

interface WidgetSwitcherProps {
  currentType: WidgetType
  onSelect: (type: WidgetType) => void
  onClose: () => void
}

const WIDGET_OPTIONS: { type: WidgetType; label: string; icon: typeof Gamepad2; color: string }[] = [
  { type: 'pet', label: '数字宠物', icon: Ghost, color: 'text-purple-500' },
  { type: 'game', label: '打砖块', icon: Gamepad2, color: 'text-blue-500' },
  { type: 'particles', label: '粒子特效', icon: Sparkles, color: 'text-yellow-500' },
  { type: 'terminal', label: '终端', icon: Terminal, color: 'text-green-500' },
  { type: 'none', label: '关闭', icon: X, color: 'text-red-500' }
]

export default function WidgetSwitcher({ currentType, onSelect, onClose }: WidgetSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card border border-border rounded-xl shadow-xl p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">选择组件</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-background-secondary transition-colors"
        >
          <X size={14} className="text-foreground-secondary" />
        </button>
      </div>
      
      <div className="space-y-1">
        {WIDGET_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive = currentType === option.type
          
          return (
            <motion.button
              key={option.type}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelect(option.type)
                onClose()
              }}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive 
                  ? 'bg-accent/10 text-accent' 
                  : 'hover:bg-background-secondary text-foreground-secondary'
              )}
            >
              <Icon size={16} className={option.color} />
              <span>{option.label}</span>
              {isActive && (
                <span className="ml-auto text-xs text-accent">当前</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
