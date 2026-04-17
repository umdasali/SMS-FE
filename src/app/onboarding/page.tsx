'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { setStoredUser } from '@/lib/auth';
import { User, ThemeColor } from '@/types';
import {
  Steps, Card, Form, Input, Select, Button, Alert, Typography, Space, Upload, Row, Col,
} from 'antd';
import {
  BankOutlined, UserOutlined, BgColorsOutlined, CheckCircleOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, ReadOutlined, InboxOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const step1Schema = z.object({
  institutionName: z.string().min(3, 'Institution name required'),
  type: z.enum(['school', 'college', 'university', 'institute']),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().min(1, 'Country required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email('Valid email required'),
  schoolCode: z.string().min(3, 'Unique code required (min 3 chars)').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
});

const step2Schema = z.object({
  adminName: z.string().min(2, 'Name required'),
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 chars'),
  confirmPassword: z.string(),
}).refine((d) => d.adminPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;

const THEME_COLORS: { value: ThemeColor; label: string; hex: string }[] = [
  { value: 'blue',    label: 'Ocean Blue',     hex: '#2563eb' },
  { value: 'indigo',  label: 'Indigo Modern',  hex: '#6366f1' },
  { value: 'purple',  label: 'Royal Purple',   hex: '#7c3aed' },
  { value: 'teal',    label: 'Teal Clean',     hex: '#14b8a6' },
  { value: 'emerald', label: 'Emerald Green',  hex: '#059669' },
  { value: 'green',   label: 'Forest Green',   hex: '#16a34a' },
  { value: 'cyan',    label: 'Cyan Fresh',     hex: '#0891b2' },
  { value: 'amber',   label: 'Amber Warm',     hex: '#d97706' },
  { value: 'orange',  label: 'Sunset Orange',  hex: '#ea580c' },
  { value: 'crimson', label: 'Crimson Bold',   hex: '#be123b' },
  { value: 'rose',    label: 'Rose Elegant',   hex: '#e11d48' },
  { value: 'pink',    label: 'Blossom Pink',   hex: '#db2777' },
  { value: 'slate',   label: 'Slate Professional', hex: '#475569' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [primaryColor, setPrimaryColor] = useState<ThemeColor>('blue');
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [marksheetTemplate, setMarksheetTemplate] = useState<'standard' | 'modern' | 'minimal'>('standard');
  const [certificateTemplate, setCertificateTemplate] = useState<'classic' | 'elegant' | 'modern'>('classic');

  const { control: ctrl1, handleSubmit: submit1, setValue: set1, formState: { errors: err1 } } =
    useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { country: 'India' } });

  const { control: ctrl2, handleSubmit: submit2, formState: { errors: err2 } } =
    useForm<Step2>({ resolver: zodResolver(step2Schema) });

  const checkCode = async (code: string) => {
    if (code.length < 3) return;
    setChecking(true);
    try {
      const res = await api.get<{ data: { available: boolean } }>(`/onboarding/check-code/${code}`);
      setCodeAvailable(res.data.data.available);
    } catch {
      setCodeAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleStep1 = (data: Step1) => { setStep1Data(data); setStep(1); };
  const handleStep2 = (data: Step2) => { setStep2Data(data); setStep(2); };

  const handleSubmit = async () => {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(step1Data).forEach(([k, v]) => formData.append(k, v));
      Object.entries(step2Data).forEach(([k, v]) => {
        if (k !== 'confirmPassword') formData.append(k, v);
      });
      formData.append('primaryColor', primaryColor);
      formData.append('marksheetTemplate', marksheetTemplate);
      formData.append('certificateTemplate', certificateTemplate);
      if (logo) formData.append('logo', logo);
      if (favicon) formData.append('favicon', favicon);

      const res = await api.post<{ data: { user: User; accessToken: string } }>(
        '/onboarding/register', formData
      );
      setStoredUser(res.data.data.user, res.data.data.accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12, background: '#2563eb', marginBottom: 12,
          }}>
            <ReadOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>SchoolFlow</Title>
        </div>

        {/* Steps indicator */}
        <Steps
          current={step}
          style={{ marginBottom: 32 }}
          items={[
            { title: 'Institution', icon: <BankOutlined /> },
            { title: 'Admin Account', icon: <UserOutlined /> },
            { title: 'Branding', icon: <BgColorsOutlined /> },
          ]}
        />

        {/* Step 1 */}
        {step === 0 && (
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: 'none' }}>
            <Title level={4}>Institution Details</Title>
            <Text type="secondary">Tell us about your school, college, or institution</Text>
            <Form layout="vertical" style={{ marginTop: 20 }} onFinish={submit1(handleStep1)}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Institution Name" required validateStatus={err1.institutionName ? 'error' : ''} help={err1.institutionName?.message}>
                    <Controller name="institutionName" control={ctrl1} render={({ field }) => <Input {...field} placeholder="Springfield High School" size="large" />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Type" required validateStatus={err1.type ? 'error' : ''} help={err1.type?.message}>
                    <Controller name="type" control={ctrl1} render={({ field }) => (
                      <Select {...field} size="large" placeholder="Select type" style={{ width: '100%' }}
                        options={[
                          { value: 'school', label: 'School' },
                          { value: 'college', label: 'College' },
                          { value: 'university', label: 'University' },
                          { value: 'institute', label: 'Institute' },
                        ]}
                      />
                    )} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Unique School Code" required validateStatus={err1.schoolCode ? 'error' : ''} help={err1.schoolCode?.message || (codeAvailable === true ? '✓ Available' : codeAvailable === false ? '✗ Already taken' : '')}>
                    <Controller name="schoolCode" control={ctrl1} render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="springfield-hs"
                        size="large"
                        suffix={checking ? <span style={{ fontSize: 12, color: '#8c8c8c' }}>…</span> : null}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          set1('schoolCode', val);
                          field.onChange(val);
                          checkCode(val);
                        }}
                      />
                    )} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Address" required validateStatus={err1.address ? 'error' : ''} help={err1.address?.message}>
                    <Controller name="address" control={ctrl1} render={({ field }) => <Input {...field} placeholder="123 Main Street" size="large" />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="City" required validateStatus={err1.city ? 'error' : ''} help={err1.city?.message}>
                    <Controller name="city" control={ctrl1} render={({ field }) => <Input {...field} placeholder="Springfield" size="large" />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="State" required validateStatus={err1.state ? 'error' : ''} help={err1.state?.message}>
                    <Controller name="state" control={ctrl1} render={({ field }) => <Input {...field} placeholder="Maharashtra" size="large" />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Phone" required validateStatus={err1.phone ? 'error' : ''} help={err1.phone?.message}>
                    <Controller name="phone" control={ctrl1} render={({ field }) => <Input {...field} placeholder="+91 9876543210" size="large" />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Institution Email" required validateStatus={err1.email ? 'error' : ''} help={err1.email?.message}>
                    <Controller name="email" control={ctrl1} render={({ field }) => <Input {...field} type="email" placeholder="info@school.edu" size="large" />} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" size="large" block icon={<ArrowRightOutlined />} iconPlacement="end" style={{ borderRadius: 8 }}>
                Continue
              </Button>
            </Form>
          </Card>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: 'none' }}>
            <Title level={4}>Admin Account</Title>
            <Text type="secondary">Create the administrator account for your institution</Text>
            <Form layout="vertical" style={{ marginTop: 20 }} onFinish={submit2(handleStep2)}>
              <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                <Form.Item label="Full Name" required validateStatus={err2.adminName ? 'error' : ''} help={err2.adminName?.message}>
                  <Controller name="adminName" control={ctrl2} render={({ field }) => <Input {...field} placeholder="John Smith" size="large" />} />
                </Form.Item>
                <Form.Item label="Admin Email" required validateStatus={err2.adminEmail ? 'error' : ''} help={err2.adminEmail?.message}>
                  <Controller name="adminEmail" control={ctrl2} render={({ field }) => <Input {...field} type="email" placeholder="admin@yourschool.com" size="large" />} />
                </Form.Item>
                <Form.Item label="Password" required validateStatus={err2.adminPassword ? 'error' : ''} help={err2.adminPassword?.message}>
                  <Controller name="adminPassword" control={ctrl2} render={({ field }) => <Input.Password {...field} placeholder="••••••••" size="large" />} />
                </Form.Item>
                <Form.Item label="Confirm Password" required validateStatus={err2.confirmPassword ? 'error' : ''} help={err2.confirmPassword?.message}>
                  <Controller name="confirmPassword" control={ctrl2} render={({ field }) => <Input.Password {...field} placeholder="••••••••" size="large" />} />
                </Form.Item>
              </Space>
              <Row gutter={12}>
                <Col span={12}>
                  <Button size="large" block icon={<ArrowLeftOutlined />} onClick={() => setStep(0)} style={{ borderRadius: 8 }}>
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button type="primary" htmlType="submit" size="large" block icon={<ArrowRightOutlined />} iconPlacement="end" style={{ borderRadius: 8 }}>
                    Continue
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: 'none' }}>
            <Title level={4}>Branding</Title>
            <Text type="secondary">Customize your institution&apos;s look and feel</Text>

            {error && <Alert title={error} type="error" showIcon style={{ marginTop: 16, borderRadius: 8 }} />}

            <div style={{ marginTop: 24 }}>
              <Form layout="vertical">
                <Form.Item label="Theme Color">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                    {THEME_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPrimaryColor(c.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 16px', borderRadius: 8,
                          border: `2px solid ${primaryColor === c.value ? c.hex : '#e8e8e8'}`,
                          background: primaryColor === c.value ? c.hex + '15' : '#fff',
                          cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, display: 'inline-block' }} />
                        {c.label}
                        {primaryColor === c.value && <CheckCircleOutlined style={{ color: c.hex, fontSize: 14 }} />}
                      </button>
                    ))}
                  </div>
                </Form.Item>

                <Form.Item label="School Logo">
                  <Dragger
                    accept="image/*"
                    beforeUpload={(file) => { setLogo(file); return false; }}
                    showUploadList={!!logo}
                    maxCount={1}
                    style={{ borderRadius: 8 }}
                  >
                    <p><InboxOutlined style={{ fontSize: 32, color: '#bfbfbf' }} /></p>
                    <p>Click or drag logo to upload</p>
                    <p style={{ color: '#8c8c8c', fontSize: 12 }}>Recommended: 200×200px, PNG or SVG</p>
                  </Dragger>
                </Form.Item>

                <Form.Item label="Favicon">
                  <Dragger
                    accept="image/x-icon,image/png,image/svg+xml"
                    beforeUpload={(file) => { setFavicon(file); return false; }}
                    showUploadList={!!favicon}
                    maxCount={1}
                    style={{ borderRadius: 8 }}
                  >
                    <p><InboxOutlined style={{ fontSize: 32, color: '#bfbfbf' }} /></p>
                    <p>Click or drag favicon to upload</p>
                    <p style={{ color: '#8c8c8c', fontSize: 12 }}>Recommended: 32×32px, ICO or PNG</p>
                  </Dragger>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Marksheet Style">
                      <Select 
                        value={marksheetTemplate} 
                        onChange={setMarksheetTemplate}
                        options={[
                          { value: 'standard', label: 'Standard' },
                          { value: 'modern', label: 'Modern' },
                          { value: 'minimal', label: 'Minimal' }
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Certificate Style">
                      <Select 
                        value={certificateTemplate} 
                        onChange={setCertificateTemplate}
                        options={[
                          { value: 'classic', label: 'Classic' },
                          { value: 'elegant', label: 'Elegant' },
                          { value: 'modern', label: 'Modern' }
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Row gutter={12}>
                <Col span={12}>
                  <Button size="large" block icon={<ArrowLeftOutlined />} onClick={() => setStep(1)} style={{ borderRadius: 8 }}>
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={submitting}
                    icon={<CheckCircleOutlined />}
                    iconPlacement="end"
                    onClick={handleSubmit}
                    style={{ borderRadius: 8 }}
                  >
                    {submitting ? 'Setting up...' : 'Complete Setup'}
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
