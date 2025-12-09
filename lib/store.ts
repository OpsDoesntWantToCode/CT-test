import { create } from "zustand";
import { persist } from "zustand/middleware";

// Định nghĩa kiểu dữ liệu cho Profile
interface UserProfile {
  fullName: string;
  phone: string;
  bloodType: string;
  medicalNotes: string; // Vd: Dị ứng, Tiền sử bệnh tim...
}

export type Language = "en" | "vi" | "ja";
export type Severity = "high" | "medium" | "low" | "safe";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  location: string;
  category: string;
  timestamp: string;
  read: boolean;
}

interface StoreState {
  // ... (giữ nguyên các state cũ của bạn như emergencyContacts, sosEvents...)
  emergencyContacts: any[];
  sosEvents: any[];
  language: Language;
  isDarkMode: boolean;
  alerts: Alert[];

  // THÊM MỚI: State cho Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setLanguage: (lang: Language) => void;
  setIsDarkMode: (isDark: boolean) => void;
  addAlert: (alert: Alert) => void;

  // Auth states
  authToken: string | null;
  user: any | null;
  hasSeenOnboarding: boolean;
  setAuthToken: (token: string | null) => void;
  setUser: (user: any) => void;
  completeOnboarding: () => void;

  addSOSEvent: (event: any) => void;
  addEmergencyContact: (contact: any) => void;
  removeEmergencyContact: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // ... (Giữ nguyên logic cũ)
      emergencyContacts: [],
      sosEvents: [],
      language: "en",
      isDarkMode: false,
      alerts: [],

      // Auth states
      authToken: null,
      user: null,
      hasSeenOnboarding: false,

      // GIÁ TRỊ MẶC ĐỊNH CHO PROFILE
      userProfile: {
        fullName: "",
        phone: "",
        bloodType: "",
        medicalNotes: "",
      },

      // HÀM UPDATE PROFILE
      updateUserProfile: (newInfo) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...newInfo },
        })),

      setLanguage: (lang: Language) => set({ language: lang }),

      setIsDarkMode: (isDark: boolean) => set({ isDarkMode: isDark }),

      addAlert: (alert: Alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts],
        })),

      setAuthToken: (token: string | null) => set({ authToken: token }),

      setUser: (user: any) => set({ user }),

      completeOnboarding: () => set({ hasSeenOnboarding: true }),

      addSOSEvent: (event) =>
        set((state) => ({
          sosEvents: [event, ...state.sosEvents],
        })),
      addEmergencyContact: (contact) =>
        set((state) => ({
          emergencyContacts: [...state.emergencyContacts, contact],
        })),
      removeEmergencyContact: (id) =>
        set((state) => ({
          emergencyContacts: (state.emergencyContacts || []).filter(
            (c) => c.id !== id
          ),
        })),
    }),
    {
      name: "safety-app-storage", // Tên key trong localStorage
    }
  )
);
