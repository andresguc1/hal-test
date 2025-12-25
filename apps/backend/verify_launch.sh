#!/bin/bash

echo "Testing launch_browser with maximizeWindow: true..."
curl -X POST http://localhost:2001/api/actions/launch_browser \
  -H "Content-Type: application/json" \
  -d '{
    "browserType": "chromium",
    "headless": true,
    "maximizeWindow": true,
    "args": "--test-arg"
  }'
echo -e "\n\n"

echo "Testing launch_browser with invalid browserType..."
curl -X POST http://localhost:2001/api/actions/launch_browser \
  -H "Content-Type: application/json" \
  -d '{
    "browserType": "invalid-browser"
  }'
echo -e "\n\n"
