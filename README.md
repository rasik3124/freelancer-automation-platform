<<<<<<< HEAD
# Crescent Black Studio — Freelancing Automation Platform

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Crescent Black Banner" width="100%" />
  <p><i>The complete ecosystem for AI-driven freelancing and client management.</i></p>
</div>

---

## 🚀 Overview
**Crescent Black** is a premium, automated platform designed for freelancers and digital studios. It combines a sophisticated 3D client-facing portfolio with a robust backend for lead generation, AI-powered proposal drafting, and real-time communication.

### ✨ Key Features
- **AI Chat & Lead Analysis**: Integrated with n8n for intelligent lead scoring and automated messaging.
- **Client & Freelancer Dashboards**: Tailored experiences for both sides of the marketplace.
- **Real-time Networking**: High-performance Socket.io implementation for instant messaging and user status tracking.
- **Automated Workflow**: Custom tools for proposal generation and meeting scheduling.
- **Secure Authentication**: Pure JWT and Express session-based security (no third-party SDK dependencies).

---

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP.
- **Backend**: Node.js, Express, Socket.io, Axios.
- **Automation**: n8n Webhook integrations.
- **Persistence**: File-based local store (`.data/`) with optional Redis support.

---

## ⚙️ Initial Setup

> [!IMPORTANT]
> **CRITICAL STEP**: You MUST configure your environment variables before starting the server. The application will not run without valid secrets.

### 1. Environment Configuration
Copy the `.env.example` template to a new `.env` file:
```bash
cp .env.example .env
```
Open `.env` and provide your secrets:
- `JWT_SECRET`: A long, random string for token signing.
- `SESSION_SECRET`: Used for session security.
- `N8N_WEBHOOK_URL`: Your n8n automation endpoint.
- `SMTP_*`: Credentials for email notifications.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Project
Launch both the Vite development server and the Express backend:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 📂 Project Structure

```text
├── server.ts              # Full Express backend (unified server)
├── .env                   # Local secrets (never committed)
├── .data/                 # Local JSON database (persistence)
├── src/
│   ├── lib/               # Shared libraries (socket.ts, etc.)
│   ├── assets/            # Static media and icons
│   ├── components/        # Reusable UI components
│   ├── pages/             # Route top-level pages
│   ├── services/          # API & Integration logic (n8n, API, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── main.tsx           # Frontend entry point
├── public/                # Static assets for the build
└── vite.config.ts         # Vite bundler configuration
```

---

## 🔐 Security Standards
This project follows strict security protocols:
- **Environment Strictness**: All sensitive keys are strictly loaded from `.env`. Fallback strings have been removed from the source code.
- **Git Protection**: `.gitignore` is configured to prevent accidental leakage of secrets.
- **Traffic Control**: Rate limiters are implemented on all authentication and AI-forwarding routes.

---

<div align="center">
  <p>&copy; 2026 Crescent Black Studio. All Rights Reserved.</p>
</div>
=======
# freelancer-automation-platform
AI powered SaaS platform to automate freelancer workflow including client management, proposals and scheduling
>>>>>>> 54063d8ee1ae2c5dc18f7a227176acffc5c46c38
