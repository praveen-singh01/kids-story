# Kids Story Backend - Onboarding API Documentation

## Overview

The onboarding API allows users to complete their profile setup by providing additional information required for the Kids Story app. This includes full name, birth date, and phone number. Once completed, users are marked as onboarded and can skip the onboarding flow in the frontend.

## API Endpoints

### 1. Complete Onboarding

**Endpoint:** `POST /api/v1/users/me/onboarding`

**Authentication:** Required (Bearer token)

**Description:** Complete user onboarding by providing full name, birth date, and phone number.

#### Request Body

```json
{
  "fullName": "John Doe Smith",
  "birthDate": {
    "day": 15,
    "month": 6,
    "year": 2015
  },
  "phone": "9876543210"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | String | Yes | User's full name (2-100 characters) |
| `birthDate.day` | Number | Yes | Birth day (1-31) |
| `birthDate.month` | Number | Yes | Birth month (1-12) |
| `birthDate.year` | Number | Yes | Birth year (1900-current year) |
| `phone` | String | Yes | Indian phone number (10 digits starting with 6-9) |

#### Success Response (200)

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "fullName": "John Doe Smith",
      "birthDate": {
        "day": 15,
        "month": 6,
        "year": 2015
      },
      "phone": "9876543210",
      "isOnboarded": true,
      "provider": "google",
      "roles": ["user"],
      "subscription": {
        "plan": "free",
        "status": "active"
      },
      "emailVerified": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "isOnboarded": true
  }
}
```

#### Error Responses

**400 Bad Request - Already Onboarded**
```json
{
  "success": false,
  "error": ["User has already completed onboarding"],
  "message": "Onboarding failed"
}
```

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": ["Full name is required and must be between 2 and 100 characters"],
  "message": "Validation failed"
}
```

**400 Bad Request - Invalid Birth Date**
```json
{
  "success": false,
  "error": ["Invalid birth date"],
  "message": "Onboarding failed"
}
```

**409 Conflict - Phone Number Exists**
```json
{
  "success": false,
  "error": ["Phone number already exists"],
  "message": "Onboarding failed"
}
```

### 2. Check Onboarding Status

**Endpoint:** `GET /api/v1/users/me/onboarding-status`

**Authentication:** Required (Bearer token)

**Description:** Check if the current user has completed onboarding and what information is available.

#### Success Response (200)

```json
{
  "success": true,
  "message": "Onboarding status retrieved successfully",
  "data": {
    "isOnboarded": true,
    "hasFullName": true,
    "hasBirthDate": true,
    "hasPhone": true
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `isOnboarded` | Boolean | Whether user has completed onboarding |
| `hasFullName` | Boolean | Whether user has provided full name |
| `hasBirthDate` | Boolean | Whether user has provided birth date |
| `hasPhone` | Boolean | Whether user has provided phone number |

### 3. Update Onboarding Details

**Endpoint:** `PUT /api/v1/users/me/onboarding`

**Authentication:** Required (Bearer token)

**Description:** Update user onboarding details. User must have completed onboarding first. All fields are optional - only provided fields will be updated.

#### Request Body

```json
{
  "fullName": "Updated Full Name",
  "birthDate": {
    "day": 20,
    "month": 8,
    "year": 2018
  },
  "phone": "9123456789"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | String | No | User's full name (2-100 characters) |
| `birthDate.day` | Number | No* | Birth day (1-31) |
| `birthDate.month` | Number | No* | Birth month (1-12) |
| `birthDate.year` | Number | No* | Birth year (1900-current year) |
| `phone` | String | No | Indian phone number (10 digits starting with 6-9) |

*Note: If updating birth date, all three fields (day, month, year) must be provided together.

#### Success Response (200)

```json
{
  "success": true,
  "message": "Onboarding details updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "fullName": "Updated Full Name",
      "birthDate": {
        "day": 20,
        "month": 8,
        "year": 2018
      },
      "phone": "9123456789",
      "isOnboarded": true,
      "provider": "google",
      "roles": ["user"],
      "subscription": {
        "plan": "free",
        "status": "active"
      },
      "emailVerified": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "updated": ["fullName", "birthDate", "phone"]
  }
}
```

#### Error Responses

**400 Bad Request - Not Onboarded**
```json
{
  "success": false,
  "error": ["User must complete onboarding first"],
  "message": "Update failed"
}
```

**400 Bad Request - No Fields to Update**
```json
{
  "success": false,
  "error": ["No valid fields provided for update"],
  "message": "Update failed"
}
```

**400 Bad Request - Incomplete Birth Date**
```json
{
  "success": false,
  "error": ["Birth date must include day, month, and year"],
  "message": "Update failed"
}
```

**409 Conflict - Phone Number Exists**
```json
{
  "success": false,
  "error": ["Phone number already exists"],
  "message": "Update failed"
}
```

## Frontend Integration Guide

### 1. Check Onboarding Status on App Launch

```javascript
// Check if user needs to complete onboarding
const checkOnboardingStatus = async () => {
  try {
    const response = await fetch('/api/v1/users/me/onboarding-status', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success && !data.data.isOnboarded) {
      // Show onboarding screen
      navigateToOnboarding();
    } else {
      // User is onboarded, proceed to main app
      navigateToMainApp();
    }
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
  }
};
```

### 2. Complete Onboarding

```javascript
const completeOnboarding = async (onboardingData) => {
  try {
    const response = await fetch('/api/v1/users/me/onboarding', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(onboardingData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Onboarding completed successfully
      console.log('Onboarding completed:', data.data.user);
      navigateToMainApp();
    } else {
      // Handle errors
      console.error('Onboarding failed:', data.error);
      showErrorMessage(data.error.join(', '));
    }
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    showErrorMessage('Failed to complete onboarding. Please try again.');
  }
};
```

### 3. Form Validation

```javascript
const validateOnboardingForm = (formData) => {
  const errors = [];
  
  // Validate full name
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }
  
  // Validate birth date
  const { day, month, year } = formData.birthDate;
  const birthDate = new Date(year, month - 1, day);
  
  if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1) {
    errors.push('Please enter a valid birth date');
  }

  // Validate phone number
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(formData.phone)) {
    errors.push('Please enter a valid 10-digit phone number starting with 6-9');
  }
  
  return errors;
};
```

### 4. Update Onboarding Details

```javascript
const updateOnboardingDetails = async (updateData) => {
  try {
    const response = await fetch('/api/v1/users/me/onboarding', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('Onboarding details updated:', data.data.user);
      console.log('Updated fields:', data.data.updated);
      return data.data.user;
    } else {
      console.error('Update failed:', data.error);
      showErrorMessage(data.error.join(', '));
    }
  } catch (error) {
    console.error('Failed to update onboarding details:', error);
    showErrorMessage('Failed to update details. Please try again.');
  }
};

// Example: Update only full name
await updateOnboardingDetails({
  fullName: 'New Full Name'
});

// Example: Update only phone number
await updateOnboardingDetails({
  phone: '9876543210'
});

// Example: Update birth date (must include all three fields)
await updateOnboardingDetails({
  birthDate: {
    day: 15,
    month: 8,
    year: 2020
  }
});

// Example: Update multiple fields
await updateOnboardingDetails({
  fullName: 'Updated Name',
  phone: '9123456789'
});
```

## Testing

Run the test script to verify the onboarding API:

```bash
cd backend
node test-onboarding-api.js
```

The test script will:
1. Register a new test user
2. Check initial onboarding status
3. Complete onboarding with valid data
4. Verify onboarding completion
5. Test duplicate onboarding prevention
6. Test validation error handling

## Database Schema Changes

The User model has been updated with the following new fields:

```javascript
// New fields added to User schema
fullName: {
  type: String,
  trim: true,
  maxlength: 100
},
birthDate: {
  day: {
    type: Number,
    min: 1,
    max: 31
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  }
},
isOnboarded: {
  type: Boolean,
  default: false
}
```

## Security Considerations

1. **Authentication Required**: All onboarding endpoints require valid JWT authentication
2. **One-time Onboarding**: Users can only complete onboarding once (but can update details later)
3. **Phone Number Uniqueness**: Phone numbers must be unique across all users
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Standard rate limiting applies to prevent abuse
6. **Partial Updates**: PUT endpoint allows updating individual fields without affecting others

## Error Handling

The API provides detailed error messages for various scenarios:
- Missing or invalid fields
- Already onboarded users
- Duplicate phone numbers
- Invalid birth dates
- Age restrictions
- Server errors

All errors follow the standard API response format with appropriate HTTP status codes.
