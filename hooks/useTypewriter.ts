'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseTypewriterOptions {
  texts: string[]        // 要循环显示的文本数组
  typingSpeed?: number   // 打字速度（ms/字符），默认 100
  deletingSpeed?: number // 删除速度（ms/字符），默认 50
  pauseDuration?: number // 打完后的暂停时间（ms），默认 2000
}

interface UseTypewriterReturn {
  displayText: string    // 当前显示的文字
  showCursor: boolean    // 是否显示光标
  currentIndex: number   // 当前显示第几条
  isTyping: boolean      // 是否正在打字
  isDeleting: boolean    // 是否正在删除
}

type Phase = 'typing' | 'paused' | 'deleting' | 'waiting'

export function useTypewriter({
  texts,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [showCursor, setShowCursor] = useState(true)

  const currentText = texts[currentIndex] || ''

  // 光标闪烁效果
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530) // 标准光标闪烁速度

    return () => clearInterval(cursorInterval)
  }, [])

  // 打字机主逻辑
  useEffect(() => {
    if (texts.length === 0) return

    let timeoutId: NodeJS.Timeout

    switch (phase) {
      case 'waiting':
        // 初始等待后开始打字
        timeoutId = setTimeout(() => {
          setPhase('typing')
        }, 500)
        break

      case 'typing': {
        const targetText = currentText
        if (displayText.length < targetText.length) {
          // 继续打字
          timeoutId = setTimeout(() => {
            setDisplayText(targetText.slice(0, displayText.length + 1))
          }, typingSpeed)
        } else {
          // 打字完成，进入暂停
          setPhase('paused')
        }
        break
      }

      case 'paused':
        // 暂停后进入删除
        timeoutId = setTimeout(() => {
          setPhase('deleting')
        }, pauseDuration)
        break

      case 'deleting':
        if (displayText.length > 0) {
          // 继续删除
          timeoutId = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1))
          }, deletingSpeed)
        } else {
          // 删除完成，切换到下一条
          setCurrentIndex((prev) => (prev + 1) % texts.length)
          setPhase('waiting')
        }
        break
    }

    return () => clearTimeout(timeoutId)
  }, [texts, currentText, displayText, phase, typingSpeed, deletingSpeed, pauseDuration])

  return {
    displayText,
    showCursor,
    currentIndex,
    isTyping: phase === 'typing',
    isDeleting: phase === 'deleting'
  }
}

export default useTypewriter
