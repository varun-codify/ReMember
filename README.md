# ReMember - Personal Digital Memory Vault

A production-ready MERN stack application that helps users store, recall, and manage important digital information they frequently forget.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Problem Solved

Users forget:
- Which email or password they used for a website
- Important tasks and reminders  
- Useful websites or AI tools they once discovered
- YouTube videos saved "to watch later" but never revisited

**ReMember** unifies all of this into ONE secure, organized platform.

## ✨ Features

### 🔐 Password Vault
- Securely store passwords with AES encryption
- Organize by category (Social, Work, Finance, Shopping, Entertainment)
- Vault locked until passkey verification
- Additional security layer beyond user password
- Never stores passwords in plain text

### ✅ Task Manager
- Create tasks with title, description, and optional due date
- Organize by priority (Low, Medium, High)
- Mark tasks as pending or completed
- Track task statistics on dashboard
- Fully responsive task cards

### 🎥 YouTube Organizer
- Save YouTube videos with metadata
- Track watch status (Not Watched, In Progress, Completed)
- Add personal notes and tags
- Automatic thumbnail fetching
- Direct links to original videos

### 🌐 Website & AI Memory
- Remember useful websites and AI tools
- Categorize by type (AI, Productivity, Learning, Development, Design, etc.)
- Quick access with "Visit" button
- Add descriptions and notes
- Mark favorites

### 👤 User Management
- Secure registration and login
- JWT-based authentication (7-day tokens)
- Bcrypt password hashing
- Per-user data isolation
- Last login tracking

### ⚙️ Settings & Security
- Profile information management
- Vault passkey configuration
- Security notices and recommendations
- Production-ready implementation

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React.js with React Router
- Tailwind CSS for responsive design
- Axios for API calls
- Context API for state management
- Dark mode UI optimized for productivity

**Backend:**
- Express.js REST API
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Crypto-JS for encryption

**General:**
- RESTful API architecture
- Modular, scalable structure
- Clean separation of concerns
- Environment-based configuration

### Project Structure

```
organizr/
├── server/                 # Backend Express server
│   ├── models/            # MongoDB schemas
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & other middleware
│   ├── .env               # Environment config
│   └── server.js          # Entry point
│
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── App.js         # Router
│   │   ├── api.js         # Axios instance
│   │   └── config.js      # API config
│   └── tailwind.config.js # Tailwind config
│
├── GETTING_STARTED.md     # Detailed setup guide
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ 
- MongoDB (local or Atlas)
- npm/yarn

### Installation

1. **Navigate to project:**
```bash
cd "c:\Users\varun\OneDrive\Documents\Project X\organizr"
```

2. **Install backend:**
```bash
cd server
npm install
```

3. **Install frontend:**
```bash
cd ../client
npm install
```

4. **Start MongoDB** (if local):
```bash
mongod
```

5. **Start backend** (Terminal 1):
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

6. **Start frontend** (Terminal 2):
```bash
cd client
npm start
# Opens http://localhost:3000
```

## 📚 Detailed Setup

For comprehensive setup instructions, environment configuration, and testing guide, see [GETTING_STARTED.md](GETTING_STARTED.md)

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/vault-passkey` | Set vault passkey |
| POST | `/api/auth/verify-vault-passkey` | Verify passkey |

### Passwords (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passwords` | Get all passwords |
| POST | `/api/passwords` | Create password |
| PUT | `/api/passwords/:id` | Update password |
| DELETE | `/api/passwords/:id` | Delete password |

### Tasks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats` | Get task statistics |

### Videos (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | Get all videos |
| POST | `/api/videos` | Add video |
| PUT | `/api/videos/:id` | Update video |
| DELETE | `/api/videos/:id` | Delete video |

### Websites (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/websites` | Get all websites |
| POST | `/api/websites` | Add website |
| PUT | `/api/websites/:id` | Update website |
| DELETE | `/api/websites/:id` | Delete website |

## 🔐 Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **Encryption**: AES encryption for stored passwords
- **JWT Tokens**: 7-day expiration, verified on each request
- **Vault Passkey**: Additional security layer
- **Data Isolation**: Each user sees only their own data
- **Input Validation**: Express-validator on all routes
- **No Plain Text**: Sensitive data never stored unencrypted

## 🎨 UI/UX Design

- **Dark Mode**: Professional, calm interface
- **Responsive Design**: Mobile-first approach
- **Clean Layout**: Minimal, focused design
- **Consistent Spacing**: Professional typography
- **Intuitive Navigation**: Clear menu structure
- **Visual Hierarchy**: Important info highlighted
- **Hover Effects**: Smooth transitions
- **Error Handling**: Friendly, clear messages

## 📱 Features by Module

### Dashboard
- Overview cards with statistics
- Quick action buttons
- Real-time data aggregation
- Professional card layout

### Password Vault  
- Vault lock/unlock system
- Encrypted storage
- Category organization
- Edit/delete functionality
- Personal notes field

### Tasks & Reminders
- Priority levels
- Due date tracking
- Completion status
- Batch operations
- Statistics view

### YouTube Organizer
- Thumbnail display
- Watch status tracking
- Personal notes
- Direct video links
- Category filtering

### Websites & AI Tools
- Category organization
- Quick link access
- Description storage
- Favorite marking
- Easy management

## 🚢 Deployment

### For Production:

1. **Update environment variables** with secure keys
2. **Build frontend**: `npm run build`
3. **Configure MongoDB** for production
4. **Enable HTTPS** (required)
5. **Set up error logging**
6. **Configure CI/CD** pipeline

### Recommended Platforms:
- **Full Stack**: Heroku, Railway, Render, DigitalOcean
- **Frontend**: Vercel, Netlify
- **Backend**: AWS Lambda, Google Cloud, Azure
- **Database**: MongoDB Atlas, AWS DocumentDB

## 📊 Performance

- Optimized React components
- Lazy loading routes
- API response caching
- Efficient MongoDB queries
- Minimal bundle size
- Fast initial load time

## 🧪 Testing

Features implemented and tested:
- ✅ User registration and login
- ✅ JWT authentication flow
- ✅ Password encryption/storage
- ✅ CRUD operations for all modules
- ✅ Protected routes
- ✅ Error handling
- ✅ Responsive design
- ✅ Data validation

## 🔮 Future Enhancements

- Two-factor authentication (2FA)
- Advanced search with AI
- Browser extension
- Mobile app (React Native)
- Password generator
- Breach notification service
- Team vault sharing
- End-to-end encryption
- Biometric authentication
- Export/Import data

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm run dev    # Start with nodemon
npm start      # Start production
```

**Frontend:**
```bash
npm start      # Start dev server
npm build      # Build for production
npm test       # Run tests
```

### Code Quality

- Clean, readable code
- Consistent naming conventions
- Modular architecture
- Comprehensive error handling
- Security best practices
- Production-ready patterns

## 📝 Security Notice

This is a **personal-use implementation** with good security practices. For enterprise deployment, consider:
- Audit by security professional
- Advanced encryption (end-to-end)
- Rate limiting
- Security logging
- Regular penetration testing
- Compliance requirements (GDPR, CCPA, etc.)

## 📄 License

MIT License - Free for personal and commercial use. See LICENSE file for details.

## 🤝 Contributing

Suggestions and improvements welcome! This is a showcase project for:
- Clean code architecture
- Security best practices
- Professional UI/UX
- Production-ready implementation
- Interview preparation

## 📞 Support

For setup issues or questions, refer to:
- [GETTING_STARTED.md](GETTING_STARTED.md) - Detailed setup guide
- Inline code comments
- Error messages and logs

---

**Created**: December 2024  
**Status**: Production-ready MVP  
**Version**: 1.0.0  

**Built with** ❤️ using MERN Stack  
**Perfect for**: Portfolios, Interviews, Personal Use, Learning

