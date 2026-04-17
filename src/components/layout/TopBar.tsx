'use client';

import { useState } from 'react';
import { Button, Drawer, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tenant } = useAuth();

  return (
    <>
      <header style={{
        height: 56,
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Mobile toggle */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileOpen(true)}
          style={{ display: 'none' }}
          className="mobile-menu-btn"
        />

        {/* Page title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13, letterSpacing: '-0.01em', display: 'block' }} className="topbar-title">
            {title || tenant?.branding?.schoolName || tenant?.name || 'Dashboard'}
          </Text>
        </div>

      </header>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        size="default"
        styles={{ body: { padding: 0 }, wrapper: { width: '260px !important' } }}
        title={null}
        closeIcon={null}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </Drawer>

      <style>{`
        @media (max-width: 992px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 480px) {
          .topbar-title { font-size: 14px !important; }
        }
      `}</style>
    </>
  );
}
