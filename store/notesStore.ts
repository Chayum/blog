import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { notesApi } from '@/lib/api'

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
  _isSyncing: boolean
  setHasHydrated: (state: boolean) => void
  setNotes: (notes: Note[]) => void
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'slug' | 'readingTime' | 'isPinned'>) => Promise<{ success: boolean; note?: any; error?: string }>
  updateNote: (id: string, updates: Partial<Note>) => Promise<{ success: boolean; error?: string }>
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>
  getNoteBySlug: (slug: string) => Note | undefined
  getPublicNotes: () => Note[]
  getPinnedNotes: () => Note[]
  getRecentNotes: (limit?: number) => Note[]
  getAllTags: () => string[]
  togglePin: (id: string) => void
  syncFromApi: () => Promise<void>
}

const generateSlug = (title: string): string => {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const slugBase = sanitized || 'note'
  return `${slugBase}-${Date.now().toString(36)}`
}

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200
  const words = content.replace(/[#*`\[\]]/g, '').length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

// 从 API 响应解析 tags（可能是 JSON 字符串或数组）
const parseTags = (tags: string | string[] | null): string[] => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      _hasHydrated: false,
      _isSyncing: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setNotes: (notes) => {
        // 确保每个 note 的 tags 都是数组
        const normalizedNotes = notes.map(note => ({
          ...note,
          tags: parseTags(note.tags),
        }))
        set({ notes: normalizedNotes })
      },
      
      // 从 API 同步数据
      syncFromApi: async () => {
        if (get()._isSyncing) return
        set({ _isSyncing: true })
        try {
          const apiNotes = await notesApi.getAll()
          const normalizedNotes = apiNotes.map((note: any) => ({
            ...note,
            tags: parseTags(note.tags),
            isPublic: note.isPublic ?? true,
            isPinned: note.isPinned ?? false,
          }))
          set({ notes: normalizedNotes })
        } catch (error) {
          console.error('Failed to sync notes from API:', error)
        } finally {
          set({ _isSyncing: false })
        }
      },

      addNote: async (noteData) => {
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
        
        // 先更新本地
        set((state) => ({
          notes: [newNote, ...state.notes]
        }))
        
        // 同步到 API
        try {
          const created = await notesApi.create({
            title: newNote.title,
            content: newNote.content,
            tags: newNote.tags,
            slug: newNote.slug,
            readingTime: newNote.readingTime,
          })
          
          // 更新本地 ID 为 API 返回的 ID（如果不同）
          if (created.id !== newNote.id) {
            set((state) => ({
              notes: state.notes.map((note) =>
                note.id === newNote.id ? { ...note, id: created.id } : note
              )
            }))
          }
          
          return { success: true, note: created }
        } catch (error: any) {
          console.error('Failed to create note on API:', error)
          // 回滚本地更改
          set((state) => ({ notes: state.notes.filter((note) => note.id !== newNote.id) }))
          return { success: false, error: error.message || '同步失败' }
        }
      },

      updateNote: async (id, updates) => {
        const now = new Date().toISOString()
        
        // 保存旧数据用于回滚
        const oldNote = get().notes.find((n) => n.id === id)
        
        // 先更新本地
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id === id) {
              const updatedContent = updates.content ?? note.content
              return {
                ...note,
                ...updates,
                updatedAt: now,
                readingTime: updates.content ? calculateReadingTime(updatedContent) : note.readingTime,
                slug: updates.title ? generateSlug(updates.title) : note.slug
              }
            }
            return note
          })
        }))
        
        // 同步到 API
        try {
          await notesApi.update(id, {
            ...updates,
            readingTime: updates.content ? calculateReadingTime(updates.content) : undefined,
          })
          return { success: true }
        } catch (error: any) {
          console.error('Failed to update note on API:', error)
          // 回滚本地更改
          if (oldNote) {
            set((state) => ({
              notes: state.notes.map((note) => note.id === id ? oldNote : note)
            }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
      },

      deleteNote: async (id) => {
        // 保存旧数据用于回滚
        const oldNote = get().notes.find((n) => n.id === id)
        
        // 先更新本地
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }))
        
        // 同步到 API
        try {
          await notesApi.delete(id)
          return { success: true }
        } catch (error: any) {
          console.error('Failed to delete note on API:', error)
          // 回滚本地更改
          if (oldNote) {
            set((state) => ({ notes: [oldNote, ...state.notes] }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
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
        const note = get().notes.find((n) => n.id === id)
        if (note) {
          get().updateNote(id, { isPinned: !note.isPinned })
        }
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
