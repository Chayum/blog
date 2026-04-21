'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Check, BookOpen, Lightbulb, ListTodo, Pencil } from 'lucide-react'
import { useReviewsStore } from '@/store/reviewsStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import Link from 'next/link'
import clsx from 'clsx'

export default function ReviewPage() {
  const toast = useToast()
  const { 
    currentTemplate, 
    getReviewByDate, 
    upsertReview, 
    syncFromApi, 
    syncTemplates,
    syncStats,
    stats,
    _hasHydrated 
  } = useReviewsStore()

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [completed, setCompleted] = useState<string[]>([])
  const [insights, setInsights] = useState('')
  const [plans, setPlans] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [isSaving, setIsSaving] = useState(false)

  // 初始化
  useEffect(() => {
    if (_hasHydrated) {
      syncFromApi()
      syncTemplates()
      syncStats()
    }
  }, [_hasHydrated])

  // 加载选中日期的复盘
  useEffect(() => {
    const review = getReviewByDate(selectedDate)
    if (review) {
      try {
        setCompleted(JSON.parse(review.completed || '[]'))
      } catch { setCompleted([]) }
      setInsights(review.insights || '')
      try {
        setPlans(JSON.parse(review.plans || '[]'))
      } catch { setPlans([]) }
      setFreeText(review.freeText || '')
    } else {
      setCompleted([])
      setInsights('')
      setPlans([])
      setFreeText('')
    }
  }, [selectedDate, getReviewByDate])

  // 保存复盘
  const handleSave = async () => {
    setIsSaving(true)
    const result = await upsertReview({
      date: selectedDate,
      completed: JSON.stringify(completed.filter(c => c.trim())),
      insights,
      plans: JSON.stringify(plans.filter(p => p.trim())),
      freeText
    })
    setIsSaving(false)
    
    if (result.success) {
      toast.success('复盘已保存')
    } else {
      toast.error(result.error || '保存失败，请先登录管理员')
    }
  }

  // 日期格式化
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  // 生成日历
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: { date: string; isCurrentMonth: boolean }[] = []

    // 填充月初空白
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date: date.toISOString().split('T')[0], isCurrentMonth: false })
    }

    // 填充当月日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date: date.toISOString().split('T')[0], isCurrentMonth: true })
    }

    // 填充月末空白
    const endPadding = 42 - days.length
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date: date.toISOString().split('T')[0], isCurrentMonth: false })
    }

    return days
  }

  // 快捷操作
  const addCompletedItem = () => {
    setCompleted([...completed, ''])
  }

  const updateCompletedItem = (index: number, value: string) => {
    const newCompleted = [...completed]
    newCompleted[index] = value
    setCompleted(newCompleted)
  }

  const removeCompletedItem = (index: number) => {
    setCompleted(completed.filter((_, i) => i !== index))
  }

  const toggleCompletedItem = (index: number) => {
    // 这里可以添加完成状态切换逻辑
  }

  const addPlanItem = () => {
    setPlans([...plans, ''])
  }

  const updatePlanItem = (index: number, value: string) => {
    const newPlans = [...plans]
    newPlans[index] = value
    setPlans(newPlans)
  }

  const removePlanItem = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index))
  }

  if (!_hasHydrated) {
    return (
      <PageTransition>
        <div className="animate-pulse max-w-3xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-background-secondary rounded mb-8" />
          <div className="space-y-4">
            <div className="h-40 bg-background-secondary rounded-xl" />
            <div className="h-40 bg-background-secondary rounded-xl" />
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 头部 */}
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">每日复盘</h1>
              <p className="text-foreground-secondary mt-1">记录每一天的成长与收获</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/review/history" className="btn btn-secondary text-sm">
                历史记录
              </Link>
              <Link href="/review/stats" className="btn btn-secondary text-sm">
                统计
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* 统计卡片 */}
        {stats && (
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-accent">{stats.streakDays}</div>
                <div className="text-sm text-foreground-secondary">连续天数</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-accent">{stats.totalReviews}</div>
                <div className="text-sm text-foreground-secondary">总复盘数</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-accent">{stats.thisMonthReviews}</div>
                <div className="text-sm text-foreground-secondary">本月复盘</div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* 日期选择 */}
        <FadeIn delay={0.1}>
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-accent" />
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="btn btn-secondary text-sm"
              >
                选择日期
              </button>
            </div>

            {/* 日历选择器 */}
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-background-secondary rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="p-2 hover:bg-background rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="p-2 hover:bg-background rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="p-2 text-foreground-secondary">{day}</div>
                  ))}
                  {generateCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(day.date)
                        setShowDatePicker(false)
                      }}
                      className={clsx(
                        'p-2 rounded-lg text-sm transition-colors',
                        day.isCurrentMonth ? 'hover:bg-accent/10' : 'text-foreground-secondary/50',
                        day.date === selectedDate && 'bg-accent text-white',
                        day.date === new Date().toISOString().split('T')[0] && day.date !== selectedDate && 'ring-1 ring-accent'
                      )}
                    >
                      {new Date(day.date).getDate()}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </FadeIn>

        {/* 今日完成 */}
        <FadeIn delay={0.15}>
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Check size={20} className="text-green-500" />
              <h2 className="text-lg font-semibold">今日完成</h2>
            </div>
            <div className="space-y-2">
              {completed.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border"
                    onChange={() => toggleCompletedItem(index)}
                  />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateCompletedItem(index, e.target.value)}
                    placeholder="完成了什么..."
                    className="flex-1 px-3 py-2 bg-background-secondary rounded-lg border border-border focus:border-accent outline-none"
                  />
                  <button
                    onClick={() => removeCompletedItem(index)}
                    className="p-2 text-foreground-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addCompletedItem}
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-accent transition-colors"
              >
                <Plus size={16} />
                添加完成事项
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 今日感悟 */}
        <FadeIn delay={0.2}>
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-yellow-500" />
              <h2 className="text-lg font-semibold">今日感悟</h2>
            </div>
            <textarea
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              placeholder="今天有什么收获、感悟或思考..."
              rows={4}
              className="w-full px-3 py-2 bg-background-secondary rounded-lg border border-border focus:border-accent outline-none resize-none"
            />
          </div>
        </FadeIn>

        {/* 明日计划 */}
        <FadeIn delay={0.25}>
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo size={20} className="text-blue-500" />
              <h2 className="text-lg font-semibold">明日计划</h2>
            </div>
            <div className="space-y-2">
              {plans.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updatePlanItem(index, e.target.value)}
                    placeholder="明天要做什么..."
                    className="flex-1 px-3 py-2 bg-background-secondary rounded-lg border border-border focus:border-accent outline-none"
                  />
                  <button
                    onClick={() => removePlanItem(index)}
                    className="p-2 text-foreground-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addPlanItem}
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-accent transition-colors"
              >
                <Plus size={16} />
                添加计划事项
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 自由记录 */}
        <FadeIn delay={0.3}>
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Pencil size={20} className="text-purple-500" />
              <h2 className="text-lg font-semibold">自由记录</h2>
              <span className="text-xs text-foreground-secondary">（可选）</span>
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="任何想记录的内容..."
              rows={4}
              className="w-full px-3 py-2 bg-background-secondary rounded-lg border border-border focus:border-accent outline-none resize-none"
            />
          </div>
        </FadeIn>

        {/* 保存按钮 */}
        <FadeIn delay={0.35}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary w-full py-3"
          >
            {isSaving ? '保存中...' : '保存复盘'}
          </motion.button>
        </FadeIn>
      </div>
    </PageTransition>
  )
}