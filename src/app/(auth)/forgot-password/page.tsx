'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button, Card, Input, Alert, Typography } from 'antd';
import { ArrowLeftOutlined, MailOutlined, ReadOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email) return;
    setSubmitting(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ant-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReadOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700 }}>SchoolFlow</span>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: 0 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: '#16a34a' }} />
              </div>
              <Title level={4} style={{ margin: '0 0 8px' }}>Check your inbox</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                We sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don&apos;t see it.
              </Text>
              <Link href="/login">
                <Button block icon={<ArrowLeftOutlined />} style={{ borderRadius: 8 }}>Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              <Title level={3} style={{ textAlign: 'center', margin: '0 0 4px' }}>Reset Password</Title>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
                Enter your account email and we&apos;ll send you a reset link.
              </Text>

              {error && <Alert description={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email address</Text>
                <Input
                  prefix={<MailOutlined style={{ color: '#d9d9d9' }} />}
                  type="email"
                  size="large"
                  placeholder="admin@yourschool.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPressEnter={onSubmit}
                  style={{ borderRadius: 8 }}
                />
              </div>

              <Button
                type="primary" block size="large" loading={submitting}
                disabled={!email} onClick={onSubmit} style={{ borderRadius: 8, marginBottom: 12 }}
              >
                Send Reset Link
              </Button>

              <Link href="/login">
                <Button block icon={<ArrowLeftOutlined />} style={{ borderRadius: 8 }}>Back to Sign In</Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
