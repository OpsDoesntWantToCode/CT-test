'use client'

import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react' // [FIX] Thêm useEffect
import { useRef } from 'react'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { BottomNav } from '../../components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { Search, ShieldAlert, ArrowLeft, MapPin, Maximize2 } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import UserMarker from '../../components/UserMarker.client'
import FlyToLocation from '../../components/FlyToLocation'

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false }) as any
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false }) as any
const Polygon      = dynamic(() => import("react-leaflet").then(m => m.Polygon), { ssr: false }) as any
const Circle       = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false }) as any

export default function MapPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  const [searchQuery, setSearchQuery] = useState('')

  // [FIX] Khai báo State để chứa dữ liệu từ Backend
  const [zones, setZones] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)

  const severityColors: any = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
    safe: 'bg-green-500',
  }

  // Helper để lấy màu vẽ lên bản đồ (Map color)
  const getZoneColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      case 'safe': return 'green';
      default: return 'blue';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'High Risk (0-24)'
      case 'medium': return 'Medium Risk (25-49)'
      case 'low': return 'Low Risk (50-79)'
      case 'safe': return 'Safe (80-100)'
      default: return severity
    }
  }

  const isDarkMode = useStore((state) => state.isDarkMode)
  
  // [FIX] Gọi API lấy dữ liệu thật
  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/risk-zones'); 
        const data = await response.json();
        setZones(data); // Cập nhật state
      } catch (error) {
        console.error("Failed to fetch map data:", error);
      } finally {
        setLoading(false); // Tắt trạng thái loading
      }
    };
    fetchRiskZones();
  }, []);

  // Load Leaflet library on client to create divIcon markers
  useEffect(() => {
    import('leaflet')
      .then((mod) => setL(mod.default))
      .catch((e) => console.error('Leaflet load failed', e));
  }, []);

  // State để giữ map instance và vùng được chọn
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<any | null>(null)
  const [L, setL] = useState<any>(null)

  // Helper: tính centroid từ polygon (nếu backend không trả `center`)
  const computeCentroid = (path: any[]) => {
    if (!path || path.length === 0) return null
    let lat = 0
    let lng = 0
    path.forEach((p: any) => {
      lat += p[0]
      lng += p[1]
    })
    return [lat / path.length, lng / path.length]
  }

  // When selectedZone changes, flying is handled by the FlyToLocation component
  useEffect(() => {
    // no-op: FlyToLocation (rendered inside MapContainer) will call map.flyTo
  }, [selectedZone])

  const markerCenter = selectedZone ? (selectedZone.center || (selectedZone.path ? computeCentroid(selectedZone.path) : null)) : null

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full">
          {/* Header with Back Button */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-serif flex-1">Risk Map</h1>
          </div>

          {/* Search Bar */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
            {/* Map Area with Leaflet */}
            <div className="lg:col-span-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 relative min-h-[500px] overflow-hidden">
              <Button
                size="sm"
                className="absolute top-4 right-4 bg-white text-black hover:bg-gray-200 z-[9999] flex items-center gap-2"
                onClick={() => router.push('/map-fullscreen')}
              >
                <Maximize2 className="h-4 w-4" />
                Expand
              </Button>

              <MapContainer
                center={[21.0285, 105.8542]} // Có thể đổi thành center động nếu muốn
                zoom={6}  // Zoom xa ra một chút để thấy toàn Việt Nam
                className="w-full h-full"
                whenCreated={(map: any) => setMapInstance(map)}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* [FIX] Render dữ liệu thật từ state ZONES */}
                {zones.map((zone, index) => {
                   const color = getZoneColor(zone.severity);
                   return (
                    <div key={index}>
                      {/* 2. Vẽ Polygon (Đa giác) nếu backend trả về type='polygon' */}
                      {zone.type === 'polygon' && zone.path && (
                        <Polygon 
                          positions={zone.path}
                          pathOptions={{ color: color, fillColor: color, fillOpacity: 0.4 }}
                        />
                      )}

                      {/* 3. Vẽ Circle (Hình tròn) nếu backend trả về type='circle' */}
                      {zone.type === 'circle' && zone.radius && (
                        <Circle 
                          center={zone.center}
                          pathOptions={{ color: color, fillColor: color, fillOpacity: 0.4 }}
                          radius={zone.radius}
                        />
                      )}
                    </div>
                  )
                })}

                {/* Marker hiển thị khi user chọn 1 zone từ cột bên phải */}
                {markerCenter && (
                  <>
                    <FlyToLocation lat={Number(markerCenter[0])} lon={Number(markerCenter[1])} zoom={14} />
                    {L && (
                      <UserMarker
                        position={{ lat: Number(markerCenter[0]), lon: Number(markerCenter[1]) }}
                        L={L}
                      />
                    )}
                  </>
                )}
              </MapContainer>

              <Button
                size="icon"
                className="absolute bottom-10 right-10 h-14 w-14 rounded-full bg-[#E57373] hover:bg-[#EF5350] text-white shadow-lg z-50"
                onClick={() => router.push('/sos')}
              >
                <ShieldAlert className="h-6 w-6" />
              </Button>
            </div>

            {/* Legend & Risk Zones List */}
            <div className="space-y-4">
              {/* Legend giữ nguyên... */}
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4 text-white">
                <h3 className="text-sm font-semibold mb-3">Risk Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span className="text-xs font-medium">High Risk (0-24)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500" />
                    <span className="text-xs font-medium">Medium Risk (25-49)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span className="text-xs font-medium">Low Risk (50-79)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span className="text-xs font-medium">Safe (80-100)</span>
                  </div>
                </div>
              </Card>

              {/* Active Risk Zones List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {/* [FIX] Duyệt qua danh sách ZONES thật */}
                {loading ? (
                  <p className="text-center text-white/50 text-sm">Loading map data...</p>
                ) : (
                  zones.map((zone, index) => (
                    <Card
                      key={index}
                      onClick={() => setSelectedZone(zone)}
                      className={`bg-black/40 backdrop-blur-md border-white/10 p-3 text-white hover:border-white/20 transition-colors cursor-pointer ${selectedZone?.name === zone.name ? 'ring-2 ring-white/20' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{zone.name}</h4>
                            <p className="text-xs text-white/70">Active risk zone</p>
                          </div>
                        </div>
                        <Badge className={`${severityColors[zone.severity] || 'bg-gray-500'} text-white text-xs whitespace-nowrap`}>
                          {getSeverityLabel(zone.severity)}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}