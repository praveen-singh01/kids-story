# Postman Collection Updates - Bilingual Content Support

This document outlines the updates made to the Postman collections to support the new bilingual content features.

## 📁 Updated Files

### 1. **Kids-Story-Payment-API.postman_collection.json** (Updated)
- **Version**: Updated to 2.0.0
- **Name**: Changed to "Kids Story API - Bilingual Support"
- **Description**: Updated to mention bilingual content support

### 2. **Kids-Story-Bilingual-Content.postman_collection.json** (New)
- **Purpose**: Focused collection for testing bilingual features only
- **Content**: Organized by language (English/Hindi) for easy comparison

### 3. **README.md** (Updated)
- Added bilingual content documentation
- Updated testing workflows
- Added response format examples

## 🔄 Content Endpoint Updates

### Updated Endpoints

#### 1. **List Content**
- **Before**: `GET /content?ageRange=6-8&type=story&limit=20&offset=0`
- **After**: `GET /content?ageRange=6-8&type=story&limit=20&offset=0&language=en`
- **New**: Added Hindi version with `language=hi`

#### 2. **Search Content**
- **Before**: `GET /content/search?q=adventure&limit=10`
- **After**: `GET /content/search?query=buddha&limit=10&language=en`
- **Changes**: 
  - Fixed parameter name from `q` to `query`
  - Added language parameter
  - Added Hindi version with Hindi search terms

#### 3. **Get Featured Content**
- **Before**: `GET /content/featured?limit=10`
- **After**: `GET /content/featured?limit=10&language=en`
- **New**: Added Hindi version with `language=hi`

#### 4. **Get Content by Slug**
- **Before**: `GET /content/adventure-story-1`
- **After**: `GET /content/buddha-and-angulimala?language=en`
- **Changes**:
  - Updated to use actual content slug
  - Added language parameter
  - Added Hindi version

#### 5. **Get Content by Type**
- **Before**: `GET /content/type/story?limit=20&offset=0&ageRange=6-8`
- **After**: `GET /content/type/story?limit=20&offset=0&ageRange=6-8&language=en`
- **New**: Added Hindi version with `language=hi`

### New Endpoints

#### 6. **Get Available Languages** ⭐ NEW
- **Endpoint**: `GET /content/languages`
- **Purpose**: Returns list of supported languages
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "code": "en",
      "name": "English", 
      "nativeName": "English"
    },
    {
      "code": "hi",
      "name": "Hindi",
      "nativeName": "हिन्दी"
    }
  ]
}
```

## 🌐 Language Parameter Support

### Supported Languages
- **English**: `language=en` (default)
- **Hindi**: `language=hi`

### Parameter Behavior
- **Optional**: If not provided, defaults to English
- **Validation**: Only accepts `en` or `hi`
- **Filtering**: Hindi requests only return content available in Hindi
- **Fallback**: If requested language not available, returns error

## 📋 Collection Organization

### Main Collection Structure
```
Kids Story API - Bilingual Support
├── Authentication
├── User Management  
├── Kid Profiles
├── Content (Updated with bilingual support)
│   ├── List Content
│   ├── List Content (Hindi)
│   ├── Search Content
│   ├── Search Content (Hindi)
│   ├── Get Featured Content
│   ├── Get Featured Content (Hindi)
│   ├── Get Content by Slug
│   ├── Get Content by Slug (Hindi)
│   ├── Get Content by Type
│   ├── Get Content by Type (Hindi)
│   └── Get Available Languages ⭐ NEW
├── Avatars
├── Explore
├── Favorites
├── Progress Tracking
├── Payment Orders
├── Payment Subscriptions
└── Health & Utility
```

### Bilingual-Focused Collection Structure
```
Kids Story - Bilingual Content API
├── 🌐 Language Support
│   └── Get Available Languages
├── 📚 Content - English
│   ├── List Content (English)
│   ├── Search Content (English)
│   ├── Get Featured Content (English)
│   ├── Get Content by Slug (English)
│   └── Get Content by Type (English)
├── 🇮🇳 Content - Hindi
│   ├── List Content (Hindi)
│   ├── Search Content (Hindi)
│   ├── Get Featured Content (Hindi)
│   ├── Get Content by Slug (Hindi)
│   └── Get Content by Type (Hindi)
└── 🔄 Language Comparison
    └── Compare Same Content - English vs Hindi
```

## 🧪 Testing Scenarios

### 1. **Language Discovery**
```
GET /content/languages
→ Verify both English and Hindi are available
```

### 2. **Content Filtering**
```
GET /content?language=hi
→ Should only return content available in Hindi
→ Verify Hindi titles, descriptions, audio/image URLs
```

### 3. **Language Comparison**
```
GET /content/buddha-and-angulimala?language=en
GET /content/buddha-and-angulimala?language=hi
→ Compare responses to verify different language content
```

### 4. **Search Functionality**
```
GET /content/search?query=buddha&language=en
GET /content/search?query=बुद्ध&language=hi
→ Test search in both languages
```

### 5. **Error Handling**
```
GET /content/english-only-content?language=hi
→ Should return 400 error for unavailable language
```

## 📝 Response Format Changes

### New Fields in Content Responses
- `availableLanguages`: Array of supported language codes
- `requestedLanguage`: The language code that was requested
- `defaultLanguage`: The default language for this content

### Language-Specific Fields
These fields now vary based on the requested language:
- `title`
- `description` 
- `audioUrl`
- `imageUrl`
- `thumbnailUrl`
- `metadata.keyValue`
- `metadata.summary`

## 🚀 Usage Instructions

### For Main Collection
1. Import `Kids-Story-Payment-API.postman_collection.json`
2. Use the updated content endpoints with language parameters
3. Test both English and Hindi versions of each endpoint

### For Bilingual-Focused Collection
1. Import `Kids-Story-Bilingual-Content.postman_collection.json`
2. Start with "Get Available Languages"
3. Test English endpoints, then Hindi endpoints
4. Use comparison endpoint to see differences

## 🔧 Environment Variables

No new environment variables are required. The existing setup works with:
- `base_url`: API base URL (http://localhost:3000/api/v1)

## 📊 Sample Test Data

The collections use the "Buddha and Angulimala" story which is available in both languages:
- **English**: "Buddha and Angulimala"
- **Hindi**: "बुद्ध और अंगुलिमाल"
- **Slug**: `buddha-and-angulimala`

This provides a perfect test case for bilingual functionality.
