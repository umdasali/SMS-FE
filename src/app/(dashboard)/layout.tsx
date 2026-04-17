'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Skeleton } from 'antd';

const LoadingSkeleton = () => (
  <div style={{ display: 'flex', height: '100vh' }}>
    <div style={{ width: 240, background: '#fff', borderRight: '1px solid #f0f0f0', padding: 16 }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
    <div style={{ flex: 1, padding: 24 }}>
      <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton.Button key={i} active style={{ width: '100%', height: 100 }} />
        ))}
      </div>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading } = useAuth();
  const { applyTenantTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait until auth is resolved before making decisions
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'student') {
      router.replace('/portal/profile');
      return;
    }
    if (user.role === 'saas_admin') {
      router.replace('/saas-admin/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (tenant) applyTenantTheme(tenant);
  }, [tenant, applyTenantTheme]);

  // Show skeleton while auth is being resolved OR while a redirect is pending.
  // This prevents the blank-screen flash from `if (!user) return null`.
  if (isLoading) return <LoadingSkeleton />;

  // Auth resolved but user is null — redirect is in-flight via useEffect above.
  // Render skeleton instead of null so there's no blank-screen flash.
  if (!user || user.role === 'student' || user.role === 'saas_admin') {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f5' }}>
      {/* Sidebar — hidden on mobile via media query */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main className="dashboard-main-content">
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-desktop { display: flex; }
        .dashboard-main-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        @media (max-width: 992px) {
          .sidebar-desktop { display: none; }
          .dashboard-main-content { padding: 16px; }
        }
        @media (max-width: 576px) {
          .dashboard-main-content { padding: 12px; }
        }
      `}</style>
    </div>
  );
}
