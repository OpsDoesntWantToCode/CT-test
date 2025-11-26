'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { ChevronRight, Globe, Moon, Wifi, Bell, Shield, HelpCircle, User, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { Switch } from '../../components/ui/switch'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function SettingsPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const offlineMode = useStore((state) => state.offlineMode)
  const notifications = useStore((state) => state.notifications)
  const setLanguage = useStore((state) => state.setLanguage)
  const setDarkMode = useStore((state) => state.setDarkMode)
  const toggleOfflineMode = useStore((state) => state.toggleOfflineMode)
  const toggleNotifications = useStore((state) => state.toggleNotifications)
  const t = useTranslation(language)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const languageOptions = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'jp' as const, label: '日本語', flag: '🇯🇵' },
  ]

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header with Back Button */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-serif flex-1">Settings</h1>
          </div>

          {/* GENERAL SECTION */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">General</h2>

            {/* Language Selection */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 font-medium">Language</span>
              </div>
              <div className="space-y-2 ml-13">
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${language === option.code
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/90 hover:bg-white text-gray-900'
                      }`}
                  >
                    <span className="text-2xl">{option.flag}</span>
                    <span className="font-medium">{option.label}</span>
                    {language === option.code && (
                      <span className="ml-auto">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Notifications Toggle */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">Notifications</span>
                </div>
                <Switch checked={notifications} onCheckedChange={toggleNotifications} />
              </div>
              <button
                onClick={() => router.push('/notifications')}
                className="w-full p-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-between"
              >
                <span>View Notifications</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Card>

            {/* Dark Mode Toggle */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 font-medium">Dark Mode</span>
                <Switch checked={isDarkMode} onCheckedChange={(checked) => setDarkMode(checked)} />
              </div>
            </Card>

            {/* Offline Mode */}
            <Card
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => router.push('/offline')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Offline Mode</div>
                  <div className="text-xs text-white/60">
                    Cache maps and alerts for offline access
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
          </div>

          {/* ACCOUNT SECTION */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">Account</h2>

            {/* Profile */}
            <Card
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => router.push('/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Profile</div>
                  <div className="text-xs text-white/60">Manage your account</div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
          </div>

          {/* PRIVACY & LEGAL SECTION */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">Privacy & Legal</h2>

            {/* Privacy Policy */}
            <Card
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
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

            {/* Help & Support */}
            <Card
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => router.push('/help')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Help & Support</div>
                  <div className="text-xs text-white/60">FAQs and contact support</div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}