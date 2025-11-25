"use client";

import { getNearestLocation } from "@/lib/location/getNearestLocation";
import { useState } from "react";

export default function UseCurrentLocation({
  onGetLocation,
}: {
  onGetLocation: (gps: { lat: number; lon: number }, nearest: any) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          let nearest = null;
          try {
            nearest = await getNearestLocation(latitude, longitude);
          } catch (e) {
            console.error("getNearestLocation failed:", e);
          }

          // Always call onGetLocation with GPS (nearest may be null on error)
          try {
            onGetLocation(
              { lat: latitude, lon: longitude }, // vị trí thật
              nearest // nearest từ CSV or null
            );
          } catch (e) {
            console.error("onGetLocation callback failed:", e);
          }

          setLoading(false);
        },
        () => {
          alert("Không lấy được vị trí GPS.");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-2 bg-blue-500 text-white rounded-xl"
    >
      {loading ? "Locating..." : "Your Current Location"}
    </button>
  );
}
