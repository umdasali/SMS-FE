'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, Button, Layout, Typography } from 'antd';
import {
  UserOutlined, FileTextOutlined, SafetyCertificateOutlined, LogoutOutlined,
  ReadOutlined, TrophyOutlined, CalendarOutlined, DollarOutlined, HomeOutlined,
} from '@ant-design/icons';
import { getInitials } from '@/lib/utils';

const { Header, Content } = Layout;
const { Text } = Typography;

const NAV = [
  { href: '/portal',              label: 'Home',         icon: <HomeOutlined />,              roles: ['student', 'teacher'] },
  { href: '/portal/profile',      label: 'Profile',      icon: <UserOutlined />,             roles: ['student', 'teacher'] },
  { href: '/portal/marksheet',    label: 'Marksheet',    icon: <FileTextOutlined />,          roles: ['student'] },
  { href: '/portal/exams',        label: 'Exams',        icon: <TrophyOutlined />,            roles: ['student'] },
  { href: '/portal/schedule',     label: 'Schedule',     icon: <CalendarOutlined />,          roles: ['student'] },
  { href: '/portal/fees',         label: 'Fees',         icon: <DollarOutlined />,            roles: ['student'] },
  { href: '/portal/certificates', label: 'Certs',        icon: <SafetyCertificateOutlined />, roles: ['student'] },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading, logout } = useAuth();
  const { applyTenantTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && user && !['student', 'teacher'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (tenant) applyTenantTheme(tenant);
  }, [tenant, applyTenantTheme]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ReadOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
      </div>
    );
  }
  if (!user) return null;

  const handleLogout = async () => { await logout(); router.push('/login'); };
  const visibleNav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .portal-desktop-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
          overflow-x: auto;
        }
        .portal-nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #595959;
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .portal-nav-link:hover {
          background: #f5f5f5;
          color: #111;
        }
        .portal-nav-link.active {
          background: var(--ant-color-primary-bg);
          color: var(--ant-color-primary);
          font-weight: 600;
        }
        .portal-school-name {
          font-size: 14px;
          font-weight: 600;
        }
        .portal-bottom-nav {
          display: none;
        }

        @media (max-width: 640px) {
          .portal-desktop-nav { display: none !important; }
          .portal-school-name { display: none; }
          .portal-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 58px;
            background: #fff;
            border-top: 1px solid #f0f0f0;
            z-index: 100;
            box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
          }
          .portal-content-wrap {
            padding-bottom: 72px !important;
          }
        }

        .portal-bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #8c8c8c;
          font-size: 10px;
          font-weight: 500;
          padding: 6px 4px;
          transition: color 0.15s;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .portal-bottom-nav-item .nav-icon {
          font-size: 18px;
          line-height: 1;
        }
        .portal-bottom-nav-item.active {
          color: var(--ant-color-primary);
        }
        .portal-bottom-nav-item.active .nav-icon {
          position: relative;
        }
        .portal-bottom-nav-item.active .nav-icon::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--ant-color-primary);
        }
      `}</style>

      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 12px',
        height: 52,
        lineHeight: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Logo + school name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {tenant?.branding?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.branding.logo} alt="logo" style={{ height: 28, width: 28, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--ant-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReadOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
          )}
          <Text strong className="portal-school-name">
            {tenant?.branding?.schoolName || tenant?.name || 'SchoolFlow'}
          </Text>
        </div>

        {/* Desktop nav */}
        <nav className="portal-desktop-nav">
          {visibleNav.map((n) => {
            const isActive = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`portal-nav-link${isActive ? ' active' : ''}`}
              >
                {n.icon} {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          <Avatar
            size={30}
            src={user.avatar || undefined}
            style={{ background: 'var(--ant-color-primary)', fontWeight: 700, fontSize: 11 }}
          >
            {!user.avatar && getInitials(user.name)}
          </Avatar>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            size="small"
            onClick={handleLogout}
            style={{ color: '#8c8c8c' }}
          />
        </div>
      </Header>

      <Content
        className="portal-content-wrap"
        style={{ maxWidth: 860, margin: '0 auto', padding: '24px 14px', width: '100%' }}
      >
        {children}
      </Content>

      {/* Mobile bottom tab bar */}
      <nav className="portal-bottom-nav">
        {visibleNav.map((n) => {
          const isActive = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`portal-bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </Layout>
  );
}
