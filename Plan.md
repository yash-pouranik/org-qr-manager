# Implementation Plan: Organization QR Management Platform

## 1. Architectural Blueprint & System Design

The **Organization QR Management Platform** is an enterprise-grade administration and QR governance platform. It consists of a React/TypeScript frontend (based on `shadcn-admin`), a dedicated server-side redirection and security runtime, and a MongoDB database connected via urBackend (`@urbackend/react` and `@urbackend/sdk`).

### System Topology
```
┌────────────────────────────────────────────────────────────────────────┐
│                   Frontend Client (React 18 + Vite)                    │
│  - Base UI: shadcn-admin conventions (TanStack Router, Tailwind CSS)   │
│  - Theme: Deep Forest Green (#166534) & Warm Saffron Gold (#E9A23B)    │
│  - State & Data: @urbackend/react (UrProvider, useUser, useDb)         │
│  - Forms: React Hook Form + Zod strict validation                      │
│  - Visuals: Recharts (Analytics) + qr-code-styling (Designer QR Engine)│
└──────────────────┬────────────────────────────────┬────────────────────┘
                   │                                │
                   ▼ (Data queries via pk_live)     ▼ (Upload & Admin via server)
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│     urBackend Data & Auth API    │ │     Server-Side Redirection &     │
│   (https://api.urbackend.in)     │ │        Security Service           │
│  - /api/userAuth/* (Auth)        │ │  - GET /r/:shortCode (HTTP 302)   │
│  - /api/data/* (CRUD via RLS)    │ │  - Bot Filtering & Dupe Debounce  │
│  - /api/data/:coll/aggregate     │ │  - Synchronous Scan Persistence   │
└──────────────────┬───────────────┘ │  - Logo Upload Gateway (sk_live)  │
                   │                 │  - Super Admin Role Gate          │
                   │                 └──────────────┬────────────────────┘
                   ▼                                │
  ┌─────────────────────────────────────────────────┴──────────────────┐
  │                   MongoDB Instance (BYOD)                          │
  │  Indexed Collections: users, profiles, departments,                │
  │  qr_codes, qr_scans, activity_logs                                 │
  └────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Corrections & Standards

### 1. Server-Side HTTP Redirect Engine (`GET /r/:shortCode`)
* **Protocol**: Redirections are handled strictly via a server-side HTTP endpoint, **never via client-side SPA routing**.
* **Flow**:
  1. Visitor request hits `GET /r/:shortCode`.
  2. **Bot Detection**: Inspects User-Agent against crawler/bot signatures (Googlebot, Bingbot, Twitterbot, TelegramBot, WhatsApp previewers, FacebookExternalHit, etc.). Bots receive an immediate 302 without recording scan metrics.
  3. **Duplicate Debouncing**: Hashes `(client_ip + user_agent + qr_id)` with a 5-minute sliding window. Repeated scans within this window are logged as repeat visits rather than inflating raw unique scans.
  4. **Synchronous Scan Persistence**: Scan event is written and confirmed in MongoDB (`qr_scans` insert and `qr_codes` scan counter increment) **before** sending the response header.
  5. **Response**: Returns HTTP `302 Found` with headers:
     - `Location: <destination_url>`
     - `Cache-Control: no-cache, no-store, must-revalidate`
     - `Pragma: no-cache`
  6. **Fallback / Inactive**: If the code does not exist or status is `paused` / `archived`, renders a branded, professional status page ("QR Code Inactive").

### 2. Logo Storage & Asset Management (Zero Large Base64 in Database)
* **Storage Protocol**: Large Base64 images are strictly prohibited in MongoDB documents to prevent BSON bloat and document fragmentation.
* **Upload Pipeline**:
  - Center logos are uploaded through a secure server endpoint (`POST /api/upload/logo`).
  - The server utilizes urBackend Storage (`client.storage.upload` / `/api/storage/*`) with the project's `sk_live_...` key.
  - Returns a public CDN URL (`url`) and storage reference path (`path`).
  - QR documents store only the URL reference and path metadata:
    ```json
    "customization": {
      "logo_url": "https://cdn.urbackend.in/uploads/...",
      "logo_path": "project_id/uuid_logo.png",
      "logo_size": 24
    }
    ```

### 3. Super Admin Bootstrapping & Permission Defense
* **Defense-in-Depth**: Client-side `pk_live` requests can never modify sensitive authorization fields (`role`, `department_id`, `status`).
* **Bootstrapping Protocol**:
  - Initial Super Admin email is configured via environment variable: `INITIAL_SUPER_ADMIN_EMAIL`.
  - On application bootstrap or first authenticated sign-in matching this email, the backend elevates the profile to `super_admin`.
* **Role & Department Modification**:
  - Role promotions, department assignments, and status modifications require a secure server API call (`POST /api/admin/update-role`).
  - The server verifies the caller's JWT token, ensures the caller possesses `super_admin` permissions, and prohibits users from elevating their own permissions or modifying their own role.

### 4. Separate UPI QR Architecture
Direct UPI payments and dynamic redirect tracking require two distinct architectural implementations:

| Attribute | Direct Static UPI QR | Smart Dynamic Donation Page |
| :--- | :--- | :--- |
| **Workflow** | Scanned directly by UPI apps | Scanned by standard camera / browser |
| **Payload** | Raw `upi://pay?pa=...&pn=...&am=...&cu=INR` | Web URL: `https://.../pay/:slug` |
| **App Compatibility** | 100% compatible with BHIM, PhonePe, GPay, Paytm | Cross-browser mobile landing page |
| **Redirection Risk** | Zero risk (no HTTP redirect) | User taps "Pay Now" on landing page |
| **Scan Tracking** | Offline (No tracking) | Full tracking, donor details, campaign stats |
| **Primary Use** | Counter donation boxes, temple prasad stalls | Festival campaigns, online appeals, banners |

### 5. MongoDB Indexing Strategy
To guarantee sub-10ms query execution across millions of scans and QR documents, the following indexes are defined:

```javascript
// Database Setup Script (scripts/setup-db-indexes.js)
db.qr_codes.createIndex({ short_code: 1 }, { unique: true, sparse: true });
db.qr_codes.createIndex({ department_id: 1, status: 1 });
db.qr_codes.createIndex({ created_by: 1 });
db.qr_codes.createIndex({ isDeleted: 1 });

db.qr_scans.createIndex({ qr_code_id: 1, scanned_at: -1 });
db.qr_scans.createIndex({ scanned_at: -1 });
db.qr_scans.createIndex({ anonymous_session_hash: 1 });

db.profiles.createIndex({ auth_id: 1 }, { unique: true });
db.profiles.createIndex({ email: 1 }, { unique: true });
db.profiles.createIndex({ department_id: 1, role: 1 });

db.departments.createIndex({ slug: 1 }, { unique: true });
```

### 6. Bot Filtering, Duplicate Debouncing & Privacy-Conscious Estimation
* **Bot Filtering**: RegEx crawler verification against known bot signatures. Bots do not increment scan counters.
* **Duplicate Debounce**: Same-session scans within 5 minutes are grouped under the existing session hash.
* **Privacy-Conscious Visitor Estimation**:
  $$\text{Session Hash} = \text{HMAC-SHA256}(\text{Visitor IP} + \text{User Agent}, \text{Daily Salt})$$
  - The daily salt rotates automatically at 00:00 UTC.
  - Raw visitor IP addresses are **never written to disk or database**.
  - Unique visitor metrics are computed via MongoDB `$group` on `anonymous_session_hash`.

### 7. urBackend Verified SDK & API Capabilities
* **Authentication**: `/api/userAuth/signup`, `/api/userAuth/login`, `/api/userAuth/me`, `/api/userAuth/refresh-token`, `/api/userAuth/request-password-reset`. Handled via `@urbackend/react` hooks (`useUser()`, `useAuth()`).
* **Database Operations**: `/api/data/:collection` with `filter`, `sort`, `page`, `limit` (max 1000). Handled via `useDb()`.
* **Aggregations**: `POST /api/data/:collectionName/aggregate` natively executes MongoDB pipelines (`$match`, `$group`, `$sort`, `$project`) with automatic RLS boundary enforcement.
* **Soft Deletes**: Native `isDeleted` and `deletedAt` system fields. Default reads omit deleted items (`include_deleted=false`). 30-day trash recovery built-in.
* **Storage**: `/api/storage/*` requiring `sk_live_...` for upload URL generation and confirmation, managed through our server-side gateway.

---

## 3. Database Collection Schemas

### `profiles` (Application Users & RBAC)
```json
{
  "_id": "ObjectId",
  "auth_id": "string",            // urBackend Auth UID
  "full_name": "string",
  "email": "string",
  "phone": "string | null",
  "avatar_url": "string | null",
  "role": "super_admin | admin | manager | member",
  "department_id": "ObjectId | null",
  "status": "active | suspended | pending",
  "created_at": "ISOString",
  "last_login": "ISOString"
}
```

### `departments`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string",
  "description": "string",
  "manager_ids": ["ObjectId"],
  "status": "active | archived",
  "isDeleted": false,
  "created_at": "ISOString",
  "updated_at": "ISOString"
}
```

### `qr_codes`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "type": "static | dynamic",
  "content_type": "url | upi_direct | upi_page | vcard | whatsapp | wifi | text | email | phone | location | event | document",
  "content": "string",
  "destination_url": "string | null",
  "short_code": "string | null",
  "department_id": "ObjectId",
  "created_by": "ObjectId",
  "customization": {
    "fg_color": "#166534",
    "bg_color": "#FFFFFF",
    "dot_style": "square | dots | rounded",
    "eye_style": "square | rounded | leaf",
    "gradient": { "enabled": false, "type": "linear", "color2": "#E9A23B" },
    "logo_url": "string | null",
    "logo_path": "string | null",
    "logo_size": 24,
    "cta_frame": { "enabled": false, "text": "Scan to Connect", "color": "#166534" },
    "error_correction_level": "H"
  },
  "status": "active | paused | archived",
  "total_scans": 0,
  "last_scanned_at": "ISOString | null",
  "isDeleted": false,
  "created_at": "ISOString",
  "updated_at": "ISOString"
}
```

### `qr_scans`
```json
{
  "_id": "ObjectId",
  "qr_code_id": "ObjectId",
  "scanned_at": "ISOString",
  "device_type": "mobile | desktop | tablet | other",
  "browser": "Chrome | Safari | Firefox | Edge | Other",
  "operating_system": "iOS | Android | Windows | macOS | Linux | Other",
  "country": "string | null",
  "city": "string | null",
  "referrer": "string | null",
  "anonymous_session_hash": "string",
  "is_repeat_scan": false
}
```

### `activity_logs`
```json
{
  "_id": "ObjectId",
  "actor_id": "ObjectId",
  "actor_name": "string",
  "action": "qr.created | qr.updated | qr.destination_changed | qr.status_changed | qr.deleted | user.created | user.role_changed",
  "resource_type": "qr_code | profile | department | settings",
  "resource_id": "ObjectId",
  "metadata": "object",
  "timestamp": "ISOString"
}
```

---

## 4. Nine-Phase Implementation Roadmap

We strictly implement one phase at a time. Each phase requires verification before advancing.

### 🟢 Phase 1: Project Scaffolding & Setup
* **Scope**:
  - Initialize the repository with `shadcn-admin` architecture (Vite, React 18, TypeScript, TanStack Router).
  - Setup server runtime directory (`server/`) with Express for redirect and security endpoints.
  - Install dependencies: `@urbackend/react`, `@urbackend/sdk`, `lucide-react`, `recharts`, `react-hook-form`, `zod`, `qr-code-styling`, `jspdf`, `html2canvas`.
  - Configure Tailwind CSS design tokens:
    - Primary: Deep Forest Green (`#166534` / `hsl(142, 69%, 25%)`).
    - Accent: Warm Saffron Gold (`#E9A23B` / `hsl(36, 80%, 57%)`).
    - Typography: Inter font, slate scale.
  - Setup environment configs (`.env.example` with client `VITE_URBACKEND_PUBLISHABLE_KEY` and server `URBACKEND_SECRET_KEY`).
  - Provide MongoDB indexing script (`scripts/setup-db-indexes.js`).
* **Acceptance Criteria**: Dev server boots, TypeScript compilation passes without errors, design system tokens are active.

---

### 🟢 Phase 2: Dashboard Layout Shell & Navigation
* **Scope**:
  - Build persistent dashboard shell following shadcn-admin patterns.
  - Collapsible Sidebar with department filtering and role-aware navigation.
  - Top Header with breadcrumbs, quick search, notification trigger, and user profile menu.
  - Dark/Light mode theme provider.
  - Mobile responsive drawer navigation.
* **Acceptance Criteria**: Fully interactive shell, responsive sidebar toggle, and working theme switcher.

---

### 🟢 Phase 3: urBackend Authentication, Profiles & Super Admin Bootstrap
* **Scope**:
  - Root `<UrProvider apiKey={...}>` integration.
  - Sign-in (`/sign-in`), Forgot Password (`/forgot-password`), and Reset Password screens.
  - AuthContext integrating `useUser()` and `useAuth()`.
  - Profile resolution in `profiles` collection upon sign-in.
  - Server-side Super Admin bootstrapping check (`INITIAL_SUPER_ADMIN_EMAIL`).
  - Role-gated route guards (`Super Admin`, `Admin`, `Manager`, `Member`).
* **Acceptance Criteria**: Users can log in/out, session persists across reloads, profile data loads, Super Admin auto-bootstraps securely.

---

### ✅ Phase 4: Department & Role-Based Access Governance (RBAC) [COMPLETED]
* **Scope**:
  - **Departments Management** (`/departments`): CRUD, manager assignment, member count, dependency validation preventing accidental deletion of active departments.
  - **User Governance** (`/users`): Query `profiles` collection, user listing with role and department filters.
  - Server-side role update endpoint (`POST /api/admin/update-role`) ensuring only Super Admins can alter roles/departments and users cannot modify their own permissions.
* **Acceptance Criteria**: Super Admin can manage departments and roles; unauthorized role modifications are blocked on server.

---

### ✅ Phase 5: Designer QR Engine & Static Studio (Including Direct UPI) [COMPLETED]
* **Scope**:
  - Two-column QR Generator builder.
  - **Direct Static UPI Generator**: Dedicated tab creating standard `upi://pay` strings with payee name, VPA, amount, and seva note with 100% scanner compatibility.
  - **Standard Types**: Website URL, vCard, WhatsApp, Wi-Fi, Text, Email, Phone, Location, Calendar Event.
  - **Designer Studio**:
    - Pattern styles: Classic Square, Rounded Dots, Smooth Curves.
    - Corner eye styles: Square, Rounded, Leaf.
    - Solid color and gradient controls (Green & Saffron presets).
    - Center logo upload through server upload gateway (urBackend Storage CDN reference).
    - Branded CTA frames with custom text.
  - **Client-Side Export**: High-resolution PNG (1024x1024), Vector SVG, and PDF Foldable Table Standee / Tent Card layout.
* **Acceptance Criteria**: Live real-time canvas preview, scannable direct UPI codes, custom styles applied, instant export.

---

### ✅ Phase 6: Dynamic QR Engine, Server-Side Redirection & Soft-Delete Trash [COMPLETED]
* **Scope**:
  - Dynamic QR creation with unique short code generation.
  - Smart Dynamic Donation Page option (`/pay/:slug`) with selectable seva amounts and 1-tap UPI app intent launch.
  - Server-side redirection endpoint (`GET /r/:shortCode`):
    - Bot filtering via User-Agent check.
    - Duplicate scan debounce (5-minute window).
    - Synchronous scan persistence to `qr_scans` before HTTP 302 response.
    - Status check: Inactive/Paused fallback screen.
  - Real-time destination URL editing without altering printed QR patterns.
  - 30-day soft-delete trash view with restore capability.
* **Acceptance Criteria**: Dynamic QR redirects via HTTP 302, scan is logged synchronously to MongoDB, bots are filtered, destination can be updated live.

---

### 🟢 Phase 7: Analytics & Visualization via MongoDB Aggregations
* **Scope**:
  - Overview Dashboard stat cards: Total QRs, Static vs. Dynamic count, Total Scans, Active QRs.
  - High-performance aggregation queries via `POST /api/data/qr_scans/aggregate`:
    - Daily scan trends line chart (`$dateToString` pipeline).
    - Device breakdown (Mobile vs. Desktop vs. Tablet).
    - Browser & Operating System distribution.
    - Approximate Geo/City distribution.
    - Unique visitor estimation via daily salted session hashing.
  - Date range filtering: Today, 7D, 30D, 90D, Custom range.
* **Acceptance Criteria**: Recharts dashboards populate directly from MongoDB aggregation results without client data crunching.

---

### 🟢 Phase 8: Activity Audit Logs & System Settings
* **Scope**:
  - Audit trail viewer (`/audit-logs`) tracking QR creation, destination modifications, status changes, and role assignments.
  - Filter by actor, department, action type, and date range.
  - System Settings (`/settings`):
    - Personal profile & password update via `@urbackend/react`.
    - Organization defaults: Default QR color scheme, default logo asset, default error correction level.
* **Acceptance Criteria**: All critical administrative actions generate immutable audit entries; settings persist across the organization.

---

### 🟢 Phase 9: End-to-End Testing, Security Review & Build Polish
* **Scope**:
  - Cross-platform scanner testing (iOS Camera, Android Camera, PhonePe, GPay, Paytm).
  - Validation of RLS rules and server authorization barriers.
  - Production build execution: `tsc --noEmit && vite build`.
  - Deployment configuration and comprehensive documentation.
* **Acceptance Criteria**: Production build succeeds with 0 TypeScript/lint errors; complete setup documentation delivered.
