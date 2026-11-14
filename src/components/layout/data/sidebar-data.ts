import {
  LayoutDashboard,
  QrCode,
  Sparkles,
  Building2,
  Users,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  Building,
  HeartHandshake,
  Calendar,
  Utensils,
  BookOpen,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Administrator',
    email: 'admin@organization.local',
    avatar: '/images/favicon.png',
  },
  teams: [
    {
      name: 'All Departments',
      logo: Building,
      plan: 'Organization-wide',
    },
    {
      name: 'Donations & Seva',
      logo: HeartHandshake,
      plan: '12 QR Codes',
    },
    {
      name: 'Events & Festivals',
      logo: Calendar,
      plan: '8 QR Codes',
    },
    {
      name: 'Kitchen & Prasadam',
      logo: Utensils,
      plan: '6 QR Codes',
    },
    {
      name: 'Book Distribution',
      logo: BookOpen,
      plan: '15 QR Codes',
    },
    {
      name: 'Administration',
      logo: ShieldCheck,
      plan: '4 QR Codes',
    },
  ],
  navGroups: [
    {
      title: 'QR Operations',
      items: [
        {
          title: 'Overview',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'QR Directory',
          url: '/qr-codes',
          icon: QrCode,
        },
        {
          title: 'QR Generator',
          url: '/qr-codes/create',
          icon: Sparkles,
        },
      ],
    },
    {
      title: 'Organization & Access',
      items: [
        {
          title: 'Departments',
          url: '/departments',
          icon: Building2,
        },
        {
          title: 'User Management',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Analytics & Audit',
      items: [
        {
          title: 'Scan Analytics',
          url: '/analytics',
          icon: BarChart3,
        },
        {
          title: 'Audit Logs',
          url: '/audit-logs',
          icon: History,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
