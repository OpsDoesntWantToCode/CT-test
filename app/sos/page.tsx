'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '../../components/app-header'
import { ShieldAlert, Phone, MapPin, CheckCircle2, Shield, Plus, Trash2, Navigation, ExternalLink, PhoneCall } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Load Map Dynamic
const RescueMap = dynamic(() => import('../../components/RescueMap'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-800/50 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
})

export default function SOSPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const addSOSEvent = useStore((state) => state.addSOSEvent)
  const emergencyContacts = useStore((state) => state.emergencyContacts)
  const addEmergencyContact = useStore((state) => state.addEmergencyContact)
  const removeEmergencyContact = useStore((state) => state.removeEmergencyContact)
  const t = useTranslation(language)
  const { toast } = useToast()
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })

  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [rescueStation, setRescueStation] = useState<any>(null)
  const [isLoadingRescue, setIsLoadingRescue] = useState(false)
  const [rescueType, setRescueType] = useState<string>("hospital")

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
        const response = await fetch('http://localhost:8000/api/v1/rescue/nearest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: latitude,
            lon: longitude,
            filter_type: rescueType
          })
        })

        const data = await response.json()

        if (data.status === 'success') {
          setRescueStation({
            lat: data.data.Lat,
            lon: data.data.Lon,
            name: data.data.Name,
            address: data.data.Address,
            phone: data.data.Phone // Lấy thêm số điện thoại
          })
          toast({ 
            title: "Đã tìm thấy!", 
            description: `Nơi gần nhất: ${data.data.Name}` 
          })
        } else {
          toast({ title: "Không tìm thấy", description: "Không có trạm nào quanh đây.", variant: "destructive" })
        }
      } catch (error) {
        console.error(error)
        toast({ title: "Lỗi kết nối", description: "Không thể kết nối server.", variant: "destructive" })
      } finally {
        setIsLoadingRescue(false)
      }
    }, (error) => {
      setIsLoadingRescue(false)
      toast({ title: "Lỗi GPS", description: "Vui lòng bật định vị.", variant: "destructive" })
    })
  }

  const openGoogleMaps = () => {
    if (userLocation && rescueStation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${rescueStation.lat},${rescueStation.lon}&travelmode=driving`;
      window.open(url, '_blank');
    }
  }

  // Hàm gọi điện
  const handleCallStation = () => {
    if (rescueStation && rescueStation.phone) {
      window.location.href = `tel:${rescueStation.phone}`;
    } else {
      toast({ title: "Không có số", description: "Địa điểm này không có số điện thoại.", variant: "destructive" });
    }
  }

  const handleSOS = async () => {
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    let locationString = "Unknown Location" 
    if (navigator.geolocation) {
      try {
          const pos: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          locationString = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch (e) { console.log("Lỗi GPS SOS"); }
    }
    addSOSEvent({
      id: Date.now().toString(),
      type: 'SOS',
      severity: 'critical',
      location: locationString,
      timestamp: new Date(),
      status: 'pending',
      description: 'Emergency SOS signal triggered'
    } as any)
    setSending(false)
    setSent(true)
    setShowConfirm(false)
    setTimeout(() => { setSent(false) }, 3000)
  }

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

  return (
    <div className="min-h-screen relative text-white overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/60'}`} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        <AppHeader />

        <main className="p-4 space-y-6 flex-1 overflow-y-auto">
          
          {/* Card Tìm Kiếm */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4 space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                <Navigation className="w-5 h-5" />
                Tìm nơi cứu trợ
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
                     <option value="townhall">UBND</option>
                   </select>
                </div>
                
                <Button 
                  onClick={findNearestRescue}
                  disabled={isLoadingRescue}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoadingRescue ? 'Đang tìm...' : 'Tìm kiếm'}
                </Button>
              </div>
            </div>
            
            {/* Bản đồ */}
            <div className="h-72 w-full bg-slate-900/50 rounded-lg overflow-hidden relative border border-white/10">
              {!userLocation ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MapPin className="w-8 h-8 opacity-50" />
                  <p className="text-sm">Chọn loại và nhấn tìm kiếm</p>
                </div>
              ) : (
                <RescueMap 
                  userLocation={userLocation} 
                  destination={rescueStation} 
                />
              )}
              
              {isLoadingRescue && (
                <div className="absolute inset-0 bg-black/60 z-[1000] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* CÁC NÚT CHỨC NĂNG (GỌI & CHỈ ĐƯỜNG) */}
            {rescueStation && (
              <div className="grid grid-cols-2 gap-3">
                {/* Nút Gọi Điện */}
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCallStation}
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Gọi: {rescueStation.phone}
                </Button>

                {/* Nút Google Maps */}
                <Button 
                  variant="outline" 
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  onClick={openGoogleMaps}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Chỉ đường
                </Button>
              </div>
            )}
          </Card>

          {/* Nút SOS Lớn */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
               <div className={`absolute inset-0 rounded-full bg-red-500/20 blur-xl ${sending ? 'animate-pulse' : ''}`} />
               <button onClick={() => setShowConfirm(true)} className={`relative w-56 h-56 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 border-4 ${sent ? 'bg-green-600 border-green-400 shadow-[0_0_50px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:from-red-600 hover:to-red-800'}`}>
                {sent ? <CheckCircle2 className="w-24 h-24 text-white animate-bounce" /> : <div className="text-center flex flex-col items-center">{sending ? <div className="animate-spin mb-2"><Shield className="w-16 h-16 text-white" /></div> : <ShieldAlert className="w-20 h-20 text-white mx-auto mb-2" />}<span className="text-2xl font-bold text-white tracking-wider">{sending ? 'SENDING...' : 'SOS'}</span>{!sending && <span className="text-xs text-white/80 mt-1">PRESS FOR HELP</span>}</div>}
              </button>
            </div>
          </div>

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

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-red-500 flex flex-col items-center gap-4"><ShieldAlert className="w-16 h-16" />XÁC NHẬN SOS</DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-lg">Bạn có chắc chắn muốn gửi tín hiệu khẩn cấp?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-4 mt-4">
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 w-full sm:w-auto" onClick={() => setShowConfirm(false)}>Hủy</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" onClick={handleSOS} disabled={sending}>{sending ? 'Đang gửi...' : 'GỬI NGAY'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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