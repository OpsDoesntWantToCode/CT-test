# app/core/socket_manager.py (Tạo mới file này)
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Lưu trữ kết nối: {alert_id: [WebSocket_User, WebSocket_Admin]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, alert_id: str):
        await websocket.accept()
        if alert_id not in self.active_connections:
            self.active_connections[alert_id] = []
        self.active_connections[alert_id].append(websocket)
        print(f"🔌 [WebSocket] Alert {alert_id}: Có kết nối mới.")

    def disconnect(self, websocket: WebSocket, alert_id: str):
        if alert_id in self.active_connections:
            if websocket in self.active_connections[alert_id]:
                self.active_connections[alert_id].remove(websocket)
            if not self.active_connections[alert_id]:
                del self.active_connections[alert_id]
        print(f"🔌 [WebSocket] Alert {alert_id}: Đã ngắt kết nối.")

    async def broadcast(self, message: dict, alert_id: str):
        """Gửi tin nhắn tới tất cả mọi người trong cùng 1 alert (User & Cứu hộ)"""
        if alert_id in self.active_connections:
            for connection in self.active_connections[alert_id]:
                await connection.send_json(message)

# Tạo instance global để dùng ở router
manager = ConnectionManager()