from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import httpx

app = FastAPI()

# CORS configuration (Local Development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "devices.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            name TEXT PRIMARY KEY,
            is_on INTEGER
        )
    """)
    conn.execute("INSERT OR IGNORE INTO devices VALUES ('lamp', 0)")
    conn.execute("INSERT OR IGNORE INTO devices VALUES ('tv', 0)")
    conn.commit()
    conn.close()

init_db()

# State for temperature
temp_state = {"value": None}

BANDUNG_LAT = -6.9147
BANDUNG_LON = 107.6098

# Database interaction functions
def get_all_devices():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT name, is_on FROM devices").fetchall()
    conn.close()
    state = {name: {"on": bool(is_on)} for name, is_on in rows}
    state["temp"] = temp_state
    return state

def toggle_device(name):
    conn = sqlite3.connect(DB_PATH)
    current = conn.execute("SELECT is_on FROM devices WHERE name = ?", (name,)).fetchone()[0]
    new_state = 0 if current else 1
    conn.execute("UPDATE devices SET is_on = ? WHERE name = ?", (new_state, name))
    conn.commit()
    conn.close()
    return bool(new_state)

# All connected WebSocket clients
active_connections: list[WebSocket] = []

# Basic health check endpoint
@app.get("/")
def read_root():
    return {"message": "Hello, Showroom!"}

# Retrieve the current state of all devices
@app.get("/devices")
def get_devices():
    return get_all_devices()

# Toggle the state of the lamp and broadcast the new state to all connected clients
@app.post("/lamp/toggle")
async def toggle_lamp():
    new_state = toggle_device("lamp")
    await broadcast_state()
    return {"on": new_state}

# Toggle the state of the TV and broadcast the new state to all connected clients
@app.post("/tv/toggle")
async def toggle_tv():
    new_state = toggle_device("tv")
    await broadcast_state()
    return {"on": new_state}

# Refresh the temperature from the Open-Meteo API and broadcast
@app.post("/temp/refresh")
async def refresh_temp():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": BANDUNG_LAT,
                "longitude": BANDUNG_LON,
                "current": "temperature_2m",
            },
        )
        data = response.json()
        temp_state["value"] = data["current"]["temperature_2m"]

    await broadcast_state()
    return temp_state

# Broadcast the current state of all devices to all connected WebSocket clients
async def broadcast_state():
    state = get_all_devices()
    for connection in active_connections:
        await connection.send_json(state)

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