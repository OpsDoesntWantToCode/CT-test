'use client'

import 'leaflet/dist/leaflet.css'
import { BottomNav } from '../../components/bottom-nav'
import { Button } from '../../components/ui/button'
import { Search, X, Plus, Minus, MapPin, ChevronLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { riskZones } from '../../lib/mock-data'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

export default function MapFullscreenPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(10)

  return (
    <div className="w-screen h-screen relative text-white overflow-hidden">
      {/* Full Screen Map */}
      <div className="w-full h-full">
        <MapContainer center={[21.0285, 105.8542]} zoom={zoom} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          <Circle center={[21.0285, 105.8542]} radius={500} color="blue" />
          
          {riskZones.map((zone) => (
            <Marker key={zone.id} position={[zone.lat, zone.lng]}>
              <Popup>
                <div className="text-sm">
                  <h4 className="font-semibold">{zone.name}</h4>
                  <p className="text-xs text-gray-600">
                    {zone.severity === 'high' ? 'High Risk (0-24)' 
                    : zone.severity === 'medium' ? 'Medium Risk (25-49)' 
                    : zone.severity === 'low' ? 'Low Risk (50-79)' 
                    : 'Safe (80-100)'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Top Bar - HIGHEST Z-INDEX */}
      <div className="absolute top-0 left-0 right-0 z-[9999] p-4">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-3 flex items-center gap-3">
          <Search className="h-4 w-4 text-white/60 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50"
          />
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-auto"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Back Button */}
      <Button
        size="sm"
        className="absolute top-20 left-4 bg-white text-black hover:bg-gray-200 z-[9999] flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-24 z-[9999] space-y-2">
        <Button
          size="icon"
          className="bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-lg"
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-lg"
          onClick={() => setZoom(Math.max(zoom - 1, 2))}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend - Bottom Left */}
      <div className="absolute bottom-24 left-4 z-[9999] bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 text-white max-w-xs">
        <h3 className="text-sm font-semibold mb-3">Risk Levels</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs">High Risk (0-24)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-xs">Medium Risk (25-49)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-xs">Low Risk (50-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs">Safe (80-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-xs">Your Location</span>
          </div>
        </div>
      </div>

      {/* Risk Zones List - Bottom Right */}
      <div className="absolute bottom-24 right-4 z-[9999] bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 text-white max-w-xs">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Risk Zones
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {riskZones.map((zone) => (
            <div key={zone.id} className="bg-white/5 rounded p-2">
              <p className="text-xs font-semibold">{zone.name}</p>
              <p className="text-xs text-white/60">
                {zone.severity === 'high' ? 'High Risk'
                : zone.severity === 'medium' ? 'Medium Risk'
                : zone.severity === 'low' ? 'Low Risk'
                : 'Safe'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}