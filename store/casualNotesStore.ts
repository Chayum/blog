import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 便签颜色
export const NOTE_COLORS = [
  '#fef3c7', // 黄色
  '#dbeafe', // 蓝色
  '#fce7f3', // 粉色
  '#d1fae5', // 绿色
  '#ede9fe', // 紫色
  '#fed7aa', // 橙色
]

export interface CasualNote {
  id: string
  content: string
  createdAt: string
  color: string
}

interface CasualNotesState {
  notes: CasualNote[]
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  addNote: (content: string) => void
  deleteNote: (id: string) => void
  getRecentNotes: (limit?: number) => CasualNote[]
}

export const useCasualNotesStore = create<CasualNotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      addNote: (content) => {
        const trimmed = content.trim()
        if (!trimmed) return

        const newNote: CasualNote = {
          id: crypto.randomUUID(),
          content: trimmed,
          createdAt: new Date().toISOString(),
          color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
        }

        set((state) => ({
          notes: [newNote, ...state.notes]
        }))
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id)
        }))
      },

      getRecentNotes: (limit = 6) => {
        return get().notes.slice(0, limit)
      }
    }),
    {
      name: 'blogpro-casual-notes',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
