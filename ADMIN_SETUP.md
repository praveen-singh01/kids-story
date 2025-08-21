# 🌙 Bedtime Stories Admin Dashboard Setup Guide

This guide will help you set up and run the beautiful admin dashboard for the Bedtime Stories platform.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 8+** installed
- **MongoDB** running (for the backend)
- **Redis** running (for caching)
- **Backend API** configured and running

## 🚀 Quick Start

### 1. Start the Backend API

First, make sure your backend is running:

```bash
# In the root directory
npm install
npm run dev
```

The backend should be running on `http://localhost:3000`

### 2. Create an Admin User

You need an admin user to access the dashboard. You can create one using the MongoDB shell or a database GUI:

```javascript
// Connect to your MongoDB database
use bedtime

// Create an admin user
db.users.insertOne({
  email: "admin@example.com",
  name: "Admin User",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJL9.K5F6", // "admin123"
  provider: "local",
  roles: ["admin"],
  isEmailVerified: true,
  subscription: {
    plan: "premium",
    status: "active"
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date()
})
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

### 3. Install Admin Dashboard Dependencies

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install
```

### 4. Start the Admin Dashboard

```bash
# Start development server
npm run dev
```

The admin dashboard will be available at `http://localhost:5173`

### 5. Login to the Dashboard

1. Open `http://localhost:5173` in your browser
2. Login with the admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. You should be redirected to the dashboard!

## 🧪 Testing the Setup

You can test if everything is working correctly:

```bash
# In the admin directory
node src/test-admin.js
```

This will test the API endpoints and verify admin access.

## 🎨 Dashboard Features

Once logged in, you'll have access to:

### 📊 Dashboard Overview
- Real-time statistics and metrics
- Content performance charts
- Recent activity feed
- Quick action buttons

### 📚 Content Management
- View all content (stories, music, meditations, affirmations)
- Create new content with file uploads
- Edit existing content
- Bulk operations (activate/deactivate, feature content)
- Advanced search and filtering

### 👥 User Management
- View all users and their subscription details
- Search users by email or name
- Filter by subscription plan or status
- View user profiles with kids and favorites

### 📈 Analytics
- Content performance metrics
- User engagement analytics
- Age group preferences
- Weekly and monthly trends

### ⚙️ Settings
- Profile management
- System configuration
- Cache management
- Notification preferences

## 🔧 Configuration

### Backend API Configuration

The admin dashboard connects to your backend API. Make sure these endpoints are working:

- `POST /api/v1/auth/login` - Admin authentication
- `GET /api/v1/admin/content` - Content management
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/stats/*` - Analytics data
- `POST /api/v1/admin/upload` - File uploads

### Environment Variables

The admin dashboard uses these default configurations:

- **API Base URL**: `http://localhost:3000/api/v1`
- **Development Port**: `5173`

You can modify these in `admin/vite.config.js` if needed.

## 📁 File Uploads

The dashboard supports file uploads for:

- **Audio Files**: MP3, WAV, M4A (max 50MB)
- **Images**: JPG, PNG, WebP (max 10MB)

Uploaded files are stored in the `uploads/` directory and served at `/uploads/*` URLs.

## 🎯 Usage Examples

### Creating New Content

1. Go to **Content** → **Add Content**
2. Fill in the content details:
   - Type (Story, Music, Meditation, Affirmation)
   - Title and duration
   - Age range (3-5, 6-8, 9-12)
   - Tags for categorization
3. Upload audio file and cover image
4. Set featured/active status
5. Click **Create Content**

### Managing Users

1. Go to **Users** section
2. Use search to find specific users
3. Filter by subscription plan or status
4. Click on a user to view detailed profile
5. Update user information as needed

### Viewing Analytics

1. Go to **Analytics** section
2. View overview statistics
3. Analyze content performance charts
4. Check user engagement metrics
5. Export data for reporting

## 🚨 Troubleshooting

### Common Issues

**1. "Cannot connect to API"**
- Ensure backend is running on port 3000
- Check CORS configuration in backend
- Verify API endpoints are accessible

**2. "Login failed"**
- Verify admin user exists in database
- Check user has "admin" role
- Ensure password is correct

**3. "File upload failed"**
- Check uploads directory exists and is writable
- Verify file size limits
- Ensure multer is configured correctly

**4. "Charts not loading"**
- Check if analytics data is available
- Verify stats API endpoints are working
- Look for JavaScript errors in browser console

### Debug Mode

Enable debug logging by setting localStorage:

```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

### API Testing

Test individual API endpoints:

```bash
# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test content API (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/v1/admin/content \
  -H "Authorization: Bearer TOKEN"
```

## 🔒 Security Notes

- Admin credentials should be changed in production
- Use strong passwords for admin accounts
- Enable HTTPS in production
- Regularly update dependencies
- Monitor admin access logs

## 📚 Additional Resources

- [Backend API Documentation](./README.md)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Review backend logs for API errors
3. Verify database connections
4. Test API endpoints manually
5. Check file permissions for uploads

## 🎉 Success!

Once everything is set up, you should have a fully functional admin dashboard with:

- ✅ Beautiful, responsive design
- ✅ Real-time data and analytics
- ✅ Content management with file uploads
- ✅ User management and monitoring
- ✅ Comprehensive search and filtering
- ✅ Role-based access control

Enjoy managing your Bedtime Stories platform! 🌙
