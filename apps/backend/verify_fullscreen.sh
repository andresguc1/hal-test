#!/bin/bash

echo "Testing launch_browser with --start-fullscreen..."
curl -X POST http://localhost:2001/api/actions/launch_browser \
  -H "Content-Type: application/json" \
  -d '{
    "browserType": "chromium",
    "headless": true,
    "args": "--start-fullscreen"
  }'
echo -e "\n\n"
