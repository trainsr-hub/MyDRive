#!/bin/bash

echo "[Rebased] Starting development stack..."
echo ""

# Backend startup
echo "[1/2] Starting FastAPI backend on port 20140..."
cd "$(dirname "$0")/backend"
python -m uvicorn main:app --host 0.0.0.0 --port 20140 --reload &
BACKEND_PID=$!

sleep 3

# Frontend startup
echo "[2/2] Starting Vite frontend on port 5173..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "[OK] Rebased development stack started!"
echo "Backend: http://localhost:20140"
echo "Frontend: http://localhost:5173"
echo ""

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
