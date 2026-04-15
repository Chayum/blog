'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-200 dark:from-gray-700 via-gray-100 dark:via-gray-600 to-gray-200 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
      style={{ width, height }}
    />
  )
}

export function NoteCardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex items-center gap-2 mt-auto">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function SiteGroupSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border">
            <Skeleton className="h-10 w-10 rounded-lg mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function NoteDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-10 w-2/3 mb-4" />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="h-4 w-4/5 mb-3" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}