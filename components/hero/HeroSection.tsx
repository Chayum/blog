'use client'

import { motion } from 'framer-motion'
import { useSettingsStore } from '@/store/settingsStore'
import { useTypewriter } from '@/hooks/useTypewriter'
import ScrollIndicator from '@/components/ui/ScrollIndicator'

export default function HeroSection() {
  const heroBackground = useSettingsStore((state) => state.heroBackground)
  const typewriterTexts = useSettingsStore((state) => state.typewriterTexts)
  const heroSubtitle = useSettingsStore((state) => state.heroSubtitle)
  
  const { displayText, showCursor } = useTypewriter({
    texts: typewriterTexts,
    typingSpeed: 120,
    deletingSpeed: 60,
    pauseDuration: 2500
  })

  // 背景样式 - 区分图片和渐变/颜色
  const isImageBackground = heroBackground && (
    heroBackground.startsWith('data:image') || // base64 图片
    heroBackground.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) || // 图片 URL
    heroBackground.startsWith('http') // 外部图片链接
  )

  const backgroundStyle = heroBackground
    ? isImageBackground
      ? {
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      : { background: heroBackground } // 渐变或纯色
    : { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }

  return (
    <section 
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-16"
      style={backgroundStyle}
    >
      {/* 背景遮罩 - 确保文字可读 */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* 网格背景效果 */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* 发光效果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* 主要内容 */}
      <div className="relative z-10 text-center px-4">
        {/* 打字机标题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gradient tracking-tight">
            <span className="inline-block min-h-[1.2em]">
              {displayText}
            </span>
            <motion.span
              animate={{ opacity: showCursor ? 1 : 0 }}
              transition={{ duration: 0.1 }}
              className="inline-block w-[3px] h-[1em] bg-accent ml-1 align-middle"
            />
          </h1>
        </motion.div>

        {/* 副标题 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-12"
        >
          {heroSubtitle}
        </motion.p>

        {/* 快捷按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="/write"
            className="px-8 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/30"
          >
            开始写作
          </a>
          <a
            href="/notes"
            className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white/20 transition-all hover:scale-105"
          >
            浏览笔记
          </a>
        </motion.div>
      </div>

      {/* 底部下滑指示器 */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
        <ScrollIndicator />
      </div>

      {/* 底部渐变遮罩 - 平滑过渡到内容区 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  )
}
