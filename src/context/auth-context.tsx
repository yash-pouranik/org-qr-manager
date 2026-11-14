import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth, useUser } from '@urbackend/react'
import { useAuthStore } from '@/stores/auth-store'

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'member'

export interface UserProfile {
  _id?: string
  auth_id: string
  full_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  role: AppRole
  department_id?: string | null
  department_name?: string | null
  status: 'active' | 'suspended' | 'pending'
  created_at?: string
  last_login?: string
}

export interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  role: AppRole
  isSuperAdmin: boolean
  isAdmin: boolean
  isManager: boolean
  isMember: boolean
  canManageDepartments: boolean
  canManageUsers: boolean
  canCreateQr: boolean
  canEditQr: boolean
  canDeleteQr: boolean
  canAccessTrash: boolean
  assignedDepartmentId: string | null
  assignedDepartmentName: string | null
  hasRole: (roles: AppRole[]) => boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const INITIAL_SUPER_ADMIN_EMAIL =
  import.meta.env.VITE_INITIAL_SUPER_ADMIN_EMAIL || 'yashpouranik124@gmail.com'

const DEFAULT_DEV_ADMIN: UserProfile = {
  auth_id: 'dev_super_admin_001',
  full_name: 'Yash Pouranik (Super Admin)',
  email: 'yashpouranik124@gmail.com',
  role: 'super_admin',
  department_id: null,
  department_name: 'All Departments',
  status: 'active',
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const urAuth = useAuth()
  const { user: urUser, isAuthenticated: urIsAuthenticated, isLoading: urIsLoading } = useUser()
  const { auth } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Check if a dev admin session exists in localStorage
    const saved = localStorage.getItem('org_user_profile')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    // Default to dev admin in development if store has token
    if (auth.accessToken) {
      return DEFAULT_DEV_ADMIN
    }
    return null
  })

  const [isLoading, setIsLoading] = useState(false)

  // Sync with urBackend user when authenticated
  useEffect(() => {
    if (urIsAuthenticated && urUser) {
      const isSuperAdminEmail =
        urUser.email.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase()

      const userId = String((urUser as any)._id || (urUser as any).id || 'auth_user')
      const userName = (urUser as any).name || (urUser as any).username || urUser.email.split('@')[0]
      const userRole = (urUser as any).role || (isSuperAdminEmail ? 'super_admin' : 'member')
      const deptId = (urUser as any).departmentId || null
      const deptName =
        (urUser as any).departmentName || (isSuperAdminEmail ? 'All Departments' : 'Unassigned')

      const resolvedProfile: UserProfile = {
        auth_id: userId,
        full_name: userName,
        email: urUser.email,
        role: isSuperAdminEmail ? 'super_admin' : userRole,
        department_id: deptId,
        department_name: deptName,
        status: (urUser as any).status || 'active',
        last_login: new Date().toISOString(),
      }

      setProfile(resolvedProfile)
      localStorage.setItem('org_user_profile', JSON.stringify(resolvedProfile))

      // Also sync to legacy zustand store so existing components work
      auth.setUser({
        accountNo: userId,
        email: urUser.email,
        role: [resolvedProfile.role],
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    }
  }, [urIsAuthenticated, urUser])

  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      // 1. Try logging in with urBackend SDK
      if (urAuth && typeof urAuth.login === 'function') {
        try {
          await urAuth.login({ email, password: pass })
          setIsLoading(false)
          return { success: true }
        } catch (urErr: any) {
          console.warn('urBackend live auth failed or offline, evaluating fallback:', urErr?.message)
        }
      }

      // 2. Local credential verification fallback
      try {
        const verifyResp = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        })
        const verifyResult = await verifyResp.json()

        if (verifyResp.ok && verifyResult.success && verifyResult.user) {
          const u = verifyResult.user
          const isSuperAdmin = u.email.toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL.toLowerCase()
          const verifiedProfile: UserProfile = {
            auth_id: u.auth_id || u.id,
            full_name:
              `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email.split('@')[0],
            email: u.email,
            role: isSuperAdmin ? 'super_admin' : u.role || 'member',
            department_id: u.departmentId || null,
            department_name:
              u.departmentName || (isSuperAdmin ? 'All Departments' : 'Unassigned'),
            status: u.status || 'active',
            last_login: new Date().toISOString(),
          }

          setProfile(verifiedProfile)
          localStorage.setItem('org_user_profile', JSON.stringify(verifiedProfile))
          auth.setAccessToken('local_dev_token_' + Date.now())
          auth.setUser({
            accountNo: verifiedProfile.auth_id,
            email: verifiedProfile.email,
            role: [verifiedProfile.role],
            exp: Date.now() + 24 * 60 * 60 * 1000,
          })

          setIsLoading(false)
          return { success: true }
        } else {
          setIsLoading(false)
          return { success: false, error: verifyResult.error || 'Invalid email or password' }
        }
      } catch (err: any) {
        setIsLoading(false)
        return { success: false, error: err?.message || 'Authentication server unreachable' }
      }
    } catch (err: any) {
      setIsLoading(false)
      return { success: false, error: err?.message || 'Authentication failed' }
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      if (urAuth && typeof urAuth.logout === 'function') {
        await urAuth.logout().catch(() => {})
      }
    } finally {
      setProfile(null)
      localStorage.removeItem('org_user_profile')
      auth.reset()
      setIsLoading(false)
    }
  }

  const role: AppRole = profile?.role || 'member'
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = isSuperAdmin || role === 'admin'
  const isManager = isAdmin || role === 'manager'
  const isMember = role === 'member'

  const canManageDepartments = isSuperAdmin
  const canManageUsers = isSuperAdmin || role === 'admin'
  const canCreateQr = isSuperAdmin || role === 'admin' || role === 'manager'
  const canEditQr = isSuperAdmin || role === 'admin' || role === 'manager'
  const canDeleteQr = isSuperAdmin || role === 'admin'
  const canAccessTrash = isSuperAdmin || role === 'admin'
  const assignedDepartmentId = isSuperAdmin ? null : profile?.department_id || null
  const assignedDepartmentName = isSuperAdmin ? 'All Departments' : profile?.department_name || null

  const hasRole = (allowedRoles: AppRole[]): boolean => {
    if (!profile) return false
    if (profile.role === 'super_admin') return true
    return allowedRoles.includes(profile.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        isAuthenticated: !!profile,
        isLoading: isLoading || urIsLoading,
        role: profile?.role || 'member',
        isSuperAdmin,
        isAdmin,
        isManager,
        isMember,
        canManageDepartments,
        canManageUsers,
        canCreateQr,
        canEditQr,
        canDeleteQr,
        canAccessTrash,
        assignedDepartmentId,
        assignedDepartmentName,
        hasRole,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAppAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAppAuth must be used within an AppAuthProvider')
  }
  return context
}

// Convenient alias
export const useAuthUser = useAppAuth

