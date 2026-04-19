/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColor } from '@/types';
import api from '@/lib/api';
import { Button, Card, Input, Alert, Typography, Upload, Divider, Space, App } from 'antd';
import {
  CheckCircleOutlined, BgColorsOutlined, UploadOutlined, DeleteOutlined, SaveOutlined,
  FileTextOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { themeTokens } from '@/lib/theme';

const { Title, Text } = Typography;
const { Dragger } = Upload;

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

interface TemplateOption {
  value: string;
  label: string;
  desc: string;
  thumbBg: string;
  headerBg: string;
  headerH: number;
  accentColor: string;
  showBorder?: boolean;
}

const MARKSHEET_TEMPLATES: TemplateOption[] = [
  {
    value: 'standard',
    label: 'Standard',
    desc: 'Double border frame, navy official',
    thumbBg: '#f8fafc',
    headerBg: '#1e3a5f',
    headerH: 18,
    accentColor: '#1e3a5f',
    showBorder: true,
  },
  {
    value: 'modern',
    label: 'Modern',
    desc: 'Side accent bar, clean transcript',
    thumbBg: '#ffffff',
    headerBg: '#1d4ed8',
    headerH: 4,
    accentColor: '#1d4ed8',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    desc: 'Official typed letter style',
    thumbBg: '#ffffff',
    headerBg: '#111827',
    headerH: 3,
    accentColor: '#374151',
  },
  {
    value: 'royal',
    label: 'Royal',
    desc: 'Gold & navy prestigious university',
    thumbBg: '#fefefe',
    headerBg: '#0a1628',
    headerH: 22,
    accentColor: '#c9a84c',
  },
  {
    value: 'pearl',
    label: 'Pearl',
    desc: 'Triple border, green institutional',
    thumbBg: '#ffffff',
    headerBg: '#14532d',
    headerH: 16,
    accentColor: '#14532d',
    showBorder: true,
  },
];

const CERTIFICATE_TEMPLATES: TemplateOption[] = [
  {
    value: 'classic',
    label: 'Classic',
    desc: 'Double borders, corner ornaments',
    thumbBg: '#fefce8',
    headerBg: '#92400e',
    headerH: 5,
    accentColor: '#92400e',
    showBorder: true,
  },
  {
    value: 'elegant',
    label: 'Elegant',
    desc: 'Left sidebar, clean formal layout',
    thumbBg: '#f8fafc',
    headerBg: '#4f46e5',
    headerH: 72,
    accentColor: '#4f46e5',
  },
  {
    value: 'modern',
    label: 'Modern',
    desc: 'Bold color header block',
    thumbBg: '#ffffff',
    headerBg: '#0f172a',
    headerH: 26,
    accentColor: '#0f172a',
  },
  {
    value: 'royal',
    label: 'Royal',
    desc: 'Crimson & gold, ornate borders',
    thumbBg: '#fff8f0',
    headerBg: '#7f1d1d',
    headerH: 22,
    accentColor: '#b45309',
    showBorder: true,
  },
  {
    value: 'pearl',
    label: 'Pearl',
    desc: 'Split layout, minimal elegance',
    thumbBg: '#fdf4ff',
    headerBg: '#6b21a8',
    headerH: 14,
    accentColor: '#6b21a8',
  },
];

const MAX_FILE_SIZE_MB = 2;

function validateImage(file: File): string | null {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (!allowedTypes.includes(file.type)) return 'Only PNG, JPG, SVG, WEBP, or ICO files are allowed.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
  if (file.size === 0) return 'File is empty. Please choose a valid image.';
  return null;
}

export default function BrandingPage() {
  const { message } = App.useApp();
  const { tenant, refreshUser } = useAuth();
  const { setColor, color: currentColor } = useTheme();
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(currentColor);
  const [schoolName, setSchoolName] = useState(tenant?.branding?.schoolName || tenant?.name || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(tenant?.branding?.logo || '');
  const [faviconPreview, setFaviconPreview] = useState(tenant?.branding?.favicon || '');
  const [logoError, setLogoError] = useState('');
  const [faviconError, setFaviconError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [marksheetTemplate, setMarksheetTemplate] = useState<'standard' | 'modern' | 'minimal' | 'royal' | 'pearl'>('standard');
  const [certificateTemplate, setCertificateTemplate] = useState<'classic' | 'elegant' | 'modern' | 'royal' | 'pearl'>('classic');

  const currentColorHex = themeTokens[currentColor]?.colorPrimary || '#2563eb';

  useEffect(() => {
    if (tenant) {
      setSelectedColor(tenant.branding?.primaryColor || 'blue');
      setSchoolName(tenant.branding?.schoolName || tenant.name);
      setLogoPreview(tenant.branding?.logo || '');
      setFaviconPreview(tenant.branding?.favicon || '');
      setMarksheetTemplate(tenant.branding?.marksheetTemplate || 'standard');
      setCertificateTemplate(tenant.branding?.certificateTemplate || 'classic');
    }
  }, [tenant]);

  const handleColorChange = (c: ThemeColor) => {
    setSelectedColor(c);
    setColor(c);
  };

  const handleLogoSelect = (file: File) => {
    const err = validateImage(file);
    if (err) { setLogoError(err); return false; }
    setLogoError('');
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    return false; // prevent Ant Design auto-upload
  };

  const handleFaviconSelect = (file: File) => {
    const err = validateImage(file);
    if (err) { setFaviconError(err); return false; }
    setFaviconError('');
    setFavicon(file);
    setFaviconPreview(URL.createObjectURL(file));
    return false;
  };

  const removeLogo = () => { setLogo(null); setLogoPreview(''); setLogoError(''); };
  const removeFavicon = () => { setFavicon(null); setFaviconPreview(''); setFaviconError(''); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('primaryColor', selectedColor);
      formData.append('schoolName', schoolName.trim());
      formData.append('marksheetTemplate', marksheetTemplate);
      formData.append('certificateTemplate', certificateTemplate);
      if (logo) formData.append('logo', logo);
      if (favicon) formData.append('favicon', favicon);

      // Do NOT pass Content-Type header manually — Axios auto-sets
      // multipart/form-data with the correct boundary when given FormData.
      await api.put('/tenants/my/branding', formData);

      await refreshUser();
      message.success('Branding saved successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save branding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BgColorsOutlined /> Branding &amp; Theme
        </Title>
        <Text type="secondary">Customize your institution&apos;s visual identity</Text>
      </div>

      {error && (
        <Alert
          title={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
          onClose={() => setError('')}
        />
      )}

      {/* Institution Details */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        <Title level={5}>Institution Details</Title>
        <div>
          <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Display Name</Text>
          <Input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="School display name"
            style={{ borderRadius: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            Shown in the sidebar and PDF documents
          </Text>
        </div>
      </Card>

      {/* Theme Color */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>Theme Color</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Changes apply instantly across the entire dashboard</Text>
          </div>
          {/* Active color preview pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${currentColorHex}`,
            background: currentColorHex + '12',
          }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: currentColorHex, display: 'inline-block' }} />
            <Text style={{ fontSize: 12, fontWeight: 600, color: currentColorHex }}>
              {THEME_COLORS.find(c => c.value === selectedColor)?.label || selectedColor}
            </Text>
          </div>
        </div>

        {/* Color swatches — large tile grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {THEME_COLORS.map((c) => {
            const isActive = selectedColor === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleColorChange(c.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 8px 10px',
                  borderRadius: 10,
                  border: `2px solid ${isActive ? c.hex : '#ebebeb'}`,
                  background: isActive ? c.hex + '10' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: isActive ? `3px solid ${c.hex}40` : 'none',
                  outlineOffset: 1,
                  position: 'relative',
                }}
              >
                {/* Large swatch */}
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${c.hex}, ${c.hex}cc)`,
                  display: 'inline-block',
                  boxShadow: isActive ? `0 4px 12px ${c.hex}55` : '0 1px 3px rgba(0,0,0,0.12)',
                  marginBottom: 7,
                  transition: 'box-shadow 0.15s',
                }} />
                <Text style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? c.hex : '#374151', textAlign: 'center', lineHeight: 1.3 }}>
                  {c.label}
                </Text>
                {isActive && (
                  <CheckCircleOutlined style={{
                    color: c.hex, fontSize: 13,
                    position: 'absolute', top: 5, right: 6,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Logo & Favicon */}
      <Card style={{ borderRadius: 10, marginBottom: 24 }}>
        <Title level={5}>Logo &amp; Favicon</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Used in sidebar, PDF documents, and browser tab. Max {MAX_FILE_SIZE_MB}MB per file.
        </Text>

        {/* Logo */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 10, border: '2px dashed #e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0, background: '#fafafa',
          }}>
            {logoPreview
              ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <UploadOutlined style={{ color: '#bfbfbf', fontSize: 20 }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>School Logo</Text>
              {(logo || logoPreview) && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={removeLogo} style={{ fontSize: 12 }}>
                  Remove
                </Button>
              )}
            </Space>
            {logoError && <Alert title={logoError} type="error" showIcon style={{ marginBottom: 8, borderRadius: 6 }} />}
            <Dragger
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              beforeUpload={handleLogoSelect}
              showUploadList={false}
              style={{ borderRadius: 8 }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {logo
                  ? `✓ ${logo.name} (${(logo.size / 1024).toFixed(1)} KB) — click to replace`
                  : 'Click or drag to upload logo. PNG, SVG, WEBP recommended. 200×200px'}
              </Text>
            </Dragger>
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Favicon */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, border: '2px dashed #e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0, background: '#fafafa',
          }}>
            {faviconPreview
              ? <img src={faviconPreview} alt="favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <UploadOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>Favicon</Text>
              {(favicon || faviconPreview) && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={removeFavicon} style={{ fontSize: 12 }}>
                  Remove
                </Button>
              )}
            </Space>
            {faviconError && <Alert title={faviconError} type="error" showIcon style={{ marginBottom: 8, borderRadius: 6 }} />}
            <Dragger
              accept=".ico,image/png,image/svg+xml"
              beforeUpload={handleFaviconSelect}
              showUploadList={false}
              style={{ borderRadius: 8 }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {favicon
                  ? `✓ ${favicon.name} (${(favicon.size / 1024).toFixed(1)} KB) — click to replace`
                  : 'Click or drag to upload. ICO or PNG, 32×32px'}
              </Text>
            </Dragger>
          </div>
        </div>
      </Card>

      {/* Document Templates */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        <Title level={5}>Document Templates</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
          Select the visual layout for your official documents
        </Text>

        {/* Marksheet Templates */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            <FileTextOutlined style={{ marginRight: 6 }} />
            Marksheet Template
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {MARKSHEET_TEMPLATES.map((t) => {
              const isActive = marksheetTemplate === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setMarksheetTemplate(t.value as any)}
                  style={{
                    padding: 0, borderRadius: 10, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${isActive ? currentColorHex : '#e8e8e8'}`,
                    background: 'transparent', overflow: 'hidden',
                    outline: isActive ? `3px solid ${currentColorHex}30` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {/* Mini preview thumbnail */}
                  <div style={{ background: t.thumbBg, height: 72, position: 'relative', overflow: 'hidden' }}>
                    {/* Header bar */}
                    <div style={{ background: t.headerBg, height: t.headerH, width: '100%' }} />
                    {/* Content lines */}
                    <div style={{ padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ height: 4, flex: 2, background: '#d1d5db', borderRadius: 2 }} />
                        <div style={{ height: 4, flex: 1, background: '#e5e7eb', borderRadius: 2 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[3, 1, 1, 1, 1].map((f, i) => (
                          <div key={i} style={{ height: 3, flex: f, background: i === 0 ? '#e5e7eb' : t.accentColor + '55', borderRadius: 1 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[3, 1, 1, 1, 1].map((f, i) => (
                          <div key={i} style={{ height: 3, flex: f, background: i === 0 ? '#f3f4f6' : '#e5e7eb', borderRadius: 1 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[3, 1, 1, 1, 1].map((f, i) => (
                          <div key={i} style={{ height: 3, flex: f, background: i === 0 ? '#e5e7eb' : '#f3f4f6', borderRadius: 1 }} />
                        ))}
                      </div>
                      {/* Sig lines */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, paddingHorizontal: 2 } as any}>
                        <div style={{ height: 1, width: 24, background: t.accentColor + '80', borderRadius: 1 }} />
                        <div style={{ height: 1, width: 24, background: t.accentColor + '80', borderRadius: 1 }} />
                      </div>
                    </div>
                    {/* Border overlay for Standard/Pearl */}
                    {t.showBorder && (
                      <div style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, border: `1.5px solid ${t.accentColor}40`, pointerEvents: 'none' }} />
                    )}
                    {isActive && (
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: currentColorHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#fff', fontSize: 10 }} />
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ padding: '8px 10px', background: isActive ? currentColorHex + '08' : '#fafafa' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: isActive ? currentColorHex : '#111827' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, lineHeight: 1.3 }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Certificate Templates */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            <SafetyCertificateOutlined style={{ marginRight: 6 }} />
            Certificate Template
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {CERTIFICATE_TEMPLATES.map((t) => {
              const isActive = certificateTemplate === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setCertificateTemplate(t.value as any)}
                  style={{
                    padding: 0, borderRadius: 10, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${isActive ? currentColorHex : '#e8e8e8'}`,
                    background: 'transparent', overflow: 'hidden',
                    outline: isActive ? `3px solid ${currentColorHex}30` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {/* Mini certificate thumbnail */}
                  <div style={{ background: t.thumbBg, height: 72, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ background: t.headerBg, height: t.headerH, width: '100%' }} />
                    <div style={{ padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ height: 4, width: '60%', background: t.accentColor + '80', borderRadius: 2 }} />
                      <div style={{ height: 3, width: '80%', background: '#e5e7eb', borderRadius: 2 }} />
                      <div style={{ height: 3, width: '70%', background: '#f3f4f6', borderRadius: 2 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
                        <div style={{ height: 1, width: 28, background: t.accentColor + '90', borderRadius: 1 }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1px dashed ${t.accentColor}`, flexShrink: 0 }} />
                        <div style={{ height: 1, width: 28, background: t.accentColor + '90', borderRadius: 1 }} />
                      </div>
                    </div>
                    {t.showBorder && (
                      <div style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, border: `1.5px solid ${t.accentColor}50`, pointerEvents: 'none' }} />
                    )}
                    {isActive && (
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: currentColorHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#fff', fontSize: 10 }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px', background: isActive ? currentColorHex + '08' : '#fafafa' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: isActive ? currentColorHex : '#111827' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, lineHeight: 1.3 }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Button
        type="primary"
        block
        loading={saving}
        icon={<SaveOutlined />}
        onClick={handleSave}
        style={{ borderRadius: 8, height: 45, fontWeight: 600 }}
      >
        {saving ? 'Saving...' : 'Save Branding & Templates'}
      </Button>
    </div>
  );
}
