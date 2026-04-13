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
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setHeroBackground: (background: string | null) => void
  setTypewriterTexts: (texts: string[]) => void
  resetTypewriterTexts: () => void
  setLeftWidget: (widget: Partial<WidgetConfig>) => void
  setRightWidget: (widget: Partial<WidgetConfig>) => void
  resetWidgetPositions: () => void
  setHeroSubtitle: (text: string) => void
  setSiteName: (name: string) => void
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

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
        // 同步到 API
        settingsApi.update('theme', theme).catch(console.error)
      },

      toggleTheme: () => {
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
        settingsApi.update('theme', newTheme).catch(console.error)
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
        settingsApi.update('sidebarOpen', open).catch(console.error)
      },

      toggleSidebar: () => {
        const newValue = !get().sidebarOpen
        set({ sidebarOpen: newValue })
        settingsApi.update('sidebarOpen', newValue).catch(console.error)
      },

      setHeroBackground: (background) => {
        set({ heroBackground: background })
        settingsApi.update('heroBackground', background).catch(console.error)
      },

      setTypewriterTexts: (texts) => {
        set({ typewriterTexts: texts })
        settingsApi.update('typewriterTexts', JSON.stringify(texts)).catch(console.error)
      },

      resetTypewriterTexts: () => {
        set({ typewriterTexts: DEFAULT_TYPEWRITER_TEXTS })
        settingsApi.update('typewriterTexts', JSON.stringify(DEFAULT_TYPEWRITER_TEXTS)).catch(console.error)
      },

      setLeftWidget: (widget) => {
        set((state) => {
          const newWidget = { ...state.leftWidget, ...widget }
          settingsApi.update('leftWidget', JSON.stringify(newWidget)).catch(console.error)
          return { leftWidget: newWidget }
        })
      },

      setRightWidget: (widget) => {
        set((state) => {
          const newWidget = { ...state.rightWidget, ...widget }
          settingsApi.update('rightWidget', JSON.stringify(newWidget)).catch(console.error)
          return { rightWidget: newWidget }
        })
      },

      resetWidgetPositions: () => {
        set({
          leftWidget: DEFAULT_LEFT_WIDGET,
          rightWidget: DEFAULT_RIGHT_WIDGET
        })
        settingsApi.update('leftWidget', JSON.stringify(DEFAULT_LEFT_WIDGET)).catch(console.error)
        settingsApi.update('rightWidget', JSON.stringify(DEFAULT_RIGHT_WIDGET)).catch(console.error)
      },

      setHeroSubtitle: (text) => {
        set({ heroSubtitle: text })
        settingsApi.update('heroSubtitle', text).catch(console.error)
      },

      setSiteName: (name) => {
        set({ siteName: name })
        settingsApi.update('siteName', name).catch(console.error)
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
