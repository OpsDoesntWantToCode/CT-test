'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { ShieldAlert, Phone, MapPin, CheckCircle2, Shield, Plus, Trash2, Navigation, ExternalLink, PhoneCall, Battery, Activity } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// --- CẤU HÌNH API ---
const API_BASE_URL = 'http://localhost:8000'; 

// Load Map Dynamic
const RescueMap = dynamic(() => import('../../components/RescueMap'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-800/50 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
})

// Interface phản hồi từ Server Backend
interface SOSResponse {
  alert_id: string;
  status: string;
  message: string;
  nearest_station: {
    Name: string;
    Phone: string;
    distance_km: number;
    Lat: number;
    Lon: number;
  } | null;
}

export default function SOSPage() {
  const router = useRouter()
  // Global Store
  const language = useStore((state) => state.language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const addSOSEvent = useStore((state) => state.addSOSEvent)
  const emergencyContacts = useStore((state) => state.emergencyContacts)
  const addEmergencyContact = useStore((state) => state.addEmergencyContact)
  const removeEmergencyContact = useStore((state) => state.removeEmergencyContact)
  
  const { toast } = useToast()
  
  // Local State UI
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })

  // State Logic SOS
  const [sending, setSending] = useState(false) // Đang gọi API
  const [sosActive, setSosActive] = useState(false) // Phiên SOS đang chạy
  const [statusMessage, setStatusMessage] = useState("Sẵn sàng hỗ trợ")
  const [serverMessage, setServerMessage] = useState("") // Tin nhắn từ Socket
  
  // State Tìm kiếm thủ công
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [rescueStation, setRescueStation] = useState<any>(null)
  const [isLoadingRescue, setIsLoadingRescue] = useState(false)
  const [rescueType, setRescueType] = useState<string>("hospital")

  // Refs quản lý kết nối ngầm (Tránh re-render)
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // --- 1. HÀM TIỆN ÍCH ---
  
  // Lấy mức pin thiết bị
  const getBatteryLevel = async () => {
    try {
      // @ts-ignore
      if (navigator.getBattery) {
        // @ts-ignore
        const battery = await navigator.getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (e) { return null; }
    return null;
  };

  // Dọn dẹp khi thoát trang
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // --- 2. LOGIC TÌM KIẾM THỦ CÔNG (Giữ lại tính năng cũ của bạn) ---
  const findNearestRescue = () => {
    if (!navigator.geolocation) {
      toast({ title: "Lỗi", description: "Trình duyệt không hỗ trợ định vị.", variant: "destructive" })
      return
    }
    setIsLoadingRescue(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setUserLocation({ lat: latitude, lon: longitude })
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/rescue/nearest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lon: longitude, filter_type: rescueType })
        })
        const data = await response.json()
        if (data && data.Name) { // Backend trả về trực tiếp dict hoặc qua field data
            const station = data.data || data; // Handle tùy format trả về
            setRescueStation({
              lat: station.Lat,
              lon: station.Lon,
              name: station.Name,
              address: station.Address || "Đang cập nhật",
              phone: station.Phone
            })
            toast({ title: "Đã tìm thấy!", description: `Nơi gần nhất: ${station.Name}` })
        } else {
          toast({ title: "Không tìm thấy", description: "Không có trạm nào quanh đây.", variant: "destructive" })
        }
      } catch (error) {
        toast({ title: "Lỗi kết nối", description: "Không thể kết nối server.", variant: "destructive" })
      } finally { setIsLoadingRescue(false) }
    }, () => {
      setIsLoadingRescue(false)
      toast({ title: "Lỗi GPS", description: "Vui lòng bật định vị.", variant: "destructive" })
    })
  }

  // --- 3. LOGIC SOS CHÍNH (Kết nối Backend) ---
  
  // Bước 3.1: Gửi Request SOS
  // --- CODE GIẢ LẬP GPS (DÙNG ĐỂ TEST KHI TRÌNH DUYỆT BỊ CHẶN) ---
  const handleSOS = async () => {
    setSending(true);

    // Tự tạo một tọa độ giả (Ví dụ: Nhà thờ Đức Bà, TP.HCM)
    const fakePosition = {
      coords: {
        latitude: 10.7798,
        longitude: 106.6990
      }
    };

    console.log("⚠️ ĐANG DÙNG CHẾ ĐỘ GIẢ LẬP GPS ĐỂ TEST");

    // Xử lý y hệt như khi có GPS thật
    try {
      const { latitude, longitude } = fakePosition.coords;
      
      const payload = {
        latitude,
        longitude,
        user_id: "test_user_locked_gps",
        user_email: "opsminh2910@gmail.com", 
        medical_info: "Nhóm máu A+, Dị ứng Penicillin",
        risk_context: "Yêu cầu cứu hộ (Test Fake GPS)",
        activation_method: "button_simulation"
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/sos/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Server Error");
      const data: SOSResponse = await res.json();

      setSosActive(true);
      setStatusMessage(data.message);
      setShowConfirm(false);
      
      addSOSEvent({
          id: data.alert_id,
          type: 'SOS',
          severity: 'critical',
          location: `${latitude}, ${longitude}`,
          timestamp: new Date(),
          status: 'active',
          description: data.message
      } as any);

      toast({
        title: "TEST SOS THÀNH CÔNG!",
        description: "Đã gửi tọa độ giả lập tới Server.",
        className: "bg-green-600 text-white border-none"
      });

      // Bắt đầu tracking giả
      startTracking(data.alert_id);

    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không kết nối được server", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Bước 3.3: WebSocket & Tracking
  const startTracking = (alertId: string) => {
    // A. Mở kết nối Socket
    // Chuyển http -> ws (ví dụ: http://localhost:8000 -> ws://localhost:8000)
    const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws'); 
    const ws = new WebSocket(`${wsBaseUrl}/api/v1/sos/ws/${alertId}`);
    
    ws.onopen = () => console.log("🟢 [WS] Đã kết nối Tracking SOS");
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // Xử lý tin nhắn từ server gửi về (ví dụ: Cứu hộ đang đến)
      if (msg.type === 'tracking_update') {
         // Có thể update UI ở đây nếu cần
         console.log("Server received location");
      }
    };
    
    wsRef.current = ws;

    // B. Bắt đầu lắng nghe di chuyển (Continuous Location)
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const battery = await getBatteryLevel();
        const updateData = {
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
          battery: battery
        };

        // Gửi qua socket nếu đang mở
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(updateData));
        }
      },
      (err) => console.error("Lỗi tracking:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // --- UI UTILS ---
  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      addEmergencyContact({
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
        relation: newContact.relation,
      })
      setNewContact({ name: '', phone: '', relation: '' })
      setShowAddContact(false)
      toast({ title: "Thành công", description: "Đã thêm liên hệ." })
    }
  }

  const openGoogleMaps = () => {
    if (userLocation && rescueStation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${rescueStation.lat},${rescueStation.lon}&travelmode=driving`;
      window.open(url, '_blank');
    }
  }

  const handleCallStation = () => {
    if (rescueStation && rescueStation.phone) {
      window.location.href = `tel:${rescueStation.phone}`;
    }
  }

  return (
    <div className="min-h-screen relative text-white overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/60'}`} />
        {/* Hiệu ứng báo động đỏ khi SOS active */}
        {sosActive && <div className="absolute inset-0 bg-red-600/10 animate-pulse z-0 pointer-events-none"></div>}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        <AppHeader />

        <main className="p-4 space-y-6 flex-1 overflow-y-auto">
          
          {/* SECTION 1: NÚT SOS CHÍNH (Đã update logic trạng thái) */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
               {/* Vòng tròn hiệu ứng */}
               <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 
                  ${sosActive ? 'bg-green-500/40 scale-110' : 'bg-red-500/20'}`} />
               
               <button 
                onClick={() => !sosActive && setShowConfirm(true)} // Nếu đang active thì không click mở confirm nữa
                disabled={sending}
                className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform border-8 shadow-2xl
                  ${sosActive 
                    ? 'bg-green-700 border-green-500 scale-105 shadow-[0_0_50px_rgba(34,197,94,0.6)] cursor-default' 
                    : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(220,38,38,0.5)]'
                  }`}
               >
                  {sosActive ? (
                    <>
                      <CheckCircle2 className="w-20 h-20 text-white mb-2 animate-bounce" />
                      <span className="text-2xl font-black text-white tracking-widest">ĐÃ GỬI</span>
                      <span className="text-sm text-green-200 mt-1 font-semibold animate-pulse">ĐANG THEO DÕI...</span>
                    </>
                  ) : (
                    <>
                      {sending ? (
                        <div className="animate-spin"><Shield className="w-20 h-20 text-white opacity-80" /></div> 
                      ) : (
                        <ShieldAlert className="w-24 h-24 text-white mb-2" />
                      )}
                      <span className="text-4xl font-black text-white tracking-widest">{sending ? 'ĐANG GỬI' : 'SOS'}</span>
                      {!sending && <span className="text-xs text-red-200 mt-1 font-bold tracking-wider">NHẤN ĐỂ CỨU HỘ</span>}
                    </>
                  )}
              </button>
            </div>
            
            {/* Hộp thông báo trạng thái */}
            <div className={`mt-6 p-4 rounded-xl border w-full text-center transition-all duration-500
              ${sosActive ? 'bg-green-900/50 border-green-500/50' : 'bg-black/40 border-white/10'}`}>
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                   {sosActive ? <Activity className="w-5 h-5 text-green-400 animate-pulse"/> : <Navigation className="w-5 h-5 text-blue-400"/>}
                   {sosActive ? "TRẠNG THÁI HỆ THỐNG" : "Thông tin hệ thống"}
                </h3>
                <p className={`text-sm mt-1 ${sosActive ? 'text-green-300 font-bold' : 'text-slate-300'}`}>
                  {statusMessage}
                </p>
                {sosActive && <p className="text-xs text-slate-400 mt-2 italic">*Vị trí và mức pin của bạn đang được chia sẻ liên tục</p>}
            </div>
          </div>

          {/* SECTION 2: TÌM KIẾM THỦ CÔNG (Secondary Option) */}
          {/* Chỉ hiện khi chưa kích hoạt SOS hoặc người dùng muốn tìm thêm */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4 space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                <MapPin className="w-5 h-5" />
                Tìm trạm cứu hộ gần nhất
              </h2>
              
              <div className="flex gap-2">
                <div className="w-1/2">
                   <select 
                      className="w-full h-10 px-3 rounded-md border border-white/20 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={rescueType}
                      onChange={(e) => setRescueType(e.target.value)}
                   >
                     <option value="hospital">Bệnh viện</option>
                     <option value="police">Công an</option>
                     <option value="fire">Cứu hỏa</option>
                     <option value="townhall">UBND</option>
                   </select>
                </div>
                
                <Button 
                  onClick={findNearestRescue}
                  disabled={isLoadingRescue}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoadingRescue ? 'Đang quét...' : 'Tìm kiếm'}
                </Button>
              </div>
            </div>
            
            {/* Map Area */}
            <div className="h-48 w-full bg-slate-900/50 rounded-lg overflow-hidden relative border border-white/10">
              {(!userLocation && !sosActive) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MapPin className="w-8 h-8 opacity-50" />
                  <p className="text-xs">Bản đồ sẽ hiện khi tìm kiếm hoặc SOS</p>
                </div>
              ) : (
                <RescueMap 
                  userLocation={userLocation || {lat: 10.7, lon: 106.6}} // Fallback
                  destination={rescueStation} 
                />
              )}
            </div>

            {/* Action Buttons */}
            {rescueStation && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCallStation}>
                  <PhoneCall className="w-4 h-4 mr-2" /> Gọi trạm
                </Button>
                <Button variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20" onClick={openGoogleMaps}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Chỉ đường
                </Button>
              </div>
            )}
          </Card>

          {/* SECTION 3: DANH BẠ (Giữ nguyên) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-500" />
                Liên hệ khẩn cấp
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddContact(true)} className="hover:bg-white/10"><Plus className="w-5 h-5" /></Button>
            </div>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <Card key={contact.id} className="bg-black/40 backdrop-blur-md border-white/10 p-4 flex items-center justify-between hover:bg-black/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30"><Shield className="w-5 h-5 text-red-400" /></div>
                    <div><h3 className="font-medium text-white">{contact.name}</h3><p className="text-sm text-slate-300">{contact.relation} • {contact.phone}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeEmergencyContact(contact.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* DIALOG XÁC NHẬN */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-red-500 flex flex-col items-center gap-4"><ShieldAlert className="w-16 h-16 animate-pulse" />XÁC NHẬN KHẨN CẤP</DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-lg mt-2">
              Hành động này sẽ gửi ngay lập tức:
              <br/> <span className="text-white font-semibold">• Vị trí trực tiếp (Live GPS)</span>
              <br/> <span className="text-white font-semibold">• Thông tin y tế & Mức pin</span>
              <br/>tới đơn vị cứu hộ gần nhất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-4 mt-4">
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 w-full sm:w-auto" onClick={() => setShowConfirm(false)}>Hủy bỏ</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto font-bold text-lg h-12" onClick={handleSOS} disabled={sending}>
              {sending ? 'ĐANG KẾT NỐI...' : 'GỬI NGAY'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Thêm Contact (Giữ nguyên) */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Thêm liên hệ mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Họ tên</Label><Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
            <div className="space-y-2"><Label>Số điện thoại</Label><Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
            <div className="space-y-2"><Label>Mối quan hệ</Label><Input value={newContact.relation} onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
            <Button onClick={handleAddContact} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newContact.name || !newContact.phone}>Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  )
}