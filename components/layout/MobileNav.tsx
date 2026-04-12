'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BookOpen, PenLine, Globe, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/notes', label: '笔记', icon: BookOpen },
  { href: '/write', label: '写', icon: PenLine },
  { href: '/sites', label: '导航', icon: Globe },
  { href: '/settings', label: '设置', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          
          // 写笔记按钮特殊样式
          if (item.href === '/write') {
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white -mt-4 shadow-lg shadow-accent/30"
                >
                  <Icon size={22} />
                </motion.div>
              </Link>
            )
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[56px]',
                  isActive
                    ? 'text-accent'
                    : 'text-foreground-secondary'
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute bottom-1 w-8 h-1 rounded-full bg-accent"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
