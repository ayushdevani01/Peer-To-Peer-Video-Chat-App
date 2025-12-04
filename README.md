# Video-Chat-App

A full-stack real-time video conferencing application with WebRTC video/audio, text chat, user authentication, and meeting history. Supports both registered users and guest sessions.

**Live Demo:** [https://starlit-griffin-fc5583.netlify.app/](https://starlit-griffin-fc5583.netlify.app/)

---

## Features

### Video & Communication
- **WebRTC Video Chat** - Peer-to-peer video/audio communication
- **Real-time Text Chat** - Send messages within rooms
- **User Notifications** - Alerts when users join/leave

### Rooms & Meetings
- **Create Rooms** - Generate unique meeting rooms with shareable links
- **Join Rooms** - Join existing meetings via room ID or link
- **Meeting History** - View past meetings (registered users only)

### Authentication
- **User Registration & Login** - JWT-based authentication
- **Guest Sessions** - Join meetings without creating an account
- **Protected Routes** - Secure access to authenticated features

### Security
- **Rate Limiting** - Protect against brute force attacks
- **Input Validation** - Server-side validation with express-validator
- **Password Hashing** - Secure password storage with bcrypt

---

## Tech Stack

### Client (Frontend)
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| Material-UI (MUI) | Component Library |
| Socket.IO Client | Real-time Communication |
| React Router | Client-side Routing |
| WebRTC | Peer-to-peer Video/Audio |

### Server (Backend)
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 5 | Web Framework |
| Socket.IO | Real-time Events |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| bcryptjs | Password Hashing |

---

## Project Structure

```
Video-Chat-App/
├── client/                 # React Frontend
│   └── src/
│       ├── components/     # UI Components
│       ├── context/        # Auth Context
│       └── services/       # API Services
│
└── server/                 # Node.js Backend
    ├── app.js              # Entry Point
    └── src/
        ├── config/         # Database Config
        ├── controllers/    # Route Handlers
        ├── middleware/     # Auth & Rate Limiting
        ├── models/         # Mongoose Schemas
        ├── routes/         # API Routes
        └── utils/          # Room Manager & Helpers
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- MongoDB (local or Atlas)

### Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ayushdevani01/Video-Chat-App
   cd Video-Chat-App
   ```

2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

---

## Running Locally

Run both client and server in separate terminals:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get user profile | Protected |

### Rooms
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/rooms/create` | Create new room | Guest/Auth |
| GET | `/api/rooms/history` | Get meeting history | Protected |

---

## Application Flow

### User Authentication Flow

![User Authentication Flow](docs/User%20Authentication%20Flow.png)

### Meeting Flow

![Meeting Flow](docs/Meeting%20Flow.png)

---
