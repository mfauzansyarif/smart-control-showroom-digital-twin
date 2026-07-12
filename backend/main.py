from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration (Local Development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state of devices (Single source of truth)
devices = {
    "lamp": {"on": False},
    "tv": {"on": False}
}

# All connected WebSocket clients
active_connections: list[WebSocket] = []

# Basic health check endpoint
@app.get("/")
def read_root():
    return {"message": "Hello, Showroom!"}

# Retrieve the current state of all devices
@app.get("/devices")
def get_devices():
    return devices

# Toggle the state of the lamp and broadcast the new state to all connected clients
@app.post("/lamp/toggle")
async def toggle_lamp():
    devices["lamp"]["on"] = not devices["lamp"]["on"]
    await broadcast_state()
    return devices["lamp"]

# Toggle the state of the TV and broadcast the new state to all connected clients
@app.post("/tv/toggle")
async def toggle_tv():
    devices["tv"]["on"] = not devices["tv"]["on"]
    await broadcast_state()
    return devices["tv"]

# Broadcast the current state of all devices to all connected WebSocket clients
async def broadcast_state():
    for connection in active_connections:
        await connection.send_json(devices)

# WebSocket endpoint for real-time communication with clients
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)