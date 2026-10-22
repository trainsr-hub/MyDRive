from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    """WebSocket connection manager for streaming Faust subtitles and live events."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[WebSocket] Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"[WebSocket] Error sending message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"[WebSocket] Error broadcasting: {e}")
                self.disconnect(connection)

ws_manager = ConnectionManager()

async def broadcast_subtitle_update(text: str):
    """Broadcast subtitle text to all connected WebSocket clients."""
    print(f"[WebSocket] Broadcasting subtitle: {text}")
    if ws_manager.active_connections:
        subtitle_message = f"Faust: {text}"
        await ws_manager.broadcast(subtitle_message)
    else:
        print("[WebSocket] No active listeners for subtitle")
