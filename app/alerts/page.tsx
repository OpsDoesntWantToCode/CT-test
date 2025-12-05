'use client'

import { useState } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { BottomNav } from '../../components/bottom-nav'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import type { Severity } from '../../lib/store'
import { AppHeader } from '../../components/app-header'
import Image from 'next/image'

type FilterType = 'nearMe' | 'national' | 'all'

export default function AlertsPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const alerts = useStore((state) => state.alerts)
  const t = useTranslation(language)
  const [filter, setFilter] = useState<FilterType>('all')
  
  const severityColors: Record<Severity, string> = {
    high: 'bg-red-500 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-yellow-500 text-white',
    safe: 'bg-green-500 text-white',
  }
  
  const getSeverityLabel = (severity: Severity) => {
    switch (severity) {
      case 'high': return 'High Risk (0-24)'
      case 'medium': return 'Medium Risk (25-49)'
      case 'low': return 'Low Risk (50-79)'
      case 'safe': return 'Safe (80-100)'
      default: return severity
    }
  }
  
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'nearMe') {
      return alert.location.includes('Hanoi') || alert.location.includes('Ha Long')
    }
    if (filter === 'national') {
      return alert.category !== 'advisory'
    }
    return true
  })
  
  const unreadCount = filteredAlerts.filter(a => !a.read).length
  const isDarkMode = useStore((state) => state.isDarkMode)
  
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />
        
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Header - THÊM NÚT QUAY LẠI */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-serif mb-1">{t.alertHub}</h1>
              <p className="text-sm text-white/70">{unreadCount} {t.unreadAlerts}</p>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={filter === 'nearMe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('nearMe')}
            >
              {t.nearMe}
            </Button>
            <Button
              variant={filter === 'national' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('national')}
            >
              {t.national}
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t.all}
            </Button>
          </div>
          
          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors ${
                  !alert.read ? 'border-l-4 border-l-primary' : ''
                }`}
                onClick={() => router.push(`/alerts/${alert.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-1">{alert.title}</h3>
                      <Badge className={`${severityColors[alert.severity]} text-xs shrink-0`}>
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2 mb-3">
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        📍 {alert.location}
                      </span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/70 shrink-0 mt-1" />
                </div>
              </Card>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-white/70">No alerts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}