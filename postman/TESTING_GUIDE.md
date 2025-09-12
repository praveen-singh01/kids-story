# Kids Story API - Complete Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing the complete Kids Story API using the updated Postman collection.

## 🚀 Initial Setup

### 1. Import Files
Import these 3 files into Postman:
- `Kids-Story-Complete-API-Updated.postman_collection.json`
- `Kids-Story-Development-Updated.postman_environment.json`
- `Kids-Story-Production-Updated.postman_environment.json`

### 2. Select Environment
- For local testing: **Kids Story - Development (Updated)**
- For production testing: **Kids Story - Production (Updated)**

### 3. Update Base URL
Update the `base_url` in your selected environment:
- Development: `http://localhost:5000/api/v1`
- Production: `https://your-production-url.com/api/v1`

## 📋 Complete Testing Workflow

### Phase 1: Authentication & User Setup

#### Step 1: User Registration/Login
```
1. Run: Authentication → Register with Email
   OR
   Run: Authentication → Login with Email
   
✅ Expected: auth_token and user_id automatically saved
```

#### Step 2: Verify User Profile
```
2. Run: User Management → Get Current User Profile

✅ Expected: User details returned successfully
```

### Phase 2: Content Discovery

#### Step 3: Explore Content
```
3. Run: Content Management → List Content
4. Run: Content Management → Get Available Languages
5. Run: Content Management → Get Featured Content

✅ Expected: content_id and content_slug automatically saved
```

#### Step 4: Test Bilingual Support
```
6. Run: Content Management → List Content (change language=hi)
7. Run: Content Management → Search Content (query=story, language=hi)

✅ Expected: Hindi content returned with proper language fields
```

#### Step 5: Category Navigation
```
8. Run: Categories → List Categories
9. Run: Categories → Get Category by Slug

✅ Expected: category_id automatically saved
```

### Phase 3: User Interactions

#### Step 6: Kid Profile Management
```
10. Run: Avatars → Get Available Avatars
11. Run: Kid Profiles → Create Kid Profile
12. Run: Kid Profiles → List Kid Profiles

✅ Expected: kid_id automatically saved
```

#### Step 7: Favorites & Progress
```
13. Run: Favorites → Add to Favorites
14. Run: Favorites → Get User Favorites
15. Run: Progress Tracking → Update Progress
16. Run: Progress Tracking → Get All Progress

✅ Expected: favorite_id automatically saved, progress tracked
```

#### Step 8: Explore Features
```
17. Run: Explore → Get Browse Categories
18. Run: Explore → Get Featured Collections
19. Run: Explore → Get Continue Playing Items

✅ Expected: Personalized content recommendations
```

### Phase 4: Subscription & Payment

#### Step 9: Subscription Management
```
20. Run: Subscriptions → Get Available Plans
21. Run: Subscriptions → Create Subscription
22. Run: Subscriptions → Get My Subscription

✅ Expected: subscription_id automatically saved
```

#### Step 10: Payment Processing
```
23. Run: Payment → Create Order
24. Run: Payment → Create Payment Subscription
25. Run: Payment → Get User Orders

✅ Expected: order_id automatically saved
```

#### Step 11: Payment Verification
```
26. Run: Payment → Verify Payment Success (with test data)
27. Run: Payment → Payment Callback (simulate microservice)

✅ Expected: Payment status updated correctly
```

### Phase 5: Admin Operations (Optional)

#### Step 12: Admin Setup
```
28. Manually set admin_token in environment variables
29. Run: Admin Operations → Admin Health Check

✅ Expected: Admin authentication working
```

#### Step 13: Admin Management
```
30. Run: Admin Operations → Admin - List Users
31. Run: Admin Operations → Admin - List Content
32. Run: Admin Operations → Admin - Create User (optional)

✅ Expected: Admin operations successful
```

### Phase 6: System Health

#### Step 14: Health Checks
```
33. Run: Health & System → API Root
34. Run: Health & System → Health Check
35. Run: Health & System → Detailed Health Check

✅ Expected: All systems healthy
```

## 🔍 Validation Checklist

### Authentication ✅
- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth works (if configured)
- [ ] Tokens are automatically saved
- [ ] Protected endpoints require authentication

### Content Management ✅
- [ ] Content listing with filters works
- [ ] Search functionality works
- [ ] Bilingual content support works
- [ ] Content by slug retrieval works
- [ ] Featured content works

### User Features ✅
- [ ] Kid profile creation/management works
- [ ] Favorites add/remove works
- [ ] Progress tracking works
- [ ] User profile updates work

### Categories & Navigation ✅
- [ ] Category listing works
- [ ] Category content retrieval works
- [ ] Subcategories work
- [ ] Explore features work

### Subscriptions & Payment ✅
- [ ] Plan listing works
- [ ] Subscription creation works
- [ ] Payment order creation works
- [ ] Payment verification works
- [ ] Subscription status tracking works

### Admin Operations ✅
- [ ] Admin authentication works
- [ ] User management works
- [ ] Content management works
- [ ] Admin analytics work

### System Health ✅
- [ ] API health checks pass
- [ ] Database connectivity confirmed
- [ ] All endpoints respond correctly

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: 
- Check if `auth_token` is set in environment
- Re-run login endpoint to refresh token
- Verify token format (should be JWT)

### Issue: 404 Not Found
**Solution**:
- Verify `base_url` is correct
- Check if required IDs are set (content_id, user_id, etc.)
- Ensure server is running

### Issue: 400 Bad Request
**Solution**:
- Check request body format
- Verify required fields are present
- Check data types match API expectations

### Issue: Variables Not Auto-Saving
**Solution**:
- Check if test scripts are enabled
- Verify response format matches expected structure
- Check Postman Console for script errors

## 📊 Performance Testing

### Load Testing Endpoints
Test these endpoints under load:
1. `GET /content` - Content listing
2. `GET /content/search` - Search functionality
3. `POST /auth/login` - Authentication
4. `GET /subscriptions/me` - Subscription status
5. `POST /progress` - Progress updates

### Expected Response Times
- Authentication: < 500ms
- Content listing: < 1000ms
- Search: < 1500ms
- User operations: < 300ms
- Health checks: < 100ms

## 🔄 Automated Testing

### Collection Runner
1. Select the entire collection
2. Choose environment
3. Set iterations (1-10)
4. Run collection
5. Review results

### Newman CLI
```bash
newman run Kids-Story-Complete-API-Updated.postman_collection.json \
  -e Kids-Story-Development-Updated.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export results.html
```

## 📝 Test Data

### Sample Users
- Email: `test@example.com`
- Password: `password123`
- Phone: `+919999999999`

### Sample Kid Profiles
- Name: `Emma`, Age: `6-8`, Avatar: `avatar_girl_1`
- Name: `Alex`, Age: `9-12`, Avatar: `avatar_boy_1`

### Sample Content Filters
- Type: `story`, `meditation`, `sound`
- Age Range: `3-5`, `6-8`, `9-12`
- Language: `en`, `hi`
- Tags: `bedtime`, `adventure`, `educational`

## 📞 Support

For testing issues:
1. Check Postman Console for detailed logs
2. Verify server logs in `backend/logs/`
3. Test individual endpoints to isolate issues
4. Check database connection and data

---

**Happy Testing!** 🎉
