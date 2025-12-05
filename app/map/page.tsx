'use client'

import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
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

// --- 1. IMPORT CÁC COMPONENT CỦA LEAFLET (DỰA TRÊN CODE BẠN CUNG CẤP) ---
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any
const Polygon      = dynamic(() => import("react-leaflet").then(m => m.Polygon), { ssr: false }) as any
const Circle       = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false }) as any
// ------------------------------------------------------------------------

export default function MapPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const [searchQuery, setSearchQuery] = useState('')

  // State chứa dữ liệu bản đồ
  const [zones, setZones] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<any | null>(null)
  const [L, setL] = useState<any>(null)

  // --- 2. LOGIC MÀU SẮC (LẤY TỪ CODE CŨ) ---
  const severityColors: any = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
    safe: 'bg-green-500',
    info: 'bg-green-500',    // Thêm info -> Xanh lá
    default: 'bg-green-500', // Mặc định -> Xanh lá
  }

  const getZoneColor = (severity: string) => {
    const level = severity?.toLowerCase() || 'medium';
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      case 'safe': return 'green';
      case 'info': return 'green'; // Thêm case Info -> Xanh lá
      default: return 'green';     // Đổi default từ blue -> green
    }
  };

  const getSeverityLabel = (severity: string) => {
    const level = severity?.toLowerCase();
    switch (level) {
      case 'high': return 'High Risk (0-24)'
      case 'medium': return 'Medium Risk (25-49)'
      case 'low': return 'Low Risk (50-79)'
      case 'safe': return 'Safe (80-100)'
      default: return severity
    }
  }
  // ------------------------------------------

  // --- 3. FETCH DỮ LIỆU TỪ BACKEND PYTHON & MAP SANG FORMAT CŨ ---
  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
        // Gọi API Backend Python
        const response = await fetch('http://localhost:8000/api/v1/map/zones'); 
        const backendData = await response.json();

        // Map dữ liệu từ Backend sang format Frontend mong muốn
        const formattedZones = backendData.map((item: any) => ({
           id: item.id || Math.random().toString(),
           name: item.id, // Backend đang dùng id làm tên (location_name)
           // Xác định loại hình vẽ: Nếu có path -> polygon, không có -> circle
           type: (item.path && item.path.length > 0) ? 'polygon' : 'circle',
           path: item.path,
           center: item.center, // [lat, lon]
           radius: 3000, // Mặc định 3km nếu là hình tròn (Backend chưa trả radius)
           severity: item.risk_level?.toLowerCase() || 'medium', // Map 'High' -> 'high'
           description: item.info?.type || 'Unknown Risk'
        }));

        setZones(formattedZones);
      } catch (error) {
        console.error("Failed to fetch map data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRiskZones();
  }, []);

  // Load Leaflet library
  useEffect(() => {
    import('leaflet')
      .then((mod) => setL(mod.default))
      .catch((e) => console.error('Leaflet load failed', e));
  }, []);

  const markerCenter = selectedZone ? (selectedZone.center || (selectedZone.path ? selectedZone.path[0] : null)) : null

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
            {/* Map Area */}
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
                center={[21.0285, 105.8542]}
                zoom={6}
                className="w-full h-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* --- 4. VẼ VÙNG AN TOÀN / RỦI RO (ÁP DỤNG CODE TỪ FILE TS BẠN GỬI) --- */}
                {zones.map((zone, index) => {
                   const color = getZoneColor(zone.severity);
                   return (
                    <div key={index}>
                      {/* Vẽ Đa giác (Polygon) */}
                      {zone.type === 'polygon' && zone.path && (
                        <Polygon 
                          positions={zone.path}
                          pathOptions={{ color: color, fillColor: color, fillOpacity: 0.4 }}
                        />
                      )}

                      {/* Vẽ Hình tròn (Circle) */}
                      {zone.type === 'circle' && (
                        <Circle 
                          center={zone.center}
                          pathOptions={{ color: color, fillColor: color, fillOpacity: 0.4 }}
                          radius={zone.radius || 3000}
                        />
                      )}
                    </div>
                  )
                })}
                {/* --------------------------------------------------------------------- */}

                {/* Fly to selected zone */}
                {markerCenter && (
                  <>
                    <FlyToLocation lat={Number(markerCenter[0])} lon={Number(markerCenter[1])} zoom={13} />
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

            {/* List Bên Phải */}
            <div className="space-y-4">
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

              {/* Danh sách Zones Active */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
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
                            <p className="text-xs text-white/70">{zone.description}</p>
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