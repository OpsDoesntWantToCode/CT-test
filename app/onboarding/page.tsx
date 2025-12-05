"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Checkbox } from "../../components/ui/checkbox"
import { Label } from "../../components/ui/label"
import { useStore } from "../../lib/store"

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useStore()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    completeOnboarding()
    router.push("/home")
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Stormy sea background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay for better text readability if needed, though design shows clear image */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col p-6 md:flex-row md:p-12 lg:p-16">
        
        {/* Header Elements */}
        <div className="absolute left-6 top-6 md:left-12 md:top-12">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-cyan-400/30 bg-cyan-500/20 backdrop-blur-sm">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="absolute right-6 top-6 md:right-12 md:top-12">
          <Link href="/help" className="text-lg font-medium text-white hover:text-cyan-300">
            Help
          </Link>
        </div>

        {/* Left Column - Title */}
        <div className="mt-24 flex flex-1 flex-col justify-center md:mt-0 md:pr-12">
          <h1 className="font-serif text-5xl leading-tight text-[#E8E8D0] drop-shadow-lg md:text-6xl lg:text-7xl">
            Travel Safety System
            <br />
            <span className="text-white">with</span>
            <br />
            Weather and Disaster
            <br />
            Warnings
          </h1>
          
          {/* Decorative lines/dots from design */}
          <div className="mt-12 flex items-center gap-4 opacity-80">
            <div className="h-1 w-16 bg-white" />
            <div className="h-3 w-3 rotate-45 bg-[#E8E8D0]" />
            <div className="h-3 w-3 rotate-45 bg-[#E8E8D0]" />
            <div className="h-1 w-16 bg-white" />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="mt-12 flex flex-1 flex-col justify-center md:mt-0 md:pl-12">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-black/10 p-6 backdrop-blur-sm md:p-8">
            <h2 className="mb-8 text-center font-serif text-4xl text-[#E8E8D0] md:text-5xl">
              {mode === "signup" ? "Sign up" : "Sign in"}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs text-gray-300">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="M." 
                      className="bg-white text-black placeholder:text-gray-400"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs text-gray-300">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Farman" 
                      className="bg-white text-black placeholder:text-gray-400"
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-gray-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="farmanjaved2001@gmail.com" 
                  className="bg-white text-black placeholder:text-gray-400"
                  required 
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs text-gray-300">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="0987654321" 
                    className="bg-white text-black placeholder:text-gray-400"
                    required 
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-gray-300">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="**************" 
                  className="bg-white text-black placeholder:text-gray-400"
                  required 
                />
              </div>

              {mode === "signup" && (
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox id="terms" className="border-white data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white" required />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the <span className="underline hover:text-cyan-300">terms & policy</span>
                  </label>
                </div>
              )}

              <Button 
                type="submit" 
                className="mt-4 w-full bg-[#2A8C98] py-6 text-lg font-semibold hover:bg-[#227580]"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (mode === "signup" ? "Create Account" : "Login")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === "signup" ? (
                <p>
                  Have an account?{" "}
                  <button 
                    onClick={() => setMode("signin")} 
                    className="font-semibold text-[#E8E8D0] hover:text-white hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setMode("signup")} 
                    className="font-semibold text-[#E8E8D0] hover:text-white hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
