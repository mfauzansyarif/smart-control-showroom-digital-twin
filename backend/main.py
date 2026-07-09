from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

devices = {
    "lamp": {"on": False},
    "tv": {"on": False}
}

active_connections: list[WebSocket] = []

@app.get("/")
def read_root():
    return {"message": "Hello, Showroom!"}

@app.get("/devices")
def get_devices():
    return devices

@app.post("/lamp/toggle")
async def toggle_lamp():
    devices["lamp"]["on"] = not devices["lamp"]["on"]
    await broadcast_state()
    return devices["lamp"]

@app.post("/tv/toggle")
async def toggle_tv():
    devices["tv"]["on"] = not devices["tv"]["on"]
    await broadcast_state()
    return devices["tv"]

async def broadcast_state():
    for connection in active_connections:
        await connection.send_json(devices)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)