'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Layout, Menu, Typography, Skeleton } from 'antd';
import {
  DashboardOutlined, BankOutlined, LogoutOutlined, DeploymentUnitOutlined,
} from '@ant-design/icons';
import { getInitials } from '@/lib/utils';

const { Sider, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/saas-admin/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/saas-admin/institutions', label: 'Institutions', icon: <BankOutlined /> },
];

export default function SaasAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'saas_admin')) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton active style={{ width: 400 }} />
      </div>
    );
  }
  if (!user) return null;

  const selectedKey = NAV_ITEMS.find((n) => pathname.startsWith(n.key))?.key ?? '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{ background: '#0f172a', display: 'flex', flexDirection: 'column' }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DeploymentUnitOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div>
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'block', lineHeight: 1.2 }}>SchoolFlow</Text>
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>SaaS Admin</Text>
          </div>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ background: 'transparent', border: 'none', flex: 1, marginTop: 8 }}
          theme="dark"
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key} style={{ color: 'inherit' }}>{item.label}</Link>,
          }))}
        />

        {/* User footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Avatar size={28} style={{ background: '#3b82f6', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {getInitials(user.name)}
          </Avatar>
          <Text style={{ color: '#94a3b8', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </Text>
          <LogoutOutlined
            style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
            onClick={async () => { await logout(); router.push('/login'); }}
          />
        </div>
      </Sider>

      <Layout style={{ background: '#f8fafc' }}>
        <Content style={{ padding: 32, minHeight: '100vh' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
