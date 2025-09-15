# Kids Story Backend - Onboarding API cURL Commands

## Prerequisites

1. Make sure the Kids Story backend server is running on `http://localhost:3000`
2. You need a valid JWT access token from user registration or login

## Step 1: Register a Test User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.onboarding@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "test.onboarding@example.com",
      "name": "Test User",
      "isOnboarded": false,
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the `accessToken` from the response for the next steps.**

## Step 2: Check Initial Onboarding Status

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET http://localhost:3000/api/v1/users/me/onboarding-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding status retrieved successfully",
  "data": {
    "isOnboarded": false,
    "hasFullName": false,
    "hasBirthDate": false,
    "hasPhone": false
  }
}
```

## Step 3: Complete Onboarding

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe Smith",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2015
    },
    "phone": "9876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "test.onboarding@example.com",
      "name": "Test User",
      "fullName": "John Doe Smith",
      "birthDate": {
        "day": 15,
        "month": 6,
        "year": 2015
      },
      "phone": "9876543210",
      "isOnboarded": true,
      ...
    },
    "isOnboarded": true
  }
}
```

## Step 4: Verify Onboarding Status After Completion

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET http://localhost:3000/api/v1/users/me/onboarding-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
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

## Step 5: Test Duplicate Onboarding (Should Fail)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Another Name",
    "birthDate": {
      "day": 20,
      "month": 8,
      "year": 2016
    },
    "phone": "9876543211"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["User has already completed onboarding"],
  "message": "Onboarding failed"
}
```

## Step 6: Update Onboarding Details (PUT)

### Full Update

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Full Name",
    "birthDate": {
      "day": 25,
      "month": 12,
      "year": 2019
    },
    "phone": "9123456789"
  }'
```

### Partial Update (Only Full Name)

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Partially Updated Name"
  }'
```

### Update Only Phone Number

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999888777"
  }'
```

### Update Only Birth Date

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": {
      "day": 1,
      "month": 1,
      "year": 2021
    }
  }'
```

**Expected Response for PUT requests:**
```json
{
  "success": true,
  "message": "Onboarding details updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "test.onboarding@example.com",
      "name": "Test User",
      "fullName": "Updated Full Name",
      "birthDate": {
        "day": 25,
        "month": 12,
        "year": 2019
      },
      "phone": "9123456789",
      "isOnboarded": true,
      ...
    },
    "updated": ["fullName", "birthDate", "phone"]
  }
}
```

## Error Testing Examples

### Invalid Birth Date (Day > 31)

```bash
# Register a new user first, then use this command
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "birthDate": {
      "day": 32,
      "month": 6,
      "year": 2015
    },
    "phone": "9876543211"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["Birth day must be between 1 and 31"],
  "message": "Validation failed"
}
```

### Invalid Phone Number

```bash
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2015
    },
    "phone": "1234567890"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["Phone number is required and must be 10 digits starting with 6-9"],
  "message": "Validation failed"
}
```

### Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2015
    }
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": [
    "Full name is required and must be between 2 and 100 characters",
    "Phone number is required and must be 10 digits starting with 6-9"
  ],
  "message": "Validation failed"
}
```

### Age Too Young (Less than 3 years old)

```bash
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Baby User",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2023
    },
    "phone": "9876543211"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["User must be at least 3 years old"],
  "message": "Onboarding failed"
}
```

## Authentication Error Testing

### No Authorization Header

```bash
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2015
    },
    "phone": "9876543210"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Invalid Token

```bash
curl -X POST http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "birthDate": {
      "day": 15,
      "month": 6,
      "year": 2015
    },
    "phone": "9876543210"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "Token is not valid."
}
```

### PUT Endpoint Error Testing

#### Empty Update (Should Fail)

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["No valid fields provided for update"],
  "message": "Update failed"
}
```

#### Incomplete Birth Date (Should Fail)

```bash
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": {
      "day": 15
    }
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["Birth date must include day, month, and year"],
  "message": "Update failed"
}
```

#### Update Without Onboarding (Should Fail)

```bash
# First register a new user without completing onboarding
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not.onboarded@example.com",
    "password": "testpassword123",
    "name": "Not Onboarded User"
  }'

# Then try to update (use the token from registration response)
curl -X PUT http://localhost:3000/api/v1/users/me/onboarding \
  -H "Authorization: Bearer NEW_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Should Fail"
  }'
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": ["User must complete onboarding first"],
  "message": "Update failed"
}
```

## Notes

1. Replace `YOUR_ACCESS_TOKEN` with the actual JWT token received from registration/login
2. Each test user email must be unique - change the email address for each test
3. Phone numbers must be unique across all users
4. The server must be running on `http://localhost:3000` (or update the URL accordingly)
5. All timestamps in responses are in ISO 8601 format
6. Birth dates are validated to ensure they represent valid calendar dates
7. No age restrictions are enforced - users can enter any valid birth date
8. PUT endpoint allows partial updates - only provided fields will be updated
9. When updating birth date via PUT, all three fields (day, month, year) must be provided together
