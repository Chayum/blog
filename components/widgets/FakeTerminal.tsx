'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Command {
  input: string
  output: string
  isError?: boolean
}

const FORTUNES = [
  '今天是个写代码的好日子！',
  '保持专注，你离目标越来越近了。',
  '休息一下，灵感会来的。',
  '代码如诗，bug 如画。',
  '每一个 bug 都是成长的机会。',
  '相信过程，享受旅程。',
  '今晚的月色真美。',
  '喝水！保护颈椎！',
  '记得保存！记得提交！',
  '你比昨天更优秀了。'
]

export default function FakeTerminal() {
  const [commands, setCommands] = useState<Command[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [commands])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const parts = trimmed.split(' ')
    const command = parts[0]
    const args = parts.slice(1)

    let output = ''
    let isError = false

    switch (command) {
      case 'help':
        output = `可用命令:
  help       - 显示帮助
  clear      - 清屏
  date       - 显示当前时间
  echo       - 回显文字
  fortune    - 随机名言
  matrix     - 开启矩阵雨效果
  whoami     - 显示用户信息
  neofetch   - 系统信息
  weather    - 显示天气（伪）
  joke       - 讲个笑话
  calc       - 简单计算
  exit       - 关闭终端`
        break

      case 'clear':
        setCommands([])
        return

      case 'date':
        output = new Date().toLocaleString('zh-CN')
        break

      case 'echo':
        output = args.join(' ') || '(空)'
        break

      case 'fortune':
        output = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
        break

      case 'matrix':
        output = '矩阵雨效果已开启！（假装有效果）'
        // 这里可以触发一个全屏矩阵雨效果
        break

      case 'whoami':
        output = 'cyber_blogger'
        break

      case 'neofetch':
        output = `
    ___      __    __    _           
   / _ )___ / /__ / /__ (_)__  ___ _ 
  / _  / -_) / -_)  '_// / _ \\/ _ \\
 /____/\\__/_/\\__/_/\\_/_/_//_/\\_, / 
                              /___/  

  操作系统: BlogPro OS v1.0
  内核版本: Next.js 14
  运行时间: ${Math.floor(Math.random() * 24)}小时
  主题: 赛博朋克
  心情: 非常好 ✨`
        break

      case 'weather':
        const weathers = ['☀️ 晴朗 25°C', '⛅ 多云 22°C', '🌧️ 小雨 18°C', '⚡ 雷阵雨 20°C']
        output = `当前天气: ${weathers[Math.floor(Math.random() * weathers.length)]}`
        break

      case 'joke':
        const jokes = [
          '为什么程序员总是分不清圣诞节和万圣节？因为 Oct 31 = Dec 25',
          '程序员最讨厌的四件事：1. 写注释 2. 写文档 3. 别人不写注释 4. 别人不写文档',
          '一个程序员走进酒吧，举起两根手指说："来一杯啤酒。"',
          '为什么程序员总是把万圣节和圣诞节搞混？因为 Oct 31 == Dec 25'
        ]
        output = jokes[Math.floor(Math.random() * jokes.length)]
        break

      case 'calc':
        try {
          const expression = args.join(' ')
          // 安全计算，只允许基本运算
          if (!/^[\d\+\-\*\/\(\)\.\s]+$/.test(expression)) {
            output = '表达式包含非法字符'
            isError = true
          } else {
            // eslint-disable-next-line no-eval
            const result = eval(expression)
            output = `${expression} = ${result}`
          }
        } catch {
          output = '计算错误，请检查表达式'
          isError = true
        }
        break

      case 'exit':
        output = '再见！👋'
        break

      case '':
        return

      default:
        output = `命令未找到: ${command}\n输入 'help' 查看可用命令`
        isError = true
    }

    setCommands(prev => [...prev, { input: cmd, output, isError }])
    setHistory(prev => [...prev, cmd])
    setHistoryIndex(-1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    executeCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 
          ? history.length - 1 
          : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-[280px]">
      {/* 终端输出区域 */}
      <div
        ref={scrollRef}
        className="flex-1 bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto scrollbar-thin"
        onClick={() => inputRef.current?.focus()}
      >
        {/* 欢迎信息 */}
        {commands.length === 0 && (
          <div className="text-green-400 mb-4">
            <p>Welcome to BlogPro Terminal v1.0</p>
            <p className="text-green-600">Type 'help' for available commands</p>
          </div>
        )}

        {/* 命令历史 */}
        <AnimatePresence>
          {commands.map((cmd, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-2"
            >
              <div className="flex items-center text-green-400">
                <span className="mr-2">$</span>
                <span className="text-white">{cmd.input}</span>
              </div>
              <div className={`pl-4 whitespace-pre-wrap ${cmd.isError ? 'text-red-400' : 'text-green-300'}`}>
                {cmd.output}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 输入行 */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none font-mono text-xs"
            placeholder="输入命令..."
            spellCheck={false}
            autoComplete="off"
          />
          <span className="w-2 h-4 bg-green-400 animate-pulse ml-1" />
        </form>
      </div>

      {/* 快捷按钮 */}
      <div className="flex flex-wrap gap-1 mt-2">
        {['help', 'clear', 'fortune', 'neofetch'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setInput(cmd)
              executeCommand(cmd)
            }}
            className="px-2 py-1 text-[10px] bg-background-secondary hover:bg-border rounded text-foreground-secondary transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  )
}
