'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Trash2, Eye } from 'lucide-react'
import { useReviewsStore } from '@/store/reviewsStore'
import { useToast } from '@/components/ui/Toast'
import PageTransition, { FadeIn } from '@/components/layout/PageTransition'
import Link from 'next/link'
import clsx from 'clsx'

export default function ReviewHistoryPage() {
  const toast = useToast()
  const { 
    reviews, 
    deleteReview, 
    syncFromApi, 
    _hasHydrated 
  } = useReviewsStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 初始化加载数据
  useEffect(() => {
    if (_hasHydrated) {
      setIsLoading(true)
      syncFromApi().finally(() => setIsLoading(false))
    }
  }, [_hasHydrated])

  // 分页计算
  const totalPages = Math.ceil(reviews.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReviews = reviews.slice(startIndex, endIndex)

  // 删除复盘
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条复盘记录吗？')) return
    
    const result = await deleteReview(id)
    if (result.success) {
      toast.success('删除成功')
    } else {
      toast.error(result.error || '删除失败')
    }
  }

  // 查看详情
  const handleViewDetail = (review: any) => {
    setSelectedReview(review)
    setShowDetail(true)
  }

  // 日期格式化
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  // 解析 JSON 字段
  const parseJsonField = (field: string | null): string[] => {
    if (!field) return []
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }

  if (!_hasHydrated) {
    return (
      <PageTransition>
        <div className="animate-pulse max-w-3xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-background-secondary rounded mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-background-secondary rounded-xl" />
            ))}
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
            <div className="flex items-center gap-4">
              <Link href="/review" className="p-2 hover:bg-background-secondary rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">历史记录</h1>
                <p className="text-foreground-secondary mt-1">共 {reviews.length} 条复盘记录</p>
              </div>
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

        {/* 空状态 */}
        {!isLoading && reviews.length === 0 && (
          <FadeIn>
            <div className="card p-8 text-center">
              <Calendar size={48} className="mx-auto text-foreground-secondary mb-4" />
              <p className="text-foreground-secondary mb-4">暂无复盘记录</p>
              <Link href="/review" className="btn btn-primary">
                开始写复盘
              </Link>
            </div>
          </FadeIn>
        )}

        {/* 复盘列表 */}
        {!isLoading && reviews.length > 0 && (
          <>
            <div className="space-y-4">
              {currentReviews.map((review, index) => {
                const completed = parseJsonField(review.completed)
                const plans = parseJsonField(review.plans)
                
                return (
                  <FadeIn key={review.id} delay={index * 0.05}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="card p-5 cursor-pointer hover:border-accent/50 transition-colors"
                      onClick={() => handleViewDetail(review)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-accent" />
                          <span className="font-medium">{formatDate(review.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetail(review)
                            }}
                            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye size={16} className="text-foreground-secondary" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(review.id)
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* 预览内容 */}
                      <div className="space-y-2 text-sm text-foreground-secondary">
                        {completed.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-green-500 shrink-0">完成:</span>
                            <span className="line-clamp-1">{completed.filter(c => c.trim()).join('、') || '无'}</span>
                          </div>
                        )}
                        {review.insights && (
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-500 shrink-0">感悟:</span>
                            <span className="line-clamp-1">{review.insights}</span>
                          </div>
                        )}
                        {plans.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-blue-500 shrink-0">计划:</span>
                            <span className="line-clamp-1">{plans.filter(p => p.trim()).join('、') || '无'}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </FadeIn>
                )
              })}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <FadeIn delay={0.2}>
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-background-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      // 只显示当前页附近的页码
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={clsx(
                              'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                              page === currentPage
                                ? 'bg-accent text-white'
                                : 'hover:bg-background-secondary'
                            )}
                          >
                            {page}
                          </button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-1">...</span>
                      }
                      return null
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-background-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </FadeIn>
            )}
          </>
        )}

        {/* 详情弹窗 */}
        {showDetail && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{formatDate(selectedReview.date)}</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-background-secondary rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* 今日完成 */}
                <div>
                  <h3 className="text-sm font-medium text-green-500 mb-2">今日完成</h3>
                  <div className="space-y-1">
                    {parseJsonField(selectedReview.completed).filter((c: string) => c.trim()).map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </div>
                    ))}
                    {parseJsonField(selectedReview.completed).filter((c: string) => c.trim()).length === 0 && (
                      <span className="text-sm text-foreground-secondary">无</span>
                    )}
                  </div>
                </div>

                {/* 今日感悟 */}
                {selectedReview.insights && (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-500 mb-2">今日感悟</h3>
                    <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                      {selectedReview.insights}
                    </p>
                  </div>
                )}

                {/* 明日计划 */}
                <div>
                  <h3 className="text-sm font-medium text-blue-500 mb-2">明日计划</h3>
                  <div className="space-y-1">
                    {parseJsonField(selectedReview.plans).filter((p: string) => p.trim()).map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {item}
                      </div>
                    ))}
                    {parseJsonField(selectedReview.plans).filter((p: string) => p.trim()).length === 0 && (
                      <span className="text-sm text-foreground-secondary">无</span>
                    )}
                  </div>
                </div>

                {/* 自由记录 */}
                {selectedReview.freeText && (
                  <div>
                    <h3 className="text-sm font-medium text-purple-500 mb-2">自由记录</h3>
                    <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                      {selectedReview.freeText}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowDetail(false)}
                  className="btn btn-secondary"
                >
                  关闭
                </button>
                <Link
                  href={`/review?date=${selectedReview.date}`}
                  className="btn btn-primary"
                >
                  编辑
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
