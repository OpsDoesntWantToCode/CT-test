import { Language } from './store'

export const translations = {
  en: {
    // Onboarding
    welcomeTitle: 'Stay Safe While Traveling',
    welcomeSubtitle: 'Real-time weather and disaster alerts to keep you informed',
    feature1: 'Real-time Alerts',
    feature1Desc: 'Get instant notifications about weather and disasters',
    feature2: 'SOS Support',
    feature2Desc: 'Emergency assistance at your fingertips',
    feature3: 'Offline Mode',
    feature3Desc: 'Access safety information even without internet',
    getStarted: 'Get Started',
    
    // Navigation
    home: 'Home',
    map: 'Map',
    alerts: 'Alerts',
    sos: 'SOS',
    more: 'More',
    
    // Home
    welcomeBack: 'Welcome Back',
    safetyScore: 'Safety Score',
    currentLocation: 'Current Location',
    quickActions: 'Quick Actions',
    viewMap: 'View Map',
    checkAlerts: 'Check Alerts',
    emergency: 'Emergency',
    recentAlerts: 'Recent Alerts',
    
    // Map
    searchLocation: 'Search location...',
    legend: 'Risk Levels',
    critical: 'Critical',
    high: 'High Risk',
    moderate: 'Moderate',
    low: 'Low Risk',
    safe: 'Safe',
    
    // Alerts
    alertHub: 'Alert Hub',
    nearMe: 'Near Me',
    national: 'National',
    all: 'All',
    unreadAlerts: 'unread alerts',
    
    // Alert Detail
    whatToDo: 'What to Do',
    whatNotToDo: 'What Not to Do',
    markAsRead: 'Mark as Read',
    share: 'Share',
    
    // SOS
    sosTitle: 'Emergency SOS',
    sosDescription: 'Press and hold the button to send an emergency alert to your contacts and local authorities',
    pressToActivate: 'Press to Activate SOS',
    sending: 'Sending...',
    sentSuccessfully: 'SOS Sent Successfully',
    sosConfirmTitle: 'Confirm Emergency SOS',
    sosConfirmDesc: 'This will alert your emergency contacts and local authorities. Continue?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // History
    history: 'History',
    alertHistory: 'Alert History',
    sosEvents: 'SOS Events',
    noHistory: 'No history yet',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    offlineMode: 'Offline Mode',
    notifications: 'Notifications',
    privacyPolicy: 'Privacy Policy',
    
    // Profile
    profile: 'Profile',
    emergencyContacts: 'Emergency Contacts',
    savedLocations: 'Saved Locations',
    editProfile: 'Edit Profile',
    logout: 'Logout',
    addContact: 'Add Contact',
    addLocation: 'Add Location',
    
    // Help
    help: 'Help & Support',
    about: 'About',
    emergencyNumbers: 'Emergency Numbers',
    safetyTips: 'Safety Tips',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    viewDetails: 'View Details',
  },
  vi: {
    // Onboarding
    welcomeTitle: 'An Toàn Khi Du Lịch',
    welcomeSubtitle: 'Cảnh báo thời tiết và thiên tai theo thời gian thực',
    feature1: 'Cảnh Báo Thời Gian Thực',
    feature1Desc: 'Nhận thông báo ngay lập tức về thời tiết và thiên tai',
    feature2: 'Hỗ Trợ SOS',
    feature2Desc: 'Hỗ trợ khẩn cấp trong tầm tay',
    feature3: 'Chế Độ Ngoại Tuyến',
    feature3Desc: 'Truy cập thông tin an toàn ngay cả khi không có internet',
    getStarted: 'Bắt Đầu',
    
    // Navigation
    home: 'Trang Chủ',
    map: 'Bản Đồ',
    alerts: 'Cảnh Báo',
    sos: 'SOS',
    more: 'Thêm',
    
    // Home
    welcomeBack: 'Chào Mừng Trở Lại',
    safetyScore: 'Điểm An Toàn',
    currentLocation: 'Vị Trí Hiện Tại',
    quickActions: 'Hành Động Nhanh',
    viewMap: 'Xem Bản Đồ',
    checkAlerts: 'Kiểm Tra Cảnh Báo',
    emergency: 'Khẩn Cấp',
    recentAlerts: 'Cảnh Báo Gần Đây',
    
    // Map
    searchLocation: 'Tìm kiếm vị trí...',
    legend: 'Mức Độ Rủi Ro',
    critical: 'Nghiêm Trọng',
    high: 'Cao',
    moderate: 'Trung Bình',
    low: 'Thấp',
    safe: 'An Toàn',
    
    // Alerts
    alertHub: 'Trung Tâm Cảnh Báo',
    nearMe: 'Gần Tôi',
    national: 'Toàn Quốc',
    all: 'Tất Cả',
    unreadAlerts: 'cảnh báo chưa đọc',
    
    // Alert Detail
    whatToDo: 'Cần Làm Gì',
    whatNotToDo: 'Không Nên Làm Gì',
    markAsRead: 'Đánh Dấu Đã Đọc',
    share: 'Chia Sẻ',
    
    // SOS
    sosTitle: 'SOS Khẩn Cấp',
    sosDescription: 'Nhấn và giữ nút để gửi cảnh báo khẩn cấp đến liên hệ và cơ quan địa phương',
    pressToActivate: 'Nhấn Để Kích Hoạt SOS',
    sending: 'Đang Gửi...',
    sentSuccessfully: 'Đã Gửi SOS Thành Công',
    sosConfirmTitle: 'Xác Nhận SOS Khẩn Cấp',
    sosConfirmDesc: 'Điều này sẽ cảnh báo liên hệ khẩn cấp và cơ quan địa phương. Tiếp tục?',
    cancel: 'Hủy',
    confirm: 'Xác Nhận',
    
    // History
    history: 'Lịch Sử',
    alertHistory: 'Lịch Sử Cảnh Báo',
    sosEvents: 'Sự Kiện SOS',
    noHistory: 'Chưa có lịch sử',
    
    // Settings
    settings: 'Cài Đặt',
    language: 'Ngôn Ngữ',
    darkMode: 'Chế Độ Tối',
    offlineMode: 'Chế Độ Ngoại Tuyến',
    notifications: 'Thông Báo',
    privacyPolicy: 'Chính Sách Bảo Mật',
    
    // Profile
    profile: 'Hồ Sơ',
    emergencyContacts: 'Liên Hệ Khẩn Cấp',
    savedLocations: 'Vị Trí Đã Lưu',
    editProfile: 'Chỉnh Sửa Hồ Sơ',
    logout: 'Đăng Xuất',
    addContact: 'Thêm Liên Hệ',
    addLocation: 'Thêm Vị Trí',
    
    // Help
    help: 'Trợ Giúp & Hỗ Trợ',
    about: 'Giới Thiệu',
    emergencyNumbers: 'Số Khẩn Cấp',
    safetyTips: 'Mẹo An Toàn',
    
    // Common
    loading: 'Đang Tải...',
    error: 'Lỗi',
    retry: 'Thử Lại',
    close: 'Đóng',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh Sửa',
    viewDetails: 'Xem Chi Tiết',
  },
  jp: {
    // Onboarding
    welcomeTitle: '旅行中の安全を守る',
    welcomeSubtitle: 'リアルタイムの気象・災害警報',
    feature1: 'リアルタイム警報',
    feature1Desc: '気象・災害の即座な通知',
    feature2: 'SOSサポート',
    feature2Desc: '緊急支援がすぐに',
    feature3: 'オフラインモード',
    feature3Desc: 'インターネットなしでも安全情報にアクセス',
    getStarted: 'スタート',
    
    // Navigation
    home: 'ホーム',
    map: 'マップ',
    alerts: '警報',
    sos: 'SOS',
    more: 'その他',
    
    // Home
    welcomeBack: 'おかえりなさい',
    safetyScore: '安全スコア',
    currentLocation: '現在地',
    quickActions: 'クイックアクション',
    viewMap: 'マップを見る',
    checkAlerts: '警報確認',
    emergency: '緊急',
    recentAlerts: '最近の警報',
    
    // Map
    searchLocation: '場所を検索...',
    legend: 'リスクレベル',
    critical: '重大',
    high: '高リスク',
    moderate: '中程度',
    low: '低リスク',
    safe: '安全',
    
    // Alerts
    alertHub: '警報ハブ',
    nearMe: '近く',
    national: '全国',
    all: 'すべて',
    unreadAlerts: '未読の警報',
    
    // Alert Detail
    whatToDo: 'すべきこと',
    whatNotToDo: 'してはいけないこと',
    markAsRead: '既読にする',
    share: '共有',
    
    // SOS
    sosTitle: '緊急SOS',
    sosDescription: 'ボタンを長押しして、連絡先と当局に緊急警報を送信',
    pressToActivate: 'SOSを起動',
    sending: '送信中...',
    sentSuccessfully: 'SOS送信成功',
    sosConfirmTitle: '緊急SOS確認',
    sosConfirmDesc: '緊急連絡先と当局に警報します。続行しますか？',
    cancel: 'キャンセル',
    confirm: '確認',
    
    // History
    history: '履歴',
    alertHistory: '警報履歴',
    sosEvents: 'SOSイベント',
    noHistory: '履歴なし',
    
    // Settings
    settings: '設定',
    language: '言語',
    darkMode: 'ダークモード',
    offlineMode: 'オフラインモード',
    notifications: '通知',
    privacyPolicy: 'プライバシーポリシー',
    
    // Profile
    profile: 'プロフィール',
    emergencyContacts: '緊急連絡先',
    savedLocations: '保存された場所',
    editProfile: 'プロフィール編集',
    logout: 'ログアウト',
    addContact: '連絡先追加',
    addLocation: '場所追加',
    
    // Help
    help: 'ヘルプ＆サポート',
    about: '概要',
    emergencyNumbers: '緊急番号',
    safetyTips: '安全のヒント',
    
    // Common
    loading: '読み込み中...',
    error: 'エラー',
    retry: '再試行',
    close: '閉じる',
    save: '保存',
    delete: '削除',
    edit: '編集',
    viewDetails: '詳細を見る',
  },
}

export function useTranslation(lang: Language) {
  return translations[lang]
}
