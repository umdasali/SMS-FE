'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { Avatar, Typography, Divider, Tooltip } from 'antd';
import {
  DashboardOutlined, TeamOutlined, UserOutlined, BookOutlined,
  ScheduleOutlined, CheckSquareOutlined, FileTextOutlined,
  SafetyCertificateOutlined, SettingOutlined, LogoutOutlined,
  ReadOutlined, DollarOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardOutlined />, roles: ['management', 'teacher'] },
  { label: 'My Profile', href: '/my-profile', icon: <UserOutlined />, roles: ['teacher'] },
  { label: 'Students', href: '/students', icon: <TeamOutlined />, roles: ['management', 'teacher'] },
  { label: 'Teachers', href: '/teachers', icon: <UserOutlined />, roles: ['management'] },
  { label: 'Classes', href: '/classes', icon: <BookOutlined />, roles: ['management'] },
  { label: 'Subjects', href: '/subjects', icon: <ReadOutlined />, roles: ['management'] },
  { label: 'Routine', href: '/routine', icon: <ScheduleOutlined />, roles: ['management', 'teacher'] },
  { label: 'Attendance', href: '/attendance', icon: <CheckSquareOutlined />, roles: ['management', 'teacher'] },
  { label: 'Exams & Marks', href: '/exams', icon: <FileTextOutlined />, roles: ['management', 'teacher'] },
  { label: 'Certificates', href: '/certificates', icon: <SafetyCertificateOutlined />, roles: ['management'] },
  { label: 'Finance', href: '/finance', icon: <DollarOutlined />, roles: ['management'] },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: 'Branding', href: '/settings/branding', icon: <SettingOutlined />, roles: ['management'] },
  { label: 'Profile', href: '/settings/profile', icon: <UserOutlined />, roles: ['management', 'teacher'] },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const visibleNav = NAV_ITEMS.filter((item) => user?.role && item.roles.includes(user.role));
  const visibleSettings = SETTINGS_ITEMS.filter((item) => user?.role && item.roles.includes(user.role));

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--ant-color-primary)' : '#595959',
    background: active ? 'var(--ant-color-primary-bg)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
    marginBottom: 2,
  });

  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: 240,
      background: '#fff',
      borderRight: '1px solid #f0f0f0',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tenant?.branding?.logo ? (
            <img
              src={tenant.branding.logo}
              alt="logo"
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--ant-color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ReadOutlined style={{ color: '#fff', fontSize: 18 }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.3' }}>
              {tenant?.branding?.schoolName || tenant?.name || 'SchoolFlow'}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
              {tenant?.type || 'School'}
            </Text>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={navLinkStyle(active)}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {visibleSettings.length > 0 && (
          <>
            <Divider style={{ margin: '10px 0' }} />
            <Text style={{ fontSize: 10, fontWeight: 600, color: '#bfbfbf', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 4, display: 'block' }}>
              Settings
            </Text>
            {visibleSettings.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={onClose} style={navLinkStyle(active)}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8, background: '#fafafa',
        }}>
          <Avatar
            src={user?.avatar || undefined}
            size={32}
            style={{ flexShrink: 0, background: 'var(--ant-color-primary)', fontSize: 12, fontWeight: 600 }}
          >
            {user?.name ? getInitials(user.name) : 'U'}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.3' }}>{user?.name}</Text>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </Text>
          </div>
          <Tooltip title="Logout">
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#8c8c8c', padding: 4, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <LogoutOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
