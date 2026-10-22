import React, { useEffect, useRef } from 'react'
import { useThemeStore } from '../store/useThemeStore'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  rotation: number
  rotSpeed: number
  type?: string
  wobble: number
  wobbleSpeed: number
}

export const ThemeEffects: React.FC = () => {
  const activeTheme = useThemeStore((s) => s.getActiveTheme())
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Generate theme-specific particles
    const particleCount = activeTheme.id === 'christmas' ? 80 : activeTheme.id === 'valentine' ? 45 : 60
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: activeTheme.id === 'christmas' ? Math.random() * 4 + 1.5 : activeTheme.id === 'valentine' ? Math.random() * 8 + 4 : Math.random() * 2 + 0.8,
        speedY: activeTheme.id === 'christmas' ? Math.random() * 1.8 + 0.8 : activeTheme.id === 'valentine' ? Math.random() * 1.2 + 0.5 : Math.random() * 0.4 + 0.1,
        speedX: activeTheme.id === 'christmas' ? Math.sin(Math.random() * Math.PI) * 1.2 - 0.6 : activeTheme.id === 'valentine' ? Math.cos(Math.random() * Math.PI) * 0.8 + 0.3 : (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
      })
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      if (activeTheme.id === 'christmas') {
        // === WINTER SNOW & FROST PARTICLES ===
        particles.forEach((p) => {
          p.y += p.speedY
          p.wobble += p.wobbleSpeed
          p.x += Math.sin(p.wobble) * 1.2 + p.speedX

          if (p.y > height) {
            p.y = -10
            p.x = Math.random() * width
          }
          if (p.x > width) p.x = 0
          if (p.x < 0) p.x = width

          ctx.save()
          ctx.translate(p.x, p.y)

          // Glowing snowflake / crystal
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`)
          gradient.addColorStop(0.5, `rgba(224, 242, 254, ${p.opacity * 0.8})`)
          gradient.addColorStop(1, 'rgba(186, 230, 253, 0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
          ctx.fill()

          // Draw distinct 6-arm snowflake for larger particles
          if (p.size > 3.2) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`
            ctx.lineWidth = 1
            ctx.rotate((p.rotation * Math.PI) / 180)
            p.rotation += p.rotSpeed

            for (let arm = 0; arm < 6; arm++) {
              ctx.rotate(Math.PI / 3)
              ctx.beginPath()
              ctx.moveTo(0, 0)
              ctx.lineTo(0, p.size * 2.2)
              ctx.moveTo(0, p.size * 1.2)
              ctx.lineTo(p.size * 0.6, p.size * 1.6)
              ctx.moveTo(0, p.size * 1.2)
              ctx.lineTo(-p.size * 0.6, p.size * 1.6)
              ctx.stroke()
            }
          }

          ctx.restore()
        })
      } else if (activeTheme.id === 'valentine') {
        // === SAKURA PETALS & GLOWING HEARTS ===
        particles.forEach((p) => {
          p.y += p.speedY
          p.wobble += p.wobbleSpeed
          p.x += Math.cos(p.wobble) * 1.5 + p.speedX
          p.rotation += p.rotSpeed

          if (p.y > height) {
            p.y = -20
            p.x = Math.random() * width
          }
          if (p.x > width) p.x = 0
          if (p.x < 0) p.x = width

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)

          // Draw Sakura Petal / Heart shape
          ctx.fillStyle = `rgba(244, 114, 182, ${p.opacity * 0.7})`
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, Math.PI / 4, 0, Math.PI * 2)
          ctx.fill()

          // Petal inner vein glow
          ctx.strokeStyle = `rgba(251, 207, 232, ${p.opacity})`
          ctx.lineWidth = 0.8
          ctx.stroke()

          ctx.restore()
        })
      } else {
        // === COSMIC STARDUST & NEBULA PARTICLES ===
        particles.forEach((p) => {
          p.y -= p.speedY
          p.x += p.speedX

          if (p.y < 0) {
            p.y = height + 10
            p.x = Math.random() * width
          }
          if (p.x > width) p.x = 0
          if (p.x < 0) p.x = width

          ctx.save()
          ctx.translate(p.x, p.y)

          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3)
          grad.addColorStop(0, `rgba(167, 139, 250, ${p.opacity})`)
          grad.addColorStop(0.6, `rgba(124, 109, 240, ${p.opacity * 0.4})`)
          grad.addColorStop(1, 'rgba(124, 109, 240, 0)')

          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2)
          ctx.fill()

          ctx.restore()
        })
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [activeTheme.id])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Background Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Theme specific ambient overlays */}
      {activeTheme.id === 'christmas' && (
        <>
          {/* Frosted vignette & Winter Aurora Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-sky-400/10 via-red-500/5 to-transparent" />
          <div className="absolute -top-10 -right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl" />
          {/* Icicle top edge trim decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
        </>
      )}

      {activeTheme.id === 'valentine' && (
        <>
          {/* Romantic Pink & Magenta Glow */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-pink-500/15 via-rose-500/5 to-transparent" />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 shadow-[0_0_12px_rgba(244,114,182,0.8)]" />
        </>
      )}

      {activeTheme.id === 'default' && (
        <>
          {/* Interstellar Cosmic Nebula */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-purple-700/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_10px_rgba(124,109,240,0.6)]" />
        </>
      )}
    </div>
  )
}
