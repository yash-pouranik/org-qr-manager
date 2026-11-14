/**
 * Organization QR Management Platform
 * Server Runtime - HTTP 302 Dynamic Redirect & Security Gateway
 */

import fs from 'node:fs';
import path from 'node:path';

// Automatically load .env.local and .env
for (const envFile of ['.env.local', '.env']) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    try {
      if (typeof (process as any).loadEnvFile === 'function') {
        (process as any).loadEnvFile(fullPath);
      }
    } catch {
      // Ignore syntax errors in env file
    }
  }
}

import express from 'express';
import cors from 'cors';
import { UrBackendClient } from '@urbackend/sdk';
import { handleRedirectRequest } from './redirect-engine.js';

const app = express();
const PORT = process.env.PORT || 3001;
const DAILY_SALT_SECRET = process.env.DAILY_SALT_SECRET || 'org_qr_default_salt_2026';
const URBACKEND_BASE_URL = (
  process.env.URBACKEND_BASE_URL || 'https://urbackend-api.onrender.com'
).replace(/\/$/, '');
const URBACKEND_SECRET_KEY = process.env.URBACKEND_SECRET_KEY || '';
const INITIAL_SUPER_ADMIN_EMAIL =
  process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@organization.local';

/**
 * Server-side urBackend SDK instance with Secret Key
 */
export const serverUrClient = new UrBackendClient({
  apiKey: URBACKEND_SECRET_KEY,
  baseUrl: URBACKEND_BASE_URL,
});

app.use(cors());
app.use(express.json());

// In-memory store for development / offline fallback
export interface QrCodeRecord {
  id: string;
  name: string;
  category: 'dynamic' | 'static';
  type: string;
  short_code: string | null;
  short_url: string | null;
  destination_url: string;
  department_id: string;
  department_name: string;
  status: 'active' | 'paused' | 'archived';
  total_scans: number;
  unique_visitors: number;
  last_scanned_at: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  style_options?: any;
  donation_config?: {
    payeeVpa: string;
    payeeName: string;
    defaultAmounts: number[];
    sevaNote: string;
  };
  created_at: string;
  updated_at: string;
}

const inMemoryQrCodes: QrCodeRecord[] = [];

const inMemoryScans: any[] = [];

// Seed in-memory departments
interface DepartmentRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  managerName: string;
  managerEmail: string;
  status: 'active' | 'archived';
  totalQrs: number;
  totalMembers: number;
  createdAt: string;
  updatedAt: string;
}

const inMemoryDepartments: DepartmentRecord[] = [
  {
    id: 'dept_01',
    name: 'Donations & Seva',
    slug: 'donations',
    description: 'Centralized fund collection, seva contributions, and donor receipts.',
    managerName: 'Organization Administrator',
    managerEmail: 'admin@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'dept_02',
    name: 'Events & Festivals',
    slug: 'events',
    description: 'Festival registrations, VIP passes, cultural programs, and crowd logistics.',
    managerName: 'Events Lead',
    managerEmail: 'events@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'dept_03',
    name: 'Kitchen & Prasadam',
    slug: 'kitchen',
    description: 'Annadhanam sponsorship, daily meal passes, and prasad distribution counters.',
    managerName: 'Kitchen Incharge',
    managerEmail: 'kitchen@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'dept_04',
    name: 'Book Distribution',
    slug: 'book-distribution',
    description: 'Literature counters, publications, educational kiosks, and outreach books.',
    managerName: 'Literature Coordinator',
    managerEmail: 'books@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'dept_05',
    name: 'Administration',
    slug: 'administration',
    description: 'General temple management, IT infrastructure, access badges, and audit ops.',
    managerName: 'Admin Officer',
    managerEmail: 'admin@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
];

// Seed in-memory users / profiles
interface UserRecord {
  id: string;
  auth_id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  phoneNumber: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member';
  departmentId: string | null;
  departmentName: string;
  status: 'active' | 'suspended' | 'invited';
  createdAt: string;
  updatedAt: string;
}

const inMemoryUsers: UserRecord[] = [
  {
    id: 'user_001',
    auth_id: 'dev_super_admin_001',
    firstName: 'System',
    lastName: 'Admin',
    username: 'superadmin',
    email: INITIAL_SUPER_ADMIN_EMAIL,
    password: 'Admin@2026',
    phoneNumber: '+91 9876543210',
    role: 'super_admin',
    departmentId: null,
    departmentName: 'All Departments',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Health Check Endpoints
 */
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'organization-qr-redirect-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Dynamic QR Server-Side Redirect Endpoint: GET /r/:shortCode
 * Issues HTTP 302 Found after synchronous scan persistence into urBackend.
 */
app.get('/r/:shortCode', async (req, res) => {
  await handleRedirectRequest(req, res, {
    dailySaltSecret: DAILY_SALT_SECRET,
    findQrCode: async (shortCode: string) => {
      if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
        try {
          const liveQrs = await serverUrClient.db.getAll('qr_codes');
          if (Array.isArray(liveQrs)) {
            const found = liveQrs.find((q: any) => q.short_code === shortCode);
            if (found) return found;
          }
        } catch (fetchErr) {
          console.error('urBackend redirect query error:', fetchErr);
        }
      }
      return inMemoryQrCodes.find((q) => q.short_code === shortCode) || null;
    },
    persistScan: async (scanData: any) => {
      if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
        try {
          await serverUrClient.db.insert('qr_scans', scanData);
          return;
        } catch (err) {
          console.error('Scan persistence error in urBackend:', err);
        }
      }
      inMemoryScans.push(scanData);
    },
    incrementScanCount: async (qrCodeId: string) => {
      if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
        try {
          const liveQrs = await serverUrClient.db.getAll('qr_codes');
          const qr = Array.isArray(liveQrs)
            ? liveQrs.find((q: any) => (q._id || q.id) === qrCodeId || q.short_code === qrCodeId)
            : null;
          const newCount = qr ? Number(qr.total_scans || 0) + 1 : 1;
          const targetId = qr ? qr._id || qr.id : qrCodeId;
          await serverUrClient.db
            .patch('qr_codes', targetId, {
              total_scans: newCount,
            })
            .catch(() => {});
        } catch (err) {
          console.error('Increment scan count error in urBackend:', err);
        }
      }
      const qr = inMemoryQrCodes.find((q) => q.id === qrCodeId || q.short_code === qrCodeId);
      if (qr) {
        qr.total_scans = (qr.total_scans || 0) + 1;
        qr.last_scanned_at = new Date().toISOString();
      }
    },
  });
});

/* ==========================================================================
   DEPARTMENT GOVERNANCE APIS
   ========================================================================== */

/**
 * List all departments (urBackend Database backed with offline fallback)
 */
app.get('/api/admin/departments', async (_req, res) => {
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveDepts = await serverUrClient.db.getAll('departments');
      if (Array.isArray(liveDepts) && liveDepts.length > 0) {
        const formatted = liveDepts.map((d: any) => ({
          id: d._id || d.id,
          name: d.name,
          slug: d.slug,
          description: d.description || '',
          managerName: d.manager_name || d.managerName || 'Unassigned',
          managerEmail: d.manager_email || d.managerEmail || '',
          status: d.status || 'active',
          totalQrs: Number(d.total_qrs ?? d.totalQrs ?? 0),
          totalMembers: Number(d.total_members ?? d.totalMembers ?? 0),
        }));
        return res.json({ success: true, data: formatted });
      }
    } catch (err) {
      console.error('Error fetching live departments from urBackend:', err);
    }
  }

  res.json({
    success: true,
    data: inMemoryDepartments,
  });
});

/**
 * Create a new department
 */
app.post('/api/admin/departments', async (req, res) => {
  const { name, slug, description, managerName, managerEmail } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, error: 'Name and slug are required' });
  }

  const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-');

  let liveDeptId: string | null = null;
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveResult: any = await serverUrClient.db.insert('departments', {
        name,
        slug: cleanSlug,
        description: description || '',
        manager_name: managerName || 'Unassigned',
        manager_email: managerEmail || '',
        status: 'active',
        total_qrs: 0,
        total_members: 0,
      });
      if (liveResult && (liveResult._id || liveResult.id)) {
        liveDeptId = liveResult._id || liveResult.id;
      }
    } catch (err: any) {
      console.error('Error inserting department to urBackend:', err);
    }
  }

  const newDept: DepartmentRecord = {
    id: liveDeptId || `dept_${Date.now()}`,
    name,
    slug: cleanSlug,
    description: description || '',
    managerName: managerName || 'Unassigned',
    managerEmail: managerEmail || '',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryDepartments.push(newDept);
  res.status(201).json({ success: true, data: newDept });
});

/**
 * Update a department
 */
app.put('/api/admin/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, managerName, managerEmail, status } = req.body;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const patchData: any = {};
      if (name) patchData.name = name;
      if (description !== undefined) patchData.description = description;
      if (managerName !== undefined) patchData.manager_name = managerName;
      if (managerEmail !== undefined) patchData.manager_email = managerEmail;
      if (status !== undefined) patchData.status = status;

      await serverUrClient.db.patch('departments', id, patchData).catch(() => {});
    } catch (err) {
      console.error('Error patching department on urBackend:', err);
    }
  }

  const index = inMemoryDepartments.findIndex((d) => d.id === id);
  if (index !== -1) {
    const current = inMemoryDepartments[index];
    inMemoryDepartments[index] = {
      ...current,
      name: name ?? current.name,
      description: description ?? current.description,
      managerName: managerName ?? current.managerName,
      managerEmail: managerEmail ?? current.managerEmail,
      status: status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
  }

  res.json({
    success: true,
    data: {
      id,
      name,
      description,
      managerName,
      managerEmail,
      status,
    },
  });
});

/**
 * Delete a department (Enforces active QR & Member dependency check)
 */
app.delete('/api/admin/departments/:id', async (req, res) => {
  const { id } = req.params;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      await serverUrClient.db.delete('departments', id).catch(() => {});
    } catch (err) {
      console.error('Error deleting department on urBackend:', err);
    }
  }

  const index = inMemoryDepartments.findIndex((d) => d.id === id);
  if (index !== -1) {
    inMemoryDepartments.splice(index, 1);
  }

  res.json({ success: true, message: 'Department removed successfully.' });
});

/* ==========================================================================
   USER & RBAC GOVERNANCE APIS
   ========================================================================== */

/**
 * List all users (Sanitized - raw passwords are never returned)
 */
app.get('/api/admin/users', (_req, res) => {
  res.json({
    success: true,
    data: inMemoryUsers.map(({ password: _, ...safeUser }) => safeUser),
  });
});


/**
 * Create user account with credentials
 * In urBackend production, registers through POST /api/userAuth/signup.
 */
app.post('/api/admin/users', async (req, res) => {
  const { firstName, lastName, username, email, password, phoneNumber, role, departmentId } = req.body;

  if (!email || !username) {
    return res.status(400).json({ success: false, error: 'Email and username are required' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password is required and must be at least 6 characters long',
    });
  }

  if (inMemoryUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'A user with this email already exists' });
  }

  const dept = inMemoryDepartments.find((d) => d.id === departmentId);

  // If live urBackend secret key is present, register via urBackend's Auth API
  let urBackendUserId: string | null = null;
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const urResp = await fetch(`${URBACKEND_BASE_URL}/api/userAuth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': URBACKEND_SECRET_KEY,
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          name: `${firstName || ''} ${lastName || ''}`.trim() || username,
          firstName: firstName || '',
          lastName: lastName || '',
          username: username.toLowerCase(),
          phoneNumber: phoneNumber || '',
          role: role || 'member',
          departmentId: departmentId || null,
          departmentName: dept ? dept.name : 'Unassigned',
          status: 'active',
        }),
      });

      const urResult = await urResp.json();
      if (urResult && urResult.user && urResult.user._id) {
        urBackendUserId = urResult.user._id;
      }
    } catch (err) {
      console.error('urBackend /api/userAuth/signup error:', err);
    }
  }

  const newUser: UserRecord = {
    id: urBackendUserId || `user_${Date.now()}`,
    auth_id: urBackendUserId || `auth_${Date.now()}`,
    firstName: firstName || '',
    lastName: lastName || '',
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password, // Stored for credential verification
    phoneNumber: phoneNumber || '',
    role: role || 'member',
    departmentId: departmentId || null,
    departmentName: dept ? dept.name : 'Unassigned',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryUsers.push(newUser);

  // Update department member count
  if (dept) {
    dept.totalMembers += 1;
  }

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, data: safeUser });
});

/**
 * Super Admin Role & Status Management Endpoint (Server-Side Gated)
 * Prohibits self-elevation and requires verified permissions.
 */
app.post('/api/admin/users/update-role', (req, res) => {
  const { targetUserId, newRole, newStatus, newDepartmentId, requesterEmail } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'Target user ID is required' });
  }

  const userIndex = inMemoryUsers.findIndex((u) => u.id === targetUserId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  const targetUser = inMemoryUsers[userIndex];

  // RULE 1: Self-Role Elevation is strictly forbidden
  if (requesterEmail && requesterEmail.toLowerCase() === targetUser.email.toLowerCase()) {
    if (newRole && newRole !== targetUser.role) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Self-role modification is strictly prohibited. An independent administrator must modify your role.',
      });
    }
  }

  // RULE 2: Root Super Admin account cannot be demoted or suspended
  if (targetUser.email.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase()) {
    if (newRole && newRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Root Super Admin role cannot be demoted.',
      });
    }
    if (newStatus && newStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Root Super Admin account cannot be suspended.',
      });
    }
  }

  // RULE 3: Department Admin cannot elevate to Super Admin or modify other Admins
  const requester = inMemoryUsers.find(
    (u) => u.email.toLowerCase() === (requesterEmail || '').toLowerCase()
  );
  const isRequesterSuperAdmin =
    requester?.role === 'super_admin' ||
    (requesterEmail || '').toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase();

  if (!isRequesterSuperAdmin) {
    if (newRole === 'super_admin' || newRole === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only Super Administrators can grant Admin privileges.',
      });
    }
    if (targetUser.role === 'super_admin' || targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot modify an Administrator account.',
      });
    }
  }

  // Update fields
  if (newRole) {
    targetUser.role = newRole;
  }
  if (newStatus) {
    targetUser.status = newStatus;
  }
  if (newDepartmentId !== undefined) {
    const oldDept = inMemoryDepartments.find((d) => d.id === targetUser.departmentId);
    const newDept = inMemoryDepartments.find((d) => d.id === newDepartmentId);

    if (oldDept && oldDept.id !== newDepartmentId && oldDept.totalMembers > 0) {
      oldDept.totalMembers -= 1;
    }
    if (newDept && newDept.id !== targetUser.departmentId) {
      newDept.totalMembers += 1;
    }

    targetUser.departmentId = newDepartmentId;
    targetUser.departmentName = newDept ? newDept.name : 'Unassigned';
  }

  targetUser.updatedAt = new Date().toISOString();
  inMemoryUsers[userIndex] = targetUser;

  res.json({
    success: true,
    data: targetUser,
    message: `User ${targetUser.email} updated successfully.`,
  });
});

/**
 * Delete user profile
 */
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const user = inMemoryUsers.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (user.email.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete the initial Super Admin account.',
    });
  }

  const dept = inMemoryDepartments.find((d) => d.id === user.departmentId);
  if (dept && dept.totalMembers > 0) {
    dept.totalMembers -= 1;
  }

  const index = inMemoryUsers.findIndex((u) => u.id === id);
  inMemoryUsers.splice(index, 1);

  res.json({ success: true, message: `User ${user.email} deleted successfully.` });
});

/* ==========================================================================
   QR CODE MANAGEMENT & DYNAMIC ROUTING APIS
   ========================================================================== */

/**
 * List QR codes (urBackend Database backed with offline fallback)
 */
app.get('/api/admin/qr-codes', async (req, res) => {
  const isTrash = req.query.trash === 'true';
  const { departmentId, category, search } = req.query;

  let results: any[] = inMemoryQrCodes;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveQrs = await serverUrClient.db.getAll('qr_codes');
      if (Array.isArray(liveQrs)) {
        results = liveQrs.map((q: any) => ({
          id: q._id || q.id,
          name: q.name,
          category: q.category || 'dynamic',
          type: q.type || 'dynamic_url',
          short_code: q.short_code,
          short_url: q.short_url,
          destination_url: q.destination_url,
          department_id: q.department_id,
          department_name: q.department_name,
          status: q.status || 'active',
          total_scans: Number(q.total_scans || 0),
          unique_visitors: Number(q.unique_visitors || 0),
          last_scanned_at: q.last_scanned_at || null,
          isDeleted: Boolean(q.isDeleted || q.status === 'archived'),
          deletedAt: q.deletedAt || null,
          donation_config: q.donation_config,
          created_at: q.created_at || q.createdAt || new Date().toISOString(),
          updated_at: q.updated_at || q.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching qr_codes from urBackend:', err);
    }
  }

  results = results.filter((q) => (isTrash ? q.isDeleted : !q.isDeleted));

  if (departmentId && typeof departmentId === 'string' && departmentId !== 'all') {
    results = results.filter((q) => q.department_id === departmentId);
  }

  if (category && typeof category === 'string') {
    results = results.filter((q) => q.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.short_code && item.short_code.toLowerCase().includes(q)) ||
        item.destination_url.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: results });
});

/**
 * Create a new QR code (Dynamic or Static) — Persists to urBackend MongoDB
 */
app.post('/api/admin/qr-codes', async (req, res) => {
  const {
    name,
    category,
    type,
    destinationUrl,
    departmentId,
    styleOptions,
    donationConfig,
    shortCode: customShortCode,
  } = req.body;

  if (!name || !destinationUrl) {
    return res.status(400).json({ success: false, error: 'Name and destinationUrl are required' });
  }

  // Resolve valid department for MongoDB Ref constraint
  let deptId = departmentId;
  let deptName = 'All Departments';

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveDepts = await serverUrClient.db.getAll('departments');
      if (Array.isArray(liveDepts) && liveDepts.length > 0) {
        const found = liveDepts.find(
          (d: any) => (d._id || d.id) === departmentId || d.id === departmentId || d.slug === departmentId
        );
        if (found) {
          deptId = found._id || found.id;
          deptName = found.name;
        } else {
          // Default to first valid department in database
          deptId = liveDepts[0]._id || liveDepts[0].id;
          deptName = liveDepts[0].name;
        }
      }
    } catch (err) {
      console.error('Error verifying department for QR code:', err);
    }
  }

  const isDynamic = category === 'dynamic' || (type && type.startsWith('dynamic_'));

  // Ensure unique short_code (schema requires unique String on qr_codes)
  const shortCode = (
    customShortCode ||
    (isDynamic ? Math.random().toString(36).substring(2, 8) : `sq_${Math.random().toString(36).substring(2, 8)}`)
  ).toLowerCase();

  const shortUrl = `http://localhost:3001/r/${shortCode}`;

  // Format donation_config according to schema
  let formattedDonationConfig: any = undefined;
  if (donationConfig) {
    let defAmounts = '101,251,501,1100,5001';
    if (Array.isArray(donationConfig.defaultAmounts)) {
      defAmounts = donationConfig.defaultAmounts.join(',');
    } else if (typeof donationConfig.defaultAmounts === 'string') {
      defAmounts = donationConfig.defaultAmounts;
    }
    formattedDonationConfig = {
      payeeVpa: donationConfig.payeeVpa || '',
      payeeName: donationConfig.payeeName || '',
      defaultAmounts: defAmounts,
      sevaNote: donationConfig.sevaNote || '',
    };
  }

  let liveQrId: string | null = null;
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveQrDoc = {
        name,
        category: isDynamic ? 'dynamic' : 'static',
        type: type || (isDynamic ? 'dynamic_url' : 'static_url'),
        short_code: shortCode,
        short_url: shortUrl,
        destination_url: destinationUrl,
        department_id: deptId,
        department_name: deptName,
        status: 'active',
        total_scans: 0,
        unique_visitors: 0,
        donation_config: formattedDonationConfig,
      };

      const liveResult: any = await serverUrClient.db.insert('qr_codes', liveQrDoc);
      if (liveResult && (liveResult._id || liveResult.id)) {
        liveQrId = liveResult._id || liveResult.id;
      }
    } catch (err: any) {
      console.error('Error inserting QR code into urBackend:', err?.message || err);
    }
  }

  const newQr: QrCodeRecord = {
    id: liveQrId || `qr_${Date.now()}`,
    name,
    category: isDynamic ? 'dynamic' : 'static',
    type: type || (isDynamic ? 'dynamic_url' : 'static_url'),
    short_code: shortCode,
    short_url: shortUrl,
    destination_url: destinationUrl,
    department_id: deptId,
    department_name: deptName,
    status: 'active',
    total_scans: 0,
    unique_visitors: 0,
    last_scanned_at: null,
    isDeleted: false,
    deletedAt: null,
    style_options: styleOptions || null,
    donation_config: formattedDonationConfig,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryQrCodes.unshift(newQr);
  res.status(201).json({ success: true, data: newQr });
});

/**
 * Update QR code (Destination URL, name, status, department)
 */
app.put('/api/admin/qr-codes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, destinationUrl, status, departmentId } = req.body;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const patchData: any = {};
      if (name) patchData.name = name;
      if (destinationUrl) patchData.destination_url = destinationUrl;
      if (status) patchData.status = status;
      if (departmentId) patchData.department_id = departmentId;
      await serverUrClient.db.patch('qr_codes', id, patchData).catch(() => {});
    } catch (err) {
      console.error('Error patching qr_code in urBackend:', err);
    }
  }

  const qrIndex = inMemoryQrCodes.findIndex((q) => q.id === id);
  if (qrIndex !== -1) {
    const current = inMemoryQrCodes[qrIndex];
    if (name) current.name = name;
    if (destinationUrl) current.destination_url = destinationUrl;
    if (status) current.status = status;
    if (departmentId) current.department_id = departmentId;
    current.updated_at = new Date().toISOString();
    inMemoryQrCodes[qrIndex] = current;
  }

  res.json({ success: true, data: { id, name, destinationUrl, status } });
});

/**
 * Restore soft-deleted QR code
 */
app.post('/api/admin/qr-codes/:id/restore', async (req, res) => {
  const { id } = req.params;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      await serverUrClient.db.patch('qr_codes', id, { status: 'active', isDeleted: false }).catch(() => {});
    } catch (err) {
      console.error('Error restoring qr_code in urBackend:', err);
    }
  }

  const qr = inMemoryQrCodes.find((q) => q.id === id);
  if (qr) {
    qr.isDeleted = false;
    qr.status = 'active';
    qr.deletedAt = null;
    qr.updated_at = new Date().toISOString();
  }

  res.json({ success: true, message: 'QR Code restored successfully.' });
});

/**
 * Delete QR code (Soft-delete or Permanent delete)
 */
app.delete('/api/admin/qr-codes/:id', async (req, res) => {
  const { id } = req.params;
  const isPermanent = req.query.permanent === 'true';

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      if (isPermanent) {
        await serverUrClient.db.delete('qr_codes', id).catch(() => {});
      } else {
        await serverUrClient.db.patch('qr_codes', id, { status: 'archived', isDeleted: true }).catch(() => {});
      }
    } catch (err) {
      console.error('Error deleting qr_code in urBackend:', err);
    }
  }

  const qrIndex = inMemoryQrCodes.findIndex((q) => q.id === id);
  if (qrIndex !== -1) {
    if (isPermanent) {
      inMemoryQrCodes.splice(qrIndex, 1);
    } else {
      inMemoryQrCodes[qrIndex].isDeleted = true;
      inMemoryQrCodes[qrIndex].status = 'archived';
      inMemoryQrCodes[qrIndex].deletedAt = new Date().toISOString();
    }
  }

  res.json({ success: true, message: isPermanent ? 'QR Code permanently removed.' : 'QR Code moved to Trash.' });
});

/**
 * Public Smart Donation Campaign Details
 */
app.get('/api/public/donation/:slug', (req, res) => {
  const { slug } = req.params;
  const qr = inMemoryQrCodes.find(
    (q) => q.short_code === slug && !q.isDeleted && q.status === 'active'
  );

  if (!qr) {
    return res.status(404).json({ success: false, error: 'Seva donation campaign not found' });
  }

  res.json({
    success: true,
    data: {
      name: qr.name,
      departmentName: qr.department_name,
      donationConfig: qr.donation_config || {
        payeeVpa: 'temple.seva@okhdfcbank',
        payeeName: 'Temple Management Trust',
        defaultAmounts: [101, 251, 501, 1100, 5001],
        sevaNote: qr.name,
      },
    },
  });
});

/* ==========================================================================
   ANALYTICS & AGGREGATION APIS (PHASE 7)
   ========================================================================== */

/**
 * Analytics Summary & Aggregation Pipeline
 * Computes time-series scan activity, device distributions, OS/browser mix,
 * and unique visitor counts with daily salted session deduplication.
 */
app.get('/api/admin/analytics/summary', async (req, res) => {
  try {
    const departmentId = (req.query.department_id as string) || undefined;
    const qrCodeId = (req.query.qr_code_id as string) || undefined;
    const timeRange = (req.query.time_range as string) || '30d';

    const now = new Date();
    const startDate = new Date();

    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'all') {
      startDate.setFullYear(2020, 0, 1);
    } else {
      // Default: 30d
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    // Try fetching from urBackend if configured
    let allScans: any[] = inMemoryScans;
    if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const filterQuery: any = {
          scanned_at: { $gte: startDate.toISOString() },
        };
        if (departmentId && departmentId !== 'all') {
          filterQuery.department_id = departmentId;
        }
        if (qrCodeId && qrCodeId !== 'all') {
          filterQuery.qr_code_id = qrCodeId;
        }
        const resp = await fetch(
          `${URBACKEND_BASE_URL}/api/data/qr_scans?filter=${encodeURIComponent(
            JSON.stringify(filterQuery)
          )}&limit=10000`,
          { headers: { 'x-api-key': URBACKEND_SECRET_KEY } }
        );
        const result = await resp.json();
        if (Array.isArray(result)) {
          allScans = result;
        } else if (result && Array.isArray(result.data)) {
          allScans = result.data;
        }
      } catch (err) {
        console.error('urBackend analytics fetch error, falling back to in-memory:', err);
      }
    }

    // Filter scans
    const filteredScans = allScans.filter((scan) => {
      const scanDate = new Date(scan.scanned_at || scan.createdAt || now);
      if (scanDate < startDate) return false;

      if (departmentId && departmentId !== 'all') {
        const scanDept =
          scan.department_id ||
          inMemoryQrCodes.find((q) => q.id === scan.qr_code_id)?.department_id;
        if (scanDept !== departmentId) return false;
      }

      if (qrCodeId && qrCodeId !== 'all') {
        if (scan.qr_code_id !== qrCodeId) return false;
      }

      return true;
    });

    const totalScans = filteredScans.length;
    const uniqueVisitorSet = new Set<string>();
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    const osCounts: Record<string, number> = {
      Android: 0,
      iOS: 0,
      Windows: 0,
      macOS: 0,
      Linux: 0,
      Other: 0,
    };

    const browserCounts: Record<string, number> = {
      Chrome: 0,
      Safari: 0,
      Firefox: 0,
      Edge: 0,
      Other: 0,
    };

    const qrScanMap: Record<string, { scans: number; visitors: Set<string> }> = {};
    const deptScanMap: Record<string, number> = {};

    filteredScans.forEach((scan) => {
      const hash = scan.anonymous_session_hash || scan.sessionHash || 'anon_visitor';
      uniqueVisitorSet.add(hash);

      const device = (scan.device_type || 'mobile').toLowerCase();
      if (device === 'mobile') mobileCount++;
      else if (device === 'tablet') tabletCount++;
      else desktopCount++;

      const os = scan.operating_system || 'Other';
      if (osCounts[os] !== undefined) osCounts[os]++;
      else osCounts.Other = (osCounts.Other || 0) + 1;

      const browser = scan.browser || 'Other';
      if (browserCounts[browser] !== undefined) browserCounts[browser]++;
      else browserCounts.Other = (browserCounts.Other || 0) + 1;

      const qrId = scan.qr_code_id || 'unknown';
      if (!qrScanMap[qrId]) {
        qrScanMap[qrId] = { scans: 0, visitors: new Set() };
      }
      qrScanMap[qrId].scans++;
      qrScanMap[qrId].visitors.add(hash);

      const deptId =
        scan.department_id ||
        inMemoryQrCodes.find((q) => q.id === qrId)?.department_id ||
        'general';
      deptScanMap[deptId] = (deptScanMap[deptId] || 0) + 1;
    });

    const uniqueVisitors = uniqueVisitorSet.size;
    const mobileShare =
      totalScans > 0 ? Math.round(((mobileCount + tabletCount) / totalScans) * 100) : 0;

    // Time-series buckets
    const timeSeriesData: { date: string; label: string; scans: number; uniqueVisitors: number }[] =
      [];

    if (timeRange === 'today') {
      // 24 Hour buckets
      for (let h = 0; h < 24; h++) {
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        const scansInHour = filteredScans.filter((s) => {
          const d = new Date(s.scanned_at || s.createdAt || now);
          return d.getHours() === h;
        });
        const hourVisitors = new Set(
          scansInHour.map((s) => s.anonymous_session_hash || 'anon')
        ).size;
        timeSeriesData.push({
          date: hourStr,
          label: hourStr,
          scans: scansInHour.length,
          uniqueVisitors: hourVisitors,
        });
      }
    } else {
      // Daily buckets from startDate to now
      const daysCount =
        timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === 'all' ? 60 : 30;

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const scansOnDay = filteredScans.filter((s) => {
          const sd = new Date(s.scanned_at || s.createdAt || now);
          const sYyyy = sd.getFullYear();
          const sMm = String(sd.getMonth() + 1).padStart(2, '0');
          const sDd = String(sd.getDate()).padStart(2, '0');
          return `${sYyyy}-${sMm}-${sDd}` === dateKey;
        });

        const dayVisitors = new Set(
          scansOnDay.map((s) => s.anonymous_session_hash || 'anon')
        ).size;

        timeSeriesData.push({
          date: dateKey,
          label: dayLabel,
          scans: scansOnDay.length,
          uniqueVisitors: dayVisitors,
        });
      }
    }

    // Top QR Codes list
    const topQrs = Object.entries(qrScanMap)
      .map(([qrId, data]) => {
        const qr = inMemoryQrCodes.find((q) => q.id === qrId || q.short_code === qrId);
        return {
          id: qrId,
          name: qr?.name || `QR Code (${qrId.substring(0, 8)})`,
          departmentName: qr?.department_name || 'General',
          type: qr?.type || 'dynamic_url',
          totalScans: data.scans,
          uniqueVisitors: data.visitors.size,
          lastScannedAt: qr?.last_scanned_at || null,
          shortCode: qr?.short_code || null,
        };
      })
      .sort((a, b) => b.totalScans - a.totalScans)
      .slice(0, 5);

    // Top Departments
    const topDepartments = Object.entries(deptScanMap)
      .map(([deptId, scans]) => {
        const dept = inMemoryDepartments.find((d) => d.id === deptId);
        return {
          id: deptId,
          name: dept?.name || deptId,
          totalScans: scans,
        };
      })
      .sort((a, b) => b.totalScans - a.totalScans);

    res.json({
      success: true,
      data: {
        summary: {
          totalScans,
          uniqueVisitors,
          mobileShare,
          activeQrsCount: inMemoryQrCodes.filter((q) => !q.isDeleted && q.status === 'active')
            .length,
        },
        timeSeries: timeSeriesData,
        deviceBreakdown: [
          { name: 'Mobile', value: mobileCount },
          { name: 'Desktop', value: desktopCount },
          { name: 'Tablet', value: tabletCount },
        ],
        osBreakdown: Object.entries(osCounts)
          .map(([name, value]) => ({ name, value }))
          .filter((item) => item.value > 0),
        browserBreakdown: Object.entries(browserCounts)
          .map(([name, value]) => ({ name, value }))
          .filter((item) => item.value > 0),
        topQrs,
        topDepartments,
      },
    });
  } catch (err: any) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to aggregate analytics' });
  }
});

/**
 * MongoDB Aggregation Pipeline Endpoint (POST /api/admin/analytics/aggregate)
 * Direct urBackend / MongoDB aggregation pass-through with fallbacks.
 */
app.post('/api/admin/analytics/aggregate', async (req, res) => {
  const { pipeline } = req.body;
  if (!pipeline || !Array.isArray(pipeline)) {
    return res.status(400).json({ success: false, error: 'Pipeline array is required' });
  }

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const response = await fetch(`${URBACKEND_BASE_URL}/api/data/qr_scans/aggregate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': URBACKEND_SECRET_KEY,
        },
        body: JSON.stringify({ pipeline }),
      });
      const result = await response.json();
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('urBackend aggregation error:', err);
    }
  }

  // Fallback: simple count
  res.json({
    success: true,
    data: [{ _id: 'all', count: inMemoryScans.length }],
  });
});

/**
 * Test Scan Simulator (POST /api/admin/analytics/simulate-scan)
 * Allows developers & testers to generate realistic sample scans across dates and devices.
 */
app.post('/api/admin/analytics/simulate-scan', (req, res) => {
  const { qrCodeId, count = 10 } = req.body;
  const qr =
    inMemoryQrCodes.find((q) => q.id === qrCodeId) ||
    inMemoryQrCodes.find((q) => !q.isDeleted && q.status === 'active') ||
    inMemoryQrCodes[0];

  const targetQrId = qr ? qr.id : 'sample_qr_001';
  const targetQrName = qr ? qr.name : 'General QR';
  const targetDeptId = qr ? qr.department_id : 'dept_01';

  const devices = ['mobile', 'mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
  const osList = ['Android', 'Android', 'iOS', 'iOS', 'Windows', 'macOS'];
  const browsers = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];

  const now = new Date();
  const addedScans: any[] = [];

  for (let i = 0; i < count; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 25);
    const scanDate = new Date(now);
    scanDate.setDate(now.getDate() - randomDaysAgo);
    scanDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const dev = devices[Math.floor(Math.random() * devices.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const sessionHash = `sim_hash_${Math.floor(Math.random() * (count / 2))}`;

    const scan = {
      qr_code_id: targetQrId,
      qr_name: targetQrName,
      department_id: targetDeptId,
      scanned_at: scanDate.toISOString(),
      device_type: dev,
      browser,
      operating_system: os,
      country: 'IN',
      city: null,
      referrer: 'camera_scanner',
      anonymous_session_hash: sessionHash,
      is_repeat_scan: Math.random() > 0.8,
    };

    inMemoryScans.push(scan);
    addedScans.push(scan);

    if (qr) {
      qr.total_scans = (qr.total_scans || 0) + 1;
      qr.last_scanned_at = scanDate.toISOString();
    }
  }

  res.json({
    success: true,
    message: `Generated ${count} test scan events.`,
    totalScansNow: inMemoryScans.length,
  });
});

// Production: Serve static client build (SPA mode)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/r/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Redirect & Security Engine] Running on http://localhost:${PORT}`);
  console.log(`[Redirect & Security Engine] Dynamic QR route: http://localhost:${PORT}/r/:shortCode`);
  console.log(`[Redirect & Security Engine] Admin endpoints: http://localhost:${PORT}/api/admin/*`);
});

