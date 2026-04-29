'use client';

import { useRouter } from 'next/navigation';
import { Card, Typography, Button, Space } from 'antd';
import { StopOutlined, ReadOutlined, MailOutlined, LogoutOutlined } from '@ant-design/icons';
import { clearStoredAuth } from '@/lib/auth';

const { Title, Text } = Typography;

export default function SuspendedPage() {
  const router = useRouter();

  const handleLogout = () => {
    clearStoredAuth();
    router.replace('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff5f5 0%, #f5f5f5 100%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--ant-color-primary)',
            marginBottom: 12,
          }}>
            <ReadOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>SchoolFlow</Title>
        </div>

        <Card
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 12, border: 'none' }}
          styles={{ body: { padding: 40 } }}
        >
          {/* Warning icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: '50%',
              background: '#fff1f0',
              marginBottom: 16,
            }}>
              <StopOutlined style={{ fontSize: 36, color: '#ff4d4f' }} />
            </div>
            <Title level={3} style={{ margin: '0 0 8px' }}>Account Suspended</Title>
            <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>
              Your institution&apos;s subscription has been suspended due to non-payment.
              Access to all features has been temporarily disabled.
            </Text>
          </div>

          {/* Info box */}
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 28,
          }}>
            <Text style={{ fontSize: 13, color: '#595959', lineHeight: 1.7 }}>
              To restore access, please contact your system administrator or settle any outstanding payments.
              Your data is safe and will remain intact.
            </Text>
          </div>

          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<MailOutlined />}
              block
              href="mailto:support@schoolflow.io"
              style={{ borderRadius: 8, height: 44 }}
            >
              Contact Support
            </Button>
            <Button
              size="large"
              icon={<LogoutOutlined />}
              block
              onClick={handleLogout}
              style={{ borderRadius: 8, height: 44 }}
            >
              Sign Out
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
