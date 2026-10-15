# 🔐 Our Space — Backend REST API & WebSocket Server

Backend server for **Our Space**, providing REST API endpoints, WebSocket realtime handling, single-use pairing codes, and location consent privacy enforcement.

## 🚀 Tech Stack
- **Node.js** (v20+)
- **Express.js** (ES Modules)
- **Socket.IO** (Realtime events)
- **Helmet, CORS, Express-Rate-Limit**
- **Bcrypt.js & JWT**
- **Multer** (Media uploads)
- **Node.js native test runner** (`node:test`, `node:assert`)

## 💻 Running the Server
```powershell
npm --prefix server run dev
```

## 🧪 Running Automated Tests
```powershell
npm --prefix server test
```
Runs 7 test suites validating authentication, single-use invitation codes, 2-member limit, messages, and mutual location privacy.
