# User Preferences API Documentation

## Overview

The Kids Story Backend now supports user preferences including language selection and avatar ID management integrated into the onboarding process. This document outlines the enhanced onboarding API endpoints for managing user preferences.

## New Features Added

### 1. Language Preference Support
- Users can set their preferred language (`en` for English, `hi` for Hindi) during onboarding
- Default language is English (`en`)
- Language preference is returned in all user profile responses

### 2. Avatar ID Support
- Users can select and store their preferred avatar ID during onboarding
- Avatar ID is returned in all user profile responses
- Supports any string value for avatar identification

## API Endpoints

### GET /api/users/me
**Description:** Get current user profile with preferences

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "preferences": {
      "language": "en"
    },
    "avatarId": "avatar_123",
    "isOnboarded": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/users/me/onboarding
**Description:** Complete user onboarding with optional language preference and avatar ID

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "birthDate": {
    "day": 15,
    "month": 6,
    "year": 1990
  },
  "phone": "9876543210",
  "language": "hi",           // Optional: "en" or "hi"
  "avatarId": "avatar_456"    // Optional: any string
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "fullName": "John Doe",
      "birthDate": {
        "day": 15,
        "month": 6,
        "year": 1990
      },
      "phone": "9876543210",
      "preferences": {
        "language": "hi"
      },
      "avatarId": "avatar_456",
      "isOnboarded": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "isOnboarded": true
  }
}
```

### PUT /api/users/me/onboarding
**Description:** Update user onboarding details including language preference and avatar ID

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "Updated Name",     // Optional
  "birthDate": {                  // Optional (all fields required if provided)
    "day": 20,
    "month": 8,
    "year": 1985
  },
  "phone": "9123456789",          // Optional
  "language": "en",               // Optional: "en" or "hi"
  "avatarId": "avatar_new_123"    // Optional: any string
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding details updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "fullName": "Updated Name",
      "preferences": {
        "language": "en"
      },
      "avatarId": "avatar_new_123",
      "isOnboarded": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "updated": ["fullName", "preferences.language", "avatarId"]
  }
}
```

**Validation Rules:**
- `language`: Must be either "en" or "hi" (optional)
- `avatarId`: Must be a string (optional)
- All other validation rules from original onboarding apply

**Error Responses:**
```json
// Invalid language
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Language must be either \"en\" or \"hi\""]
}

// User not onboarded (for PUT endpoint)
{
  "success": false,
  "message": "Update failed",
  "errors": ["User must complete onboarding first"]
}
```

## Updated Existing Endpoints

All existing user endpoints now return the enhanced user object with preferences:

### GET /api/users/me
- Now returns `preferences` and `avatarId` in response

### PATCH /api/users/me
- Now returns `preferences` and `avatarId` in response

### POST /api/users/me/onboarding
- Now accepts `language` and `avatarId` fields
- Returns `preferences` and `avatarId` in response

### PUT /api/users/me/onboarding
- Now accepts `language` and `avatarId` fields
- Returns `preferences` and `avatarId` in response

## Database Schema Changes

### User Model Updates
```javascript
// New fields added to User schema
preferences: {
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  }
},
avatarId: {
  type: String,
  default: null
}
```

## Testing

### Manual Testing with cURL

1. **Get user profile:**
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

2. **Complete onboarding with preferences:**
```bash
curl -X POST http://localhost:3000/api/users/me/onboarding \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "birthDate": {"day": 15, "month": 6, "year": 1990},
    "phone": "9876543210",
    "language": "hi",
    "avatarId": "avatar_123"
  }'
```

3. **Update onboarding with new preferences:**
```bash
curl -X PUT http://localhost:3000/api/users/me/onboarding \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "en", "avatarId": "avatar_456"}'
```

### Automated Testing
Run the test script:
```bash
cd backend
node test-user-preferences.js
```

## Frontend Integration

### Example Usage in Flutter/React Native

```javascript
// Get user profile with preferences
const getUserProfile = async () => {
  const response = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();

  const language = data.data.preferences.language; // 'en' or 'hi'
  const avatarId = data.data.avatarId; // string or null
  const isOnboarded = data.data.isOnboarded; // boolean
};

// Complete onboarding with preferences
const completeOnboarding = async (onboardingData) => {
  const response = await fetch('/api/users/me/onboarding', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName: onboardingData.fullName,
      birthDate: onboardingData.birthDate,
      phone: onboardingData.phone,
      language: onboardingData.language, // 'en' or 'hi'
      avatarId: onboardingData.avatarId
    })
  });
  return response.json();
};

// Update onboarding details including preferences
const updateOnboardingPreferences = async (language, avatarId) => {
  const response = await fetch('/api/users/me/onboarding', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ language, avatarId })
  });
  return response.json();
};
```

## Migration Notes

- Existing users will have default language preference set to 'en'
- Existing users will have avatarId set to null
- No breaking changes to existing API responses
- All existing functionality remains unchanged
