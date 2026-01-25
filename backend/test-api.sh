#!/bin/bash

# API Testing Script
# Tests all endpoints of the forecasting API

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Forecasting API Test Suite"
echo "========================================="
echo ""

# Check if server is running
echo -n "Checking if server is running... "
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Error: Server is not running. Start it with: npm run dev"
    exit 1
fi
echo ""

# Get sample dates from database (if available)
# Note: Staff data uses 2026 dates, ED data uses 2020-2025 range
if command -v sqlite3 > /dev/null 2>&1 && [ -f "forecasting.db" ]; then
    SAMPLE_DATE=$(sqlite3 forecasting.db "SELECT DISTINCT date FROM fact_staff_shift ORDER BY date LIMIT 1" 2>/dev/null || echo "2026-01-24")
    FROM_DATE=$(sqlite3 forecasting.db "SELECT MIN(date) FROM fact_ed_hourly" 2>/dev/null || echo "2020-01-01")
    TO_DATE=$(sqlite3 forecasting.db "SELECT MAX(date) FROM fact_ed_hourly" 2>/dev/null || echo "2020-01-31")
else
    # Fallback to documented date ranges
    SAMPLE_DATE="2026-01-24"
    FROM_DATE="2020-01-01"
    TO_DATE="2020-01-31"
fi

echo "Using sample dates:"
echo "  - Single date: $SAMPLE_DATE"
echo "  - Range: $FROM_DATE to $TO_DATE"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "   ${GREEN}✓${NC} Health check passed (200)"
    echo "   Response: $BODY"
else
    echo -e "   ${RED}✗${NC} Health check failed ($HTTP_CODE)"
fi
echo ""

# Test 2: ED Hourly
echo "2. Testing ED Hourly Endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ui/ed/hourly?from=$FROM_DATE&to=$TO_DATE")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    if command -v jq > /dev/null 2>&1; then
        COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "?")
    else
        COUNT=$(echo "$BODY" | grep -o '"ts"' | wc -l | tr -d ' ' || echo "?")
    fi
    echo -e "   ${GREEN}✓${NC} ED Hourly passed (200) - $COUNT records"
else
    echo -e "   ${RED}✗${NC} ED Hourly failed ($HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Staff Day
echo "3. Testing Staff Day Endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ui/staff/day?date=$SAMPLE_DATE")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    if command -v jq > /dev/null 2>&1; then
        COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "?")
    else
        COUNT=$(echo "$BODY" | grep -o '"shift_id"' | wc -l | tr -d ' ' || echo "?")
    fi
    echo -e "   ${GREEN}✓${NC} Staff Day passed (200) - $COUNT records"
else
    echo -e "   ${RED}✗${NC} Staff Day failed ($HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Inventory Risk
echo "4. Testing Inventory Risk Endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ui/inventory/risk?days=7")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    if command -v jq > /dev/null 2>&1; then
        COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "?")
    else
        COUNT=$(echo "$BODY" | grep -o '"sku_id"' | wc -l | tr -d ' ' || echo "?")
    fi
    echo -e "   ${GREEN}✓${NC} Inventory Risk passed (200) - $COUNT records"
else
    echo -e "   ${RED}✗${NC} Inventory Risk failed ($HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 5: Agent Context
echo "5. Testing Agent Context Endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/agent/context?from=$FROM_DATE&to=$TO_DATE&date=$SAMPLE_DATE")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "   ${GREEN}✓${NC} Agent Context passed (200)"
    if command -v jq > /dev/null 2>&1; then
        ED_COUNT=$(echo "$BODY" | jq '.ed_hourly | length' 2>/dev/null || echo "?")
        STAFF_COUNT=$(echo "$BODY" | jq '.staff_day | length' 2>/dev/null || echo "?")
        INV_COUNT=$(echo "$BODY" | jq '.inventory_risk_7d | length' 2>/dev/null || echo "?")
        EVENTS_COUNT=$(echo "$BODY" | jq '.events | length' 2>/dev/null || echo "?")
    else
        ED_COUNT=$(echo "$BODY" | grep -o '"ts"' | wc -l | tr -d ' ' || echo "?")
        STAFF_COUNT=$(echo "$BODY" | grep -o '"shift_id"' | wc -l | tr -d ' ' || echo "?")
        INV_COUNT=$(echo "$BODY" | grep -o '"sku_id"' | wc -l | tr -d ' ' || echo "?")
        EVENTS_COUNT=$(echo "$BODY" | grep -o '"event_id"' | wc -l | tr -d ' ' || echo "?")
    fi
    echo "   - ED Hourly: $ED_COUNT records"
    echo "   - Staff Day: $STAFF_COUNT records"
    echo "   - Inventory Risk: $INV_COUNT records"
    echo "   - Events: $EVENTS_COUNT records"
else
    echo -e "   ${RED}✗${NC} Agent Context failed ($HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 6: Agent Outputs (POST)
echo "6. Testing Agent Outputs Endpoint (POST)..."
PAYLOAD='{"agent_name":"test_agent","output_type":"test","window_start":"'$SAMPLE_DATE'","window_end":"'$TO_DATE'","payload":{"test":"data"}}'
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/agent/outputs" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" -eq 201 ]; then
    if command -v jq > /dev/null 2>&1; then
        ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null || echo "?")
    else
        ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "?")
    fi
    echo -e "   ${GREEN}✓${NC} Agent Outputs POST passed (201) - ID: $ID"
else
    echo -e "   ${RED}✗${NC} Agent Outputs POST failed ($HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 7: Error Handling
echo "7. Testing Error Handling..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ui/ed/hourly")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "   ${GREEN}✓${NC} Error handling works (400 for missing params)"
else
    echo -e "   ${YELLOW}⚠${NC} Expected 400, got $HTTP_CODE"
fi
echo ""

echo "========================================="
echo "Test Suite Complete"
echo "========================================="
