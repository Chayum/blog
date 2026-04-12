'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface ScrollIndicatorProps {
  text?: string
  onClick?: () => void
}

export default function ScrollIndicator({ 
  text, 
  onClick 
}: ScrollIndicatorProps) {
  const handleClick = () => {
    // 平滑滚动到下一屏
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
    onClick?.()
  }

  return (
    <motion.button
      onClick={handleClick}
      className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      {text && (
        <span className="text-sm font-medium tracking-wider uppercase">
          {text}
        </span>
      )}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="relative"
      >
        <ChevronDown size={24} className="group-hover:scale-110 transition-transform" />
        {/* 光晕效果 */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full blur-md"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </motion.button>
  )
}
