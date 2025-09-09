# Kids Story - Complete API Collection Guide

## 📋 Overview

This comprehensive Postman collection includes all CRUD operations, admin endpoints, and update functionality for the Kids Story API. It covers content management, user management, filtering, analytics, and system endpoints.

## 🚀 Quick Start

### 1. Import Collection
- Import `Kids-Story-Complete-API.postman_collection.json` into Postman
- Import the environment file for your target environment (Development/Production)

### 2. Authentication Setup
1. **Run "Admin Login"** first to get admin token
2. **Run "User Login"** to get user token
3. Tokens are automatically saved to collection variables

### 3. Test Content Operations
1. Run "List Admin Content" to populate `content_id` variable
2. Run "List Users" to populate `user_id` variable
3. Now you can test all update operations

## 📚 Collection Structure

### 🔐 Authentication
- **Admin Login**: Get admin access token
- **User Login**: Get regular user access token

### 📚 Content Management

#### 📖 Content CRUD
- **List All Content**: Get public content with filtering options
- **Get Content by ID**: Retrieve specific content item

#### 🔧 Admin Content Operations
- **List Admin Content**: Get all content (admin view)
- **Create Content**: Add new content with all fields
- **Update Content**: ✅ **PATCH** - Update existing content
- **Toggle Featured Status**: ✅ **PATCH** - Quick featured toggle
- **Delete Content**: Remove content (soft delete)
- **Upload File**: Upload audio/image files

### 👥 User Management

#### 🔧 Admin User Operations
- **List Users**: Get all users with pagination
- **Create User**: Add new user account
- **Update User**: ✅ **PATCH** - Update user profile and settings
- **Delete User**: Remove user account

#### 👤 User Profile
- **Get My Profile**: Get current user profile
- **Update My Profile**: ✅ **PATCH** - Update own profile

### 🔍 Content Filtering & Search
- **Filter by New Collection**: `?newcollection=true`
- **Filter by Trending Now**: `?trendingnow=true`
- **Filter by Language**: `?language=hi` (Hindi) or `?language=en` (English)
- **Filter by Type**: `?type=story`
- **Filter by Age Range**: `?ageRange=6-8`
- **Combined Filters**: Multiple filters together

### 📊 Analytics & System
- **Dashboard Analytics**: Admin dashboard stats
- **Content Analytics**: Content performance metrics
- **User Analytics**: User engagement metrics
- **Health Check**: Basic API health
- **Detailed Health Check**: Comprehensive system status

## 🔧 Update Endpoints Reference

### Content Updates

#### 1. Update Content - `PATCH /admin/content/:id`
```json
{
  "title": "Updated Story Title",
  "description": "Updated story description",
  "type": "story",
  "ageRange": "6-8",
  "language": "en",
  "featured": true,
  "isNewCollection": true,
  "isTrendingNow": false,
  "isActive": true
}
```

#### 2. Toggle Featured Status - `PATCH /admin/content/:id/featured`
```json
{
  "featured": true
}
```

### User Updates

#### 3. Admin Update User - `PATCH /admin/users/:id`
```json
{
  "name": "Updated User Name",
  "email": "updated@example.com",
  "roles": ["user", "admin"],
  "subscription": {
    "plan": "premium",
    "status": "active"
  },
  "isActive": true
}
```

#### 4. User Update Profile - `PATCH /users/me`
```json
{
  "name": "Updated Profile Name",
  "email": "newemail@example.com"
}
```

## 🎯 New Features Included

### ✅ New Collection & Trending Filters
- `?newcollection=true` - Filter content marked as new collections
- `?trendingnow=true` - Filter content marked as trending now
- Both work on `/content` and `/admin/content` endpoints

### ✅ Enhanced Content Fields
- `isNewCollection`: Boolean flag for new collection status
- `isTrendingNow`: Boolean flag for trending status
- Both fields can be updated via PATCH endpoints

### ✅ Bilingual Support
- `?language=hi` - Get Hindi content
- `?language=en` - Get English content
- Content structure supports multiple languages

## 🔄 Variables Used

The collection uses these variables for dynamic testing:
- `{{base_url}}`: API base URL
- `{{admin_token}}`: Admin authentication token
- `{{user_token}}`: User authentication token
- `{{content_id}}`: Content ID for testing updates
- `{{user_id}}`: User ID for testing updates

## 📝 Testing Workflow

### Content Management Flow
1. **Admin Login** → Get admin token
2. **List Admin Content** → Get content ID
3. **Update Content** → Test content updates
4. **Toggle Featured Status** → Test quick toggles
5. **Create Content** → Test content creation

### User Management Flow
1. **Admin Login** → Get admin token
2. **List Users** → Get user ID
3. **Update User** → Test user updates
4. **User Login** → Get user token
5. **Update My Profile** → Test profile updates

### Filtering Flow
1. **Filter by New Collection** → Test new collection filter
2. **Filter by Trending Now** → Test trending filter
3. **Filter by Language** → Test Hindi/English filters
4. **Combined Filters** → Test multiple filters

## 🚨 Important Notes

- **Authentication Required**: Most endpoints require valid tokens
- **Admin Permissions**: Admin endpoints require admin role
- **Rate Limiting**: Login endpoints have rate limiting
- **File Uploads**: Use form-data for file upload endpoint
- **Soft Deletes**: Delete operations are soft deletes (set isActive: false)

## 🔍 Troubleshooting

### Common Issues
1. **401 Unauthorized**: Run login endpoint first
2. **404 Not Found**: Check if content/user ID exists
3. **429 Rate Limited**: Wait before retrying login
4. **Validation Errors**: Check request body format

### Debug Tips
- Check collection variables are set correctly
- Verify token is not expired
- Use "Get Content by ID" to verify updates
- Check server logs for detailed error messages
