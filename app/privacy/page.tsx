'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { Shield, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PrivacyPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  
  const handleBack = () => {
    // Kiểm tra xem có đang ở trang onboarding không (dựa vào document.referrer)
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/onboarding')
    }
  }
  
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-serif flex-1">{t.privacyPolicy}</h1>
            <Shield className="h-6 w-6 text-white/60" />
          </div>
          
          {/* Privacy Content */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-6">
            <div className="prose prose-sm max-w-none prose-invert">
              <h2 className="text-xl font-bold mb-4 text-white">Privacy Policy</h2>
              
              <h3 className="text-lg font-semibold mt-6 mb-2 text-white">Data Collection</h3>
              <p className="text-white/70 leading-relaxed">
                We collect location data to provide real-time safety alerts and weather warnings. 
                Your location is processed securely and is never shared with third parties without 
                your explicit consent.
              </p>
              
              <h3 className="text-lg font-semibold mt-6 mb-2 text-white">Data Usage</h3>
              <p className="text-white/70 leading-relaxed">
                Your data is used exclusively to:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-1 mt-2">
                <li>Provide location-based safety alerts</li>
                <li>Calculate safety scores for your area</li>
                <li>Send emergency notifications</li>
                <li>Improve our prediction algorithms</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-6 mb-2 text-white">Data Security</h3>
              <p className="text-white/70 leading-relaxed">
                We implement AES-256 encryption for all sensitive data. GPS coordinates are 
                anonymized and stored securely. Multi-factor authentication protects your account.
              </p>
              
              <h3 className="text-lg font-semibold mt-6 mb-2 text-white">Your Rights</h3>
              <p className="text-white/70 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-1 mt-2">
                <li>Access your personal data</li>
                <li>Request data deletion</li>
                <li>Opt-out of location tracking</li>
                <li>Export your data</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-6 mb-2 text-white">Contact</h3>
              <p className="text-white/70 leading-relaxed">
                For privacy concerns, contact us at: privacy@travelsafety.com
              </p>
              
              <p className="text-xs text-white/50 mt-8">
                Last updated: January 2025
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}