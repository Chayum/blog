'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type PetState = 'idle' | 'blink' | 'sleep' | 'happy' | 'follow'

const MESSAGES = [
  '你好呀！👋',
  '今天也要加油哦！💪',
  '想写点什么吗？✍️',
  '我是一只赛博猫咪！🐱',
  '代码写得怎么样？💻',
  '记得休息一下～☕',
  '我在看着你哦！👀',
  '喵～🐾',
  '外面的世界很精彩！🌍',
  '保持好奇心！✨'
]

export default function DigitalPet() {
  const [state, setState] = useState<PetState>('idle')
  const [message, setMessage] = useState('')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const petRef = useRef<HTMLDivElement>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout>()

  // 自动切换状态
  useEffect(() => {
    const stateInterval = setInterval(() => {
      setState(prev => {
        if (prev === 'sleep') return Math.random() > 0.3 ? 'idle' : 'sleep'
        if (prev === 'idle') {
          const rand = Math.random()
          if (rand < 0.2) return 'blink'
          if (rand < 0.4) return 'sleep'
          return 'idle'
        }
        return 'idle'
      })
    }, 3000)

    return () => clearInterval(stateInterval)
  }, [])

  // 追踪鼠标位置
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 计算眼睛跟随
  useEffect(() => {
    if (!petRef.current || state === 'sleep') return

    const rect = petRef.current.getBoundingClientRect()
    const petCenterX = rect.left + rect.width / 2
    const petCenterY = rect.top + rect.height / 2

    const angle = Math.atan2(mousePos.y - petCenterY, mousePos.x - petCenterX)
    const distance = Math.min(3, Math.hypot(mousePos.x - petCenterX, mousePos.y - petCenterY) / 50)

    setEyeOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    })
  }, [mousePos, state])

  // 点击互动
  const handleClick = () => {
    setState('happy')
    const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    setMessage(randomMessage)

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }

    messageTimeoutRef.current = setTimeout(() => {
      setMessage('')
      setState('idle')
    }, 3000)
  }

  return (
    <div className="flex flex-col items-center">
      {/* 消息气泡 */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="mb-3 px-3 py-2 bg-accent/10 rounded-lg text-xs text-center text-foreground"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 宠物 SVG */}
      <motion.div
        ref={petRef}
        onClick={handleClick}
        className="cursor-pointer select-none"
        animate={{
          scale: state === 'happy' ? 1.1 : 1,
          rotate: state === 'happy' ? [0, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="120" height="100" viewBox="0 0 120 100">
          {/* 耳朵 */}
          <motion.path
            d="M30 35 L25 10 L50 30 Z"
            fill="#818CF8"
            stroke="#6366F1"
            strokeWidth="2"
            animate={{ rotate: state === 'happy' ? -5 : 0 }}
            style={{ transformOrigin: '30px 35px' }}
          />
          <motion.path
            d="M90 35 L95 10 L70 30 Z"
            fill="#818CF8"
            stroke="#6366F1"
            strokeWidth="2"
            animate={{ rotate: state === 'happy' ? 5 : 0 }}
            style={{ transformOrigin: '90px 35px' }}
          />

          {/* 身体 */}
          <ellipse cx="60" cy="60" rx="45" ry="35" fill="#818CF8" stroke="#6366F1" strokeWidth="2" />

          {/* 眼睛 - 左眼 */}
          <g>
            {/* 眼白 */}
            <circle cx="45" cy="55" r="12" fill="#FFF" stroke="#333" strokeWidth="2" />
            {/* 瞳孔 */}
            <motion.circle
              cx={45 + eyeOffset.x}
              cy={55 + eyeOffset.y}
              r="6"
              fill="#333"
              animate={{
                scaleY: state === 'blink' ? 0.1 : state === 'sleep' ? 0.1 : 1,
                cy: state === 'sleep' ? 59 : 55 + eyeOffset.y
              }}
              transition={{ duration: 0.1 }}
            />
            {/* 高光 */}
            <circle
              cx={47 + eyeOffset.x}
              cy={53 + eyeOffset.y}
              r="2"
              fill="#FFF"
              opacity="0.6"
            />
          </g>

          {/* 眼睛 - 右眼 */}
          <g>
            {/* 眼白 */}
            <circle cx="75" cy="55" r="12" fill="#FFF" stroke="#333" strokeWidth="2" />
            {/* 瞳孔 */}
            <motion.circle
              cx={75 + eyeOffset.x}
              cy={55 + eyeOffset.y}
              r="6"
              fill="#333"
              animate={{
                scaleY: state === 'blink' ? 0.1 : state === 'sleep' ? 0.1 : 1,
                cy: state === 'sleep' ? 59 : 55 + eyeOffset.y
              }}
              transition={{ duration: 0.1 }}
            />
            {/* 高光 */}
            <circle
              cx={77 + eyeOffset.x}
              cy={53 + eyeOffset.y}
              r="2"
              fill="#FFF"
              opacity="0.6"
            />
          </g>

          {/* 鼻子 */}
          <motion.path
            d="M56 68 L64 68 L60 74 Z"
            fill="#F472B6"
            animate={{ scale: state === 'happy' ? 1.2 : 1 }}
            style={{ transformOrigin: '60px 70px' }}
          />

          {/* 嘴巴 */}
          <motion.path
            d={state === 'happy' ? 'M50 75 Q60 85 70 75' : 'M55 75 Q60 78 65 75'}
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ d: state === 'happy' ? 'M50 75 Q60 85 70 75' : 'M55 75 Q60 78 65 75' }}
          />

          {/* 胡须 */}
          <g stroke="#333" strokeWidth="1" opacity="0.5">
            <line x1="25" y1="65" x2="40" y2="68" />
            <line x1="25" y1="70" x2="40" y2="70" />
            <line x1="95" y1="65" x2="80" y2="68" />
            <line x1="95" y1="70" x2="80" y2="70" />
          </g>

          {/* 腮红 */}
          <ellipse cx="35" cy="65" rx="6" ry="4" fill="#F472B6" opacity="0.3" />
          <ellipse cx="85" cy="65" rx="6" ry="4" fill="#F472B6" opacity="0.3" />

          {/* 睡眠气泡 */}
          {state === 'sleep' && (
            <motion.g
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -20, x: 10 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <text x="90" y="30" fontSize="14" fill="#6366F1">Zzz</text>
            </motion.g>
          )}
        </svg>
      </motion.div>

      {/* 状态提示 */}
      <div className="mt-2 text-xs text-foreground-secondary text-center">
        {state === 'sleep' && '💤 睡觉中...'}
        {state === 'idle' && '✨ 发呆中...'}
        {state === 'happy' && '😊 很开心！'}
        {state === 'follow' && '👀 看着你...'}
      </div>

      {/* 互动提示 */}
      <div className="mt-1 text-[10px] text-foreground-secondary/60">
        点击我互动
      </div>
    </div>
  )
}
