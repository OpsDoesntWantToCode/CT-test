'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import L from 'leaflet'
import 'leaflet-routing-machine'

const iconFix = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

interface RescueMapProps {
  userLocation: { lat: number; lon: number }
  destination: { lat: number; lon: number; name: string; address: string } | null
  onRouteFound?: (summary: { totalDistance: number; totalTime: number }) => void
}

// Component xử lý Routing tách biệt
const RoutingMachine = ({ userLocation, destination, onRouteFound }: any) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  // 1. Effect khởi tạo và cập nhật đường đi
  useEffect(() => {
    if (!map || !userLocation) return;

    // Chuẩn bị danh sách điểm đi qua (Waypoints)
    const waypoints = [
      L.latLng(userLocation.lat, userLocation.lon)
    ];

    // Chỉ thêm điểm đích nếu nó hợp lệ
    if (destination && (destination.lat !== 0 || destination.lon !== 0)) {
      waypoints.push(L.latLng(destination.lat, destination.lon));
    }

    if (!routingControlRef.current) {
      // TRƯỜNG HỢP 1: Chưa có Control -> Tạo mới
      const routingControl = (L as any).Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        show: false,
        collapsible: true,
        lineOptions: {
          styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
        },
        createMarker: function() { return null; }, // Ẩn marker mặc định
        router: new (L as any).Routing.OSRMv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
      });

      // Bắt sự kiện tìm thấy đường
      routingControl.on('routesfound', function(e: any) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        // Hiện popup thông tin giữa đường
        try {
          const midPointIndex = Math.floor(routes[0].coordinates.length / 2);
          const midPoint = routes[0].coordinates[midPointIndex];
          L.popup()
            .setLatLng(midPoint)
            .setContent(`
              <div style="text-align: center;">
                <b>${(summary.totalDistance / 1000).toFixed(1)} km</b><br/>
                ~ ${Math.round(summary.totalTime / 60)} phút
              </div>
            `)
            .openOn(map);
        } catch (err) {
          // Bỏ qua lỗi popup nếu map chưa sẵn sàng
        }

        if (onRouteFound) {
          onRouteFound(summary);
        }
      });

      // Bắt lỗi routing
      routingControl.on('routingerror', function(e: any) {
        console.warn("Routing error (OSRM busy or bad coords):", e);
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;

    } else {
      // TRƯỜNG HỢP 2: Đã có Control -> Chỉ cập nhật điểm (Update Waypoints)
      // Cách này KHÔNG xóa layer nên tránh được lỗi "removeLayer of null"
      routingControlRef.current.setWaypoints(waypoints);
    }

  }, [map, userLocation, destination]); // Chạy lại khi tọa độ thay đổi

  // 2. Effect Cleanup (Chỉ chạy khi component bị hủy hoàn toàn)
  useEffect(() => {
    return () => {
      if (routingControlRef.current && map) {
        try {
          // Thử xóa control an toàn
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn("Cleanup warning:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map]);

  return null;
};

const RescueMap = ({ userLocation, destination, onRouteFound }: RescueMapProps) => {
  useEffect(() => { iconFix() }, [])

  return (
    <MapContainer 
      center={[userLocation.lat, userLocation.lon]} 
      zoom={13} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[userLocation.lat, userLocation.lon]}>
        <Popup>Vị trí của bạn</Popup>
      </Marker>

      {/* Marker Đích */}
      {destination && (destination.lat !== 0 || destination.lon !== 0) && (
        <Marker position={[destination.lat, destination.lon]}>
          <Popup>
            <div className="font-bold">{destination.name}</div>
            <div className="text-xs">{destination.address}</div>
          </Popup>
        </Marker>
      )}

      <RoutingMachine 
        userLocation={userLocation} 
        destination={destination} 
        onRouteFound={onRouteFound}
      />
    </MapContainer>
  )
}

export default RescueMap