#!/bin/bash

echo "Testing launch_browser with Firefox and maximizeWindow: true..."
curl -X POST http://localhost:2001/api/actions/launch_browser \
  -H "Content-Type: application/json" \
  -d '{
    "browserType": "firefox",
    "headless": false,
    "maximizeWindow": true
  }'
echo -e "\n\n"
