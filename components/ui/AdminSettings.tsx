'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Check, X, Eye, EyeOff, Download, Upload } from 'lucide-react'
import { getAdminPassword, setAdminPassword, clearAdminPassword, testAdminPassword, dataApi, type ExportData } from '@/lib/api'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import { useSettingsStore } from '@/store/settingsStore'

interface AdminSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminSettings({ isOpen, onClose }: AdminSettingsProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // 导出/导入状态
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  
  // Store 方法
  const setNotes = useNotesStore((state) => state.setNotes)
  const setSites = useSitesStore((state) => state.setSites)
  const setGroups = useSitesStore((state) => state.setGroups)
  
  const notes = useNotesStore((state) => state.notes)
  const sites = useSitesStore((state) => state.sites)
  const groups = useSitesStore((state) => state.groups)
  
  // 检查是否已设置密码
  useEffect(() => {
    const storedPassword = getAdminPassword()
    if (storedPassword) {
      setPassword(storedPassword)
      setIsValid(true)
    }
  }, [])
  
  // 验证密码
  const handleVerify = async () => {
    if (!password) {
      setError('请输入密码')
      return
    }
    
    setIsVerifying(true)
    setError('')
    
    try {
      const valid = await testAdminPassword(password)
      if (valid) {
        setAdminPassword(password)
        setIsValid(true)
      } else {
        setError('密码错误')
      }
    } catch (e) {
      setError('验证失败，请稍后重试')
    } finally {
      setIsVerifying(false)
    }
  }
  
  // 保存新密码
  const handleSave = () => {
    if (!password) {
      setError('请输入密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    setAdminPassword(password)
    setIsValid(true)
    setConfirmPassword('')
    setError('')
  }
  
  // 登出
  const handleLogout = () => {
    clearAdminPassword()
    setPassword('')
    setIsValid(false)
  }
  
  // 导出数据
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await dataApi.exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blogpro-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
      alert('导出失败')
    } finally {
      setIsExporting(false)
    }
  }
  
  // 导入数据
  const handleImport = async () => {
    if (!importFile) {
      alert('请选择文件')
      return
    }
    
    setIsImporting(true)
    try {
      const text = await importFile.text()
      const data: ExportData = JSON.parse(text)
      
      if (!data.version || !data.notes || !data.sites || !data.groups) {
        throw new Error('Invalid data format')
      }
      
      // 导入数据到 API
      await dataApi.importAll(data, password!)
      
      // 更新本地 stores
      setNotes(data.notes)
      setSites(data.sites)
      setGroups(data.groups)
      
      alert('导入成功！')
      setImportFile(null)
    } catch (e) {
      console.error('Import failed:', e)
      alert('导入失败，请检查文件格式')
    } finally {
      setIsImporting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-xl border border-border p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {isValid ? <Lock size={18} /> : <Unlock size={18} />}
              {isValid ? '管理员设置' : '输入管理员密码'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-background-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {!isValid ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                请输入管理员密码以进行写操作（添加、编辑、删除）
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入管理员密码"
                    className="input pr-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="btn btn-primary w-full"
              >
                {isVerifying ? '验证中...' : '验证'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <Check size={16} />
                已验证
              </div>
              
              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3">数据管理</h4>
                
                {/* 导出 */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground-secondary">
                    导出所有数据到 JSON 文件
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-secondary w-full justify-start"
                  >
                    <Download size={16} />
                    {isExporting ? '导出中...' : '导出数据'}
                  </button>
                </div>
                
                {/* 导入 */}
                <div className="space-y-2">
                  <p className="text-sm text-foreground-secondary">
                    从 JSON 文件导入数据
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                    <button
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                      className="btn btn-secondary"
                    >
                      <Upload size={16} />
                      {isImporting ? '导入中...' : '导入'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3">当前数据统计</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background-secondary rounded-lg p-2">
                    <div className="text-2xl font-bold">{notes.length}</div>
                    <div className="text-xs text-foreground-secondary">笔记</div>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-2">
                    <div className="text-2xl font-bold">{sites.length}</div>
                    <div className="text-xs text-foreground-secondary">网站</div>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-2">
                    <div className="text-2xl font-bold">{groups.length}</div>
                    <div className="text-xs text-foreground-secondary">分组</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn btn-ghost text-red-500 w-full"
              >
                退出登录
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
