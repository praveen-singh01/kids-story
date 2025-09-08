# Bilingual Content API Documentation

This document describes the enhanced API endpoints that support bilingual content (English and Hindi) for the Kids Story application.

## Overview

The API now supports serving content in multiple languages. All content endpoints accept a `language` query parameter to specify the desired language. If no language is specified, English (`en`) is used as the default.

### Supported Languages

- `en` - English (default)
- `hi` - Hindi (हिन्दी)

## API Endpoints

### 1. Get Content List

**Endpoint:** `GET /api/v1/content`

**Query Parameters:**
- `language` (optional): Language code (`en` or `hi`)
- `ageRange` (optional): Age range filter (`3-5`, `6-8`, `9-12`)
- `tags` (optional): Comma-separated tags
- `type` (optional): Content type (`story`, `meditation`, `affirmation`, `sound`)
- `limit` (optional): Number of items to return (1-100, default: 20)
- `offset` (optional): Number of items to skip (default: 0)

**Example Request:**
```
GET /api/v1/content?language=hi&ageRange=6-8&limit=10
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "content_id",
        "type": "story",
        "slug": "buddha-and-angulimala",
        "durationSec": 480,
        "ageRange": "6-8",
        "tags": ["wisdom", "compassion"],
        "defaultLanguage": "en",
        "availableLanguages": ["en", "hi"],
        "isFeatured": true,
        "popularityScore": 4.5,
        "publishedAt": "2024-01-01T00:00:00.000Z",
        
        // Language-specific content (based on requested language)
        "title": "बुद्ध और अंगुलिमाल",
        "description": "करुणा और परिवर्तन की कहानी...",
        "audioUrl": "/assets/ElevenLabs_buddha_and_angulimala.mp3",
        "imageUrl": "/assets/Hindi.png",
        "thumbnailUrl": null,
        "metadata": {
          "keyValue": "करुणा",
          "summary": "इस शक्तिशाली कहानी के माध्यम से..."
        },
        
        // Additional response metadata
        "requestedLanguage": "hi"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    },
    "language": "hi"
  },
  "message": "Content retrieved successfully"
}
```

### 2. Get Content by Slug

**Endpoint:** `GET /api/v1/content/:slug`

**Query Parameters:**
- `language` (optional): Language code (`en` or `hi`)

**Example Request:**
```
GET /api/v1/content/buddha-and-angulimala?language=en
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "content_id",
    "type": "story",
    "slug": "buddha-and-angulimala",
    "durationSec": 480,
    "ageRange": "6-8",
    "tags": ["wisdom", "compassion"],
    "defaultLanguage": "en",
    "availableLanguages": ["en", "hi"],
    "isFeatured": true,
    "popularityScore": 4.5,
    "publishedAt": "2024-01-01T00:00:00.000Z",
    
    // Language-specific content (English in this example)
    "title": "Buddha and Angulimala",
    "description": "A story about compassion and transformation...",
    "audioUrl": "/assets/Buddha and Angulimala.mp3",
    "imageUrl": "/assets/English (1).png",
    "thumbnailUrl": null,
    "metadata": {
      "keyValue": "Compassion",
      "summary": "Through this powerful tale, children learn..."
    },
    
    "requestedLanguage": "en"
  },
  "message": "Content retrieved successfully"
}
```

### 3. Get Featured Content

**Endpoint:** `GET /api/v1/content/featured`

**Query Parameters:**
- `language` (optional): Language code (`en` or `hi`)
- `limit` (optional): Number of items to return (default: 10)

**Example Request:**
```
GET /api/v1/content/featured?language=hi&limit=5
```

### 4. Search Content

**Endpoint:** `GET /api/v1/content/search`

**Query Parameters:**
- `query` (required): Search query string
- `language` (optional): Language code (`en` or `hi`)
- `limit` (optional): Number of items to return (default: 20)

**Example Request:**
```
GET /api/v1/content/search?query=buddha&language=hi
```

### 5. Get Content by Type

**Endpoint:** `GET /api/v1/content/type/:type`

**Query Parameters:**
- `language` (optional): Language code (`en` or `hi`)
- `ageRange` (optional): Age range filter
- `limit` (optional): Number of items to return (default: 20)
- `offset` (optional): Number of items to skip (default: 0)

**Example Request:**
```
GET /api/v1/content/type/story?language=hi&ageRange=6-8
```

### 6. Get Available Languages

**Endpoint:** `GET /api/v1/content/languages`

**Description:** Returns a list of all available languages in the system.

**Response Format:**
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
  ],
  "message": "Available languages retrieved successfully"
}
```

## Error Handling

### Language Not Supported

When requesting content in a language that's not available for that specific content:

```json
{
  "success": false,
  "errors": ["Content not available in the requested language"],
  "message": "Language not available"
}
```

### Invalid Language Code

When providing an unsupported language code:

```json
{
  "success": false,
  "errors": ["Language must be one of: en, hi"],
  "message": "Language validation failed"
}
```

## Content Structure

### Language-Specific Fields

Each content item can have different values for these fields in different languages:

- `title` - Content title
- `description` - Content description
- `audioUrl` - URL to the audio file
- `imageUrl` - URL to the image file
- `thumbnailUrl` - URL to the thumbnail image
- `metadata.keyValue` - Key learning value
- `metadata.summary` - Content summary

### Language-Agnostic Fields

These fields remain the same across all languages:

- `id` - Content ID
- `type` - Content type
- `slug` - URL slug
- `durationSec` - Duration in seconds
- `ageRange` - Target age range
- `tags` - Content tags
- `isFeatured` - Featured status
- `popularityScore` - Popularity score
- `publishedAt` - Publication date
- `defaultLanguage` - Default language code
- `availableLanguages` - Array of available language codes

## Frontend Integration

### Requesting Content in Specific Language

```javascript
// Get Hindi content
const response = await fetch('/api/v1/content?language=hi');
const data = await response.json();

// Get English content (default)
const response = await fetch('/api/v1/content');
const data = await response.json();
```

### Checking Language Availability

```javascript
// Check if content is available in Hindi
const content = data.data.content[0];
const isHindiAvailable = content.availableLanguages.includes('hi');
```

### Language Switching

```javascript
// Get the same content in different language
const slug = 'buddha-and-angulimala';
const englishContent = await fetch(`/api/v1/content/${slug}?language=en`);
const hindiContent = await fetch(`/api/v1/content/${slug}?language=hi`);
```

## Migration

To migrate existing content to the new bilingual structure, run:

```bash
npm run migrate:bilingual
```

This will:
1. Convert existing content to the new schema
2. Create sample bilingual content
3. Validate the migration results

## Notes

- All endpoints maintain backward compatibility
- If no language is specified, English is used as default
- Content filtering by language only shows content that has the requested language available
- The `requestedLanguage` field in responses indicates which language was served
- Error messages are localized based on the requested language
