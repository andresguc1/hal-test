#!/bin/bash

echo "Testing launch_browser with manual --start-maximized arg..."
curl -X POST http://localhost:2001/api/actions/launch_browser \
  -H "Content-Type: application/json" \
  -d '{
    "browserType": "chromium",
    "headless": true,
    "args": "--start-maximized"
  }'
echo -e "\n\n"
