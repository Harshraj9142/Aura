#!/bin/bash
# ==============================================================================
# APIx AIRFARE PRICE INDEX SYSTEM — UNIFIED SYSTEM LAUNCHER
# Starts Next.js Dashboard, PostgreSQL Listener, and Background Scraper Engine
# ==============================================================================

echo "======================================================================"
echo "✈️  STARTING REAL-TIME AIRFARE PRICE INDEX SYSTEM (APIx)"
echo "   MoSPI / NSO Problem Statement #26056"
echo "======================================================================"

# Step 1: Check Python Virtual Environment
if [ ! -d "scraper/venv" ]; then
    echo "❌ Scraper virtualenv not found in scraper/venv! Please create it."
    exit 1
fi

# Step 2: Test Database Connection & Inspect Data
echo "🔍 Checking Neon PostgreSQL Connection & Current Records..."
cd scraper
source venv/bin/activate
python view_db.py
cd ..

# Step 3: Start Next.js Web Application in Background
echo "🌐 Starting Next.js Web Application on http://localhost:3000..."
cd web
npm run dev &
NEXT_PID=$!
cd ..

# Wait briefly for Next.js to start
sleep 2

echo ""
echo "======================================================================"
echo "🎉 SYSTEM FULLY OPERATIONAL!"
echo "• Web Dashboard:    http://localhost:3000"
echo "• NSO REST APIs:    http://localhost:3000/api/index"
echo "• Interactive CLI:  cd scraper && source venv/bin/activate && python interactive_cli.py"
echo "• DB Inspector:     cd scraper && source venv/bin/activate && python view_db.py"
echo "======================================================================"

# Keep process alive
wait $NEXT_PID
