'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ShieldAlert, Phone, MapPin, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// --- IMPORT COMPONENT ---
import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'

// Cấu hình API Backend
const BACKEND_API_URL = 'http://127.0.0.1:8000/api/sos/trigger';

// Load Map (SSR false)
const RescueMap = dynamic(() => import('@/components/RescueMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-800/50 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
      Đang tải bản đồ...
    </div>
  )
})

export default function SOSPage() {
  const router = useRouter()
  // Store hooks
  const addSOSEvent = useStore((state: any) => state.addSOSEvent)
  const emergencyContacts = useStore((state: any) => state.emergencyContacts)
  const addEmergencyContact = useStore((state: any) => state.addEmergencyContact)
  const removeEmergencyContact = useStore((state: any) => state.removeEmergencyContact)
  
  const { toast } = useToast()

  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })
  
  // State cho Map
  const [isMounted, setIsMounted] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);

  // Init
  useEffect(() => {
    setIsMounted(true);
    
    const initLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLoc(current);
          setDestination({
            lat: current.lat + 0.005, 
            lng: current.lng + 0.005
          });
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true }
      );
    };
    initLocation();
  }, []);

  // Hàm lấy GPS (Promise)
  const getCurrentLocationPromise = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("No GPS"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Xử lý SOS
  const handleSOS = async () => {
    setSending(true);
    try {
      // 1. Lấy vị trí mới nhất
      const location = await getCurrentLocationPromise();
      setUserLoc(location); 

      // 2. Gọi Backend
      fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          contact_phone: emergencyContacts?.length > 0 ? emergencyContacts[0].phone : "Unknown",
          medical_notes: "SOS Alert",
          user_id: "user_app_v1"
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.nearest_rescue && data.nearest_rescue.lat && data.nearest_rescue.lng) {
            setDestination({
                lat: data.nearest_rescue.lat,
                lng: data.nearest_rescue.lng
            });
            toast({ title: "Đã tìm thấy cứu hộ!", description: `Điều hướng tới: ${data.nearest_rescue.name}` });
        }
      })
      .catch(err => console.error("API Error:", err));

      // 3. Gửi SMS
      const googleMapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      if (emergencyContacts && emergencyContacts.length > 0) {
        const primaryContact = emergencyContacts[0];
        const message = `SOS! Toi can giup do. Vi tri: ${googleMapsLink}`;
        window.open(`sms:${primaryContact.phone}?&body=${encodeURIComponent(message)}`, '_blank');
      }

      // 4. Gọi 115
      window.location.href = 'tel:115';

      // 5. Lưu Store
      if (addSOSEvent) {
        addSOSEvent({
          id: Date.now().toString(),
          type: 'SOS',
          timestamp: new Date().toISOString(),
          details: `SOS tại ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
          status: 'active'
        });
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi GPS", description: "Đang gọi 115 thủ công.", variant: "destructive" });
      window.location.href = 'tel:115';
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      if (addEmergencyContact) addEmergencyContact({ id: Date.now().toString(), ...newContact })
      setNewContact({ name: '', phone: '', relation: '' })
      setShowAddContact(false)
    }
  }

  const handleDeleteContact = (id: string) => {
    if (removeEmergencyContact) removeEmergencyContact(id)
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* NÚT SOS */}
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          <div className="relative group">
            <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-pulse group-hover:bg-red-500/30 transition-all duration-500" />
            <Button 
              className="w-48 h-48 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-8 border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95 z-10 relative"
              onClick={() => setShowConfirm(true)}
            >
              <ShieldAlert className="w-16 h-16 text-white mb-2" />
              <span className="text-2xl font-black text-white tracking-wider">SOS</span>
              <span className="text-xs text-red-200 font-medium">NHẤN ĐỂ KÍCH HOẠT</span>
            </Button>
          </div>
          <p className="text-slate-400 text-center max-w-xs text-sm">
            Gửi cảnh báo khẩn cấp và tìm đường cứu hộ.
          </p>
        </div>

        {/* MAP - Thêm class z-0 để đảm bảo nó nằm dưới */}
        <Card className="bg-slate-900/50 border-slate-800 p-4 overflow-hidden relative z-0">
          <div className="flex items-center gap-2 mb-4 text-slate-200 font-semibold">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span>Đường đến trạm cứu hộ</span>
          </div>
          <div className="rounded-lg overflow-hidden border border-slate-700 h-64 relative bg-slate-900">
             {isMounted && userLoc && destination ? (
               <RescueMap 
                  userLocation={userLoc}
                  destination={destination}
               />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 gap-2">
                 <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                 <span className="text-sm">Đang định vị...</span>
               </div>
             )}
          </div>
        </Card>

        {/* CONTACTS */}
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Phone className="w-5 h-5 text-green-500" />
              <span>Liên hệ khẩn cấp</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAddContact(true)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-1" /> Thêm
            </Button>
          </div>
          <div className="space-y-3">
            {!emergencyContacts || emergencyContacts.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">Chưa có liên hệ nào.</div>
            ) : (
              emergencyContacts.map((contact: any) => (
                <div key={contact.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">{contact.name.charAt(0).toUpperCase()}</div>
                    <div><div className="text-slate-200 font-medium">{contact.name}</div><div className="text-xs text-slate-400">{contact.phone}</div></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>

      {/* DIALOG 1: CONFIRM SOS - Thêm z-[9999] */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md top-[20%] translate-y-0 z-[9999]">
          <DialogHeader><DialogTitle className="text-red-500 flex items-center gap-2 text-xl"><ShieldAlert className="w-6 h-6" /> XÁC NHẬN SOS?</DialogTitle>
          <DialogDescription className="text-slate-300 pt-2">Gửi vị trí và gọi cứu hộ?</DialogDescription></DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="ghost" className="w-full sm:w-auto text-slate-400" onClick={() => setShowConfirm(false)}>Hủy bỏ</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" onClick={handleSOS} disabled={sending}>{sending ? 'ĐANG GỬI...' : 'GỬI NGAY'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: ADD CONTACT - FIX: Thêm z-[9999] để đè lên Map */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white top-[20%] translate-y-0 z-[9999]">
          <DialogHeader><DialogTitle>Thêm liên hệ mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Họ tên</Label><Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
            <div className="space-y-2"><Label>Số điện thoại</Label><Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
            <Button onClick={handleAddContact} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">Lưu lại</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}