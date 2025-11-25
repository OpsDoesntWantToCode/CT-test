'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { History, Bell, ShieldAlert, ChevronLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { Button } from '../../components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '../../lib/utils'
import { useState } from 'react'
import { AppHeader } from '../../components/app-header'
import Image from 'next/image'

export default function HistoryPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const alerts = useStore((state) => state.alerts)
  const sosHistory = useStore((state) => state.sosHistory)
  const t = useTranslation(language)
  
  const [activeTab, setActiveTab] = useState<'alerts' | 'sos'>('alerts')
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const groupByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {}
    items.forEach(item => {
      const date = formatDate(item.timestamp)
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    return groups
  }
  
  const alertGroups = groupByDate(alerts)
  const sosGroups = groupByDate(sosHistory)
  const isDarkMode = useStore((state) => state.isDarkMode)
  
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />
        
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <h1 className="text-3xl font-serif flex-1">{t.history}</h1>
            <History className="h-6 w-6 text-white/60" />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'alerts' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab('alerts')}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t.alertHistory}
            </Button>
            <Button
              variant={activeTab === 'sos' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab('sos')}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              {t.sosEvents}
            </Button>
          </div>
          
          {/* Content with glassmorphism cards */}
          {activeTab === 'alerts' ? (
            Object.keys(alertGroups).length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.noHistory}</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(alertGroups).map(([date, items]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {date}
                    </h3>
                    {items.map((alert) => (
                      <Card
                        key={alert.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => router.push(`/alerts/${alert.id}`)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{alert.title}</h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(alert.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {alert.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-xs px-2 py-1 rounded-full font-medium',
                                alert.severity === 'critical' && 'bg-critical/10 text-critical',
                                alert.severity === 'high' && 'bg-high/10 text-high',
                                alert.severity === 'moderate' && 'bg-moderate/10 text-moderate',
                                alert.severity === 'low' && 'bg-low/10 text-low'
                              )}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {alert.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )
          ) : (
            Object.keys(sosGroups).length === 0 ? (
              <Card className="p-8 text-center">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.noHistory}</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(sosGroups).map(([date, items]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {date}
                    </h3>
                    {items.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full',
                            event.status === 'sent' && 'bg-low/10',
                            event.status === 'pending' && 'bg-moderate/10',
                            event.status === 'failed' && 'bg-critical/10'
                          )}>
                            <ShieldAlert className={cn(
                              'h-5 w-5',
                              event.status === 'sent' && 'text-low',
                              event.status === 'pending' && 'text-moderate',
                              event.status === 'failed' && 'text-critical'
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">SOS Alert</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                            <span className={cn(
                              'inline-block text-xs px-2 py-1 rounded-full font-medium mt-2',
                              event.status === 'sent' && 'bg-low/10 text-low',
                              event.status === 'pending' && 'bg-moderate/10 text-moderate',
                              event.status === 'failed' && 'bg-critical/10 text-critical'
                            )}>
                              {event.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
