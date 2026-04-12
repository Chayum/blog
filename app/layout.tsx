import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import ToastContainer from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'BlogPro - 个人笔记空间',
  description: '一个简洁、优雅的个人笔记博客系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileNav />
        <ToastContainer />
      </body>
    </html>
  )
}
