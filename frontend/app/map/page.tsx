"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

import FlyToLocation from "@/components/FlyToLocation";
import LocationSelector from "@/components/LocationSelector";
import UseCurrentLocation from "@/components/UseCurrentLocation";
import UserMarker from "@/components/UserMarker.client";
import { getNearestLocation } from "@/lib/location/getNearestLocation";

import {
  MapPin,
  Phone,
  Droplets,
  Search,
  X,
  AlertTriangle,
  Zap,
  ShieldAlert,
} from "lucide-react";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic react-leaflet (client only)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
// Marker is provided by `UserMarker.client.tsx` — no direct dynamic import here.

const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);
// Load Leaflet safely on client
const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Hàm tính khoảng cách giữa 2 tọa độ (đơn vị: km)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Bán kính trái đất (km)
  var dLat = (lat2 - lat1) * (Math.PI / 180);
  var dLon = (lon2 - lon1) * (Math.PI / 180);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Khoảng cách (km)
  return d;
}

export default function HomePage() {
  const router = useRouter();
  const language = useStore((state) => state.language);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const t = useTranslation(language);

  const [info, setInfo] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [safetyInfo, setSafetyInfo] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allLocations, setAllLocations] = useState<any[]>([]); // Chứa danh sách tất cả địa điểm
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]); // Kết quả tìm kiếm
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hàm tính khoảng cách đơn giản (km) để sắp xếp bên Frontend
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  
  const fetchSafetyScore = async (lat: number, lon: number) => {
    setCalculating(true);
    try {
      // Đổi URL này cho đúng với backend của bạn
      const response = await fetch('http://localhost:8000/api/v1/map/check-risk', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: lat, lon: lon }) 
      });

      const data = await response.json();
      // Ánh xạ dữ liệu từ Backend sang format mà Frontend đang dùng để hiển thị
      const mappedRisks = (data.all_risks || []).map((item: any) => ({
          disaster_type: item.type,       // Backend trả 'type' -> UI cần 'disaster_type'
          location: item.location,        // Giữ nguyên
          distance: item.distance_km,     // Backend trả 'distance_km' -> UI cần 'distance'
          severity: item.level,           // Backend trả 'level' -> UI cần 'severity'
          time_ago: "Live update"         // Backend chưa có -> Tự thêm chuỗi hiển thị
      }));

      setSafetyInfo({
          safety_score: data.safety_score,
          risk_level: data.nearest_risk?.level || 'Safe',
          message: data.message,
          nearby_risks: mappedRisks       // Sử dụng danh sách đã được map lại
      });
    } catch (error) {
      console.error("Lỗi tính điểm an toàn:", error);
    } finally {
      setCalculating(false);
    }
  };
  const handleLocationUpdate = (lat: number, lon: number, locationInfo?: any) => {
    // 1. Cập nhật vị trí để Map bay tới đó
    setUserPos({ lat, lon });
    
    // 2. Nếu có thông tin tên địa danh thì cập nhật (optional)
    if (locationInfo) setInfo(locationInfo);

    // 3. Quan trọng: Gọi API tính điểm ngay lập tức
    fetchSafetyScore(lat, lon);
  };
 useEffect(() => {
    // Logic: Khi người dùng định vị hoặc chọn điểm trên bản đồ -> gọi backend
    if (userPos) {
      fetchSafetyScore(userPos.lat, userPos.lon);
    }
  }, [userPos]);
  // Load Leaflet safely (client only)
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

  // Auto detect user location — set both GPS (for map) and nearest (for dropdowns)
  useEffect(() => {
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;


      // Also fetch nearest location (CSV) for dropdowns / weather
      const nearest = await getNearestLocation(latitude, longitude);
      handleLocationUpdate(latitude, longitude, nearest);
    });
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/map/zones');
        if (!res.ok) {
            console.warn("API Locations returned status:", res.status);
            setAllLocations([]); // Set rỗng để không bị lỗi
            return;
        }

        const data = await res.json();
        const mappedData = data.map((item: any) => ({
            name: item.id,                 // Backend dùng 'id' là tên
            lat: item.center[0],           // Backend trả mảng [lat, lon]
            lon: item.center[1],
            type: item.info?.type || "",   // Lấy type trong object info
            severity: item.risk_level,      // Lấy level để hiện màu
            path: item.path,       // Mảng toạ độ để vẽ hình đa giác
            color: item.color,     // Màu sắc (Backend đã tính theo Safety Score)
        }));
        setAllLocations(mappedData);        
      } catch (e) {
        console.error("Lỗi load locations:", e);
        setAllLocations([]);
      }
    };
    fetchLocations();
  }, []);

  // Hàm xử lý khi gõ phím
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase(); // Chuyển chữ thường
    setSearchQuery(e.target.value); // Giữ nguyên chữ hoa/thường trên ô input cho đẹp
    
    if (query.length > 0) {
      if (!Array.isArray(allLocations)) {
          console.warn("allLocations is not an array, skipping search.");
          setFilteredLocations([]);
          return;
      }
      // 1. LỌC: Tìm trong cả TÊN (Hanoi) và LOẠI (Rain, Storm)
      let filtered = allLocations.filter(loc => 
        loc.name.toLowerCase().includes(query) || 
        loc.type.toLowerCase().includes(query) // <--- Thêm dòng này
      );

      // 2. SẮP XẾP: Nếu đã có vị trí người dùng, đưa địa điểm gần nhất lên đầu
      if (userPos) {
         filtered.sort((a, b) => {
            // Tính khoảng cách đơn giản (Pythagoras) để so sánh nhanh
            const distA = Math.pow(a.lat - userPos.lat, 2) + Math.pow(a.lon - userPos.lon, 2);
            const distB = Math.pow(b.lat - userPos.lat, 2) + Math.pow(b.lon - userPos.lon, 2);
            return distA - distB; // Số nhỏ hơn (gần hơn) xếp trước
         });
      }

      setFilteredLocations(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Hàm xử lý phím Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowSuggestions(false); // Tắt dropdown gợi ý
      
      // Nếu chưa định vị được người dùng thì không làm gì cả
      if (!userPos) return; 

      const query = searchQuery.toLowerCase().trim();
      
      // --- [THÊM MỚI] NẾU Ô NHẬP RỖNG -> RESET VỀ TRẠNG THÁI QUÉT 50KM ---
      if (!query) {
         // Gọi lại API gốc để quét lại 50km xung quanh vị trí hiện tại
         fetchSafetyScore(userPos.lat, userPos.lon);
         return; // Dừng hàm, không chạy logic tìm kiếm bên dưới
      }
      // ------------------------------------------------------------------

      const RADIUS_LIMIT = 50; // Giới hạn 50km

      // --- TRƯỜNG HỢP 1: TÌM CÁI GẦN NHẤT ("Closest...", "Nearest...") ---
      if (query.includes("closest") || query.includes("nearest")) {
        // ... (Giữ nguyên code cũ của phần này)
        const keyword = query.replace("closest", "").replace("nearest", "").trim();
        const matches = allLocations.filter(loc => 
          loc.type.toLowerCase().includes(keyword) || loc.name.toLowerCase().includes(keyword)
        );

        if (matches.length > 0) {
          const matchesWithDist = matches.map(loc => ({
              ...loc,
              distance: calcDistance(userPos.lat, userPos.lon, loc.lat, loc.lon)
          }));
          matchesWithDist.sort((a, b) => a.distance - b.distance);
          const bestMatch = matchesWithDist[0];
          
          if (bestMatch.distance <= RADIUS_LIMIT) {
             handleLocationUpdate(bestMatch.lat, bestMatch.lon, { province: bestMatch.name, area: bestMatch.type });
             setSearchQuery(bestMatch.name);
          } else {
             alert(`Found "${keyword}" but it's too far (${bestMatch.distance}km). Only showing results within 50km.`);
          }
        }
      } 
      
      // --- TRƯỜNG HỢP 2: TÌM DANH SÁCH ("Rain", "Storm"...) ---
      else {
         // ... (Giữ nguyên code cũ của phần này)
        const matches = allLocations.filter(loc => 
           loc.type.toLowerCase().includes(query) || loc.name.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
          const listForUI = matches.map(loc => ({
             disaster_type: loc.type,
             location: loc.name,
             distance: calcDistance(userPos.lat, userPos.lon, loc.lat, loc.lon),
             severity: loc.severity || 'Medium',
             time_ago: 'Found'
          }));

          const filteredByRadius = listForUI.filter(item => item.distance <= RADIUS_LIMIT);
          filteredByRadius.sort((a, b) => a.distance - b.distance);

          if (filteredByRadius.length > 0) {
             setSafetyInfo((prev: any) => ({
                ...prev,
                nearby_risks: filteredByRadius,
                message: `Found ${filteredByRadius.length} results for "${searchQuery}" within 50km`
             }));
          } else {
             setSafetyInfo((prev: any) => ({
                ...prev,
                nearby_risks: [], 
                message: `No "${searchQuery}" found within 50km.`
             }));
          }
        } else {
           setSafetyInfo((prev: any) => ({
              ...prev,
              nearby_risks: [],
              message: `No results found for "${searchQuery}".`
           }));
        }
      }
    }
  };
  const [weather, setWeather] = useState({
    temp: 26,
    condition: "Cloudy",
    humidity: 66,
    location: "Select Location",
    date: "",
  });

  // Format date once
  useEffect(() => {
    const now = new Date();
    const formatted = now
      .toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(",", " |");

    setWeather((prev) => ({ ...prev, date: formatted }));
  }, []);

  // Load weather when location changes
  useEffect(() => {
    if (!info?.lat || !info?.lon) return;

    const loadWeather = async () => {
      const url = "https://api.openweathermap.org/data/2.5/weather";

      const params = new URLSearchParams({
        lat: info.lat,
        lon: info.lon,
        appid: process.env.NEXT_PUBLIC_OWM_API_KEY!,
        units: "metric",
        lang: "en",
      });

      try {
        const res = await fetch(`${url}?${params.toString()}`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) throw new Error(`Weather status ${res.status}`);
        if (!ct.includes("application/json")) {
          const text = await res.text();
          console.error("Weather endpoint returned non-json:", text);
          return;
        }
        const data = await res.json();

        setWeather((prev) => ({
          ...prev,
          temp: Math.round(data.main?.temp || 26),
          condition: capitalizeFirst(
            data.weather?.[0]?.description || "Unknown"
          ),
          humidity: data.main?.humidity || 66,
          location: info.area ? `${info.area}, ${info.province}` : info.province,
        }));
      } catch (e) {
        console.error("Weather load error:", e);
      }
    };

    loadWeather();
  }, [info]);
  

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Storm Background"
          fill
          className="object-cover"
          priority
        />
        <div
          className={`absolute inset-0 ${
            isDarkMode ? "bg-black/80" : "bg-black/30"
          }`}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        {/* LOCATION SELECTOR */}
        <div className="bg-black/40 backdrop-blur-lg p-4 rounded-3xl border border-white/10 max-w-7xl w-full mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            {/* PROVINCE + AREA */}
            <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="w-full md:w-1/1">
            <LocationSelector
              selectedProvince={info?.province || ""}
              selectedArea={info?.area || ""}
              onSelect={(newInfo) => {
                // If user explicitly picks a location from dropdown, clear GPS override
                if (newInfo?.lat && newInfo?.lon) {
                  handleLocationUpdate(Number(newInfo.lat), Number(newInfo.lon), newInfo);
                }
              }}
            />
          </div>

        </div>

            {/* CURRENT LOCATION BUTTON */}
        <UseCurrentLocation
          onGetLocation={(gps, nearest) => {
            // gps is the real device coordinates — use for the map
            setUserPos(gps);
            // nearest (from CSV) is used for dropdowns / weather; only set if available
            if (nearest) setInfo(nearest);
          }}
        />

      </div>
    </div>


        {/* MAIN GRID */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
          {/* LEFT COLUMN */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {/* WEATHER CARD */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <MapPin className="w-4 h-4" />
                <span>{weather.location}</span>
              </div>

              <h2 className="text-3xl mt-4">{weather.condition}</h2>

              <div className="text-7xl font-light tracking-tighter">
                {weather.temp}
                <span className="text-3xl">°C</span>
              </div>

              <div className="text-sm opacity-70 border-t border-white/10 pt-4 mt-2">
                {weather.date}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Droplets className="w-5 h-5 text-blue-300" />
                <div>
                  <p className="text-sm opacity-80">Humidity</p>
                  <p className="text-xl font-semibold">
                    {weather.humidity}% 
                  </p>
                </div>
              </div>
            </div>

            {/* SOS BUTTON */}
            <Button
              className="w-full bg-[#E57373] hover:bg-[#EF5350] text-white py-8 text-2xl rounded-full shadow-lg flex gap-3 justify-center"
              onClick={() => router.push("/sos")}
            >
              <Phone className="w-8 h-8" /> SOS
            </Button>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="md:col-span-4 h-full">
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 h-full flex flex-col shadow-xl">
              <h2 className="text-3xl text-center mb-6">Latest Update</h2>

              {/* SEARCH BAR - ĐÃ NÂNG CẤP */}
              <div className="relative mb-6 z-50"> 
                {/* z-50 để danh sách gợi ý hiện lên trên các cái khác */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  onKeyDown={handleKeyDown}  // <--- THÊM DÒNG NÀY
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  placeholder="Type 'Rain' or 'Closest Rain'..." // <--- Sửa placeholder cho người dùng biết
                  className="w-full bg-white rounded-full py-2 pl-10 pr-10 text-black placeholder:text-gray-500 focus:outline-none"
                />
                
                {/* Nút xoá tìm kiếm */}
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* DANH SÁCH GỢI Ý (DROPDOWN) */}
                {showSuggestions && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto text-black">
                    {filteredLocations.map((loc, idx) => (
                      <div 
                        key={idx}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0"
                        onClick={() => {
                          // 1. Chọn địa điểm -> Điền vào ô input
                          setSearchQuery(loc.name);
                          setShowSuggestions(false);
                          
                          // 2. Gọi hàm update chung (Bay map + Tính điểm)
                          handleLocationUpdate(loc.lat, loc.lon, { 
                            province: loc.name, // Giả lập tên tỉnh
                            area: loc.type 
                          });
                        }}
                      >
                        <div className="flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-red-500" />
                           <span className="text-sm font-medium">{loc.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize text-gray-500 border-gray-300">
                          {loc.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ALERT LIST - ĐÃ CẬP NHẬT DYNAMIC */}
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                
                {/* Trường hợp đang tính toán */}
                {calculating && (
                   <p className="text-center text-gray-400 mt-4">Scanning area...</p>
                )}

                {/* Trường hợp KHÔNG CÓ rủi ro nào (Hoặc chưa quét) */}
                {!calculating && (!safetyInfo?.nearby_risks || safetyInfo.nearby_risks.length === 0) && (
                   <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-70">
                      <ShieldAlert className="w-10 h-10 mb-2" />
                      <p>No active threats nearby</p>
                   </div>
                )}

                {/* Trường hợp CÓ rủi ro -> Vẽ danh sách */}
                {!calculating && safetyInfo?.nearby_risks?.map((risk: any, index: number) => (
                  <div 
                  key={index} 
                  className="bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-white/5 animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => {
                    // Tìm toạ độ của rủi ro này trong danh sách allLocations
                    // (Vì API check-risk hiện tại chỉ trả về tên, chưa chắc có lat/lon)
                    const targetLoc = allLocations.find(l => l.name === risk.location);
                    if (targetLoc) {
                    // Cập nhật thông tin để hiển thị marker
                        setInfo({
                        lat: targetLoc.lat,
                        lon: targetLoc.lon,
                        province: risk.location,
                        area: ""
                        });
                        setUserPos(null); 
                    } else {
                        console.warn("Không tìm thấy toạ độ cho:", risk.location);
                      }
                  }}
                  >
                    
                    
                    {/* Icon thay đổi theo mức độ */}
                    <div className={`p-2 rounded-full ${
                        risk.severity === 'High' ? 'bg-red-500/20' : 
                        risk.severity === 'Medium' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                    }`}>
                      {risk.severity === 'High' ? <Zap className="w-5 h-5 text-red-500" /> : 
                       <AlertTriangle className={`w-5 h-5 ${
                         risk.severity === 'Medium' ? 'text-orange-500' : 'text-yellow-500'
                       }`} />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate capitalize">
                          {risk.disaster_type}
                        </h3>
                        <Badge className={`text-[10px] h-5 px-1.5 ${
                            risk.severity === 'High' ? 'bg-red-500' : 
                            risk.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500 text-black'
                        }`}>
                          {risk.distance} km
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                         <p className="text-xs text-gray-300 truncate max-w-[120px]">
                           {risk.location}
                         </p>
                         <span className="text-[10px] text-gray-500">{risk.time_ago}</span>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - MAP */}
          <div className="md:col-span-5 h-full">
            <div className="bg-[#5F9EA0]/80 backdrop-blur-md rounded-3xl p-6 text-white border border-white/10 h-full flex flex-col relative overflow-hidden shadow-xl">
              <h2 className="text-3xl text-center mb-8">Safety Score</h2>

              {/* PROGRESS BAR */}
              <div className="flex items-center justify-between mb-8 px-4">
                <div>
                  {/* 1. TIÊU ĐỀ ĐỘNG (Thay đổi theo mức độ rủi ro) */}
                  <h3 className={`text-2xl font-medium mb-2 ${
                    // Nếu rủi ro cao (High) thì đổi màu chữ thành Đỏ
                    safetyInfo?.risk_level === 'High' ? "text-red-500 animate-pulse" :
                    safetyInfo?.risk_level === 'Medium' ? "text-orange-400" :
                    safetyInfo?.risk_level === 'Low' ? "text-yellow-400" :
                    "text-white"
                  }`}>
                    {/* Logic chọn chữ để hiển thị */}
                    {!safetyInfo ? "Ready to scan" : 
                      safetyInfo.risk_level === 'High' ? "CRITICAL THREAT!" :
                      safetyInfo.risk_level === 'Medium' ? "Warning: Risk Nearby" :
                      safetyInfo.risk_level === 'Low' ? "Caution Advised" :
                      "You are safe!"
                    }
                  </h3>

                  {/* 2. NỘI DUNG CHI TIẾT (Lấy từ message của Backend) */}
                  <p className="text-sm opacity-90 max-w-[180px]">
                    {/* Hiển thị message từ Backend (VD: "Phát hiện bão cách 30km...") */}
                    {safetyInfo?.message || "Select a location to check safety."}
                  </p>
                </div>

                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Tính toán các thông số vòng tròn */}
                  {(() => {
                    const r = 40;
                    const circumference = 2 * Math.PI * r; // Chu vi ~ 251.3
                    const score = safetyInfo?.safety_score ?? 0; // Lấy điểm thật, mặc định 0
                    const offset = circumference - (score / 100) * circumference; // Tính độ hở

                    // Xác định màu sắc dựa trên mức độ rủi ro
                    let circleColor = "text-green-500"; // Mặc định an toàn (Safe)
                    if (safetyInfo?.risk_level === 'High') circleColor = "text-red-500";
                    else if (safetyInfo?.risk_level === 'Medium') circleColor = "text-orange-400";
                    else if (safetyInfo?.risk_level === 'Low') circleColor = "text-yellow-400";

                    return (
                      <svg
                        className="w-full h-full -rotate-90 transition-all duration-1000 ease-out"
                        viewBox="0 0 100 100"
                      >
                        {/* Vòng tròn nền (mờ) */}
                        <circle
                          className="text-white/20"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r={r}
                          cx="50"
                          cy="50"
                        />
                        {/* Vòng tròn điểm số (chạy theo %) */}
                        <circle
                          className={`${circleColor} transition-all duration-1000 ease-out`}
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r={r}
                          cx="50"
                          cy="50"
                        />
                      </svg>
                    );
                  })()}
                  
                  {/* Số điểm ở giữa */}
                  <span className="absolute text-3xl font-bold animate-in fade-in zoom-in duration-700">
                    {safetyInfo?.safety_score ?? 0}%
                  </span>
                </div>
              </div>

              {/* MAP */}
              <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[250px] border border-white/20">
                <MapContainer
                  center={[
                    userPos?.lat
                      ? Number(userPos.lat)
                      : info?.lat
                      ? Number(info.lat)
                      : 21.0285,
                    userPos?.lon
                      ? Number(userPos.lon)
                      : info?.lon
                      ? Number(info.lon)
                      : 105.8542,
                  ]}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ width: "100%", height: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />

                  {(userPos?.lat && userPos?.lon) ? (
                    <FlyToLocation lat={Number(userPos.lat)} lon={Number(userPos.lon)} />
                  ) : (
                    info?.lat && info?.lon && (
                      <FlyToLocation lat={Number(info.lat)} lon={Number(info.lon)} />
                    )
                  )}

                  {/* CUSTOM MARKER */}
                  {L && (userPos || info) && (
                    <UserMarker
                      position={
                        userPos
                          ? { lat: Number(userPos.lat), lon: Number(userPos.lon) }
                          : { lat: Number(info.lat), lon: Number(info.lon) }
                      }
                      L={L}
                    />
                  )}
                  {allLocations.map((loc, index) => {
                    // 1. Xác định tâm để tính khoảng cách (ưu tiên vị trí User, nếu không có thì lấy tâm map)
                    const centerLat = userPos?.lat ? Number(userPos.lat) : (info?.lat ? Number(info.lat) : 0);
                    const centerLon = userPos?.lon ? Number(userPos.lon) : (info?.lon ? Number(info.lon) : 0);

                    // 2. Tính khoảng cách từ User đến vùng rủi ro
                    const distance = getDistanceFromLatLonInKm(centerLat, centerLon, Number(loc.lat), Number(loc.lon));

                    // 3. Nếu xa quá 50km thì KHÔNG VẼ (return null)
                    if (distance > 50 || !loc.path || loc.path.length === 0) return null;

                    // 4. Chọn màu sắc dựa trên mức độ rủi ro (hoặc loại thiên tai)
                    return (
                      <Polygon
                        key={`risk-poly-${index}`}
                        positions={loc.path} // Dữ liệu hình dáng từ Backend
                        pathOptions={{ 
                            color: loc.color,       // Màu viền (theo Safety Score)
                            fillColor: loc.color,   // Màu nền
                            fillOpacity: 0.4,       // Độ đậm nhạt (0.4 là vừa đẹp)
                            weight: 2               // Độ dày viền
                        }}
                      />
                    );
                  })}
                  {/* -------------------------------------- */}
                </MapContainer>

                <Button
                  className="absolute bottom-4 right-4 bg-white text-black hover:bg-gray-200 text-xs h-8"
                  onClick={() => router.push("/map")}
                >
                  Expand Map
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
