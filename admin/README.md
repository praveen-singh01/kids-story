# 🌙 Bedtime Stories Admin Dashboard

A beautiful, modern admin dashboard for managing the Bedtime Stories platform. Built with React, Vite, and Tailwind CSS.

## ✨ Features

### 🎯 Dashboard Overview
- **Real-time Statistics**: Content metrics, user analytics, and engagement data
- **Beautiful Charts**: Interactive visualizations using Recharts
- **Quick Actions**: Easy access to common admin tasks
- **Recent Activity**: Latest content and user activity

### 📚 Content Management
- **Content CRUD**: Create, read, update, and delete stories, music, meditations, and affirmations
- **Bulk Operations**: Update multiple content items at once
- **Advanced Filtering**: Filter by type, age range, status, and more
- **Search Functionality**: Find content quickly with full-text search
- **Media Upload**: Drag-and-drop file upload for audio and images

### 👥 User Management
- **User Overview**: View all users with subscription details
- **User Profiles**: Detailed user information including kids and favorites
- **Subscription Management**: Monitor and update user subscriptions
- **Search & Filter**: Find users by email, name, plan, or status

### 📊 Analytics & Insights
- **Content Performance**: Track plays, engagement, and popularity
- **User Analytics**: Monitor user growth and activity patterns
- **Age Group Insights**: Understand content preferences by age range
- **Trend Analysis**: Weekly and monthly performance trends

### ⚙️ System Management
- **Settings Panel**: Configure system preferences
- **Cache Management**: Clear caches and optimize performance
- **File Uploads**: Manage media files and assets
- **Health Monitoring**: System status and performance metrics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Backend API running on port 3000

### Installation

1. **Navigate to admin directory**:
   ```bash
   cd admin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0ea5e9) - Main brand color
- **Secondary**: Purple (#a855f7) - Accent color
- **Success**: Green (#10b981) - Success states
- **Warning**: Orange (#f59e0b) - Warning states
- **Error**: Red (#ef4444) - Error states

### Typography
- **Font Family**: Inter - Clean, modern sans-serif
- **Font Weights**: 300, 400, 500, 600, 700

### Components
- **Cards**: Clean white cards with subtle shadows
- **Buttons**: Rounded buttons with hover states
- **Forms**: Consistent input styling with focus states
- **Tables**: Responsive tables with hover effects

## 🔐 Authentication

The admin dashboard uses JWT-based authentication with role-based access control:

- **Login Required**: All routes require authentication
- **Admin Role**: Users must have 'admin' role to access
- **Token Management**: Automatic token refresh and logout
- **Secure Storage**: Tokens stored in localStorage with validation

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop**: Full-featured experience
- **Tablet**: Optimized layout with collapsible sidebar
- **Mobile**: Mobile-first design with touch-friendly interface

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Tailwind CSS**: Utility-first CSS framework

### UI Components
- **Lucide React**: Beautiful icons
- **React Dropzone**: File upload component
- **Recharts**: Chart library
- **React Hot Toast**: Toast notifications
- **Date-fns**: Date manipulation

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## 📁 Project Structure

```
admin/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.jsx     # Main layout with sidebar
│   │   ├── LoadingSpinner.jsx
│   │   ├── StatsCard.jsx
│   │   ├── FileUpload.jsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.js     # Authentication hook
│   ├── lib/               # Utilities and API
│   │   ├── api.js         # API client
│   │   └── utils.js       # Helper functions
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Content.jsx    # Content management
│   │   ├── Users.jsx      # User management
│   │   ├── Analytics.jsx  # Analytics dashboard
│   │   └── ...
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### Environment Variables
The admin dashboard connects to the backend API running on `localhost:3000`. The Vite proxy configuration handles API requests.

### API Endpoints
All API calls are made to `/api/v1/*` endpoints:
- **Authentication**: `/api/v1/auth/*`
- **Content**: `/api/v1/admin/content/*`
- **Users**: `/api/v1/admin/users/*`
- **Analytics**: `/api/v1/admin/stats/*`
- **Uploads**: `/api/v1/admin/upload`

## 🎯 Usage

### Login
1. Navigate to the admin dashboard
2. Enter admin credentials (email/password)
3. System validates admin role and redirects to dashboard

### Content Management
1. Go to Content section
2. View, search, and filter existing content
3. Click "Add Content" to create new content
4. Upload audio files and cover images
5. Set content details and publish

### User Management
1. Access Users section
2. View user list with subscription details
3. Search and filter users
4. Click on users to view detailed profiles

### Analytics
1. Visit Analytics section
2. View performance metrics and charts
3. Analyze content popularity and user engagement
4. Export data for reporting

## 🚀 Deployment

The admin dashboard can be deployed as a static site:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Configure API proxy** in production to point to your backend API

## 📄 License

This project is part of the Bedtime Stories platform and follows the same license terms.
