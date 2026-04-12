'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameState {
  isPlaying: boolean
  score: number
  lives: number
  level: number
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

interface Brick {
  x: number
  y: number
  width: number
  height: number
  color: string
  destroyed: boolean
}

const BRICK_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6']
const GAME_WIDTH = 200
const GAME_HEIGHT = 280
const PADDLE_WIDTH = 60
const PADDLE_HEIGHT = 8
const BALL_RADIUS = 4
const BRICK_WIDTH = 36
const BRICK_HEIGHT = 12

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    lives: 3,
    level: 1
  })
  
  const [highScore, setHighScore] = useState(0)
  const [showGameOver, setShowGameOver] = useState(false)
  
  const ballRef = useRef<Ball>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 40,
    dx: 2,
    dy: -2,
    radius: BALL_RADIUS
  })
  
  const paddleRef = useRef<Paddle>({
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: GAME_HEIGHT - 20,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  })
  
  const bricksRef = useRef<Brick[]>([])

  // 初始化砖块
  const initBricks = useCallback((level: number = 1) => {
    const rows = 3 + level
    const cols = 5
    const padding = 4
    const offsetX = (GAME_WIDTH - (cols * (BRICK_WIDTH + padding))) / 2
    const offsetY = 30
    
    bricksRef.current = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricksRef.current.push({
          x: offsetX + c * (BRICK_WIDTH + padding),
          y: offsetY + r * (BRICK_HEIGHT + padding),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
          destroyed: false
        })
      }
    }
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true
      if (e.key === 'ArrowRight') keysRef.current.right = true
      if (e.key === ' ' && !gameState.isPlaying && !showGameOver) {
        startGame()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false
      if (e.key === 'ArrowRight') keysRef.current.right = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState.isPlaying, showGameOver])

  // 游戏主循环
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#09090B'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 移动挡板
    if (keysRef.current.left && paddleRef.current.x > 0) {
      paddleRef.current.x -= 5
    }
    if (keysRef.current.right && paddleRef.current.x < GAME_WIDTH - PADDLE_WIDTH) {
      paddleRef.current.x += 5
    }

    // 移动球
    ballRef.current.x += ballRef.current.dx
    ballRef.current.y += ballRef.current.dy

    // 碰撞检测 - 墙壁
    if (ballRef.current.x + ballRef.current.radius > GAME_WIDTH || ballRef.current.x - ballRef.current.radius < 0) {
      ballRef.current.dx = -ballRef.current.dx
    }
    if (ballRef.current.y - ballRef.current.radius < 0) {
      ballRef.current.dy = -ballRef.current.dy
    }

    // 碰撞检测 - 挡板
    const ball = ballRef.current
    const paddle = paddleRef.current
    if (
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      ball.dy = -Math.abs(ball.dy)
      // 根据击中位置调整角度
      const hitPoint = (ball.x - paddle.x) / paddle.width
      ball.dx = (hitPoint - 0.5) * 4
    }

    // 碰撞检测 - 砖块
    let destroyedCount = 0
    bricksRef.current.forEach(brick => {
      if (!brick.destroyed) {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          brick.destroyed = true
          ball.dy = -ball.dy
          setGameState(prev => ({ ...prev, score: prev.score + 10 }))
        }
        destroyedCount++
      }
    })

    // 过关检测
    if (destroyedCount === 0) {
      setGameState(prev => ({
        ...prev,
        level: prev.level + 1,
        isPlaying: false
      }))
      ballRef.current = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 40,
        dx: 2 + gameState.level * 0.5,
        dy: -(2 + gameState.level * 0.5),
        radius: BALL_RADIUS
      }
      initBricks(gameState.level + 1)
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: true }))
      }, 1000)
      return
    }

    // 掉落检测
    if (ball.y > GAME_HEIGHT) {
      setGameState(prev => {
        const newLives = prev.lives - 1
        if (newLives <= 0) {
          setShowGameOver(true)
          return { ...prev, lives: 0, isPlaying: false }
        }
        return { ...prev, lives: newLives, isPlaying: false }
      })
      
      if (gameState.lives > 1) {
        ballRef.current = {
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT - 40,
          dx: 2,
          dy: -2,
          radius: BALL_RADIUS
        }
        setTimeout(() => {
          setGameState(prev => ({ ...prev, isPlaying: true }))
        }, 1000)
      }
      return
    }

    // 绘制挡板
    ctx.fillStyle = '#6366F1'
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)

    // 绘制球
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#FFF'
    ctx.fill()
    ctx.closePath()

    // 绘制砖块
    bricksRef.current.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        ctx.strokeStyle = '#000'
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      }
    })

    // 绘制边框
    ctx.strokeStyle = '#27272A'
    ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.level, gameState.lives, initBricks])

  // 开始游戏
  const startGame = () => {
    setGameState({
      isPlaying: true,
      score: 0,
      lives: 3,
      level: 1
    })
    setShowGameOver(false)
    
    ballRef.current = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 40,
      dx: 2,
      dy: -2,
      radius: BALL_RADIUS
    }
    
    paddleRef.current = {
      x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: GAME_HEIGHT - 20,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    }
    
    initBricks(1)
  }

  // 暂停/继续
  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  // 游戏循环控制
  useEffect(() => {
    if (gameState.isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.isPlaying, gameLoop])

  // 更新最高分
  useEffect(() => {
    if (gameState.score > highScore) {
      setHighScore(gameState.score)
    }
  }, [gameState.score, highScore])

  return (
    <div className="flex flex-col items-center">
      {/* 游戏信息 */}
      <div className="flex items-center justify-between w-full mb-2 text-xs text-foreground-secondary">
        <span>分数: {gameState.score}</span>
        <span>最高分: {highScore}</span>
      </div>
      <div className="flex items-center justify-between w-full mb-2 text-xs text-foreground-secondary">
        <span>生命: {'❤️'.repeat(gameState.lives)}</span>
        <span>关卡: {gameState.level}</span>
      </div>

      {/* 游戏画布 */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="rounded-lg border border-border"
        />
        
        {/* 开始/暂停遮罩 */}
        <AnimatePresence>
          {!gameState.isPlaying && !showGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg"
            >
              <p className="text-white text-sm mb-2">
                {gameState.score === 0 ? '准备好开始了吗？' : '已暂停'}
              </p>
              <button
                onClick={gameState.score === 0 ? startGame : togglePause}
                className="px-4 py-2 bg-accent text-white text-xs rounded-lg hover:bg-accent/90"
              >
                {gameState.score === 0 ? '开始游戏' : '继续'}
              </button>
              <p className="text-white/60 text-[10px] mt-2">
                使用 ← → 移动挡板
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 游戏结束遮罩 */}
        <AnimatePresence>
          {showGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg"
            >
              <p className="text-red-400 text-lg font-bold mb-1">游戏结束</p>
              <p className="text-white text-sm mb-3">最终得分: {gameState.score}</p>
              <button
                onClick={startGame}
                className="px-4 py-2 bg-accent text-white text-xs rounded-lg hover:bg-accent/90"
              >
                再来一局
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={togglePause}
          disabled={!gameState.isPlaying && gameState.lives <= 0}
          className="px-3 py-1.5 bg-background-secondary text-foreground-secondary text-xs rounded-lg hover:bg-border disabled:opacity-50"
        >
          {gameState.isPlaying ? '暂停' : '继续'}
        </button>
        <button
          onClick={startGame}
          className="px-3 py-1.5 bg-accent text-white text-xs rounded-lg hover:bg-accent/90"
        >
          重新开始
        </button>
      </div>
    </div>
  )
}
