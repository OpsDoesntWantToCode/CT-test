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

// Load Leaflet safely on client
const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export default function HomePage() {
  const router = useRouter();
  const language = useStore((state) => state.language);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const t = useTranslation(language);

  const [info, setInfo] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  
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

      // Set GPS position for map centering
      setUserPos({ lat: latitude, lon: longitude });

      // Also fetch nearest location (CSV) for dropdowns / weather
      const nearest = await getNearestLocation(latitude, longitude);
      setInfo(nearest);
    });
  }, []);

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
          location: `${info.area}, ${info.province}`,
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
                setUserPos(null);
                setInfo(newInfo);
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

              {/* SEARCH BAR */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Closest Storm?"
                  className="w-full bg-white rounded-full py-2 pl-10 pr-10 text-black placeholder:text-gray-500 focus:outline-none"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ALERT LIST */}
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className="bg-yellow-500/20 p-2 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm truncate">
                        Heavy Storm - 2.5 km
                      </h3>
                      <Badge className="bg-orange-500 text-[10px] h-5 px-1.5">
                        See age
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">5m ago</p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className="bg-red-500/20 p-2 rounded-full">
                    <Zap className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm truncate">
                        Thunderstorm - Nearby
                      </h3>
                      <Badge className="bg-red-500 text-[10px] h-5 px-1.5">
                        Just now
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">Just now</p>
                  </div>
                </div>
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
                  <h3 className="text-2xl font-medium mb-2">You are safe!</h3>
                  <p className="text-sm opacity-90">
                    No critical threats nearby.
                  </p>
                </div>

                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="text-white/20"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-white"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - 78 / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">78%</span>
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
