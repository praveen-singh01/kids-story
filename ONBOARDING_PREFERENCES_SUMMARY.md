# Kids Story Backend - Onboarding Preferences Integration

## Summary of Changes

The Kids Story Backend has been enhanced to include language preference and avatar ID selection as part of the user onboarding process. Instead of creating separate endpoints, these preferences are now integrated into the existing onboarding API.

## Files Modified

### 1. `src/models/User.js`
**Changes:**
- Added `preferences` object with `language` field (enum: 'en', 'hi', default: 'en')
- Added `avatarId` field (String, default: null)

**New Schema Fields:**
```javascript
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

### 2. `src/routes/users.js`
**Changes:**
- Enhanced `validateOnboarding` to accept optional `language` and `avatarId` fields
- Enhanced `validateOnboardingUpdate` to accept optional `language` and `avatarId` fields
- Updated `GET /users/me` to return preferences and avatarId in response
- Updated `PATCH /users/me` to return preferences and avatarId in response
- Updated `POST /users/me/onboarding` to handle language and avatarId fields
- Updated `PUT /users/me/onboarding` to handle language and avatarId fields
- All user responses now include consistent preference structure

**New Validation Rules:**
```javascript
body('language')
  .optional()
  .isIn(['en', 'hi'])
  .withMessage('Language must be either "en" or "hi"'),
body('avatarId')
  .optional()
  .isString()
  .trim()
  .withMessage('Avatar ID must be a string')
```

## API Endpoints Enhanced

### GET /api/users/me
**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "preferences": {
      "language": "en"
    },
    "avatarId": "avatar_123",
    "isOnboarded": true,
    // ... other fields
  }
}
```

### POST /api/users/me/onboarding
**Enhanced Request Body:**
```json
{
  "fullName": "John Doe",
  "birthDate": {"day": 15, "month": 6, "year": 1990},
  "phone": "9876543210",
  "language": "hi",           // NEW: Optional
  "avatarId": "avatar_456"    // NEW: Optional
}
```

### PUT /api/users/me/onboarding
**Enhanced Request Body:**
```json
{
  "fullName": "Updated Name",     // Optional
  "language": "en",               // NEW: Optional
  "avatarId": "avatar_new_123"    // NEW: Optional
  // ... other optional fields
}
```

## Testing Files Created

### 1. `test-user-preferences.js`
- Node.js test script using axios
- Tests onboarding with preferences
- Tests preference updates via onboarding endpoint
- Tests validation and error handling

### 2. `test-onboarding-preferences.sh`
- Bash script using cURL commands
- Complete end-to-end testing workflow
- Includes validation testing
- Easy to run and understand

### 3. `USER_PREFERENCES_API.md`
- Comprehensive API documentation
- Request/response examples
- Frontend integration examples
- cURL command examples

## Key Features

### 1. **Integrated Approach**
- Language and avatar preferences are part of onboarding flow
- No separate endpoints needed
- Consistent user experience

### 2. **Backward Compatibility**
- All existing functionality preserved
- Optional fields don't break existing clients
- Default values ensure smooth migration

### 3. **Validation**
- Language must be 'en' or 'hi'
- Avatar ID must be a string
- Proper error messages for invalid inputs

### 4. **Consistent Response Format**
- All user endpoints return preferences and avatarId
- Standardized response structure
- Easy frontend integration

## Usage Examples

### Frontend Integration (React Native/Flutter)
```javascript
// Complete onboarding with preferences
const onboardingData = {
  fullName: "John Doe",
  birthDate: {day: 15, month: 6, year: 1990},
  phone: "9876543210",
  language: "hi",
  avatarId: "avatar_123"
};

const response = await fetch('/api/users/me/onboarding', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(onboardingData)
});
```

### Update Preferences Later
```javascript
// Update only preferences
const updateData = {
  language: "en",
  avatarId: "new_avatar_456"
};

const response = await fetch('/api/users/me/onboarding', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

## Migration Notes

### For Existing Users
- Default language preference: 'en' (English)
- Default avatar ID: null
- No breaking changes to existing API responses
- All existing onboarding flows continue to work

### For Frontend Teams
- Update onboarding forms to include language and avatar selection
- Use the enhanced user object that includes preferences and avatarId
- Handle language switching based on user preference
- Display selected avatar based on avatarId

## Testing

### Run Automated Tests
```bash
# Node.js test
node test-user-preferences.js

# Bash test (requires jq)
./test-onboarding-preferences.sh
```

### Manual Testing
```bash
# Complete onboarding with preferences
curl -X POST http://localhost:3000/api/users/me/onboarding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "birthDate": {"day": 15, "month": 6, "year": 1990},
    "phone": "9876543210",
    "language": "hi",
    "avatarId": "avatar_123"
  }'
```

## Next Steps

1. **Frontend Integration**: Update mobile app onboarding screens
2. **Content Localization**: Use language preference for content delivery
3. **Avatar System**: Implement avatar display based on avatarId
4. **Analytics**: Track language and avatar preferences for insights
5. **Testing**: Add comprehensive unit and integration tests
