'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon, Monitor, PenLine, BookOpen, Globe, Settings } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import clsx from 'clsx'

const navItems = [
  { href: '/', label: '首页', icon: BookOpen },
  { href: '/notes', label: '笔记', icon: BookOpen },
  { href: '/write', label: '写笔记', icon: PenLine },
  { href: '/sites', label: '导航', icon: Globe },
  { href: '/settings', label: '设置', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, _hasHydrated } = useSettingsStore()

  // 确保客户端渲染完成
  useEffect(() => {
    setMounted(true)
  }, [])

  // 判断是否在首页
  const isHome = pathname === '/'

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      // 首页时，滚动超过100vh的80%显示背景，其他页面滚动50px显示
      const threshold = isHome ? window.innerHeight * 0.8 : 50
      setScrolled(window.scrollY > threshold)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  // 关闭移动端菜单
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // 获取主题图标
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun
      case 'dark': return Moon
      default: return Monitor
    }
  }
  const ThemeIcon = getThemeIcon()

  // 如果还没挂载，返回简化版导航避免闪烁
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16" />
        </nav>
      </header>
    )
  }

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          // 首页未滚动时透明，其他页面或滚动后显示背景
          scrolled || !isHome
            ? 'glass border-b border-border/50 shadow-sm backdrop-blur-xl bg-background/80'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors',
                  scrolled || !isHome
                    ? 'bg-gradient-to-br from-accent to-purple-500 text-white'
                    : 'bg-white/20 text-white backdrop-blur-sm'
                )}
              >
                B
              </motion.div>
              <span 
                className={clsx(
                  'font-bold text-lg hidden sm:block transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white'
                )}
              >
                BlogPro
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={clsx(
                        'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : scrolled || !isHome
                            ? 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                  setTheme(nextTheme)
                }}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  scrolled || !isHome
                    ? 'hover:bg-background-secondary text-foreground-secondary'
                    : 'hover:bg-white/10 text-white/80'
                )}
                title={`当前: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}
              >
                <ThemeIcon size={20} />
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={clsx(
                  'md:hidden p-2 rounded-lg transition-colors',
                  scrolled || !isHome
                    ? 'hover:bg-background-secondary'
                    : 'hover:bg-white/10 text-white'
                )}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 glass border-b border-border bg-background/95 backdrop-blur-xl"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={clsx(
                        'px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer - 只在非首页显示，因为首页有全屏hero */}
      {!isHome && <div className="h-16" />}
    </>
  )
}
