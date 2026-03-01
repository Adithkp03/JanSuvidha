#!/bin/bash
# demo.sh: Run the new JanSuvidha Unified Portal SPA locally natively or via Docker

echo "======================================"
echo " Starting JanSuvidha Portal Demo      "
echo "======================================"

cd "$(dirname "$0")/../portal"

if [ "$1" == "--docker" ]; then
   echo "Building Docker image..."
   docker build -t jansuvidha-portal .
   echo "Running Portal on http://localhost:8080"
   docker run -p 8080:80 --rm jansuvidha-portal
else
   echo "Installing dependencies & Running locally..."
   npm install
   npm run dev -- --open
fi
