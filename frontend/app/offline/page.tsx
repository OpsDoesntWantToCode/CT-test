'use client'

import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { BottomNav } from '../../components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { Wifi, Download, RefreshCw, Database, ArrowLeft, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function OfflinePage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const offlineMode = useStore((state) => state.offlineMode)
  const t = useTranslation(language)
  const [progress, setProgress] = useState(65)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState('2 hours ago')
  
  const offlineData = [
    { id: 1, name: 'Maps - Vietnam', size: '245 MB', type: 'map', synced: true },
    { id: 2, name: 'Weather Alerts', size: '12 MB', type: 'alerts', synced: true },
    { id: 3, name: 'Risk Zones', size: '8 MB', type: 'zones', synced: true },
    { id: 4, name: 'Emergency Contacts', size: '2 MB', type: 'contacts', synced: true },
  ]
  
  const handleRetry = () => {
    setSyncing(true)
    setProgress(0)
    
    // Simulate syncing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setSyncing(false)
          setLastSynced('just now')
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 500)
  }
  
  const totalSize = offlineData.reduce((acc, item) => {
    const size = parseInt(item.size)
    return acc + size
  }, 0)

  const isDarkMode = useStore((state) => state.isDarkMode)
  
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />
        
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-serif">{t.offlineMode}</h1>
              <p className="text-sm text-white/70">Manage your offline data</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          {/* Status Card */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 text-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Sync Status</h2>
                <span className={`text-sm font-medium ${offlineMode ? 'text-green-400' : 'text-yellow-400'}`}>
                  {offlineMode ? '✓ Enabled' : '○ Disabled'}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Download Progress</span>
                  <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      syncing ? 'bg-primary' : 'bg-green-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Sync Info */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60">
                  Last synced: <span className="text-white/80 font-medium">{lastSynced}</span>
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Total cached data: <span className="text-white/80 font-medium">{totalSize} MB</span>
                </p>
              </div>
            </div>
          </Card>
          
          {/* Cached Data */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-2">Cached Data</h2>
            
            <div className="space-y-2">
              {offlineData.map((item) => (
                <Card key={item.id} className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {item.type === 'map' && <Database className="h-5 w-5 text-primary" />}
                      {item.type === 'alerts' && <AlertCircle className="h-5 w-5 text-primary" />}
                      {item.type === 'zones' && <Wifi className="h-5 w-5 text-primary" />}
                      {item.type === 'contacts' && <Download className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <p className="text-xs text-white/60">{item.size}</p>
                    </div>
                    {item.synced && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRetry}
              disabled={syncing}
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Retry Sync'}
            </Button>
            
            <Button
              onClick={() => router.push('/map')}
              variant="outline"
              className="w-full text-white border-white/20 hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Offline Data
            </Button>
            
            <Card className="bg-blue-500/10 border-blue-500/30 p-4 text-white">
              <p className="text-sm text-center">
                ℹ️ Your offline data will be automatically updated when you're connected to the internet.
              </p>
            </Card>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}