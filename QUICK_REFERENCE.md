# ReMember - Quick Reference Guide

## 🚀 Start Application (One-Time Setup)

### First Time Only:
```bash
cd "c:\Users\varun\OneDrive\Documents\Project X\organizr"

# Install dependencies
cd server && npm install
cd ../client && npm install

# Ensure MongoDB is running
mongod

# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2)  
cd client && npm start
```

## ⚡ Quick Commands

### Development
```bash
# Start backend (from server directory)
npm run dev

# Start frontend (from client directory)
npm start

# Build frontend for production
cd client && npm run build

# Health check
curl http://localhost:5000/api/health
```

### Useful URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📋 Environment Configuration

File: `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/remember
# For MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/remember

JWT_SECRET=your_secure_random_key_here
ENCRYPTION_KEY=your_secure_random_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 🗄️ Database Setup

### Option 1: Local MongoDB
```bash
# Windows - If MongoDB Service installed
mongod

# Or if just MongoDB binary
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
```

### Option 2: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

Example Atlas URI:
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/remember
```

## 🧪 Testing the API

### Using cURL or Postman

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response includes `token` - use in headers for protected routes:
```
Authorization: Bearer <token>
```

#### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

#### 4. Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "Buy groceries",
    "priority": "medium",
    "dueDate": "2024-12-25"
  }'
```

## 📊 File Structure Overview

### Backend Files (Key)
```
server/
├── models/
│   ├── User.js          - User schema with auth methods
│   ├── Password.js      - Encrypted password storage
│   ├── Task.js          - Task with priorities
│   ├── Video.js         - YouTube video metadata
│   └── Website.js       - Website/tool bookmarks
│
├── controllers/
│   ├── authController.js     - Register, login, verification
│   ├── passwordController.js - CRUD for passwords
│   ├── taskController.js     - Task management + stats
│   ├── videoController.js    - Video management
│   └── websiteController.js  - Website management
│
├── routes/
│   ├── auth.js      - /api/auth/*
│   ├── passwords.js - /api/passwords/*
│   ├── tasks.js     - /api/tasks/*
│   ├── videos.js    - /api/videos/*
│   └── websites.js  - /api/websites/*
│
├── middleware/
│   └── auth.js      - JWT verification
│
└── server.js        - Express app setup
```

### Frontend Files (Key)
```
client/src/
├── pages/
│   ├── Login.js         - Authentication page
│   ├── Register.js      - Registration page
│   ├── Dashboard.js     - Overview with stats
│   ├── PasswordVault.js - Password management
│   ├── Tasks.js         - Task management
│   ├── Videos.js        - YouTube organizer
│   ├── Websites.js      - Website memory
│   └── Settings.js      - User settings
│
├── components/
│   ├── Navbar.js        - Top navigation
│   └── PrivateRoute.js  - Protected route wrapper
│
├── context/
│   └── AuthContext.js   - Authentication state
│
├── App.js               - Router setup
├── api.js               - Axios configuration
├── config.js            - API URL config
└── index.css            - Tailwind + custom styles
```

## 🔐 Security Implementation

### Password Storage Flow
```
User enters password
    ↓
Bcrypt hashing (salt=10)
    ↓
Stored in database
    ↓
Login: Compare hashed versions
```

### Vault Passkey Flow
```
User sets passkey
    ↓
Bcrypt hashing (same as password)
    ↓
Stored separately
    ↓
Accessing vault: Verify passkey
```

### Stored Password Flow
```
User enters password
    ↓
AES encryption with ENCRYPTION_KEY
    ↓
Encrypted text stored in DB
    ↓
Retrieval: Decrypt with ENCRYPTION_KEY
    ↓
Show to user (if vault unlocked)
```

### JWT Flow
```
Login successful
    ↓
Generate JWT (expires in 7 days)
    ↓
Send to frontend (stored in localStorage)
    ↓
Include in Authorization header for requests
    ↓
Backend verifies signature
    ↓
Grant access to protected routes
```

## 🎯 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  vaultPasskey: String (hashed),
  createdAt: Date,
  lastLogin: Date,
  updatedAt: Date
}
```

### Password
```javascript
{
  userId: ObjectId (ref User),
  websiteName: String,
  websiteUrl: String,
  username: String,
  encryptedPassword: String (AES),
  category: String,
  notes: String,
  lastModified: Date,
  timestamps: true
}
```

### Task
```javascript
{
  userId: ObjectId (ref User),
  title: String,
  description: String,
  dueDate: Date,
  priority: String (low/medium/high),
  status: String (pending/completed),
  completedAt: Date,
  tags: [String],
  timestamps: true
}
```

### Video
```javascript
{
  userId: ObjectId (ref User),
  videoUrl: String,
  videoId: String,
  title: String,
  thumbnail: String (URL),
  description: String,
  personalNotes: String,
  watchStatus: String (not-watched/in-progress/completed),
  channel: String,
  duration: String,
  timestamps: true
}
```

### Website
```javascript
{
  userId: ObjectId (ref User),
  name: String,
  url: String,
  description: String,
  category: String,
  tags: [String],
  isFavorite: Boolean,
  lastVisited: Date,
  timestamps: true
}
```

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Kill process: `taskkill /F /IM node.exe` or use PORT=5001 |
| MongoDB won't connect | Ensure mongod is running or MongoDB URI is correct |
| CORS errors | Check CLIENT_URL in .env matches frontend URL |
| Token expired | Log out and log back in to refresh token |
| File not found errors | Run `npm install` again in affected directory |
| Styles not showing | Clear browser cache and restart frontend |

## 📈 Performance Tips

- Use MongoDB indexes on frequently queried fields
- Implement pagination for large result sets
- Cache user data in context after login
- Lazy load routes in React
- Compress images and assets
- Use CDN for static files

## 🚢 Deployment Checklist

- [ ] Change JWT_SECRET to random secure value
- [ ] Change ENCRYPTION_KEY to random secure value
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas (managed service)
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Set up backups
- [ ] Test all features
- [ ] Set up CI/CD pipeline
- [ ] Configure domain name
- [ ] Set up monitoring

## 📚 Learning Resources

- Express.js: https://expressjs.com/
- MongoDB/Mongoose: https://mongoosejs.com/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- JWT: https://jwt.io/
- Bcrypt: https://github.com/dcodeIO/bcrypt.js

## 💡 Interview Talking Points

1. **Architecture**: Clean separation (Models, Controllers, Routes)
2. **Security**: Hashing, encryption, JWT, passkey system
3. **Database**: Mongoose ODM, indexes, data modeling
4. **Frontend**: React routing, context API, Tailwind CSS
5. **Authentication**: Token-based, protected routes
6. **Scalability**: Modular structure, easy to extend
7. **Performance**: Optimized queries, caching
8. **Best Practices**: Error handling, validation, environment config

---

Last Updated: December 2024
