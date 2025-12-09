"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useStore();
  const { toast } = useToast();
  const isDarkMode = useStore((state) => state.isDarkMode);

  // State cục bộ để nhập liệu
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bloodType: "",
    medicalNotes: "",
  });

  // Load dữ liệu từ Store vào Form khi mở trang
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const handleSave = () => {
    updateUserProfile(formData);
    toast({
      title: "Đã lưu hồ sơ",
      description: "Thông tin y tế của bạn sẽ được gửi kèm khi SOS.",
      className: "bg-green-600 text-white border-none",
    });
  };

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDarkMode ? "bg-black/80" : "bg-black/30"
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen pb-24">
        <AppHeader />

        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-3 border-2 border-slate-700">
              <User size={40} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold">
              {formData.fullName || "Người dùng ẩn danh"}
            </h2>
          </div>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <User size={18} /> Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Họ và tên</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Số điện thoại của bạn</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="09xxx..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                🏥 Thông tin Y tế (Gửi khi SOS)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Nhóm máu</Label>
                <Input
                  value={formData.bloodType}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodType: e.target.value })
                  }
                  placeholder="VD: O+, A-, AB..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">
                  Ghi chú y tế / Dị ứng / Bệnh nền
                </Label>
                <Textarea
                  value={formData.medicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, medicalNotes: e.target.value })
                  }
                  placeholder="VD: Dị ứng Penicillin, Bệnh tiểu đường type 2..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                />
                <p className="text-xs text-slate-300">
                  * Thông tin này cực kỳ quan trọng cho đội cứu hộ.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
          >
            <Save className="mr-2 h-5 w-5" /> Lưu thay đổi
          </Button>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
