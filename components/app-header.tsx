'use client'

import { Bell, User } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  
  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/map', label: 'Map' },
    { href: '/alerts', label: 'Alert Hub' },
    { href: '/sos', label: 'SOS' },
    { href: '/settings', label: 'Settings' },
  ]
  
  return (
    <header className="flex items-center justify-between gap-4 relative z-20">
      {/* Logo */}
      <div className="w-12 h-12 md:w-16 md:h-16 relative shrink-0">
        <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
      </div>

      {/* Nav Bar */}
      <nav className="hidden md:flex items-center bg-black/40 backdrop-blur-md rounded-full px-8 py-4 gap-12 flex-1 justify-center max-w-3xl mx-auto border border-white/10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`font-medium hover:text-primary transition-colors ${
              pathname === item.href ? 'text-white' : 'text-white/80'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Nav Placeholder */}
      <div className="md:hidden flex-1" />

      {/* Right Icons */}
<div className="flex items-center gap-6 shrink-0">
  <button
    className="text-white hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full"
    onClick={() => router.push('/notifications')}
    aria-label="Notifications"
  >
    <Bell size={25} strokeWidth={2} />
  </button>
  <button
    className="text-white hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full"
    onClick={() => router.push('/profile')}
    aria-label="Profile"
  >
    <User size={25} strokeWidth={2} />
  </button>
</div>
    </header>
  )
}
