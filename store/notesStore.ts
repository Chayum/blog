import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Note {
  id: string
  title: string
  content: string
  slug: string
  tags: string[]
  isPublic: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
  readingTime: number
}

interface NotesState {
  notes: Note[]
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'slug' | 'readingTime' | 'isPinned'>) => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  getNoteBySlug: (slug: string) => Note | undefined
  getPublicNotes: () => Note[]
  getPinnedNotes: () => Note[]
  getRecentNotes: (limit?: number) => Note[]
  getAllTags: () => string[]
  togglePin: (id: string) => void
}

const generateSlug = (title: string): string => {
  // 先将中文转为拼音风格（简单处理：保留中文字符的Unicode编码）
  // 或者使用更简洁的方式：移除所有非URL安全字符，只保留字母数字
  const sanitized = title
    .toLowerCase()
    // 保留字母、数字、中文，其他替换为 -
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // 如果处理后为空（纯中文标题），使用 "note" 作为前缀
  const slugBase = sanitized || 'note'

  // 添加时间戳确保唯一性
  return `${slugBase}-${Date.now().toString(36)}`
}

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200
  const words = content.replace(/[#*`\[\]]/g, '').length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      addNote: (noteData) => {
        const now = new Date().toISOString()
        const slug = generateSlug(noteData.title)
        const newNote: Note = {
          ...noteData,
          isPinned: false,
          id: crypto.randomUUID(),
          slug,
          createdAt: now,
          updatedAt: now,
          readingTime: calculateReadingTime(noteData.content)
        }
        set((state) => ({
          notes: [newNote, ...state.notes]
        }))
        return newNote
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id === id) {
              const updatedContent = updates.content ?? note.content
              return {
                ...note,
                ...updates,
                updatedAt: new Date().toISOString(),
                readingTime: updates.content ? calculateReadingTime(updatedContent) : note.readingTime,
                slug: updates.title ? generateSlug(updates.title) : note.slug
              }
            }
            return note
          })
        }))
      },

      deleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }))
      },

      getNoteBySlug: (slug) => {
        return get().notes.find((note) => note.slug === slug)
      },

      getPublicNotes: () => {
        return get().notes.filter((note) => note.isPublic)
      },

      getPinnedNotes: () => {
        return get().notes.filter((note) => note.isPinned && note.isPublic)
      },

      getRecentNotes: (limit = 5) => {
        return get()
          .notes.filter((note) => note.isPublic)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit)
      },

      getAllTags: () => {
        const tags = new Set<string>()
        get().notes.forEach((note) => {
          note.tags.forEach((tag) => tags.add(tag))
        })
        return Array.from(tags).sort()
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: !note.isPinned } : note
          )
        }))
      }
    }),
    {
      name: 'blogpro-notes',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 notes，不持久化 _hasHydrated
      partialize: (state) => ({ notes: state.notes }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
