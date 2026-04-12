'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning'
}: ConfirmModalProps) {
  const typeStyles = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
      buttonColor: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-200 dark:border-red-500/20'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      borderColor: 'border-yellow-200 dark:border-yellow-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-500/20'
    }
  }

  const styles = typeStyles[type]
  const Icon = styles.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* 对话框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden w-full max-w-md mx-4 pointer-events-auto">
              {/* 头部 */}
              <div className={`flex items-start gap-4 p-6 ${styles.bgColor} ${styles.borderColor} border-b`}>
                <div className={`p-2 rounded-lg bg-background ${styles.iconColor}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1 rounded-lg hover:bg-background-secondary transition-colors text-foreground-secondary"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 按钮 */}
              <div className="flex items-center justify-end gap-3 p-4 bg-background-secondary/50">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground bg-background hover:bg-background-secondary rounded-lg transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${styles.buttonColor}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
