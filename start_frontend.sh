#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")/frontend"
echo "Starting FluentFlow Frontend on http://localhost:5173..."
exec npm run dev -- --host 0.0.0.0 --port 5173
