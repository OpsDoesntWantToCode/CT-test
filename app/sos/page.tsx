"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, Phone, MapPin, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- IMPORT COMPONENT ---
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

// Cấu hình API Backend
const BACKEND_API_URL = "http://127.0.0.1:8000/api/sos/trigger";

// Load Map (SSR false)
const RescueMap = dynamic(() => import("@/components/RescueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-800/50 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
      Đang tải bản đồ...
    </div>
  ),
});

export default function SOSPage() {
  const router = useRouter();
  // Store hooks
  const userProfile = useStore((state: any) => state.userProfile);
  const addSOSEvent = useStore((state: any) => state.addSOSEvent);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const { toast } = useToast();

  // State
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // State lưu thông tin trạm cứu hộ tìm thấy
  const [nearestCenter, setNearestCenter] = useState<any>(null);

  // Quản lý danh sách liên hệ khẩn cấp (Local State mô phỏng Local Storage)
  const [contacts, setContacts] = useState([
    { id: 1, name: "Mẹ", phone: "0901234567" },
    { id: 2, name: "Anh trai", phone: "0912345678" },
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  // 1. Lấy vị trí GPS khi vào trang
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Lỗi GPS:", error);
          toast({
            title: "Lỗi vị trí",
            description: "Không thể lấy tọa độ GPS của bạn. Hãy bật định vị.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);

  // 2. Hàm gửi SOS (Đã cập nhật Logic kết nối Backend)
  const handleSOS = async () => {
    if (!location) {
      toast({
        title: "Chưa có tọa độ",
        description: "Đang tìm vị trí của bạn...",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Chuẩn bị dữ liệu y tế và liên hệ (Gộp mảng contacts thành chuỗi để gửi backend)
      const contactString = contacts
        .map((c) => `${c.name} (${c.phone})`)
        .join(", ");

      // Tạo nội dung y tế tổng hợp
      const medicalInfo = userProfile?.medicalNotes
        ? `Nhóm máu: ${userProfile.bloodType || "N/A"}. Ghi chú: ${
            userProfile.medicalNotes
          }`
        : "Không có ghi chú y tế";

      const payload = {
        latitude: location.lat,
        longitude: location.lng,
        user_id: userProfile?.phone || "anonymous_user", // Dùng SĐT làm ID nếu có

        // CẬP NHẬT: Lấy dữ liệu thật từ Profile
        medical_notes: medicalInfo,

        // CẬP NHẬT: Thông tin liên hệ
        contact_phone:
          contacts?.length > 0
            ? contacts.map((c: any) => `${c.name} (${c.phone})`).join(", ")
            : "Chưa thiết lập liên hệ khẩn cấp",
      };

      // Gọi API Backend
      const res = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Lỗi kết nối server");
      }

      // Xử lý khi thành công
      // 1. Cập nhật Store phía Client (để hiển thị lịch sử trên App)
      addSOSEvent({
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        status: "Đã gửi",
        location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      });

      // 2. Cập nhật vị trí trạm cứu hộ nhận được từ Backend để hiển thị lên Map
      if (data.nearest_rescue) {
        setNearestCenter({
          name: data.nearest_rescue.name,
          lat: data.nearest_rescue.Lat, // Lưu ý: Backend trả về 'Lat' (viết hoa) từ CSV
          lng: data.nearest_rescue.Lon, // Lưu ý: Backend trả về 'Lon' (viết hoa) từ CSV
          phone: data.nearest_rescue.Phone || data.nearest_rescue.phone,
          distance: data.nearest_rescue.distance_km,
        });
      }

      // 3. Thông báo cho người dùng
      toast({
        title: "SOS ĐÃ GỬI!",
        description: data.instruction || "Đội cứu hộ đang trên đường tới.",
        className: "bg-green-600 text-white border-none",
      });
    } catch (error: any) {
      toast({
        title: "Gửi thất bại",
        description: error.message || "Vui lòng gọi 112 ngay lập tức!",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  // Logic thêm liên hệ (Giữ nguyên UI)
  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setContacts([...contacts, { id: Date.now(), ...newContact }]);
      setNewContact({ name: "", phone: "" });
      setShowAddContact(false);
    }
  };

  // Logic xóa liên hệ (Giữ nguyên UI)
  const handleDeleteContact = (id: number) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen pb-20">
        <AppHeader />

        <main className="p-4 space-y-6">
          {/* Nút SOS Lớn */}
          <div className="flex flex-col items-center justify-center py-8 relative">
            {/* Hiệu ứng gợn sóng (Ping animation) */}
            <div className="absolute w-48 h-48 bg-red-600/20 rounded-full animate-ping delay-75"></div>
            <div className="absolute w-48 h-48 bg-red-600/10 rounded-full animate-ping delay-300"></div>

            <Button
              className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_40px_rgba(220,38,38,0.6)] border-4 border-red-500 z-10 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
              onClick={() => setShowConfirm(true)}
            >
              <ShieldAlert size={48} className="text-white" />
              <span className="text-2xl font-black text-white tracking-widest">
                SOS
              </span>
            </Button>
            <p className="mt-6 text-slate-400 text-sm font-medium">
              Nhấn để gửi tín hiệu cầu cứu ngay lập tức
            </p>
          </div>

          {/* Thông tin trạm cứu hộ (Hiển thị khi đã tìm thấy) */}
          {nearestCenter && (
            <Card className="bg-black/40 backdrop-blur-md border-green-500/50 p-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-500 mt-1">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-green-400">
                    Đã kết nối: {nearestCenter.name}
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Cách bạn:{" "}
                    <span className="font-bold text-white">
                      {nearestCenter.distance} km
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    "Giữ nguyên vị trí, chúng tôi đang tới!"
                  </p>
                  {nearestCenter.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-green-500/30 text-green-400 hover:bg-green-500/10 w-full"
                    >
                      <Phone size={14} className="mr-2" /> Gọi trạm:{" "}
                      {nearestCenter.phone}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

        {/* Bản đồ vị trí */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-1 overflow-hidden h-96">
          {/* Truyền location của user và nearestCenter vào Map component */}
          {location ? (
            <RescueMap
              userLocation={location}
              destination={
                nearestCenter
                  ? {
                      lat: nearestCenter.lat,
                      lng: nearestCenter.lng,
                      name: nearestCenter.name,
                    }
                  : null
              }
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 text-sm">
              <MapPin className="mr-2 animate-bounce" /> Đang định vị...
            </div>
          )}
        </Card>

        {/* Danh sách liên hệ khẩn cấp */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-white">
              Liên hệ khẩn cấp
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddContact(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Plus size={16} className="mr-1" /> Thêm
            </Button>
          </div>

          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-black/40 backdrop-blur-md rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{contact.name}</p>
                    <p className="text-xs text-slate-400">{contact.phone}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-red-400"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

        <BottomNav />
      </div>
  
        {/* DIALOG 1: CONFIRM SOS */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white top-[20%] translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2 text-xl">
              <ShieldAlert /> XÁC NHẬN KHẨN CẤP
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Hệ thống sẽ gửi vị trí của bạn và thông tin y tế tới đội cứu hộ
              gần nhất. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="ghost"
              className="w-full sm:w-auto text-slate-400"
              onClick={() => setShowConfirm(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              onClick={handleSOS}
              disabled={sending}
            >
              {sending ? "ĐANG GỬI..." : "GỬI NGAY"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: ADD CONTACT - FIX: Thêm z-[9999] để đè lên Map */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white top-[20%] translate-y-0 z-[9999]">
          <DialogHeader>
            <DialogTitle>Thêm liên hệ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Họ tên</Label>
              <Input
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Nhập họ tên"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Số điện thoại</Label>
              <Input
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddContact}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Lưu liên hệ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
