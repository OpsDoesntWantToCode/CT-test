'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Share2, MapPin } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { Severity } from '@/lib/store'

export default function AlertDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const language = useStore((state) => state.language)
  const alerts = useStore((state) => state.alerts)
  const markAlertAsRead = useStore((state) => state.markAlertAsRead)
  const t = useTranslation(language)
  
  const alert = alerts.find(a => a.id === params.id)
  
  if (!alert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Alert not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  
  const severityColors: Record<Severity, string> = {
    critical: 'bg-critical text-white',
    high: 'bg-high text-white',
    moderate: 'bg-moderate text-white',
    low: 'bg-low text-white',
  }
  
  const handleMarkAsRead = () => {
    markAlertAsRead(alert.id)
    toast({
      title: 'Marked as read',
      description: 'This alert has been marked as read',
    })
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: alert.title,
          text: alert.description,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      toast({
        title: 'Share link copied',
        description: 'Alert link copied to clipboard',
      })
    }
  }
  
  const todoItems = [
    'Stay indoors if possible',
    'Keep emergency kit ready',
    'Monitor official updates',
    'Charge all electronic devices',
    'Have emergency contacts handy',
  ]
  
  const dontItems = [
    'Don\'t travel to affected areas',
    'Don\'t ignore evacuation orders',
    'Don\'t use elevators during storms',
    'Don\'t drive through flooded areas',
    'Don\'t spread unverified information',
  ]
  
  return (
    <div className="min-h-screen bg-background pb-6 pwa-safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Alert Details</h1>
          <Badge className={severityColors[alert.severity]}>
            {alert.severity.toUpperCase()}
          </Badge>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Mini Map */}
        <Card className="h-40 bg-gradient-to-br from-primary/5 to-safe/5 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{alert.location}</p>
          </div>
        </Card>
        
        {/* Alert Info */}
        <div>
          <h2 className="text-2xl font-bold mb-2">{alert.title}</h2>
          <p className="text-muted-foreground mb-4">{alert.description}</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>📍 {alert.location}</span>
            <span>•</span>
            <span>🕐 {new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>
        
        {/* What to Do */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-safe">✅ {t.whatToDo}</h3>
          <ul className="space-y-2">
            {todoItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        
        {/* What Not to Do */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-critical">❌ {t.whatNotToDo}</h3>
          <ul className="space-y-2">
            {dontItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-critical" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleMarkAsRead}
            disabled={alert.read}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t.markAsRead}
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t.share}
          </Button>
        </div>
      </div>
    </div>
  )
}
