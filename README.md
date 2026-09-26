# PricingBrain Dynamic Pricing

Full-stack dynamic pricing project with:

- **FastAPI backend** for pricing APIs and model workflows
- **Vite frontend** for dashboard, storefront, sandbox, and reports UI

## Quick start

From the repository root:

```bash
chmod +x start.sh
./start.sh
```

This script will:

1. Create/activate `backend/venv` and install Python dependencies
2. Install frontend dependencies (if missing)
3. Start backend on `http://127.0.0.1:8000`
4. Start frontend on `http://localhost:5173`

## App links

- Ops Dashboard: `http://localhost:5173`
- Amazon Store: `http://localhost:5173/store`
- What-If Sandbox: `http://localhost:5173/what-if`
- Telemetry & Logs: `http://localhost:5173/reports`
- Backend API docs: `http://127.0.0.1:8000/docs`
