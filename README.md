# ⚡ Org QR Manager (Enterprise QR Platform)

<p align="center">
  <img src="./public/images/favicon.png" alt="Org QR Manager Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Self-hosted, Open-Source Alternative to Bitly QR & Beaconstac</strong><br />
  Enterprise-grade dynamic QR redirection (HTTP 302), direct UPI payments, real-time scan analytics, and department-level governance.
</p>

<p align="center">
  <a href="https://github.com/yash-pouranik/org-qr-manager/stargazers"><img src="https://img.shields.io/github/stars/yash-pouranik/org-qr-manager?style=for-the-badge&logo=github&color=166534" alt="GitHub Stars" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-E9A23B?style=for-the-badge" alt="License: MIT" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react" alt="React 18" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite" alt="Vite" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
</p>

---

## 🌟 Why Org QR Manager?

Most commercial QR code management platforms charge upwards of **$35 to $99/month** just to edit destination links, track scans, or remove watermarks. 

**Org QR Manager** is a fully open-source, production-ready solution built for enterprises, NGOs, temples, and large institutions that demand complete control over their physical-to-digital touchpoints, scan privacy, and branded collateral.

---

## ✨ Core Capabilities

### 1. 🔀 Dynamic QR Engine (Server-Side HTTP 302)
- **Zero-Latency Instant Redirection:** `GET /r/:shortCode` responds with HTTP 302/307 header in `< 15ms`.
- **Live Destination Switching:** Edit the target destination URL anytime without re-printing posters, badges, or standees.
- **Bot & Crawler Screening:** Screen User-Agent strings against 50+ crawler signatures (Googlebot, Bingbot, WhatsApp link previewers) to prevent false scan counts.
- **Duplicate Debounce Window:** 5-minute sliding session window deduplicates accidental double-taps.
- **Privacy-Preserving Unique Visitor Metrics:** Daily-salted HMAC-SHA256 session hashing differentiates unique visitors from total scans without permanently storing raw visitor IP addresses.
- **30-Day Soft-Delete Trash Recovery:** Prevent accidental deletion with one-click restore and permanent purge safeguards.

### 2. 🎨 High-Resolution Designer Studio
- **10 Offline Static Standards:** Direct UPI (`upi://pay`), Website URL, vCard, WhatsApp Chat Intent, Wi-Fi Config, Plain Text, Phone Dialer, Email, Google Maps, and Calendar Events.
- **Styling Customization:** Custom dot styles, corner eye frames (Square, Rounded, Leaf), and solid/gradient fills.
- **Print Collateral Generator:** Export in SVG vector, PNG (1024x1024), and foldable A4/A5 Table Standees with custom branding.

### 3. 💳 Dynamic Smart Donation / Payment Portals (`/pay/:slug`)
- Generates branded donation checkout pages with customizable quick amounts (₹101, ₹251, ₹501, ₹1100, ₹5001).
- Direct UPI deep-link triggers for PhonePe, Google Pay, Paytm, and BHIM UPI apps.

### 4. 📊 Analytics & MongoDB Aggregation Dashboard
- Interactive Recharts visualization with custom gradient AreaCharts and Donut breakdowns.
- Real-time aggregation of scans by time range (Today, 7D, 30D, 90D, All-time).
- Device type (Mobile vs. Desktop vs. Tablet), Operating System, and Browser distributions.
- Top-performing QR codes and department rankings.

### 5. 🛡️ Role-Based Access Control (RBAC) & Governance
- **Super Admin:** Full platform governance, multi-department administration, system-wide audit logs.
- **Department Admin:** Scoped to their department; manage departmental QR codes and invite team members.
- **Manager:** Create and edit QR codes within assigned department scopes.
- **Member:** Read-only access to view permitted QR assets.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript (Strict Mode), Vite |
| **Routing** | TanStack Router (File-based routing with layout hierarchy) |
| **UI Components** | shadcn/ui (Radix UI primitives), Lucide Icons |
| **Styling** | Tailwind CSS with Deep Forest Green (`#166534`) and Warm Saffron (`#E9A23B`) tokens |
| **Data & State** | `@urbackend/react`, TanStack Query, Zustand |
| **Visualization** | Recharts (Area, Bar, Pie charts) |
| **Backend Runtime** | Node.js, Express runtime, `@urbackend/sdk` |
| **Database** | MongoDB Atlas via urBackend |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- pnpm 9+ or npm 10+
- An [urBackend](https://app.urbackend.in) account with MongoDB connected

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yash-pouranik/org-qr-manager.git
cd org-qr-manager

# Install project dependencies
pnpm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# urBackend API Keys
VITE_URBACKEND_PUBLISHABLE_KEY=pk_live_your_publishable_key
URBACKEND_SECRET_KEY=sk_live_your_secret_key

# Service URLs
VITE_APP_URL=http://localhost:5173
VITE_REDIRECT_BASE_URL=http://localhost:3001
VITE_URBACKEND_BASE_URL=https://urbackend-api.onrender.com

# Initial Super Admin Bootstrap
VITE_INITIAL_SUPER_ADMIN_EMAIL=your-email@example.com
```

### 4. Run Development Servers
```bash
# Start frontend client (Vite on :5173)
pnpm dev

# In a separate terminal, start the redirect and security engine (Express on :3001)
pnpm start:server
```

---

## 🔒 Security & Privacy Practices

1. **API Key Separation:** `pk_live_...` is restricted to client interactions. Secret keys (`sk_live_...`) are strictly held on the server runtime and never shipped in the client bundle.
2. **Zero Permanent Raw IP Logging:** Scanners' IP addresses are hashed using daily-rotated salt secrets (`DAILY_SALT_SECRET`) via HMAC-SHA256. Raw IPs are discarded immediately.
3. **Strict URL Sanitization:** All user-supplied destination URLs are validated with Zod against phishing and `javascript:` pseudo-protocols.
4. **Self-Role Elevation Prevention:** Server and route-level checks strictly prohibit any user from mutating their own role or elevating privileges.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
