'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { getRoleRedirect } from '@/lib/auth';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ReadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const schema = z.object({
  email: z.string().min(3, 'Username/Email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const u = await login(data.email, data.password);
      router.push(getRoleRedirect(u.role));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
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
          styles={{ body: { padding: 32 } }}
        >
          <Title level={4} style={{ textAlign: 'center', marginBottom: 4 }}>Welcome back</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            Sign in to your institution account
          </Text>

          {error && (
            <Alert title={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <Form.Item
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Username or Email"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                validateStatus={errors.password ? 'error' : ''}
                help={errors.password?.message}
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="••••••••"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Link href="/forgot-password" style={{ fontSize: 13 }}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSubmitting}
                block
                style={{ borderRadius: 8, height: 44 }}
              >
                Sign in
              </Button>
            </Space>
          </form>

          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13 }}>
            New institution?{' '}
            <Link href="/onboarding" style={{ fontWeight: 500 }}>
              Register here
            </Link>
          </Text>
        </Card>
      </div>
    </div>
  );
}
