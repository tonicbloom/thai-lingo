#!/bin/bash
# Double-click to start Thai Lingo. Keep this window open while you practice.
cd "$(dirname "$0")"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
if ! lsof -iTCP:8765 -sTCP:LISTEN >/dev/null 2>&1; then
  "$NODE" server.js &
  SERVER=$!
  sleep 1
fi
open "http://localhost:8765"
echo ""
echo "  🐘 Thai Lingo is running at http://localhost:8765"
echo "  Keep this window open while you practice. Close it when you're done."
echo ""
[ -n "$SERVER" ] && wait $SERVER
