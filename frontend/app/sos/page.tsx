'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { ShieldAlert, Phone, MapPin, CheckCircle2, ArrowLeft, Shield } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SOSPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const addSOSEvent = useStore((state) => state.addSOSEvent)
  const t = useTranslation(language)
  const { toast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const isDarkMode = useStore((state) => state.isDarkMode)
  
  const handleSOSPress = () => {
    setShowConfirm(true)
  }
  
  const handleConfirm = async () => {
    setShowConfirm(false)
    setSending(true)
    
    // Simulate sending SOS
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    addSOSEvent({
      id: Date.now().toString(),
      timestamp: new Date(),
      location: 'Hanoi, Vietnam',
      status: 'sent',
    })
    
    setSending(false)
    setSent(true)
    
    toast({
      title: t.sentSuccessfully,
      description: 'Emergency services have been notified',
    })
    
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="min-h-screen relative text-white overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 md:p-8">
        <AppHeader />
      </div>

      {/* Main SOS Area - Centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-8 w-full max-w-md">
          
          {/* Large SOS Circle Button */}
          <div className="relative flex justify-center">
            {/* Pulse Background */}
            <div className={`absolute inset-0 flex items-center justify-center ${sending ? 'animate-pulse' : ''}`}>
              <div className="w-72 h-72 rounded-full bg-red-500/20 blur-xl" />
            </div>

            {/* Main Button */}
            <button
              disabled={sending || sent}
              onClick={handleSOSPress}
              className="relative w-64 h-64 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#E57373] hover:from-[#FF5252] hover:to-[#EF5350] disabled:opacity-50 shadow-2xl shadow-red-900/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
            >
              {/* Inner Content */}
              <div className="flex flex-col items-center gap-3">
                {sending ? (
                  <>
                    <div className="animate-spin">
                      <Shield className="w-20 h-20 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">{t.sending || 'Sending'}</span>
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle2 className="w-20 h-20 text-white animate-bounce" />
                    <span className="text-lg font-bold text-white">{t.sentSuccessfully || 'Sent'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-20 h-20 text-white" />
                    <div>
                      <p className="text-white text-xl font-bold leading-tight">Press to</p>
                      <p className="text-white text-xl font-bold leading-tight">Activate SOS</p>
                    </div>
                  </>
                )}
              </div>

              {/* Ring Effect on Hover */}
              {!sending && !sent && (
                <div className="absolute inset-0 rounded-full border-4 border-white/30 group-hover:border-white/60 transition-all duration-300" />
              )}
            </button>
          </div>

          {/* Info Text */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">{t.sosTitle || 'Emergency SOS'}</h1>
            <p className="text-white/70 text-lg">{t.sosDescription || 'Tap the button to activate emergency services'}</p>
          </div>
        </div>
      </div>

      {/* Emergency Info - Bottom Section */}
      <div className="relative z-10 p-4 md:p-8 space-y-3 max-w-2xl mx-auto w-full">
        
        <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 flex-shrink-0">
              <Phone className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Emergency Hotline</h3>
              <p className="text-sm text-white/70">115 (Vietnam)</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = 'tel:115'
                }
              }}
            >
              Call
            </Button>
          </div>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 flex-shrink-0">
              <MapPin className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Your Location</h3>
              <p className="text-sm text-white/70">Hanoi, Vietnam</p>
            </div>
          </div>
        </Card>

        {/* Warning */}
        <Card className="bg-red-500/10 border-red-500/30 backdrop-blur-md p-4 text-white">
          <p className="text-sm text-center">
            ⚠️ Only use SOS for genuine emergencies. False alarms may result in penalties.
          </p>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-black/80 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{t.sosConfirmTitle || 'Confirm SOS'}</DialogTitle>
            <DialogDescription className="text-white/70">
              {t.sosConfirmDesc || 'Are you sure you want to activate emergency services?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowConfirm(false)}
            >
              {t.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              {t.confirm || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}