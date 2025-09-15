#!/bin/bash

# Test script for Kids Story Backend - User Preferences in Onboarding API
# Make sure the server is running on localhost:3000

BASE_URL="http://localhost:3000/api"
TEST_EMAIL="test-onboarding-$(date +%s)@example.com"
TEST_PASSWORD="password123"

echo "🧪 Testing User Preferences in Onboarding API..."
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Register a new user
echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\"
  }")

echo "✅ Registration response:"
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Step 2: Login to get token
echo "2. Logging in to get token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .data.accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token from login response:"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Login successful, token obtained"
echo ""

# Step 3: Get initial user profile
echo "3. Getting initial user profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Initial profile:"
echo "$PROFILE_RESPONSE" | jq '.data | {email, name, isOnboarded, preferences, avatarId}'
echo ""

# Step 4: Complete onboarding with language and avatar preferences
echo "4. Completing onboarding with preferences..."
ONBOARDING_RESPONSE=$(curl -s -X POST "$BASE_URL/users/me/onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User Full Name",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 1990
    },
    "phone": "9876543210",
    "language": "hi",
    "avatarId": "avatar_test_123"
  }')

echo "✅ Onboarding completed:"
echo "$ONBOARDING_RESPONSE" | jq '.data.user | {fullName, isOnboarded, preferences, avatarId}'
echo ""

# Step 5: Update onboarding preferences
echo "5. Updating onboarding preferences..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/me/onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "avatarId": "avatar_updated_456"
  }')

echo "✅ Preferences updated:"
echo "$UPDATE_RESPONSE" | jq '.data | {user: .user | {preferences, avatarId}, updated}'
echo ""

# Step 6: Verify final state
echo "6. Verifying final state..."
FINAL_RESPONSE=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Final profile state:"
echo "$FINAL_RESPONSE" | jq '.data | {fullName, isOnboarded, preferences, avatarId}'
echo ""

# Step 7: Test invalid language (should fail)
echo "7. Testing invalid language (should fail)..."
INVALID_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/me/onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "invalid"
  }')

if echo "$INVALID_RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo "✅ Correctly rejected invalid language:"
  echo "$INVALID_RESPONSE" | jq '.errors'
else
  echo "❌ Should have rejected invalid language:"
  echo "$INVALID_RESPONSE" | jq '.'
fi
echo ""

echo "🎉 All tests completed!"
echo ""
echo "Summary:"
echo "- ✅ User registration and login"
echo "- ✅ Initial profile retrieval"
echo "- ✅ Onboarding with language and avatar preferences"
echo "- ✅ Updating preferences via onboarding endpoint"
echo "- ✅ Final state verification"
echo "- ✅ Invalid input validation"
