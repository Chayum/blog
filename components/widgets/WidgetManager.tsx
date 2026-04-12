'use client'

import { useState } from 'react'
import { useSettingsStore, WidgetType } from '@/store/settingsStore'
import WidgetContainer from './WidgetContainer'
import WidgetSwitcher from './WidgetSwitcher'
import DigitalPet from './DigitalPet'
import ParticleTrail from './ParticleTrail'
import FakeTerminal from './FakeTerminal'
import BrickBreaker from './games/BrickBreaker'

// 组件映射
const WIDGET_COMPONENTS: Record<WidgetType, () => JSX.Element | null> = {
  pet: DigitalPet,
  particles: ParticleTrail,
  game: BrickBreaker,
  terminal: FakeTerminal,
  none: () => null
}

export default function WidgetManager() {
  const [showLeftSwitcher, setShowLeftSwitcher] = useState(false)
  
  const leftWidget = useSettingsStore((state) => state.leftWidget)
  const setLeftWidget = useSettingsStore((state) => state.setLeftWidget)

  const handleLeftTypeChange = (type: WidgetType) => {
    setLeftWidget({ type })
  }

  const LeftComponent = WIDGET_COMPONENTS[leftWidget.type]

  return (
    <>
      {/* 左侧组件 */}
      {leftWidget.type !== 'none' && (
        <WidgetContainer
          config={leftWidget}
          onUpdate={setLeftWidget}
          title="左侧组件"
          defaultPosition="left"
        >
          {showLeftSwitcher ? (
            <WidgetSwitcher
              currentType={leftWidget.type}
              onSelect={handleLeftTypeChange}
              onClose={() => setShowLeftSwitcher(false)}
            />
          ) : (
            <div className="relative">
              <LeftComponent />
              <button
                onClick={() => setShowLeftSwitcher(true)}
                className="absolute -top-1 -right-1 p-1 rounded bg-background-secondary hover:bg-border transition-colors"
                title="切换组件"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          )}
        </WidgetContainer>
      )}

      {/* 左侧关闭时的按钮 */}
      {leftWidget.type === 'none' && (
        <button
          onClick={() => setShowLeftSwitcher(true)}
          className="fixed left-4 top-24 z-40 w-10 h-10 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      )}

      {/* 左侧切换器（浮动） */}
      {showLeftSwitcher && leftWidget.type === 'none' && (
        <div className="fixed left-4 top-36 z-50">
          <WidgetSwitcher
            currentType={leftWidget.type}
            onSelect={handleLeftTypeChange}
            onClose={() => setShowLeftSwitcher(false)}
          />
        </div>
      )}
    </>
  )
}
