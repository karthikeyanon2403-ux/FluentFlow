#!/usr/bin/env bash
set -e
DIR="$(dirname "$0")"

echo "=========================================================="
echo " Starting FluentFlow - AI English Communication Coach"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
"$DIR/start_backend.sh" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
until curl -s http://localhost:8000/api/health >/dev/null; do
    sleep 0.5
done
echo "Backend is ready at http://localhost:8000"

# Start frontend
"$DIR/start_frontend.sh" &
FRONTEND_PID=$!

echo ""
echo " FluentFlow is live!"
echo " Web Application URL: http://localhost:5173"
echo " API Docs & Health:   http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

wait
