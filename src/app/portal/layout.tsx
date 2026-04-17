'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, Button, Layout, Menu, Typography } from 'antd';
import {
  UserOutlined, FileTextOutlined, SafetyCertificateOutlined, LogoutOutlined,
  ReadOutlined, TrophyOutlined, CalendarOutlined, DollarOutlined,
} from '@ant-design/icons';
import { getInitials } from '@/lib/utils';

const { Header, Content } = Layout;
const { Text } = Typography;

const NAV = [
  { href: '/portal/profile',      label: 'Profile',      icon: <UserOutlined />,             roles: ['student', 'teacher'] },
  { href: '/portal/marksheet',    label: 'Marksheet',    icon: <FileTextOutlined />,          roles: ['student'] },
  { href: '/portal/exams',        label: 'Exams',        icon: <TrophyOutlined />,            roles: ['student'] },
  { href: '/portal/schedule',     label: 'Schedule',     icon: <CalendarOutlined />,          roles: ['student'] },
  { href: '/portal/fees',         label: 'Fees',         icon: <DollarOutlined />,            roles: ['student'] },
  { href: '/portal/certificates', label: 'Certificates', icon: <SafetyCertificateOutlined />, roles: ['student'] },
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
      <Header style={{
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        padding: '0 16px', height: 56, lineHeight: '56px',
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {tenant?.branding?.logo ? (
            <img src={tenant.branding.logo} alt="logo" style={{ height: 28, width: 28, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--ant-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReadOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
          )}
          <Text strong style={{ fontSize: 14 }}>
            {tenant?.branding?.schoolName || tenant?.name || 'SchoolFlow'}
          </Text>
        </div>

        {/* Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[pathname]}
          style={{ border: 'none', flex: 1, justifyContent: 'center', background: 'transparent' }}
          items={visibleNav.map((n) => ({
            key: n.href,
            icon: n.icon,
            label: <Link href={n.href}>{n.label}</Link>,
          }))}
        />

        {/* User actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Avatar size={32} src={user.avatar || undefined} style={{ background: 'var(--ant-color-primary)', fontWeight: 700, fontSize: 12 }}>
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

      <Content style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px', width: '100%' }}>
        {children}
      </Content>
    </Layout>
  );
}
