# Smart Control Showroom Digital Twin
3D Digital Twin dashboard for smart showroom device monitoring and control

## Overview
A pre-built GLB showroom model rendered with Three.js, synchronized in real time with a FastAPI backend over WebSocket. Includes a control panel for two simulated devices (Lamp, TV) and a live CCTV viewer bridged from RTSP to WebRTC via MediaMTX.

## Tech Stack
Three.js, FastAPI, WebSocket, MediaMTX

## How to Run
Three processes must run together, each in its own terminal.

**1. Backend**
```bash
cd backend
python -m uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000`

**2. Frontend**
```bash
cd frontend
python -m http.server 5500
```
Runs at `http://127.0.0.1:5500/index.html`

**3. CCTV (MediaMTX)**
```bash
cd media
.\mediamtx.exe
```
Runs at `http://localhost:8889/showroom_cam`

## Author
Muhammad Fauzan Syarif | Electrical Engineering | Institut Teknologi Bandung