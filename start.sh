#!/usr/bin/env bash
# ==============================================================================
# PricingBrain - Full Stack Dynamic Pricing & Amazon Storefront Startup Script
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🚀 Starting PricingBrain Dynamic Pricing & Storefront Suite"
echo "=========================================================="

# 1. Check Python virtual environment
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt
else
    source backend/venv/bin/activate
fi

# 2. Check Node packages
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down backend and frontend services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start FastAPI Backend
echo "Starting FastAPI Backend on http://127.0.0.1:8000 ..."
(cd backend && ./venv/bin/uvicorn main:app --reload --port 8000) &

# 4. Start Vite Frontend
echo "Starting Vite Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &

echo "=========================================================="
echo "✅ Both services are starting!"
echo "   📊 Ops Dashboard:    http://localhost:5173"
echo "   🛒 Amazon Store:     http://localhost:5173/store"
echo "   🎛️  What-If Sandbox:  http://localhost:5173/what-if"
echo "   📋 Telemetry & Logs: http://localhost:5173/reports"
echo "   ⚡ Backend API Docs: http://127.0.0.1:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C at any time to shut down both servers."

wait
