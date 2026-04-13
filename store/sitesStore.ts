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
  addGroup: (name: string, icon: string) => Promise<void>
  updateGroup: (id: string, updates: Partial<SiteGroup>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  reorderGroups: (groups: SiteGroup[]) => void
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'order'>) => Promise<void>
  updateSite: (id: string, updates: Partial<Site>) => Promise<void>
  deleteSite: (id: string) => Promise<void>
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
        
        // 尝试同步到 API
        try {
          await groupsApi.create({ name, icon })
        } catch (error) {
          console.error('Failed to create group on API:', error)
        }
      },

      updateGroup: async (id, updates) => {
        // 先更新本地
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          )
        }))
        
        // 尝试同步到 API
        try {
          await groupsApi.update(id, updates)
        } catch (error) {
          console.error('Failed to update group on API:', error)
        }
      },

      deleteGroup: async (id) => {
        // 先更新本地
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          sites: state.sites.filter((site) => site.groupId !== id)
        }))
        
        // 尝试同步到 API
        try {
          await groupsApi.delete(id)
        } catch (error) {
          console.error('Failed to delete group on API:', error)
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
        
        // 尝试同步到 API
        try {
          await sitesApi.create({
            name: newSite.name,
            url: newSite.url,
            description: newSite.description,
            groupId: newSite.groupId,
          })
        } catch (error) {
          console.error('Failed to create site on API:', error)
        }
      },

      updateSite: async (id, updates) => {
        // 先更新本地
        set((state) => ({
          sites: state.sites.map((site) =>
            site.id === id ? { ...site, ...updates } : site
          )
        }))
        
        // 尝试同步到 API
        try {
          await sitesApi.update(id, updates)
        } catch (error) {
          console.error('Failed to update site on API:', error)
        }
      },

      deleteSite: async (id) => {
        // 先更新本地
        set((state) => ({ sites: state.sites.filter((site) => site.id !== id) }))
        
        // 尝试同步到 API
        try {
          await sitesApi.delete(id)
        } catch (error) {
          console.error('Failed to delete site on API:', error)
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
