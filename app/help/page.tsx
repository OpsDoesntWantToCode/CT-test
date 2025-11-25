'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { Info, Phone, Lightbulb, Shield, ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HelpPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  
  const emergencyNumbers = [
    { country: 'Vietnam', police: '113', ambulance: '115', fire: '114' },
    { country: 'International', police: '112', ambulance: '112', fire: '112' },
  ]
  
  const safetyTips = [
    'Always check weather forecasts before traveling',
    'Keep emergency contacts readily available',
    'Download offline maps for your destination',
    'Stay informed about local disaster warnings',
    'Have a backup power source for your phone',
    'Know the location of nearby shelters',
  ]
  const isDarkMode = useStore((state) => state.isDarkMode)
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        
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
            <h1 className="text-3xl font-serif flex-1">Help & Support</h1>
          </div>
          
          {/* About Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <h3 className="font-semibold mb-2">Intelligent Travel Safety System</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                An AI-powered safety alert system designed to enhance tourist safety through 
                real-time weather and disaster warnings. Our system monitors conditions 24/7 
                and provides instant alerts to keep you informed and safe during your travels.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/60">Version 1.0.0</p>
                <p className="text-xs text-white/60">© 2025 Travel Safety Team</p>
              </div>
            </Card>
          </div>
          
          {/* Emergency Numbers */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Emergency Numbers</h2>
            </div>
            {emergencyNumbers.map((region) => (
              <Card key={region.country} className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
                <h3 className="font-semibold mb-3">{region.country}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Police</span>
                    <a href={`tel:${region.police}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.police}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Ambulance</span>
                    <a href={`tel:${region.ambulance}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.ambulance}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Fire Department</span>
                    <a href={`tel:${region.fire}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.fire}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Safety Tips */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Safety Tips</h2>
            </div>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <ul className="space-y-3">
                {safetyTips.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          
          {/* Privacy Policy Link */}
          <Card
            className="bg-black/40 backdrop-blur-md rounded-2xl border-white/10 p-6 cursor-pointer hover:bg-black/50 transition-colors"
            onClick={() => router.push('/privacy')}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 font-medium">Privacy Policy</span>
              <ChevronRight className="h-5 w-5 text-white/60" />
            </div>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}