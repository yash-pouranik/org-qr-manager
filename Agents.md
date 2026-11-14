# Agent Working Guidelines: Organization QR Management System

## 1. Project Overview & Scope
This repository houses the **Organization QR Code Management Platform**, an enterprise-grade, internal management dashboard designed for centralized QR generation, dynamic link routing, scan analytics, and department-level governance.

> **CRITICAL RULE**: Do not include or reference specific organizational or religious entity names in documentation, comments, commit messages, or user-facing text. Use generic, professional terminology such as "Organization", "Temple Management", or "Enterprise QR Portal".

---

## 2. Technology Stack & Conventions

- **Framework**: React 18+ with TypeScript (Strict mode enabled).
- **Build Tool**: Vite.
- **Routing**: TanStack Router (following shadcn-admin file-based route conventions).
- **Styling**: Tailwind CSS with CSS variables.
- **UI System**: shadcn/ui (Radix UI primitives).
- **Icons**: `lucide-react`.
- **Backend-as-a-Service**: urBackend (`@urbackend/sdk`) backed by MongoDB.
- **QR Engine**: `qrcode` / SVG rendering with high-resolution export.
- **Charts & Visualization**: `recharts`.
- **State & Form Management**: React Hook Form, Zod validation, Zustand (or TanStack Query for server state caching).

---

## 3. Design System & Visual Direction

The dashboard must reflect a modern, premium SaaS aesthetic. Avoid cluttered layouts, flashy animations, or poster-style graphic designs.

- **Background**: Crisp white `#FFFFFF` / clean off-white `#F8FAFC` (Dark mode: `#090D16` / `#0F172A`).
- **Primary Color**: Deep Forest Green (`#166534`, `hsl(142, 69%, 25%)`).
- **Accent Color**: Warm Saffron Gold (`#E9A23B`, `hsl(36, 80%, 57%)`).
- **Neutral / Slate Scale**: Slate-50 through Slate-900 for crisp text and subtle borders (`border-slate-200 / border-slate-800`).
- **Typography**: Inter font with legible hierarchy and uniform font-weight tokens.
- **Card Styling**: Rounded corners (`rounded-xl`), subtle borders, soft shadows (`shadow-sm`).
- **Responsive Layout**: Full mobile responsiveness with collapsible sidebar navigation and drawer overlays.

---

## 4. Role-Based Access Control (RBAC)

All operations must be gated by RBAC both on the UI layer (route guards, hidden action buttons) and enforced via urBackend Row-Level Security (RLS) / backend checks.

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Super Admin** | Full platform access; manage all departments, users, QR codes, audit logs, and global settings. |
| **Admin** | Manage assigned departments; manage department users and QR codes; view department scan metrics. |
| **Manager** | Create and edit QR codes within assigned department; view scan analytics for assigned codes. |
| **Member** | View permitted QR codes; create basic QR codes if explicitly enabled; view limited analytics. |

---

## 5. Security & Privacy Protocols

1. **API Key Separation**:
   - `VITE_URBACKEND_PUBLISHABLE_KEY` (`pk_live_...`): Used solely for authenticated client operations via `@urbackend/sdk`.
   - Never commit or expose Secret Keys (`sk_live_...`) in client bundles or public repositories.
2. **Visitor Privacy in Scan Tracking**:
   - Never collect raw Personally Identifiable Information (PII) during dynamic QR scans.
   - Do not store raw IP addresses permanently. Anonymize/hash identifiers for session deduplication (e.g., daily salt hash) to distinguish unique visitors from total scans.
3. **Destination URL Sanitization**:
   - Validate and sanitize all dynamic destination URLs using strict URL schemas (prevent `javascript:`, `data:`, or phishing schemes).
4. **Input Validation**:
   - All forms must be strictly validated with Zod before submission.

---

## 6. Coding & Architecture Standards

- **Component Modularity**: Never create oversized monolithic files. Deconstruct pages into logical feature components (e.g., `qr-preview`, `qr-form`, `qr-styling-panel`).
- **Centralized API Layer**: Isolate all urBackend calls within dedicated services in `src/services/` or `src/lib/urbackend.ts`.
- **Loading & Empty States**: Every data-driven table, chart, and selector must implement robust skeleton loading and informative empty states.
- **Strict Error Handling**: Wrap async API operations in try-catch with toast notifications and fallback UI.
- **Preserve Template Conventions**: Retain existing directory conventions from shadcn-admin (`src/components/`, `src/routes/`, `src/features/`, `src/hooks/`).

---

## 7. Dynamic QR Redirection Flow (Server-Side HTTP 302)

Dynamic QRs point to a short URL (`/r/:shortCode`) handled by a server-side HTTP route:
1. Visitor request hits `GET /r/:shortCode`.
2. **Bot Detection**: User-Agent is screened against crawler signatures. Bots are redirected without scan logging.
3. **Duplicate Debouncing**: 5-minute sliding window prevents duplicate scan count inflation.
4. **Synchronous Scan Persistence**: Scan event is written to MongoDB (`qr_scans`) and counter updated on `qr_codes` before redirecting.
5. **HTTP 302 Found**: Server issues immediate 302/307 redirect header with no-cache directives.
6. **Inactive Fallback**: Paused or missing QRs render an inactive notification view.

---

## 8. Critical Architectural Directives

1. **Server-Side Redirects Only**: Never use client-side SPA routing for dynamic QR redirects.
2. **Logo Assets**: Never store large Base64 strings in MongoDB. Use urBackend Storage or object storage; store only URL and path references.
3. **Super Admin & RBAC Security**: Bootstrap Super Admin via environment variable (`INITIAL_SUPER_ADMIN_EMAIL`). Never allow users to mutate their own role or department.
4. **UPI Differentiation**: Keep Direct Static UPI (native `upi://pay` URI) separate from Dynamic Smart Donation Pages (web portal with UPI app intent triggers).
5. **MongoDB Indexes**: Ensure indexes on `short_code` (unique), `department_id`, `created_by`, `qr_code_id`, and `scanned_at`.
6. **Bot & Privacy Handling**: Exclude automated bots; hash IP with daily salt for unique visitor metrics without storing raw IPs.
   - A friendly fallback screen ("This QR Code is currently inactive") is rendered.
