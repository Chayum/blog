'use client'

import { useSettingsStore } from '@/store/settingsStore'

export default function Footer() {
  const siteName = useSettingsStore((state) => state.siteName)
  
  return (
    <footer className="py-6 text-center text-sm text-foreground-secondary">
      <p>© {new Date().getFullYear()} {siteName} · 2024 建立</p>
    </footer>
  )
}