import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Cấu hình email (Nên để trong biến môi trường .env thực tế)
# Để test, bạn cần lấy "App Password" của Gmail: https://myaccount.google.com/apppasswords
SENDER_EMAIL = "opsminh2910@gmail.com"  # <--- THAY EMAIL CỦA BẠN
SENDER_PASSWORD = "zuik ravo mrql xvdb"  # <--- THAY MẬT KHẨU ỨNG DỤNG (Không phải mật khẩu đăng nhập)

def send_sos_email(user_email: str, location: dict, medical_info: str, nearest_station: dict):
    """
    Gửi email cảnh báo thật chứa Link Google Maps và thông tin trạm cứu hộ gần nhất
    """
    try:
        receiver_email = user_email # Trong thực tế đây là email người thân
        
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = receiver_email
        msg['Subject'] = "🚨 SOS ALERT: Cần hỗ trợ khẩn cấp!"

        google_maps_link = f"https://www.google.com/maps/search/?api=1&query={location['lat']},{location['long']}"
        
        station_info = "Không tìm thấy trạm gần nhất"
        if nearest_station:
            station_info = f"{nearest_station.get('Name')} (Cách {nearest_station.get('distance_km')}km)\nSĐT: {nearest_station.get('Phone')}"

        body = f"""
        HỆ THỐNG CẢNH BÁO KHẨN CẤP
        ----------------------------
        Người dùng cần giúp đỡ!
        
        📍 Vị trí hiện tại: {google_maps_link}
        (Lat: {location['lat']}, Long: {location['long']})
        
        🏥 Trạm cứu hộ đã điều phối:
        {station_info}
        
        📋 Thông tin y tế: {medical_info}
        
        Vui lòng hành động ngay lập tức.
        """

        msg.attach(MIMEText(body, 'plain'))

        # Kết nối tới server Gmail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, receiver_email, text)
        server.quit()
        
        print(f"✅ [EMAIL] Đã gửi cảnh báo tới {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ [EMAIL LỖI] {str(e)}")
        return False