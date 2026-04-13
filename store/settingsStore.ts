import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { settingsApi } from '@/lib/api'

type Theme = 'light' | 'dark' | 'system'

// 默认打字机文字
export const DEFAULT_TYPEWRITER_TEXTS = [
  '欢迎来到赛博空间',
  '探索代码与创意的边界',
  '在数字世界中留下你的痕迹',
  'CYBER_BLOG // 赛博博客'
]

// 趣味组件类型
export type WidgetType = 'pet' | 'particles' | 'game' | 'terminal' | 'none'

export interface WidgetConfig {
  type: WidgetType
  position: { x: number; y: number }
  isOpen: boolean
  isExpanded: boolean
}

interface SettingsState {
  theme: Theme
  sidebarOpen: boolean
  heroBackground: string | null  // base64 图片或渐变预设
  typewriterTexts: string[]      // 打字机文字列表
  _hasHydrated: boolean          // hydration 状态
  _isSyncing: boolean             // API 同步状态
  leftWidget: WidgetConfig       // 左侧趣味组件
  rightWidget: WidgetConfig      // 右侧趣味组件
  heroSubtitle: string           // 英雄页副标题
  siteName: string               // 博客名称
  setHasHydrated: (state: boolean) => void
  setTheme: (theme: Theme) => Promise<{ success: boolean; error?: string }>
  toggleTheme: () => Promise<{ success: boolean; error?: string }>
  setSidebarOpen: (open: boolean) => Promise<{ success: boolean; error?: string }>
  toggleSidebar: () => Promise<{ success: boolean; error?: string }>
  setHeroBackground: (background: string | null) => Promise<{ success: boolean; error?: string }>
  setTypewriterTexts: (texts: string[]) => Promise<{ success: boolean; error?: string }>
  resetTypewriterTexts: () => Promise<{ success: boolean; error?: string }>
  setLeftWidget: (widget: Partial<WidgetConfig>) => Promise<{ success: boolean; error?: string }>
  setRightWidget: (widget: Partial<WidgetConfig>) => Promise<{ success: boolean; error?: string }>
  resetWidgetPositions: () => Promise<{ success: boolean; error?: string }>
  setHeroSubtitle: (text: string) => Promise<{ success: boolean; error?: string }>
  setSiteName: (name: string) => Promise<{ success: boolean; error?: string }>
  syncFromApi: () => Promise<void>
}

// 默认组件配置
const DEFAULT_LEFT_WIDGET: WidgetConfig = {
  type: 'pet',
  position: { x: 20, y: 100 },
  isOpen: true,
  isExpanded: true
}

const DEFAULT_RIGHT_WIDGET: WidgetConfig = {
  type: 'none',
  position: { x: 20, y: 100 },
  isOpen: false,
  isExpanded: true
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      heroBackground: null,
      typewriterTexts: DEFAULT_TYPEWRITER_TEXTS,
      _hasHydrated: false,
      _isSyncing: false,
      leftWidget: DEFAULT_LEFT_WIDGET,
      rightWidget: DEFAULT_RIGHT_WIDGET,
      heroSubtitle: '记录思考 · 分享知识 · 探索无限可能',
      siteName: '最强之人',

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      // 从 API 同步设置
      syncFromApi: async () => {
        if (get()._isSyncing) return
        set({ _isSyncing: true })
        try {
          const apiSettings = await settingsApi.getAll()
          
          // 解析 API 返回的设置并更新本地状态
          const updates: Partial<SettingsState> = {}
          
          if (apiSettings.theme) updates.theme = apiSettings.theme as Theme
          if (apiSettings.sidebarOpen !== undefined) updates.sidebarOpen = apiSettings.sidebarOpen
          if (apiSettings.heroBackground !== undefined) updates.heroBackground = apiSettings.heroBackground
          if (apiSettings.typewriterTexts) {
            try {
              updates.typewriterTexts = typeof apiSettings.typewriterTexts === 'string' 
                ? JSON.parse(apiSettings.typewriterTexts) 
                : apiSettings.typewriterTexts
            } catch { /* keep default */ }
          }
          if (apiSettings.leftWidget) {
            try {
              updates.leftWidget = typeof apiSettings.leftWidget === 'string'
                ? JSON.parse(apiSettings.leftWidget)
                : apiSettings.leftWidget
            } catch { /* keep default */ }
          }
          if (apiSettings.rightWidget) {
            try {
              updates.rightWidget = typeof apiSettings.rightWidget === 'string'
                ? JSON.parse(apiSettings.rightWidget)
                : apiSettings.rightWidget
            } catch { /* keep default */ }
          }
          if (apiSettings.heroSubtitle) updates.heroSubtitle = apiSettings.heroSubtitle
          if (apiSettings.siteName) updates.siteName = apiSettings.siteName
          
          set(updates)
        } catch (error) {
          console.error('Failed to sync settings from API:', error)
        } finally {
          set({ _isSyncing: false })
        }
      },

      setTheme: async (theme) => {
        const oldTheme = get().theme
        set({ theme })
        applyTheme(theme)
        try {
          await settingsApi.update('theme', theme)
          return { success: true }
        } catch (error: any) {
          set({ theme: oldTheme })
          applyTheme(oldTheme)
          return { success: false, error: error.message || '同步失败' }
        }
      },

      toggleTheme: async () => {
        const currentTheme = get().theme
        let newTheme: Theme
        
        if (currentTheme === 'light') {
          newTheme = 'dark'
        } else if (currentTheme === 'dark') {
          newTheme = 'system'
        } else {
          newTheme = 'light'
        }
        
        set({ theme: newTheme })
        applyTheme(newTheme)
        try {
          await settingsApi.update('theme', newTheme)
          return { success: true }
        } catch (error: any) {
          set({ theme: currentTheme })
          applyTheme(currentTheme)
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setSidebarOpen: async (open) => {
        const oldValue = get().sidebarOpen
        set({ sidebarOpen: open })
        try {
          await settingsApi.update('sidebarOpen', open)
          return { success: true }
        } catch (error: any) {
          set({ sidebarOpen: oldValue })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      toggleSidebar: async () => {
        const oldValue = get().sidebarOpen
        const newValue = !oldValue
        set({ sidebarOpen: newValue })
        try {
          await settingsApi.update('sidebarOpen', newValue)
          return { success: true }
        } catch (error: any) {
          set({ sidebarOpen: oldValue })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setHeroBackground: async (background) => {
        const oldBackground = get().heroBackground
        set({ heroBackground: background })
        try {
          await settingsApi.update('heroBackground', background)
          return { success: true }
        } catch (error: any) {
          set({ heroBackground: oldBackground })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setTypewriterTexts: async (texts) => {
        const oldTexts = get().typewriterTexts
        set({ typewriterTexts: texts })
        try {
          await settingsApi.update('typewriterTexts', JSON.stringify(texts))
          return { success: true }
        } catch (error: any) {
          set({ typewriterTexts: oldTexts })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      resetTypewriterTexts: async () => {
        const oldTexts = get().typewriterTexts
        set({ typewriterTexts: DEFAULT_TYPEWRITER_TEXTS })
        try {
          await settingsApi.update('typewriterTexts', JSON.stringify(DEFAULT_TYPEWRITER_TEXTS))
          return { success: true }
        } catch (error: any) {
          set({ typewriterTexts: oldTexts })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setLeftWidget: async (widget) => {
        const oldWidget = get().leftWidget
        const newWidget = { ...oldWidget, ...widget }
        set({ leftWidget: newWidget })
        try {
          await settingsApi.update('leftWidget', JSON.stringify(newWidget))
          return { success: true }
        } catch (error: any) {
          set({ leftWidget: oldWidget })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setRightWidget: async (widget) => {
        const oldWidget = get().rightWidget
        const newWidget = { ...oldWidget, ...widget }
        set({ rightWidget: newWidget })
        try {
          await settingsApi.update('rightWidget', JSON.stringify(newWidget))
          return { success: true }
        } catch (error: any) {
          set({ rightWidget: oldWidget })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      resetWidgetPositions: async () => {
        const oldLeftWidget = get().leftWidget
        const oldRightWidget = get().rightWidget
        set({
          leftWidget: DEFAULT_LEFT_WIDGET,
          rightWidget: DEFAULT_RIGHT_WIDGET
        })
        try {
          await settingsApi.update('leftWidget', JSON.stringify(DEFAULT_LEFT_WIDGET))
          await settingsApi.update('rightWidget', JSON.stringify(DEFAULT_RIGHT_WIDGET))
          return { success: true }
        } catch (error: any) {
          set({ leftWidget: oldLeftWidget, rightWidget: oldRightWidget })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setHeroSubtitle: async (text) => {
        const oldSubtitle = get().heroSubtitle
        set({ heroSubtitle: text })
        try {
          await settingsApi.update('heroSubtitle', text)
          return { success: true }
        } catch (error: any) {
          set({ heroSubtitle: oldSubtitle })
          return { success: false, error: error.message || '同步失败' }
        }
      },

      setSiteName: async (name) => {
        const oldName = get().siteName
        set({ siteName: name })
        try {
          await settingsApi.update('siteName', name)
          return { success: true }
        } catch (error: any) {
          set({ siteName: oldName })
          return { success: false, error: error.message || '同步失败' }
        }
      }
    }),
    {
      name: 'blogpro-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        heroBackground: state.heroBackground,
        typewriterTexts: state.typewriterTexts,
        leftWidget: state.leftWidget,
        rightWidget: state.rightWidget,
        heroSubtitle: state.heroSubtitle,
        siteName: state.siteName
      }),
      onRehydrateStorage: () => (state) => {
        // 应用保存的主题
        if (state) {
          applyTheme(state.theme)
        }
        // 标记 hydration 完成
        state?.setHasHydrated(true)
      }
    }
  )
)

// 应用主题到DOM
function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  const isDark = 
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// 监听系统主题变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useSettingsStore.getState()
    if (state.theme === 'system') {
      applyTheme('system')
    }
  })
}
