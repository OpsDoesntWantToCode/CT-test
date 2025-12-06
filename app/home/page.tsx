"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

import LocationSelector from "@/components/LocationSelector";
import UseCurrentLocation from "@/components/UseCurrentLocation";
import UserMarker from "@/components/UserMarker.client";
import { getNearestLocation } from "@/lib/location/getNearestLocation";

import {
  MapPin, Phone, Droplets, Search, X, AlertTriangle, Zap, ShieldAlert, Wind, CheckCircle2
} from "lucide-react";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";

// Dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then((mod) => mod.Polygon), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const createHexagon = (lat: number, lon: number, radiusMeters: number) => {
  const coordinates = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i; 
    const dLat = (radiusMeters / 111320) * Math.cos(angle);
    const dLon = (radiusMeters / (111320 * Math.cos(lat * (Math.PI / 180)))) * Math.sin(angle);
    coordinates.push([lat + dLat, lon + dLon]);
  }
  return coordinates;
};

const MapController = ({ center }: { center: { lat: number, lon: number } }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat !== 0 && center.lon !== 0) {
      map.flyTo([center.lat, center.lon], 10, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

function getDistanceFromLatLonInKm(lat1: any, lon1: any, lat2: any, lon2: any) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
  
  const R = 6371; 
  const dLat = (Number(lat2) - Number(lat1)) * (Math.PI / 180);
  const dLon = (Number(lon2) - Number(lon1)) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * (Math.PI / 180)) * Math.cos(Number(lat2) * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1);
}

export default function HomePage() {
  const router = useRouter();
  const language = useStore((state) => state.language);
  const isDarkMode = useStore((state) => state.isDarkMode);
  
  const [info, setInfo] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [safetyInfo, setSafetyInfo] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allLocations, setAllLocations] = useState<any[]>([]); 
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [weather, setWeather] = useState({
    temp: 26, condition: "Cloudy", humidity: 66, wind: 0, location: "Select Location", date: "",
  });

  // Helper lấy màu cho Badge
  const getSeverityColor = (type: string) => {
      return 'bg-transparent border-black/40 text-black hover:bg-white/10 font-normal';
  };

  const fetchSafetyScore = async (lat: number, lon: number) => {
    setCalculating(true);
    try {
      const liveRes = await fetch('http://localhost:8000/api/v1/live/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: lat, lon: lon })
      });
      const liveData = await liveRes.json();

      if (liveData.live_weather) {
        setWeather((prev) => ({
          ...prev,
          temp: Math.round(liveData.live_weather.temp || 25),
          condition: capitalizeFirst(liveData.live_weather.desc || "Unknown"),
          humidity: liveData.live_weather.humidity || 0,
          wind: liveData.live_weather.wind || 0,
          location: info?.province || liveData.live_weather.name || "Unknown Location"
        }));
      }

      const aiInput = {
        location: info?.province || "Current Location",
        lat: lat, lon: lon,
        temperature: liveData.live_weather?.temp || 25.0,
        humidity: liveData.live_weather?.humidity || 70.0,
        pressure: 1013.0, wind_speed: liveData.live_weather?.wind || 5.0,
        precip6: 0.0, precip24: 0.0, gust6: 0.0, river_discharge: -1.0, eq_mag: -1.0, eq_dist: -1.0
      };

      const scoreRes = await fetch('http://localhost:8000/api/v1/ai/predict', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiInput) 
      });
      const scoreResponse = await scoreRes.json();

      let safetyScore = 100;
      let riskLevelBackend = 'Info';

      if (scoreResponse.success && scoreResponse.data) {
          safetyScore = Number(scoreResponse.data.safety_score);
          riskLevelBackend = scoreResponse.data.risk_level;
      }

      let insideRiskZone = false;
      let zoneMessage = "";

      if (allLocations.length > 0) {
        for (const zone of allLocations) {
            const distStr = getDistanceFromLatLonInKm(lat, lon, zone.lat, zone.lon);
            const dist = distStr === "N/A" ? 9999 : Number(distStr);
            const radiusKm = (Number(zone.radius) || 5000) / 1000;

            if (dist <= radiusKm) {
                insideRiskZone = true;
                const zoneScore = Number(zone.safety_score);
                if (!isNaN(zoneScore) && zoneScore < safetyScore) {
                    safetyScore = zoneScore;
                    zoneMessage = `Warning: Inside ${zone.name} (${zone.type})`;
                }
            }
        }
      }

      if (safetyScore < 25) riskLevelBackend = 'High';
      else if (safetyScore < 50) riskLevelBackend = 'Medium';
      else if (safetyScore < 80) riskLevelBackend = 'Low';
      else riskLevelBackend = 'Info';

      const finalMessage = insideRiskZone && zoneMessage 
          ? zoneMessage 
          : (scoreResponse.data?.suggestion || `Safety Score: ${safetyScore}/100`);

      const mappedRisks = (liveData.nearby_alerts || []).map((alert: any) => {
        const raw = alert.raw_data || {};
        const hazardType = raw.overall_hazard_prediction || "Unknown";
        
        let severity = "Low";
        if (hazardType === "No") {
            severity = "Info";
        } else if (hazardType !== "Unknown") {
             const labelKey = `${hazardType.toLowerCase()}_label`;
             const level = String(raw[labelKey] || "low").toLowerCase();
             if (level === "high") severity = "High";
             else if (level.includes("mid")) severity = "Medium";
        }

        return {
          disaster_type: hazardType === 'No' ? 'Safe' : hazardType,
          location: alert.title,
          lat: alert.lat,
          lon: alert.lon,
          distance: getDistanceFromLatLonInKm(lat, lon, alert.lat, alert.lon), 
          severity: severity,
          time_ago: "Live"
        };
      });

      const riskOrder: Record<string, number> = { 'High': 4, 'Medium': 3, 'Low': 2, 'Info': 1 };
      mappedRisks.sort((a: any, b: any) => {
        const riskDiff = (riskOrder[b.severity] || 0) - (riskOrder[a.severity] || 0);
        if (riskDiff !== 0) return riskDiff;
        return parseFloat(a.distance) - parseFloat(b.distance);
      });

      setSafetyInfo({
          safety_score: safetyScore, 
          risk_level: riskLevelBackend, 
          message: finalMessage,
          nearby_risks: mappedRisks 
      });

    } catch (error) {
      console.error("Lỗi xử lý:", error);
    } finally {
      setCalculating(false);
    }
  };

  const handleLocationUpdate = (lat: number, lon: number, locationInfo?: any) => {
    setUserPos({ lat, lon });
    if (locationInfo) setInfo(locationInfo);
    fetchSafetyScore(lat, lon);
  };

  useEffect(() => {
    if (userPos) fetchSafetyScore(userPos.lat, userPos.lon);
  }, [userPos, allLocations]); 

  useEffect(() => {
    import("leaflet").then((LeafletModule) => {
      const leaf = LeafletModule.default;
      delete (leaf.Icon.Default.prototype as any)._getIconUrl;
      leaf.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
      setL(leaf);
    });
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = await getNearestLocation(latitude, longitude);
        handleLocationUpdate(latitude, longitude, nearest);
      });
    }
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/map/zones');
        const data = await res.json();
        if (data && data.features) {
          const mappedData = data.features.map((feature: any) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            
            // 1. Tách tên và loại từ chuỗi "[Type] Name"
            let rawName = props.name || "Unknown";
            let type = props.hazard_type || "Unknown";
            let cleanName = rawName;

            // Regex tìm pattern [Type] Name
            const match = rawName.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
                type = match[1];  // Ví dụ: Rain, No, Storm
                cleanName = match[2]; // Ví dụ: Hanoi
            }

            let lat, lon, polygonCoords = [];
            if (props.center) {
                lat = props.center[0];
                lon = props.center[1];
            } else if (geometry.type === 'Polygon') {
                lat = geometry.coordinates[0][0][1];
                lon = geometry.coordinates[0][0][0];
            } else {
                lat = geometry.coordinates[1];
                lon = geometry.coordinates[0];
            }
            
            if (geometry.type === 'Polygon') {
               polygonCoords = geometry.coordinates[0].map((p: any) => [p[1], p[0]]);
            }

            return {
              name: cleanName, // Tên địa điểm đã làm sạch
              lat: lat,
              lon: lon,
              type: type, // Loại thiên tai (Rain, No, Storm...)
              severity: props.risk_level,
              color: props.color,
              radius: props.radius,
              safety_score: props.safety_score, 
              polygon: polygonCoords.length > 0 ? polygonCoords : null
            };
          });
          setAllLocations(mappedData);
        }        
      } catch (e) { console.error(e); }
    };
    fetchLocations();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(e.target.value);
    
    if (query.length > 0) {
      // Lọc: Khớp tên HOẶC Khớp loại thiên tai
      const filtered = allLocations.filter(loc => 
        (loc.name && loc.name.toLowerCase().includes(query)) || 
        (loc.type && loc.type.toLowerCase().includes(query))
      );
      
      if (userPos) {
         filtered.sort((a, b) => {
            const distA = Number(getDistanceFromLatLonInKm(userPos.lat, userPos.lon, a.lat, a.lon));
            const distB = Number(getDistanceFromLatLonInKm(userPos.lat, userPos.lon, b.lat, b.lon));
            return distA - distB;
         });
      }
      setFilteredLocations(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      if (userPos && !searchQuery) { fetchSafetyScore(userPos.lat, userPos.lon); return; }
      
      const query = searchQuery.toLowerCase().trim();
      const matches = allLocations.filter(loc => 
         loc.name.toLowerCase().includes(query) || loc.type.toLowerCase().includes(query)
      );
      
      if (matches.length > 0) {
          if (userPos) {
             matches.sort((a, b) => {
                const distA = Number(getDistanceFromLatLonInKm(userPos.lat, userPos.lon, a.lat, a.lon));
                const distB = Number(getDistanceFromLatLonInKm(userPos.lat, userPos.lon, b.lat, b.lon));
                return distA - distB;
             });
          }

          const listForUI = matches.map(loc => ({
             disaster_type: loc.type, 
             location: loc.name,
             lat: loc.lat,
             lon: loc.lon,
             distance: getDistanceFromLatLonInKm(userPos?.lat||0, userPos?.lon||0, loc.lat, loc.lon),
             severity: loc.severity === 'High' ? 'High' : 'Medium', 
             time_ago: 'Found in DB'
          }));
          
          const isSearchByType = matches[0].type.toLowerCase().includes(query);
          const message = isSearchByType 
             ? `Closest ${matches[0].type === 'No' ? 'Safe Zone' : matches[0].type}: ${matches[0].name}` 
             : `Found ${matches.length} results`;

          setSafetyInfo((prev: any) => ({ 
            ...prev, 
            nearby_risks: listForUI.slice(0, 5), 
            message: message
          }));
      } else {
           setSafetyInfo((prev: any) => ({
              ...prev,
              nearby_risks: [],
              message: `No active threats nearby for "${searchQuery}"`
           }));
      }
    }
  };

  useEffect(() => {
    const now = new Date();
    setWeather((prev) => ({ ...prev, date: now.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).replace(",", " |") }));
  }, []);

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="BG" fill className="object-cover" priority />
        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/80" : "bg-black/30"}`} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="bg-black/40 backdrop-blur-lg p-4 rounded-3xl border border-white/10 max-w-7xl w-full mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
              <div className="w-full">
                <LocationSelector
                  selectedProvince={info?.province || ""}
                  selectedArea={info?.area || ""}
                  onSelect={(newInfo) => { if (newInfo?.lat) handleLocationUpdate(Number(newInfo.lat), Number(newInfo.lon), newInfo); }}
                />
              </div>
            </div>
            <UseCurrentLocation onGetLocation={(gps, nearest) => { setUserPos(gps); if (nearest) setInfo(nearest); }} />
          </div>
        </div>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
          <div className="md:col-span-3 flex flex-col gap-6">
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-sm opacity-80"><MapPin className="w-4 h-4" /><span>{weather.location}</span></div>
              <h2 className="text-3xl mt-4">{weather.condition}</h2>
              <div className="text-7xl font-light tracking-tighter">{weather.temp}<span className="text-3xl">°C</span></div>
              <div className="text-sm opacity-70 border-t border-white/10 pt-4 mt-2">{weather.date}</div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1"><Droplets className="w-4 h-4 text-blue-300" /><span className="text-sm">{weather.humidity}%</span></div>
                <div className="flex items-center gap-1"><Wind className="w-4 h-4 text-gray-300" /><span className="text-sm">{weather.wind} m/s</span></div>
              </div>
            </div>
            <Button className="w-full bg-[#E57373] hover:bg-[#EF5350] text-white py-8 text-2xl rounded-full shadow-lg flex gap-3 justify-center" onClick={() => router.push("/sos")}><Phone className="w-8 h-8" /> SOS</Button>
          </div>

          <div className="md:col-span-4 h-full">
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 h-full flex flex-col shadow-xl">
              <h2 className="text-3xl text-center mb-6">Latest Update</h2>
              <div className="relative mb-6 z-50"> 
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={searchQuery} onChange={handleSearch} onKeyDown={handleKeyDown} onFocus={() => searchQuery && setShowSuggestions(true)} placeholder="Type 'Rain', 'Storm'..." className="w-full bg-white rounded-full py-2 pl-10 pr-10 text-black focus:outline-none" />
                {searchQuery && <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
                
                {/* [FIX] DROPDOWN GỢI Ý */}
                {showSuggestions && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto text-black">
                    {filteredLocations.map((loc, idx) => {
                      const distance = userPos 
                        ? getDistanceFromLatLonInKm(userPos.lat, userPos.lon, loc.lat, loc.lon)
                        : null;

                      return (
                        <div key={idx} className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0" onClick={() => { setSearchQuery(loc.name); setShowSuggestions(false); handleLocationUpdate(loc.lat, loc.lon, { province: loc.name }); }}>
                          <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-red-500" />
                             <span className="text-sm font-medium">{loc.name}</span>
                             {distance && distance !== "N/A" && <span className="text-xs text-gray-400 ml-1">({distance} km)</span>}
                          </div>
                          {/* [FIX] Hiển thị Label (Safe, Rain, Wind) */}
                          <Badge variant="outline" className={`text-[10px] capitalize ${getSeverityColor(loc.type)}`}>
                            {loc.type.toLowerCase() === 'no' ? 'Safe' : loc.type}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {calculating && <p className="text-center text-gray-400 mt-4">Scanning area...</p>}
                {!calculating && (!safetyInfo?.nearby_risks || safetyInfo.nearby_risks.length === 0) && (
                   <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-70"><ShieldAlert className="w-10 h-10 mb-2" /><p>No active threats nearby</p></div>
                )}
                {!calculating && safetyInfo?.nearby_risks?.map((risk: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" 
                    onClick={() => { 
                      if (risk.lat && risk.lon) handleLocationUpdate(Number(risk.lat), Number(risk.lon), { province: risk.location });
                    }}
                  >
                    <div className={`p-2 rounded-full ${
                        risk.severity === 'High' ? 'bg-red-500/20' : 
                        risk.severity === 'Medium' ? 'bg-orange-500/20' : 
                        risk.severity === 'Low' ? 'bg-yellow-500/20' :
                        'bg-green-500/20'
                    }`}>
                      {risk.severity === 'High' ? <Zap className="w-5 h-5 text-red-500" /> : 
                       risk.severity === 'Info' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                       <AlertTriangle className={`w-5 h-5 ${
                         risk.severity === 'Medium' ? 'text-orange-500' : 'text-yellow-500'
                       }`} />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate capitalize">
                          {risk.disaster_type === 'No' ? 'Safe' : risk.disaster_type}
                        </h3>
                        <Badge className={`text-[10px] h-5 px-1.5 ${
                            risk.severity === 'High' ? 'bg-red-500' : 
                            risk.severity === 'Medium' ? 'bg-orange-500' : 
                            risk.severity === 'Low' ? 'bg-yellow-500 text-black' :
                            'bg-green-500'
                        }`}>
                          {risk.distance} km
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1"><p className="text-xs text-gray-300 truncate max-w-[120px]">{risk.location}</p><span className="text-[10px] text-gray-500">{risk.time_ago}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5 h-full">
            <div className="bg-[#5F9EA0]/80 backdrop-blur-md rounded-3xl p-6 text-white border border-white/10 h-full flex flex-col relative overflow-hidden shadow-xl">
              <h2 className="text-3xl text-center mb-8">Safety Score</h2>
              <div className="flex items-center justify-between mb-8 px-4">
                <div>
                  <h3 className={`text-2xl font-medium mb-2 ${
                    safetyInfo?.risk_level === 'High' ? "text-red-500 animate-pulse" :
                    safetyInfo?.risk_level === 'Medium' ? "text-orange-400" :
                    safetyInfo?.risk_level === 'Low' ? "text-yellow-400" : 
                    "text-[#22c55e]"
                  }`}>
                    {!safetyInfo ? "Ready to scan" : 
                      safetyInfo.risk_level === 'High' ? "CRITICAL THREAT!" :
                      safetyInfo.risk_level === 'Medium' ? "Warning: Risk Nearby" :
                      safetyInfo.risk_level === 'Low' ? "Caution Advised" :
                      "You are safe!"
                    }
                  </h3>
                  <p className="text-sm opacity-90 max-w-[180px]">{safetyInfo?.message || "Select a location."}</p>
                </div>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {(() => {
                    const r = 40;
                    const circumference = 2 * Math.PI * r; 
                    const score = safetyInfo?.safety_score ?? 100;
                    const offset = circumference - (score / 100) * circumference;

                    let circleColor = "text-[#22c55e]";
                    if (safetyInfo?.risk_level === 'High') circleColor = "text-red-500";
                    else if (safetyInfo?.risk_level === 'Medium') circleColor = "text-orange-400";
                    else if (safetyInfo?.risk_level === 'Low') circleColor = "text-yellow-400";

                    return (
                      <svg
                        className="w-full h-full -rotate-90 transition-all duration-1000 ease-out"
                        viewBox="0 0 100 100"
                      >
                        <circle className="text-white/20" strokeWidth="8" stroke="currentColor" fill="transparent" r={r} cx="50" cy="50" />
                        <circle className={`${circleColor} transition-all duration-1000 ease-out`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={r} cx="50" cy="50" />
                      </svg>
                    );
                  })()}
                  <span className="absolute text-3xl font-bold animate-in fade-in zoom-in duration-700">{safetyInfo?.safety_score ?? 100}%</span>
                </div>
              </div>

              <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[250px] border border-white/20">
                <MapContainer center={[21.0285, 105.8542]} zoom={10} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                  
                  {userPos && <MapController center={userPos} />}
                  {L && userPos && <UserMarker position={userPos} L={L} />}
                  
                  {allLocations.map((loc, index) => {
                    const centerLat = userPos?.lat || 21.0285;
                    const centerLon = userPos?.lon || 105.8542;
                    const distance = getDistanceFromLatLonInKm(centerLat, centerLon, Number(loc.lat), Number(loc.lon));
                    
                    if (distance !== "N/A" && Number(distance) > 200) return null;
                    if (!loc.polygon || loc.polygon.length === 0) return null;

                    return (
                      <Polygon
                        key={`risk-poly-${index}`}
                        positions={loc.polygon} 
                        pathOptions={{ 
                            color: loc.color || 'red', 
                            fillColor: loc.color || 'red',
                            fillOpacity: 0.2,
                            weight: 1
                        }}
                      >
                         <Popup><strong>{loc.name}</strong><br/>Risk: {loc.type} ({loc.severity})</Popup>
                      </Polygon>
                    );
                  })}
                </MapContainer>
                <Button className="absolute bottom-4 right-4 bg-white text-black hover:bg-gray-200 text-xs h-8" onClick={() => router.push("/map")}>Expand Map</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}