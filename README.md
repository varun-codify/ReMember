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

### 🔎 Global Search
- Search across passwords, tasks, videos, and links from one box
- Instant results grouped by module
- Safe by design: searches metadata only, never encrypted password content

### ⏰ Reminders
- In-app reminder center with badge counts in the navbar
- Overdue / due-today tasks and stale watch-later videos surfaced automatically
- Optional email digests for due tasks (Resend, config-gated)

### ⚡ Quick Capture
- One-click bookmarklet to save any tab into ReMember
- Auto-detects YouTube videos vs websites
- Auto-fetches video titles and page metadata

### ✨ AI Capture
- Natural-language parsing: "remind me to call mom friday" becomes a structured task
- Auto-tags and one-line summaries for saved videos and links
- OpenAI-compatible, Groq free tier by default — config-gated with `AI_API_KEY`

### 🌙 Dark Mode & PWA
- Light/dark theme toggle with system-preference detection (no flash on load)
- Installable PWA with generated app icons and an offline app shell
- Browser push notifications for due/overdue tasks (Web Push + VAPID)

### 📚 Universal Capture
- YouTube videos (auto titles, thumbnails, **transcripts**) — searchable inside
- Webpages with **extracted page text** for full-text search
- **PDFs** (text extracted at save time), **images**, and **GitHub repos** (stars, language, description)
- Quick Notes — write an idea down, instantly searchable everywhere

### 🗂 Smart Collections
- Rule-based collections (types, categories, tags, favorites) that fill themselves automatically
- Auto-categorization and auto-tagging via AI on every capture

### 🔍 Full-text Search
- Search **inside** notes, extracted webpage/PDF content, and YouTube transcripts
- AI summaries + key points shown right in the results

### ✨ AI Summaries & Continue Learning
- One-click AI summaries with key points for videos, links, and notes
- **Resume watching** — videos open at your saved position
- **Continue reading** — per-link reading progress (25/50/75/100%)

### 📊 Learning Dashboard
- Weekly activity chart (saves per day)
- Category breakdown of saved links
- "Continue learning" — pick up where you left off

### 🤖 AI Assistant
- Memory-aware chat: asks questions **about your library** — "find everything I saved about React"
- Attach any saved video, link, or note for deep-dive answers ("Explain this article")
- **Quiz mode**: generates multiple-choice quizzes from your saved items and grades you
- Never invents items — answers only from your saved library

### 🕸 Knowledge Graph
- Visualizes your library as an interactive graph — nodes are saved items, edges connect items sharing tags
- Client-side force simulation (no dependencies), filters by type and topic, click any node to explore connections
- Top-topic chips spotlight related clusters

### 🎯 Smart Recommendations & Daily Review
- AI suggests related topics to learn next based on your most-used tag
- **Daily review** — spaced-repetition style: "You haven't reviewed this in 18 days" for stale items

### 📧 Weekly AI Digest
- Automatic weekly email: videos completed, notes created, topics learned, forgotten resources, and a suggested next topic
- Sends via Resend (config-gated), once per week

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

### AI (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/status` | Whether AI is configured |
| POST | `/api/ai/parse` | Parse natural language into structured capture |
| POST | `/api/ai/enrich` | Auto-summarize + tag a saved item |
| POST | `/api/ai/summarize-item` | Summarize a saved video/link/note |
| POST | `/api/ai/chat` | Memory-aware assistant chat (supports quiz mode) |
| POST | `/api/ai/recommendations` | Suggest related topics to learn next |

### Knowledge & Review (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/graph` | Knowledge graph nodes, links, and top topics |
| GET | `/api/review` | Items not reviewed recently (spaced repetition) |

## 🔐 Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **Encryption**: AES encryption for stored passwords
- **JWT Tokens**: 7-day expiration, verified on each request
- **Vault Passkey**: Additional security layer
- **Data Isolation**: Each user sees only their own data
- **Input Validation**: Server-side validation on every route
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
- Lazy loading routes (code-split page bundles)
- Efficient MongoDB queries (userId-indexed collections)
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

## 📦 Repository Notes

- **Git layout**: `client/` is tracked as a **regular directory** in this repo (it was previously a git link to a local-only CRA repo with no remote). A fresh clone now includes the full frontend. The original client repo history is preserved in a backup bundle at `../client-repo-backup-7d85dc1.bundle` (outside this repo) — restore it with `git clone <bundle> client-restore` if ever needed.
- **Same-origin API**: the frontend defaults to the relative `/api` path, so a single deployment (Vercel, or the Express server serving the built React app) works without extra configuration. Set `REACT_APP_API_URL` only if the API is hosted separately.
- **Secrets**: `JWT_SECRET` and `ENCRYPTION_KEY` are required in production — the server fails fast if they are missing. Never commit `.env` files.

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

