'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button, Card, Input, Alert, Typography } from 'antd';
import { ArrowLeftOutlined, LockOutlined, ReadOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: 0 }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Alert
            message="Invalid reset link"
            description="This password reset link is missing or malformed. Please request a new one."
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8, textAlign: 'left' }}
          />
          <Link href="/forgot-password">
            <Button type="primary" block style={{ borderRadius: 8, marginBottom: 8 }}>Request new link</Button>
          </Link>
          <Link href="/login">
            <Button block icon={<ArrowLeftOutlined />} style={{ borderRadius: 8 }}>Back to Sign In</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (done) {
    return (
      <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: 0 }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#16a34a' }} />
          </div>
          <Title level={4} style={{ margin: '0 0 8px' }}>Password updated!</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </Text>
          <Link href="/login">
            <Button type="primary" block size="large" style={{ borderRadius: 8 }}>Sign In</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: 0 }}>
      <Title level={3} style={{ textAlign: 'center', margin: '0 0 4px' }}>Set new password</Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        Choose a strong password for your account.
      </Text>

      {error && <Alert description={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <div style={{ marginBottom: 16 }}>
        <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>New password</Text>
        <Input.Password
          prefix={<LockOutlined style={{ color: '#d9d9d9' }} />}
          size="large"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Confirm password</Text>
        <Input.Password
          prefix={<LockOutlined style={{ color: '#d9d9d9' }} />}
          size="large"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onPressEnter={onSubmit}
          style={{ borderRadius: 8 }}
        />
      </div>

      <Button
        type="primary" block size="large" loading={submitting}
        disabled={!password || !confirm} onClick={onSubmit}
        style={{ borderRadius: 8, marginBottom: 12 }}
      >
        Reset Password
      </Button>

      <Link href="/login">
        <Button block icon={<ArrowLeftOutlined />} style={{ borderRadius: 8 }}>Back to Sign In</Button>
      </Link>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'var(--ant-color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReadOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700 }}>SchoolFlow</span>
        </div>

        <Suspense fallback={<Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: 0 }}><div style={{ padding: 32 }} /></Card>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
