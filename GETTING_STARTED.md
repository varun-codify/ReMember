# ReMember - Getting Started Guide

## Overview

ReMember is a production-ready MERN stack application that serves as your personal digital memory vault. It helps you store, recall, and manage important digital information you frequently forget.

### Key Features
- **Password Vault** - Securely store passwords with encryption
- **Task Manager** - Organize tasks with priorities and due dates
- **YouTube Organizer** - Save and track videos for later
- **Website Memory** - Remember useful websites and AI tools
- **Secure Authentication** - JWT-based auth with bcrypt
- **Dark Mode UI** - Professional, clean interface

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** (optional, for version control)

## Installation & Setup

### Step 1: Navigate to Project Directory
```bash
cd "c:\Users\varun\OneDrive\Documents\Project X\organizr"
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Configure Environment Variables

The `.env` file is already created. Verify it contains:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/remember
JWT_SECRET=remember_secure_jwt_secret_key_change_in_production_2024
ENCRYPTION_KEY=remember_encryption_key_change_in_production_2024
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Important**: In production, change `JWT_SECRET` and `ENCRYPTION_KEY` to secure random values.

### Step 4: Start MongoDB

#### Option A: Local MongoDB
```bash
# On Windows, if MongoDB is installed:
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/remember`)
3. Update `MONGODB_URI` in `.env`

### Step 5: Start Backend Server
```bash
# From server directory
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📍 Environment: development
```

### Step 6: Start Frontend (New Terminal)
```bash
cd client
npm start
```

The React app will open at `http://localhost:3000` automatically.

## Testing the Application

### 1. Create Account
- Go to Register page
- Enter: Name, Email, Password (min 6 chars)
- Click "Sign up"

### 2. Login
- Use your credentials to log in
- You'll be redirected to Dashboard

### 3. Test Each Module

#### Password Vault
1. Click "Passwords" in navbar
2. Click "Add Password"
3. Enter: Website name, Username, Password, Category
4. Set a vault passkey in Settings (needed for security)
5. Next time, you'll need to unlock vault with passkey

#### Tasks
1. Click "Tasks" in navbar
2. Click "Add Task"
3. Create task with title, description, due date, priority
4. Click checkbox to complete task
5. Edit or delete as needed

#### Videos
1. Click "Videos" in navbar
2. Click "Add Video"
3. Paste YouTube URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)
4. Add title and personal notes
5. Change watch status (Not Watched → In Progress → Completed)

#### Websites
1. Click "Websites" in navbar
2. Click "Add Website"
3. Enter name, URL, description, and category (AI, Productivity, etc.)
4. Click "Visit" to open site in new tab

#### Settings
1. Click settings icon (gear) in navbar
2. Set vault passkey (4+ characters)
3. View profile and security info

## Project Architecture

```
organizr/
├── server/
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Password.js
│   │   ├── Task.js
│   │   ├── Video.js
│   │   └── Website.js
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── passwordController.js
│   │   ├── taskController.js
│   │   ├── videoController.js
│   │   └── websiteController.js
│   ├── routes/              # API endpoints
│   │   ├── auth.js
│   │   ├── passwords.js
│   │   ├── tasks.js
│   │   ├── videos.js
│   │   └── websites.js
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── .env                 # Environment config
│   └── server.js            # Express app entry
│
├── client/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── PasswordVault.js
│   │   │   ├── Tasks.js
│   │   │   ├── Videos.js
│   │   │   ├── Websites.js
│   │   │   └── Settings.js
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/         # Auth context
│   │   │   └── AuthContext.js
│   │   ├── App.js           # Main router
│   │   ├── api.js           # Axios instance
│   │   ├── config.js        # API config
│   │   └── index.css        # Tailwind styles
│   └── tailwind.config.js
│
└── README.md
```

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/auth/vault-passkey     - Set vault passkey
POST   /api/auth/verify-vault-passkey - Verify passkey
```

### Passwords (Protected)
```
GET    /api/passwords              - Get all passwords
GET    /api/passwords/:id          - Get single password
POST   /api/passwords              - Create password
PUT    /api/passwords/:id          - Update password
DELETE /api/passwords/:id          - Delete password
```

### Tasks (Protected)
```
GET    /api/tasks                  - Get all tasks
GET    /api/tasks/:id              - Get single task
POST   /api/tasks                  - Create task
PUT    /api/tasks/:id              - Update task
DELETE /api/tasks/:id              - Delete task
GET    /api/tasks/stats            - Get task statistics
```

### Videos (Protected)
```
GET    /api/videos                 - Get all videos
GET    /api/videos/:id             - Get single video
POST   /api/videos                 - Add video
PUT    /api/videos/:id             - Update video
DELETE /api/videos/:id             - Delete video
```

### Websites (Protected)
```
GET    /api/websites               - Get all websites
GET    /api/websites/:id           - Get single website
POST   /api/websites               - Add website
PUT    /api/websites/:id           - Update website
DELETE /api/websites/:id           - Delete website
```

## Data Security

### Passwords
- Stored encrypted using AES encryption
- Encrypted in database, decrypted on retrieval
- Personal vault passkey required to access

### User Passwords
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Compared during login

### JWT Tokens
- Valid for 7 days
- Stored in localStorage (consider HTTP-only cookie in production)
- Verified on every protected request

### Vault Passkey
- Hashed separately from user password
- Provides extra security layer for password vault

## Building for Production

### 1. Update Environment Variables
```bash
cd server
# Edit .env with production values
MONGODB_URI=<your-production-mongodb-uri>
JWT_SECRET=<generate-random-secure-key>
ENCRYPTION_KEY=<generate-random-secure-key>
NODE_ENV=production
CLIENT_URL=<your-production-frontend-url>
```

### 2. Build Frontend
```bash
cd client
npm run build
```

This creates optimized production build in `client/build/`

### 3. Serve Frontend with Backend
```bash
# Backend can serve frontend static files
# Add to server.js:
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
```

### 4. Deploy Options
- **Heroku** - Easy Node.js deployment
- **AWS** - EC2 with auto-scaling
- **DigitalOcean** - Affordable VPS
- **Azure** - Enterprise hosting
- **Vercel** (frontend only) + Render/Railway (backend)

## Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error
```
**Solution:**
- Ensure MongoDB is running (`mongod` for local)
- Check MONGODB_URI in .env
- For Atlas, whitelist your IP address

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Backend CORS middleware is already configured
- Ensure CLIENT_URL in .env matches your frontend URL
- Check that both are on same network

### Authentication Failed
```
Invalid token
```
**Solution:**
- Clear localStorage and login again
- Check JWT_SECRET hasn't changed
- Ensure token includes Bearer prefix in headers

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Export/Import functionality
- [ ] Browser extension
- [ ] Mobile app
- [ ] Advanced search with AI
- [ ] Auto-password generator
- [ ] Breach notification service
- [ ] Team/family vault sharing
- [ ] End-to-end encryption
- [ ] Biometric authentication

## Security Best Practices

1. **Never commit .env file** - Already in .gitignore
2. **Change secrets in production** - Update JWT_SECRET and ENCRYPTION_KEY
3. **Use HTTPS** - Essential in production
4. **Enable CORS carefully** - Only allow trusted origins
5. **Rate limiting** - Add in production
6. **Input validation** - Implemented with express-validator
7. **SQL Injection** - Not applicable (using MongoDB)
8. **Password strength** - Enforce min 6 chars (extend in production)

## Support & Resources

- **Express.js** - [Documentation](https://expressjs.com/)
- **MongoDB/Mongoose** - [Documentation](https://mongoosejs.com/)
- **React** - [Documentation](https://react.dev/)
- **Tailwind CSS** - [Documentation](https://tailwindcss.com/)
- **JWT** - [jwt.io](https://jwt.io/)

## License

MIT License - Free for personal and commercial use

---

**Created**: December 2024
**Type**: Production-ready MERN Stack MVP
**Status**: Ready for development and deployment
