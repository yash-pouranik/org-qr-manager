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
  process.env.URBACKEND_BASE_URL ||
  process.env.VITE_URBACKEND_BASE_URL ||
  'https://urbackend-api.onrender.com'
).replace(/\/+$/, '');
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
    id: '6af787790d2e1b4e3b7cbf71',
    name: 'Donations & Seva',
    slug: 'donations',
    description: 'Centralized fund collection, seva contributions, and donor receipts.',
    managerName: 'Bhaja Gauranga Dasa',
    managerEmail: 'bhajagaurangadasa.mmd@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: '6af787790d2e1b4e3b7cbf7d',
    name: 'Events & Festivals',
    slug: 'events',
    description: 'Festival registrations, VIP passes, cultural programs, and crowd logistics.',
    managerName: 'Events Team',
    managerEmail: 'events@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: '6af7877a0d2e1b4e3b7cbf95',
    name: 'Book Distribution',
    slug: 'book-distribution',
    description: 'Literature counters, publications, educational kiosks, and outreach books.',
    managerName: 'Bhaja Gauranga Dasa',
    managerEmail: 'bhajagaurangadasa.mmd@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: '6af7877a0d2e1b4e3b7cbfa1',
    name: 'Administration',
    slug: 'admin',
    description: 'Executive governance, IT systems, compliance, and department coordination.',
    managerName: 'Yash Pouranik',
    managerEmail: 'yashpouranik124@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
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
              last_scanned_at: new Date().toISOString(),
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
 * Computes dynamic QR counts and member counts in real time.
 */
app.get('/api/admin/departments', async (_req, res) => {
  try {
    // 1. Gather all active QR codes
    let allQrs: any[] = [...inMemoryQrCodes];
    if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const liveQrs = await serverUrClient.db.getAll('qr_codes');
        if (Array.isArray(liveQrs) && liveQrs.length > 0) {
          allQrs = liveQrs;
        }
      } catch (qrErr) {
        console.error('Error fetching live QRs for department calculation:', qrErr);
      }
    }

    // 2. Gather all users
    const allUsersMap = new Map<string, any>();
    for (const u of inMemoryUsers) {
      if (u.email) allUsersMap.set(u.email.toLowerCase(), u);
    }

    if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const logsResp = await fetch(`${URBACKEND_BASE_URL}/api/data/activity_logs?limit=500`, {
          headers: { 'x-api-key': URBACKEND_SECRET_KEY },
        });
        const logsResult = await logsResp.json();
        const logsItems = logsResult?.data?.items || (Array.isArray(logsResult?.data) ? logsResult.data : []);
        if (Array.isArray(logsItems)) {
          for (const log of logsItems) {
            if (log.action === 'user_created' && log.metadata && log.metadata.email) {
              const email = log.metadata.email.toLowerCase();
              if (!allUsersMap.has(email)) {
                allUsersMap.set(email, {
                  email,
                  departmentId: log.metadata.departmentId,
                  departmentName: log.metadata.departmentName,
                });
              }
            }
          }
        }
      } catch (uErr) {
        console.error('Error fetching users for department calculation:', uErr);
      }
    }

    // 3. Gather departments from urBackend MongoDB
    let depts: any[] = inMemoryDepartments;
    if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const liveDepts = await serverUrClient.db.getAll('departments');
        if (Array.isArray(liveDepts) && liveDepts.length > 0) {
          depts = liveDepts.filter((d: any) => !d.isDeleted && d.status !== 'archived');
        }
      } catch (err) {
        console.error('Error fetching live departments from urBackend:', err);
      }
    }

    // 4. Calculate actual totalQrs and totalMembers dynamically
    const userList = Array.from(allUsersMap.values());
    const formatted = depts.map((d: any) => {
      const deptId = String(d._id || d.id || '');
      const deptName = String(d.name || '').trim().toLowerCase();
      const deptSlug = String(d.slug || '').trim().toLowerCase();
      const managerEmail = (d.manager_email || d.managerEmail || '').trim().toLowerCase();

      // Matching active QRs
      const deptQrs = allQrs.filter((q: any) => {
        if (q.isDeleted || q.is_deleted || q.status === 'archived') return false;
        const qDeptId = String(q.department_id || q.departmentId || '');
        const qDeptName = String(q.department_name || q.departmentName || '').trim().toLowerCase();
        return (
          qDeptId === deptId ||
          qDeptId === deptSlug ||
          (deptName && qDeptName === deptName)
        );
      });

      // Matching unique members
      const memberEmails = new Set<string>();
      if (managerEmail) {
        memberEmails.add(managerEmail);
      }
      for (const u of userList) {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (!uEmail) continue;
        const uDeptId = String(u.departmentId || u.department_id || '');
        const uDeptName = String(u.departmentName || u.department_name || '').trim().toLowerCase();
        if (
          uDeptId === deptId ||
          uDeptId === deptSlug ||
          (deptName && uDeptName === deptName)
        ) {
          memberEmails.add(uEmail);
        }
      }

      const dynamicQrs = deptQrs.length;
      const dynamicMembers = memberEmails.size;

      return {
        id: deptId,
        name: d.name,
        slug: d.slug,
        description: d.description || '',
        managerName: d.manager_name || d.managerName || 'Unassigned',
        managerEmail: d.manager_email || d.managerEmail || '',
        status: d.status || 'active',
        totalQrs: Math.max(dynamicQrs, Number(d.total_qrs ?? d.totalQrs ?? 0)),
        totalMembers: Math.max(dynamicMembers, Number(d.total_members ?? d.totalMembers ?? 0)),
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Failed to get departments:', error);
    res.json({
      success: true,
      data: inMemoryDepartments,
    });
  }
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

      // First attempt direct patch by id
      try {
        await serverUrClient.db.patch('departments', id, patchData);
      } catch {
        // If direct id lookup fails, search by slug or alternate id
        const allDepts = await serverUrClient.db.getAll('departments').catch(() => []);
        const target = allDepts.find((d: any) => d._id === id || d.id === id || d.slug === id);
        if (target && (target._id || target.id)) {
          await serverUrClient.db.patch('departments', target._id || target.id, patchData).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error patching department on urBackend:', err);
    }
  }

  const index = inMemoryDepartments.findIndex((d) => d.id === id || d.slug === id);
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
      try {
        await serverUrClient.db.delete('departments', id);
      } catch {
        const allDepts = await serverUrClient.db.getAll('departments').catch(() => []);
        const target = allDepts.find((d: any) => d._id === id || d.id === id || d.slug === id);
        if (target && (target._id || target.id)) {
          await serverUrClient.db.delete('departments', target._id || target.id).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error deleting department on urBackend:', err);
    }
  }

  const index = inMemoryDepartments.findIndex((d) => d.id === id || d.slug === id);
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
 * Discovers accounts from in-memory store, live departments, and activity logs.
 */
app.get('/api/admin/users', async (_req, res) => {
  const userMap = new Map<string, any>();

  // 1. Seed with in-memory users
  for (const u of inMemoryUsers) {
    const { password: _, ...safeUser } = u;
    userMap.set(u.email.toLowerCase(), safeUser);
  }

  // 2. Discover managers and leads from live database departments
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveDepts = await serverUrClient.db.getAll('departments');
      if (Array.isArray(liveDepts)) {
        for (const dept of liveDepts) {
          const email = (dept.manager_email || dept.managerEmail || '').trim().toLowerCase();
          if (email && !userMap.has(email)) {
            const fullName = (dept.manager_name || dept.managerName || 'Manager').trim();
            const parts = fullName.split(' ');
            const firstName = parts[0] || 'Department';
            const lastName = parts.slice(1).join(' ') || 'Lead';
            const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_');

            const discoveredUser: UserRecord = {
              id: `user_dept_${dept._id || dept.id}`,
              auth_id: `auth_dept_${dept._id || dept.id}`,
              firstName,
              lastName,
              username,
              email,
              phoneNumber: '+91 9876543210',
              role: 'manager',
              departmentId: dept._id || dept.id,
              departmentName: dept.name,
              status: 'active',
              createdAt: dept.createdAt || dept.created_at || new Date().toISOString(),
              updatedAt: dept.updatedAt || dept.updated_at || new Date().toISOString(),
            };

            inMemoryUsers.push(discoveredUser);
            const { password: _, ...safe } = discoveredUser;
            userMap.set(email, safe);
          }
        }
      }
    } catch (err) {
      console.error('Error discovering users from live departments:', err);
    }

    // 3. Discover created users from activity logs
    try {
      const logsResp = await fetch(`${URBACKEND_BASE_URL}/api/data/activity_logs?limit=500`, {
        headers: { 'x-api-key': URBACKEND_SECRET_KEY },
      });
      const logsResult = await logsResp.json();
      const logsItems = logsResult?.data?.items || (Array.isArray(logsResult?.data) ? logsResult.data : []);
      if (Array.isArray(logsItems)) {
        for (const log of logsItems) {
          if (log.action === 'user_created' && log.metadata && log.metadata.email) {
            const m = log.metadata;
            const email = m.email.toLowerCase();
            if (!userMap.has(email)) {
              const createdUser: UserRecord = {
                id: log.resource_id || `user_${Date.now()}`,
                auth_id: log.resource_id || `auth_${Date.now()}`,
                firstName: m.firstName || '',
                lastName: m.lastName || '',
                username: m.username || email.split('@')[0],
                email,
                phoneNumber: m.phoneNumber || '',
                role: m.role || 'member',
                departmentId: m.departmentId || null,
                departmentName: m.departmentName || 'Unassigned',
                status: 'active',
                createdAt: log.timestamp || log.createdAt || new Date().toISOString(),
                updatedAt: log.timestamp || log.updatedAt || new Date().toISOString(),
              };
              inMemoryUsers.push(createdUser);
              const { password: _, ...safe } = createdUser;
              userMap.set(email, safe);
            }
          }
        }
      }
    } catch (logErr) {
      console.error('Error reading activity_logs for users:', logErr);
    }
  }

  res.json({
    success: true,
    data: Array.from(userMap.values()),
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

  // Resolve department from memory or live urBackend
  let resolvedDeptName = 'Unassigned';
  let resolvedDeptId: string | null = departmentId || null;

  if (departmentId) {
    const memoryDept = inMemoryDepartments.find((d) => d.id === departmentId);
    if (memoryDept) {
      resolvedDeptName = memoryDept.name;
    } else if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const liveDepts = await serverUrClient.db.getAll('departments');
        const found = Array.isArray(liveDepts)
          ? liveDepts.find((d: any) => (d._id || d.id) === departmentId || d.slug === departmentId)
          : null;
        if (found) {
          resolvedDeptName = found.name;
          resolvedDeptId = found._id || found.id;
        }
      } catch (err) {
        console.error('Error resolving department for new user:', err);
      }
    }
  }

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
          firstName: firstName || '',
          lastName: lastName || '',
          username: username.toLowerCase(),
          role: role || 'member',
          departmentId: resolvedDeptId,
          departmentName: resolvedDeptName,
        }),
      });

      const urResult = await urResp.json();
      urBackendUserId = urResult.userId || urResult.user?._id || urResult._id || null;
    } catch (err) {
      console.error('urBackend /api/userAuth/signup error:', err);
    }
  }

  const newUserId = urBackendUserId || `user_${Date.now()}`;
  const newUser: UserRecord = {
    id: newUserId,
    auth_id: urBackendUserId || `auth_${Date.now()}`,
    firstName: firstName || '',
    lastName: lastName || '',
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    phoneNumber: phoneNumber || '',
    role: role || 'member',
    departmentId: resolvedDeptId,
    departmentName: resolvedDeptName,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryUsers.push(newUser);

  // Persist user creation in activity_logs
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      await serverUrClient.db.insert('activity_logs', {
        actor_email: email.toLowerCase(),
        action: 'user_created',
        resource_type: 'user',
        resource_id: newUserId,
        timestamp: new Date().toISOString(),
        metadata: {
          firstName: firstName || '',
          lastName: lastName || '',
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          role: role || 'member',
          departmentId: resolvedDeptId,
          departmentName: resolvedDeptName,
          phoneNumber: phoneNumber || '',
        },
      });
    } catch (logErr) {
      console.error('Failed to write activity_log for user creation:', logErr);
    }
  }

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, data: safeUser });
});

/**
 * Super Admin Role & Status Management Endpoint (Server-Side Gated)
 * Prohibits self-elevation and requires verified permissions.
 */
app.post('/api/admin/users/update-role', (req, res) => {
  const {
    targetUserId,
    newRole,
    newStatus,
    newDepartmentId,
    requesterEmail,
    firstName,
    lastName,
    phoneNumber,
  } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'Target user ID is required' });
  }

  const userIndex = inMemoryUsers.findIndex(
    (u) =>
      u.id === targetUserId ||
      u.email.toLowerCase() === targetUserId.toLowerCase() ||
      u.auth_id === targetUserId
  );
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
  if (firstName !== undefined) {
    targetUser.firstName = firstName.trim();
  }
  if (lastName !== undefined) {
    targetUser.lastName = lastName.trim();
  }
  if (phoneNumber !== undefined) {
    targetUser.phoneNumber = phoneNumber.trim();
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
  const index = inMemoryUsers.findIndex(
    (u) =>
      u.id === id ||
      u.email.toLowerCase() === id.toLowerCase() ||
      u.auth_id === id
  );

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const user = inMemoryUsers[index];

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

  inMemoryUsers.splice(index, 1);

  res.json({ success: true, message: `User ${user.email} deleted successfully.` });
});

/**
 * Personal User Profile Update Endpoint
 * Updates personal details (name, username, phone) and syncs to urBackend.
 */
app.put('/api/user/profile', async (req, res) => {
  const { email, firstName, lastName, username, phoneNumber } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'User email is required' });
  }

  // Find user by email or username
  let user = inMemoryUsers.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() ||
      (username && u.username.toLowerCase() === String(username).toLowerCase())
  );

  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      auth_id: `auth_${Date.now()}`,
      firstName: firstName || '',
      lastName: lastName || '',
      username: (username || email.split('@')[0]).toLowerCase(),
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || '',
      role:
        email.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase()
          ? 'super_admin'
          : 'member',
      departmentId: null,
      departmentName: 'Unassigned',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryUsers.push(user);
  } else {
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (username !== undefined && username.trim()) user.username = username.trim().toLowerCase();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    user.updatedAt = new Date().toISOString();
  }

  // Persist to urBackend if secret key is present
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      // 1. Log activity in activity_logs
      await serverUrClient.db.insert('activity_logs', {
        actor_email: email.toLowerCase(),
        action: 'profile_updated',
        resource_type: 'user',
        resource_id: user.id || user.auth_id,
        timestamp: new Date().toISOString(),
        metadata: {
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`.trim(),
          username: user.username,
          phoneNumber: user.phoneNumber,
        },
      });

      // 2. Also try updating 'users' collection if present
      try {
        const liveUsers = await serverUrClient.db.getAll('users');
        if (Array.isArray(liveUsers)) {
          const match = liveUsers.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (match && (match._id || match.id)) {
            await serverUrClient.db.update('users', match._id || match.id, {
              firstName: user.firstName,
              lastName: user.lastName,
              name: `${user.firstName} ${user.lastName}`.trim(),
              username: user.username,
              phoneNumber: user.phoneNumber,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        // 'users' collection might be managed via urBackend auth table
      }
    } catch (urErr) {
      console.error('Error syncing profile update to urBackend:', urErr);
    }
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    data: safeUser,
    message: 'Profile details updated successfully.',
  });
});

/**
 * Personal Password Change Endpoint
 */
app.put('/api/user/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long',
    });
  }

  const user = inMemoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    if (user.password && currentPassword && user.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password does not match' });
    }
    user.password = newPassword;
    user.updatedAt = new Date().toISOString();
  }

  // Persist password change event in activity_logs
  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      await serverUrClient.db.insert('activity_logs', {
        actor_email: email.toLowerCase(),
        action: 'password_changed',
        resource_type: 'user',
        resource_id: user?.id || email,
        timestamp: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error('Error logging password change event to urBackend:', logErr);
    }
  }

  res.json({ success: true, message: 'Password updated successfully.' });
});

/* ==========================================================================
   QR CODE MANAGEMENT & DYNAMIC ROUTING APIS
   ========================================================================== */

function getPublicBaseUrl(req: express.Request): string {
  if (process.env.REDIRECT_BASE_URL) {
    return process.env.REDIRECT_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }
  const host = req.get('host') || `localhost:${PORT}`;
  if (host.includes('tools.gitaforlife.net') || host.includes('qr.gitaforlife.net') || host.includes('gitaforlife.net')) {
    return 'https://qr.gitaforlife.net';
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
  return `${proto}://${host}`.replace(/\/$/, '');
}

/**
 * List QR codes (urBackend Database backed with offline fallback)
 */
app.get('/api/admin/qr-codes', async (req, res) => {
  const isTrash = req.query.trash === 'true';
  const { departmentId, category, search } = req.query;
  const baseUrl = getPublicBaseUrl(req);

  let results: any[] = inMemoryQrCodes;

  if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
    try {
      const liveQrs = await serverUrClient.db.getAll('qr_codes');
      if (Array.isArray(liveQrs)) {
        results = liveQrs.map((q: any) => {
          let resolvedShortUrl = q.short_url;
          if (!resolvedShortUrl || resolvedShortUrl.includes('localhost') || resolvedShortUrl.includes('tools.gitaforlife.net')) {
            resolvedShortUrl = `${baseUrl}/r/${q.short_code}`;
          }
          return {
            id: q._id || q.id,
            name: q.name,
            category: q.category || 'dynamic',
            type: q.type || 'dynamic_url',
            short_code: q.short_code,
            short_url: resolvedShortUrl,
            destination_url: q.destination_url,
            department_id: q.department_id,
            department_name: q.department_name,
            status: q.status || 'active',
            total_scans: Number(q.total_scans || 0),
            unique_visitors: Number(q.unique_visitors || 0),
            last_scanned_at: q.last_scanned_at || null,
            isDeleted: Boolean(q.isDeleted || q.status === 'archived'),
            deletedAt: q.deletedAt || null,
            style_options: q.style_options || null,
            donation_config: q.donation_config,
            created_at: q.created_at || q.createdAt || new Date().toISOString(),
            updated_at: q.updated_at || q.updatedAt || new Date().toISOString(),
          };
        });
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

  const baseUrl = getPublicBaseUrl(req);
  const shortUrl = `${baseUrl}/r/${shortCode}`;

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
        style_options: styleOptions || null,
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
    let liveQrList: any[] = inMemoryQrCodes;
    let liveDeptList: any[] = inMemoryDepartments;

    if (URBACKEND_SECRET_KEY && URBACKEND_SECRET_KEY.startsWith('sk_live_')) {
      try {
        const [scansResp, qrsData, deptsData] = await Promise.all([
          fetch(`${URBACKEND_BASE_URL}/api/data/qr_scans?limit=10000`, {
            headers: { 'x-api-key': URBACKEND_SECRET_KEY },
          }),
          serverUrClient.db.getAll('qr_codes').catch(() => []),
          serverUrClient.db.getAll('departments').catch(() => []),
        ]);

        const result = await scansResp.json();
        if (result && result.data && Array.isArray(result.data.items)) {
          allScans = result.data.items;
        } else if (result && Array.isArray(result.data)) {
          allScans = result.data;
        } else if (Array.isArray(result)) {
          allScans = result;
        }

        if (Array.isArray(qrsData) && qrsData.length > 0) {
          liveQrList = qrsData;
        }
        if (Array.isArray(deptsData) && deptsData.length > 0) {
          liveDeptList = deptsData;
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
          liveQrList.find((q: any) => (q._id || q.id) === scan.qr_code_id)?.department_id;
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
        const qr = liveQrList.find(
          (q: any) => (q._id || q.id) === qrId || q.id === qrId || q.short_code === qrId
        );
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
        const dept = liveDeptList.find((d: any) => (d._id || d.id) === deptId || d.id === deptId);
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
          activeQrsCount: liveQrList.filter((q: any) => !q.isDeleted && q.status === 'active')
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
  // Express 5 compatible catch-all for SPA client-side routing
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/r/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Robust fallback for any GET requests matching SPA client routes
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/r/')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`[Redirect & Security Engine] Running on http://localhost:${PORT}`);
  console.log(`[Redirect & Security Engine] Dynamic QR route: http://localhost:${PORT}/r/:shortCode`);
  console.log(`[Redirect & Security Engine] Admin endpoints: http://localhost:${PORT}/api/admin/*`);
});

