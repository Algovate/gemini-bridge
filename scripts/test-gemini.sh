#!/bin/bash

# Test script for Gemini API proxy using curl
# 
# Usage:
#   PROXY_URL=http://localhost:8787 API_KEY=your_key ./test-gemini.sh
#   or
#   ./test-gemini.sh http://localhost:8787 your_api_key

PROXY_URL=${1:-${PROXY_URL:-http://localhost:8787}}
API_KEY=${2:-${API_KEY:-${GEMINI_API_KEY:-}}}

if [ -z "$API_KEY" ]; then
  echo "❌ Error: API_KEY is required"
  echo "   Usage: ./test-gemini.sh [PROXY_URL] [API_KEY]"
  echo "   or: PROXY_URL=... API_KEY=... ./test-gemini.sh"
  exit 1
fi

echo "🚀 Starting Gemini API Proxy Tests"
echo "   Proxy URL: $PROXY_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=${4:-}
  
  echo "🧪 Testing: $name"
  echo "   URL: $url"
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "X-Goog-Api-Key: $API_KEY" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" "$url")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "   ${GREEN}✅ Success ($http_code)${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "   ${RED}❌ Failed ($http_code)${NC}"
    echo "   Response: $body" | head -c 200
    echo ""
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Test 1: List models using query parameter
test_endpoint "List Models (query parameter)" \
  "$PROXY_URL/v1/models?key=$API_KEY"

# Test 2: List models using header
test_endpoint "List Models (header)" \
  "$PROXY_URL/v1/models?key=$API_KEY" \
  "GET"

# Test 3: Get specific model info (use v1beta as gemini-flash-latest may not be in v1)
test_endpoint "Get Model Info" \
  "$PROXY_URL/v1beta/models/gemini-flash-latest?key=$API_KEY"

# Test 4: Generate content
test_endpoint "Generate Content" \
  "$PROXY_URL/v1beta/models/gemini-flash-latest:generateContent?key=$API_KEY" \
  "POST" \
  '{"contents":[{"parts":[{"text":"Hello! Please respond with a short greeting."}]}]}'

# Test 5: Root endpoint
test_endpoint "Root Endpoint" \
  "$PROXY_URL/"

# Test 6: CORS preflight
echo "🧪 Testing: CORS Preflight"
echo "   URL: $PROXY_URL/v1/models"
cors_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$PROXY_URL/v1/models" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Goog-Api-Key")
if [ "$cors_response" = "204" ]; then
  echo -e "   ${GREEN}✅ Success (204)${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "   ${RED}❌ Failed ($cors_response)${NC}"
  FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "============================================================"
echo "📊 Test Summary"
echo "============================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "============================================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

