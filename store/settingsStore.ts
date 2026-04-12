import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

// 默认打字机文字
export const DEFAULT_TYPEWRITER_TEXTS = [
  '欢迎来到赛博空间',
  '探索代码与创意的边界',
  '在数字世界中留下你的痕迹',
  'CYBER_BLOG // 赛博博客'
]

interface SettingsState {
  theme: Theme
  sidebarOpen: boolean
  heroBackground: string | null  // base64 图片或渐变预设
  typewriterTexts: string[]      // 打字机文字列表
  _hasHydrated: boolean          // hydration 状态
  setHasHydrated: (state: boolean) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setHeroBackground: (background: string | null) => void
  setTypewriterTexts: (texts: string[]) => void
  resetTypewriterTexts: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      heroBackground: null,
      typewriterTexts: DEFAULT_TYPEWRITER_TEXTS,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        let newTheme: Theme
        
        if (currentTheme === 'light') {
          newTheme = 'dark'
        } else if (currentTheme === 'dark') {
          newTheme = 'system'
        } else {
          // system -> light
          newTheme = 'light'
        }
        
        set({ theme: newTheme })
        applyTheme(newTheme)
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setHeroBackground: (background) => {
        set({ heroBackground: background })
      },

      setTypewriterTexts: (texts) => {
        set({ typewriterTexts: texts })
      },

      resetTypewriterTexts: () => {
        set({ typewriterTexts: DEFAULT_TYPEWRITER_TEXTS })
      }
    }),
    {
      name: 'blogpro-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        heroBackground: state.heroBackground,
        typewriterTexts: state.typewriterTexts
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
