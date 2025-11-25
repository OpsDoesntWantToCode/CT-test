"use client";

import { useEffect, useState } from "react";

interface LocationInfo {
  province: string;
  area: string;
  lat: string;
  lon: string;
  [key: string]: any;
}

export default function LocationSelector({
  onSelect,
  selectedProvince = "",
  selectedArea = "",
}: {
  onSelect: (info: LocationInfo | null) => void;
  selectedProvince: string;
  selectedArea: string;
}) {
  // ==========================
  // STATES
  // ==========================
  const [provinces, setProvinces] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  const [province, setProvince] = useState(selectedProvince);
  const [area, setArea] = useState(selectedArea);

  // ==========================
  // Đồng bộ khi HomePage update info
  // ==========================
  useEffect(() => {
    setProvince(selectedProvince);
  }, [selectedProvince]);

  useEffect(() => {
    setArea(selectedArea);
  }, [selectedArea]);

  // ==========================
  // LOAD danh sách TỈNH
  // ==========================
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/locations/provinces");
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) throw new Error(`Status ${res.status}`);
        if (!ct.includes("application/json")) {
          const text = await res.text();
          console.error("Province endpoint returned non-json:", text);
          return;
        }
        const data: string[] = await res.json();
        setProvinces(data);
      } catch (e) {
        console.error("Province load error:", e);
      }
    })();
  }, []);

  // ==========================
  // LOAD danh sách KHU VỰC khi TỈNH thay đổi
  // ==========================
  useEffect(() => {
    if (!province) {
      setAreas([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/locations/areas?province=${encodeURIComponent(province)}`
        );
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) throw new Error(`Status ${res.status}`);
        if (!ct.includes("application/json")) {
          const text = await res.text();
          console.error("Areas endpoint returned non-json:", text);
          return;
        }
        const data: string[] = await res.json();
        setAreas(data);
      } catch (e) {
        console.error("Area load error:", e);
      }
    })();
  }, [province]);

  // ==========================
  // Khi người dùng chọn tỉnh
  // ==========================
  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setArea("");

    // Reset khu vực + gửi info trống
    onSelect({
      province: value,
      area: "",
      lat: "",
      lon: "",
    });
  };

  // ==========================
  // Khi người dùng chọn area
  // ==========================
  const handleAreaChange = async (value: string) => {
    setArea(value);
    try {
      const res = await fetch(
        `/api/locations/info?province=${encodeURIComponent(
          province
        )}&area=${encodeURIComponent(value)}`
      );
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) throw new Error(`Status ${res.status}`);
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Info endpoint returned non-json:", text);
        onSelect(null);
        return;
      }
      const info = await res.json();
      onSelect(info);
    } catch (e) {
      console.error("Info load error:", e);
      onSelect(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">

      {/* DROPDOWN TỈNH */}
      <select
        className="bg-white text-black px-4 py-2 rounded-xl w-full"
        value={province}
        onChange={(e) => handleProvinceChange(e.target.value)}
      >
        <option value="">Chọn tỉnh</option>

        {provinces.map((p, i) => (
          <option key={`${p}-${i}`} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* DROPDOWN KHU VỰC */}
      <select
        className="bg-white text-black px-4 py-2 rounded-xl w-full"
        value={area}
        onChange={(e) => handleAreaChange(e.target.value)}
        disabled={!province}
      >
        <option value="">Chọn khu vực</option>

        {areas.map((a, i) => {
          const clean = a.trim();
          const unique = `${province.trim()}-${clean}-${i}`;
          return (
            <option key={unique} value={clean}>
              {clean}
            </option>
          );
        })}
      </select>
    </div>
  );
}
