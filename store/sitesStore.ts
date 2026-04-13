import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { groupsApi, sitesApi } from '@/lib/api'

export interface Site {
  id: string
  name: string
  url: string
  description: string
  groupId: string
  createdAt: string
  order: number
}

export interface SiteGroup {
  id: string
  name: string
  icon: string
  order: number
}

interface SitesState {
  groups: SiteGroup[]
  sites: Site[]
  _hasHydrated: boolean
  _isSyncing: boolean
  setHasHydrated: (state: boolean) => void
  setGroups: (groups: SiteGroup[]) => void
  setSites: (sites: Site[]) => void
  addGroup: (name: string, icon: string) => Promise<{ success: boolean; error?: string }>
  updateGroup: (id: string, updates: Partial<SiteGroup>) => Promise<{ success: boolean; error?: string }>
  deleteGroup: (id: string) => Promise<{ success: boolean; error?: string }>
  reorderGroups: (groups: SiteGroup[]) => void
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'order'>) => Promise<{ success: boolean; error?: string }>
  updateSite: (id: string, updates: Partial<Site>) => Promise<{ success: boolean; error?: string }>
  deleteSite: (id: string) => Promise<{ success: boolean; error?: string }>
  getSitesByGroup: (groupId: string) => Site[]
  getAllSites: () => Site[]
  searchSites: (query: string) => Site[]
  syncFromApi: () => Promise<void>
}

export const useSitesStore = create<SitesState>()(
  persist(
    (set, get) => ({
      groups: [],
      sites: [],
      _hasHydrated: false,
      _isSyncing: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setGroups: (groups) => {
        set({ groups })
      },

      setSites: (sites) => {
        set({ sites })
      },
      
      // 从 API 同步数据
      syncFromApi: async () => {
        if (get()._isSyncing) return
        set({ _isSyncing: true })
        try {
          const [apiGroups, apiSites] = await Promise.all([
            groupsApi.getAll(),
            sitesApi.getAll(),
          ])
          
          // API 返回的 orderIndex 映射到 order
          const normalizedGroups = apiGroups.map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            order: g.orderIndex ?? g.order ?? 0,
          }))
          
          const normalizedSites = apiSites.map((s: any) => ({
            id: s.id,
            name: s.name,
            url: s.url,
            description: s.description || '',
            groupId: s.groupId || '',
            createdAt: s.createdAt,
            order: s.orderIndex ?? s.order ?? 0,
          }))
          
          set({ 
            groups: normalizedGroups.sort((a, b) => a.order - b.order),
            sites: normalizedSites.sort((a, b) => a.order - b.order)
          })
        } catch (error) {
          console.error('Failed to sync sites from API:', error)
        } finally {
          set({ _isSyncing: false })
        }
      },

      addGroup: async (name, icon) => {
        const newGroup: SiteGroup = {
          id: crypto.randomUUID(),
          name,
          icon,
          order: get().groups.length
        }
        
        // 先更新本地
        set((state) => ({ groups: [...state.groups, newGroup] }))
        
        // 同步到 API
        try {
          await groupsApi.create({ name, icon })
          return { success: true }
        } catch (error: any) {
          console.error('Failed to create group on API:', error)
          // 回滚
          set((state) => ({ groups: state.groups.filter((g) => g.id !== newGroup.id) }))
          return { success: false, error: error.message || '同步失败' }
        }
      },

      updateGroup: async (id, updates) => {
        // 保存旧数据用于回滚
        const oldGroup = get().groups.find((g) => g.id === id)
        
        // 先更新本地
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          )
        }))
        
        // 同步到 API
        try {
          await groupsApi.update(id, updates)
          return { success: true }
        } catch (error: any) {
          console.error('Failed to update group on API:', error)
          // 回滚
          if (oldGroup) {
            set((state) => ({
              groups: state.groups.map((g) => g.id === id ? oldGroup : g)
            }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
      },

      deleteGroup: async (id) => {
        // 保存旧数据用于回滚
        const oldGroup = get().groups.find((g) => g.id === id)
        const oldSites = get().sites.filter((s) => s.groupId === id)
        
        // 先更新本地
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          sites: state.sites.filter((site) => site.groupId !== id)
        }))
        
        // 同步到 API
        try {
          await groupsApi.delete(id)
          return { success: true }
        } catch (error: any) {
          console.error('Failed to delete group on API:', error)
          // 回滚
          if (oldGroup) {
            set((state) => ({ groups: [oldGroup, ...state.groups] }))
          }
          if (oldSites.length > 0) {
            set((state) => ({ sites: [...oldSites, ...state.sites] }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
      },

      reorderGroups: (groups) => {
        set({ groups })
      },

      addSite: async (siteData) => {
        const groupSites = get().sites.filter((s) => s.groupId === siteData.groupId)
        const newSite: Site = {
          ...siteData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          order: groupSites.length
        }
        
        // 先更新本地
        set((state) => ({ sites: [...state.sites, newSite] }))
        
        // 同步到 API
        try {
          await sitesApi.create({
            name: newSite.name,
            url: newSite.url,
            description: newSite.description,
            groupId: newSite.groupId,
          })
          return { success: true }
        } catch (error: any) {
          console.error('Failed to create site on API:', error)
          // 回滚
          set((state) => ({ sites: state.sites.filter((s) => s.id !== newSite.id) }))
          return { success: false, error: error.message || '同步失败' }
        }
      },

      updateSite: async (id, updates) => {
        // 保存旧数据用于回滚
        const oldSite = get().sites.find((s) => s.id === id)
        
        // 先更新本地
        set((state) => ({
          sites: state.sites.map((site) =>
            site.id === id ? { ...site, ...updates } : site
          )
        }))
        
        // 同步到 API
        try {
          await sitesApi.update(id, updates)
          return { success: true }
        } catch (error: any) {
          console.error('Failed to update site on API:', error)
          // 回滚
          if (oldSite) {
            set((state) => ({
              sites: state.sites.map((s) => s.id === id ? oldSite : s)
            }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
      },

      deleteSite: async (id) => {
        // 保存旧数据用于回滚
        const oldSite = get().sites.find((s) => s.id === id)
        
        // 先更新本地
        set((state) => ({ sites: state.sites.filter((site) => site.id !== id) }))
        
        // 同步到 API
        try {
          await sitesApi.delete(id)
          return { success: true }
        } catch (error: any) {
          console.error('Failed to delete site on API:', error)
          // 回滚
          if (oldSite) {
            set((state) => ({ sites: [oldSite, ...state.sites] }))
          }
          return { success: false, error: error.message || '同步失败' }
        }
      },

      getSitesByGroup: (groupId) => {
        return get()
          .sites.filter((site) => site.groupId === groupId)
          .sort((a, b) => a.order - b.order)
      },

      getAllSites: () => {
        return get().sites.sort((a, b) => a.order - b.order)
      },

      searchSites: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().sites.filter(
          (site) =>
            site.name.toLowerCase().includes(lowerQuery) ||
            site.description.toLowerCase().includes(lowerQuery)
        )
      }
    }),
    {
      name: 'blogpro-sites',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 groups 和 sites，不持久化 _hasHydrated
      partialize: (state) => ({ groups: state.groups, sites: state.sites }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
