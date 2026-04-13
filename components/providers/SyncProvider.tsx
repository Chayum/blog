'use client'

import { useEffect, useState } from 'react'
import { useNotesStore } from '@/store/notesStore'
import { useSitesStore } from '@/store/sitesStore'
import { useSettingsStore } from '@/store/settingsStore'

interface SyncProviderProps {
  children: React.ReactNode
}

export default function SyncProvider({ children }: SyncProviderProps) {
  const [isSynced, setIsSynced] = useState(false)
  
  const syncNotes = useNotesStore((state) => state.syncFromApi)
  const syncSites = useSitesStore((state) => state.syncFromApi)
  const syncSettings = useSettingsStore((state) => state.syncFromApi)
  
  const notesHydrated = useNotesStore((state) => state._hasHydrated)
  const sitesHydrated = useSitesStore((state) => state._hasHydrated)
  const settingsHydrated = useSettingsStore((state) => state._hasHydrated)

  useEffect(() => {
    if (notesHydrated && sitesHydrated && settingsHydrated && !isSynced) {
      setIsSynced(true)
      Promise.all([syncNotes(), syncSites(), syncSettings()])
    }
  }, [notesHydrated, sitesHydrated, settingsHydrated, isSynced])

  return <>{children}</>
}