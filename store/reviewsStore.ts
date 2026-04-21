import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { reviewsApi, ReviewItem, ReviewStats, reviewTemplatesApi, ReviewTemplate, ReviewTemplateField } from '@/lib/api'

interface ReviewsState {
  reviews: ReviewItem[]
  templates: ReviewTemplate[]
  currentTemplate: ReviewTemplate | null
  stats: ReviewStats | null
  _hasHydrated: boolean
  _isSyncing: boolean
  setHasHydrated: (state: boolean) => void
  setReviews: (reviews: ReviewItem[]) => void
  setTemplates: (templates: ReviewTemplate[]) => void
  setCurrentTemplate: (template: ReviewTemplate | null) => void
  setStats: (stats: ReviewStats) => void
  syncFromApi: () => Promise<void>
  syncStats: () => Promise<void>
  syncTemplates: () => Promise<void>
  getReviewByDate: (date: string) => ReviewItem | undefined
  upsertReview: (data: {
    date: string
    completed?: string
    insights?: string
    plans?: string
    freeText?: string
  }) => Promise<{ success: boolean; error?: string }>
  deleteReview: (id: string) => Promise<{ success: boolean; error?: string }>
  createTemplate: (data: { name: string; fields: ReviewTemplateField[] }) => Promise<{ success: boolean; error?: string }>
  updateTemplate: (id: string, data: { name?: string; fields?: ReviewTemplateField[] }) => Promise<{ success: boolean; error?: string }>
  deleteTemplate: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      templates: [],
      currentTemplate: null,
      stats: null,
      _hasHydrated: false,
      _isSyncing: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setReviews: (reviews) => {
        set({ reviews })
      },

      setTemplates: (templates) => {
        set({ templates })
        if (templates.length > 0 && !get().currentTemplate) {
          const defaultTemplate = templates.find(t => t.isDefault === 1) || templates[0]
          set({ currentTemplate: defaultTemplate })
        }
      },

      setCurrentTemplate: (template) => {
        set({ currentTemplate: template })
      },

      setStats: (stats) => {
        set({ stats })
      },

      syncFromApi: async () => {
        if (get()._isSyncing) return
        set({ _isSyncing: true })
        try {
          const result = await reviewsApi.getAll(1, 100)
          set({ reviews: result.data })
        } catch (error) {
          console.error('Failed to sync reviews from API:', error)
        } finally {
          set({ _isSyncing: false })
        }
      },

      syncStats: async () => {
        try {
          const stats = await reviewsApi.getStats()
          set({ stats })
        } catch (error) {
          console.error('Failed to sync stats from API:', error)
        }
      },

      syncTemplates: async () => {
        try {
          const templates = await reviewTemplatesApi.getAll()
          set({ templates })
          if (templates.length > 0 && !get().currentTemplate) {
            const defaultTemplate = templates.find(t => t.isDefault === 1) || templates[0]
            set({ currentTemplate: defaultTemplate })
          }
        } catch (error) {
          console.error('Failed to sync templates from API:', error)
        }
      },

      getReviewByDate: (date) => {
        return get().reviews.find(r => r.date === date)
      },

      upsertReview: async (data) => {
        try {
          const review = await reviewsApi.upsert(data)
          set((state) => {
            const existingIndex = state.reviews.findIndex(r => r.date === data.date)
            if (existingIndex >= 0) {
              const newReviews = [...state.reviews]
              newReviews[existingIndex] = review
              return { reviews: newReviews }
            }
            return { reviews: [review, ...state.reviews] }
          })
          // 更新统计
          get().syncStats()
          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message || '保存失败' }
        }
      },

      deleteReview: async (id) => {
        try {
          await reviewsApi.delete(id)
          set((state) => ({
            reviews: state.reviews.filter(r => r.id !== id)
          }))
          get().syncStats()
          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message || '删除失败' }
        }
      },

      createTemplate: async (data) => {
        try {
          const template = await reviewTemplatesApi.create(data)
          set((state) => ({ templates: [...state.templates, template] }))
          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message || '创建失败' }
        }
      },

      updateTemplate: async (id, data) => {
        try {
          const template = await reviewTemplatesApi.update(id, data)
          set((state) => ({
            templates: state.templates.map(t => t.id === id ? template : t),
            currentTemplate: state.currentTemplate?.id === id ? template : state.currentTemplate
          }))
          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message || '更新失败' }
        }
      },

      deleteTemplate: async (id) => {
        try {
          await reviewTemplatesApi.delete(id)
          set((state) => ({
            templates: state.templates.filter(t => t.id !== id),
            currentTemplate: state.currentTemplate?.id === id ? state.templates[0] : state.currentTemplate
          }))
          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message || '删除失败' }
        }
      },
    }),
    {
      name: 'blogpro-reviews',
      partialize: (state) => ({
        currentTemplate: state.currentTemplate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)