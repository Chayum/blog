'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, TrendingUp, Calendar, Target, Award, Flame } from 'lucide-react'
import { useReviewsStore } from '@/store/reviewsStore'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import Link from 'next/link'
import clsx from 'clsx'

export default function ReviewStatsPage() {
  const { 
    reviews, 
    stats, 
    syncFromApi, 
    syncStats, 
    _hasHydrated 
  } = useReviewsStore()

  const [isLoading, setIsLoading] = useState(false)

  // 初始化加载数据
  useEffect(() => {
    if (_hasHydrated) {
      setIsLoading(true)
      Promise.all([syncFromApi(), syncStats()]).finally(() => setIsLoading(false))
    }
  }, [_hasHydrated])

  // 解析 JSON 字段
  const parseJsonField = (field: string | null): string[] => {
    if (!field) return []
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }

  // 计算本周复盘数
  const getThisWeekReviews = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    
    return reviews.filter(r => new Date(r.date) >= startOfWeek).length
  }

  // 计算各月复盘数（用于图表）
  const getMonthlyData = () => {
    const monthlyData: { month: string; count: number }[] = []
    const today = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('zh-CN', { month: 'short' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const count = reviews.filter(r => {
        const reviewDate = new Date(r.date)
        return reviewDate >= monthStart && reviewDate <= monthEnd
      }).length
      
      monthlyData.push({ month: monthStr, count })
    }
    
    return monthlyData
  }

  // 计算完成事项统计
  const getCompletedStats = () => {
    let totalItems = 0
    reviews.forEach(r => {
      totalItems += parseJsonField(r.completed).filter(c => c.trim()).length
    })
    return totalItems
  }

  // 计算连续复盘记录（用于日历热力图）
  const getReviewDates = () => {
    return new Set(reviews.map(r => r.date))
  }

  // 生成日历热力图数据
  const generateHeatmapData = () => {
    const reviewDates = getReviewDates()
    const today = new Date()
    const data: { date: string; hasReview: boolean }[] = []
    
    // 生成最近 8 周的数据
    for (let i = 55; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      data.push({
        date: dateStr,
        hasReview: reviewDates.has(dateStr)
      })
    }
    
    return data
  }

  // 热力图数据
  const heatmapData = generateHeatmapData()
  const monthlyData = getMonthlyData()
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1)

  if (!_hasHydrated) {
    return (
      <PageTransition>
        <div className="animate-pulse max-w-3xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-background-secondary rounded mb-8" />
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="h-32 bg-background-secondary rounded-xl" />
            <div className="h-32 bg-background-secondary rounded-xl" />
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
          <div className="flex items-center gap-4 mb-8">
            <Link href="/review" className="p-2 hover:bg-background-secondary rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">统计</h1>
              <p className="text-foreground-secondary mt-1">复盘数据分析</p>
            </div>
          </div>
        </FadeIn>

        {/* 加载中 */}
        {isLoading && (
          <FadeIn>
            <div className="card p-8 text-center text-foreground-secondary">
              加载中...
            </div>
          </FadeIn>
        )}

        {!isLoading && (
          <>
            {/* 主要统计卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <FadeIn delay={0.05}>
                <div className="card p-4 text-center">
                  <Flame size={24} className="mx-auto text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">{stats?.streakDays || 0}</div>
                  <div className="text-xs text-foreground-secondary">连续天数</div>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <div className="card p-4 text-center">
                  <Target size={24} className="mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
                  <div className="text-xs text-foreground-secondary">总复盘数</div>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.15}>
                <div className="card p-4 text-center">
                  <Award size={24} className="mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{stats?.thisMonthReviews || 0}</div>
                  <div className="text-xs text-foreground-secondary">本月复盘</div>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <div className="card p-4 text-center">
                  <TrendingUp size={24} className="mx-auto text-purple-500 mb-2" />
                  <div className="text-2xl font-bold">{getThisWeekReviews()}</div>
                  <div className="text-xs text-foreground-secondary">本周复盘</div>
                </div>
              </FadeIn>
            </div>

            {/* 完成事项统计 */}
            <FadeIn delay={0.25}>
              <div className="card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-accent" />
                  <h2 className="text-lg font-semibold">完成事项</h2>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-accent mb-2">{getCompletedStats()}</div>
                  <div className="text-sm text-foreground-secondary">累计完成事项</div>
                </div>
              </div>
            </FadeIn>

            {/* 日历热力图 */}
            <FadeIn delay={0.3}>
              <div className="card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-accent" />
                  <h2 className="text-lg font-semibold">复盘热力图</h2>
                  <span className="text-xs text-foreground-secondary">（最近 8 周）</span>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="text-xs text-foreground-secondary text-center mb-1">{day}</div>
                        {heatmapData
                          .filter((_, index) => index % 7 === i)
                          .map((item, index) => (
                            <div
                              key={index}
                              className={clsx(
                                'w-3 h-3 rounded-sm transition-colors',
                                item.hasReview
                                  ? 'bg-accent'
                                  : 'bg-background-secondary'
                              )}
                              title={item.date}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-foreground-secondary">
                  <span>少</span>
                  <div className="w-3 h-3 rounded-sm bg-background-secondary" />
                  <div className="w-3 h-3 rounded-sm bg-accent/50" />
                  <div className="w-3 h-3 rounded-sm bg-accent" />
                  <span>多</span>
                </div>
              </div>
            </FadeIn>

            {/* 月度趋势 */}
            <FadeIn delay={0.35}>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-accent" />
                  <h2 className="text-lg font-semibold">月度趋势</h2>
                </div>
                
                <div className="flex items-end gap-2 h-32">
                  {monthlyData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.count / maxCount) * 100}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="w-full bg-accent/20 rounded-t-lg relative"
                        style={{ minHeight: item.count > 0 ? '4px' : '0' }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-lg"
                          style={{ height: '100%' }}
                        />
                        {item.count > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                            {item.count}
                          </span>
                        )}
                      </motion.div>
                      <span className="text-xs text-foreground-secondary">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* 鼓励语 */}
            {stats && stats.streakDays > 0 && (
              <FadeIn delay={0.4}>
                <div className="mt-6 text-center">
                  <p className="text-foreground-secondary">
                    {stats.streakDays >= 30
                      ? '太棒了！坚持复盘超过一个月，继续保持！'
                      : stats.streakDays >= 7
                        ? '很好！坚持复盘一周了，继续加油！'
                        : '好的开始！每天复盘会带来意想不到的收获。'}
                  </p>
                </div>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
