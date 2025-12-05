'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { Bell, AlertTriangle, Info, AlertCircle, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import { cn } from '../../lib/utils'
import { AppHeader } from '../../components/app-header'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Severity } from '../../lib/store'

export default function NotificationsPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const alerts = useStore((state) => state.alerts)
  const t = useTranslation(language)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'medium':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-500/10'
      case 'medium':
        return 'text-orange-500 bg-orange-500/10'
      case 'low':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'safe':
        return 'text-green-500 bg-green-500/10'
      default:
        return 'text-white/70 bg-white/10'
    }
  }

  const getSeverityLabel = (severity: Severity) => {
    switch (severity) {
      case 'high':
        return 'High Risk (0-24)'
      case 'medium':
        return 'Medium Risk (25-49)'
      case 'low':
        return 'Low Risk (50-79)'
      case 'safe':
        return 'Safe (80-100)'
      default:
        return severity
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }
  const isDarkMode = useStore((state) => state.isDarkMode)

  if (!mounted) return null

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
       <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-serif flex-1">{t.notifications}</h1>
            <Bell className="h-6 w-6 text-white/60" />
          </div>

          {/* Notifications */}
          {alerts.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 text-center">
              <Bell className="h-12 w-12 text-white/60 mx-auto mb-4" />
              <p className="text-white/70">No notifications yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Card
                  key={`${alert.id}-${index}`}
                  className={cn(
                    'bg-black/40 backdrop-blur-md border-white/10 p-4 cursor-pointer hover:bg-black/50 transition-colors',
                    !alert.read && 'border-l-4 border-l-primary'
                  )}
                  onClick={() => router.push(`/alerts/${alert.id}`)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
                      getSeverityColor(alert.severity)
                    )}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={cn(
                          'font-semibold text-sm',
                          !alert.read && 'text-white'
                        )}>
                          {alert.title}
                        </h3>
                        <span className="text-xs text-white/60 whitespace-nowrap">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          getSeverityColor(alert.severity)
                        )}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                        <span className="text-xs text-white/60">
                          {alert.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}