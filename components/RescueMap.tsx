'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import L from 'leaflet'
import 'leaflet-routing-machine'

// --- 1. Fix Icon Leaflet ---
const iconFix = () => {
  if (typeof window !== 'undefined' && !(L.Icon.Default.prototype as any)._fixed) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    (L.Icon.Default.prototype as any)._fixed = true; // Đánh dấu đã fix để không chạy lại
  }
};

interface RescueMapProps {
  userLocation: { lat: number; lng: number } | null
  destination: { lat: number; lng: number; name?: string; address?: string } | null
  onRouteFound?: (summary: { totalDistance: number; totalTime: number }) => void
}

// --- 2. Component Routing (Được tách riêng để dùng hook useMap) ---
const RoutingMachine = ({ userLocation, destination, onRouteFound }: any) => {
  const map = useMap();
  // Dùng ref để giữ instance của routing control
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    // Safety check: Nếu map chưa sẵn sàng hoặc thiếu tọa độ -> bỏ qua
    if (!map || !userLocation?.lat || !userLocation?.lng) return;

    // Định nghĩa điểm đi và đến
    const waypoints = [
      L.latLng(userLocation.lat, userLocation.lng)
    ];

    if (destination?.lat && destination?.lng) {
      waypoints.push(L.latLng(destination.lat, destination.lng));
    }

    // --- LOGIC KHỞI TẠO HOẶC CẬP NHẬT ---
    if (!routingControlRef.current) {
      // a. Nếu chưa có control -> Tạo mới
      try {
        const routingControl = (L as any).Routing.control({
          waypoints: waypoints,
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          show: false, // Ẩn bảng text chỉ đường để tránh lỗi DOM
          collapsible: true,
          addWaypoints: false, // Cấm kéo thả thêm điểm (tránh lỗi)
          draggableWaypoints: false,
          lineOptions: {
            styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
          },
          createMarker: () => null, // Không tạo marker mặc định của library
          router: new (L as any).Routing.OSRMv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          })
        });

        // Lắng nghe sự kiện tìm đường
        routingControl.on('routesfound', (e: any) => {
          const routes = e.routes;
          const summary = routes[0].summary;

          // Tạo popup hiển thị khoảng cách
          try {
            const midIndex = Math.floor(routes[0].coordinates.length / 2);
            const midPoint = routes[0].coordinates[midIndex];
            
            // Xóa popup cũ nếu có (để tránh chồng chéo)
            map.closePopup();

            L.popup()
              .setLatLng(midPoint)
              .setContent(`
                <div style="text-align: center; font-family: sans-serif;">
                  <b style="color: #ea580c;">${(summary.totalDistance / 1000).toFixed(1)} km</b><br/>
                  ~ ${Math.round(summary.totalTime / 60)} phút
                </div>
              `)
              .openOn(map);
          } catch (err) {
            // Bỏ qua lỗi popup nếu map đang unmount
          }

          if (onRouteFound) onRouteFound(summary);
        });

        // Thêm vào map
        routingControl.addTo(map);
        routingControlRef.current = routingControl;
      } catch (e) {
        console.warn("Lỗi khởi tạo routing:", e);
      }
    } else {
      // b. Nếu đã có control -> Chỉ cập nhật điểm (Set Waypoints)
      // Cách này an toàn hơn là remove đi add lại
      try {
        routingControlRef.current.setWaypoints(waypoints);
      } catch (e) {
        console.warn("Lỗi cập nhật routing:", e);
      }
    }

    // --- CLEANUP FUNCTION AN TOÀN ---
    // Chỉ chạy khi component unmount hẳn
    return () => {
      // Không làm gì cả! 
      // Lý do: Việc cố gắng map.removeControl() ở đây thường gây ra lỗi "_removePath of undefined"
      // nếu map container đã bị React hủy trước đó.
      // Leaflet sẽ tự dọn dẹp khi MapContainer bị hủy.
      // Tuy nhiên, nếu muốn chắc chắn reset khi đổi trang, ta có thể set waypoints về rỗng.
      if (routingControlRef.current) {
        try {
            routingControlRef.current.setWaypoints([]); 
        } catch (e) {}
      }
    };
  }, [map, userLocation, destination]); // Re-run khi tọa độ thay đổi

  return null;
};

// --- 3. Component Chính ---
const RescueMap = ({ userLocation, destination, onRouteFound }: RescueMapProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    iconFix();
    setReady(true);
  }, []);

  // Safety Guard: Chặn render nếu chưa có location hoặc chưa mounted
  if (!ready || !userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 rounded-lg border border-slate-700">
            <div className="flex flex-col items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"/>
                <span className="text-xs">Đang tải bản đồ...</span>
            </div>
        </div>
    );
  }

  // KEY TRICK: Dùng 'key' dựa trên lat/lng để buộc React vẽ lại MapContainer mới hoàn toàn
  // khi vị trí thay đổi quá lớn (hoặc khi mới load). Điều này KHẮC PHỤC LỖI "Map container is being reused".
  // Tuy nhiên, để map mượt (không nháy), ta chỉ dùng key cố định hoặc thay đổi ít.
  // Ở đây tôi dùng key cố định "rescue-map-container" để React tái sử dụng instance,
  // nhưng logic bên trong RoutingMachine sẽ handle việc update.
  
  return (
    <MapContainer 
      key="unique-rescue-map-id" // Key cố định để tránh remount liên tục
      center={[userLocation.lat, userLocation.lng]} 
      zoom={14} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }} // zIndex 0 để không đè dialog
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Marker Vị trí của bạn */}
      <Marker position={[userLocation.lat, userLocation.lng]}>
        <Popup>Vị trí hiện tại</Popup>
      </Marker>

      {/* Marker Đích */}
      {destination && destination.lat && destination.lng && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>
            <div className="font-bold">{destination.name || "Trạm cứu hộ"}</div>
          </Popup>
        </Marker>
      )}

      {/* Routing Controller */}
      <RoutingMachine 
        userLocation={userLocation} 
        destination={destination} 
        onRouteFound={onRouteFound}
      />
    </MapContainer>
  )
}

export default RescueMap