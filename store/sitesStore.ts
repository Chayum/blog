import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  setHasHydrated: (state: boolean) => void
  addGroup: (name: string, icon: string) => void
  updateGroup: (id: string, updates: Partial<SiteGroup>) => void
  deleteGroup: (id: string) => void
  reorderGroups: (groups: SiteGroup[]) => void
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'order'>) => void
  updateSite: (id: string, updates: Partial<Site>) => void
  deleteSite: (id: string) => void
  getSitesByGroup: (groupId: string) => Site[]
  getAllSites: () => Site[]
  searchSites: (query: string) => Site[]
}

export const useSitesStore = create<SitesState>()(
  persist(
    (set, get) => ({
      groups: [],
      sites: [],
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      addGroup: (name, icon) => {
        const newGroup: SiteGroup = {
          id: crypto.randomUUID(),
          name,
          icon,
          order: get().groups.length
        }
        set((state) => ({ groups: [...state.groups, newGroup] }))
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          )
        }))
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          sites: state.sites.filter((site) => site.groupId !== id)
        }))
      },

      reorderGroups: (groups) => {
        set({ groups })
      },

      addSite: (siteData) => {
        const groupSites = get().sites.filter((s) => s.groupId === siteData.groupId)
        const newSite: Site = {
          ...siteData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          order: groupSites.length
        }
        set((state) => ({ sites: [...state.sites, newSite] }))
      },

      updateSite: (id, updates) => {
        set((state) => ({
          sites: state.sites.map((site) =>
            site.id === id ? { ...site, ...updates } : site
          )
        }))
      },

      deleteSite: (id) => {
        set((state) => ({ sites: state.sites.filter((site) => site.id !== id) }))
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
