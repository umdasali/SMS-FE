/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColor } from '@/types';
import api from '@/lib/api';
import { Button, Card, Input, Alert, Typography, Upload, Row, Col, App, Tabs, Tag } from 'antd';
import {
  CheckCircleOutlined, BgColorsOutlined, UploadOutlined, DeleteOutlined, SaveOutlined,
  FileTextOutlined, SafetyCertificateOutlined, EyeOutlined,
  BookOutlined, TeamOutlined, UserOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { themeTokens } from '@/lib/theme';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const THEME_COLORS: { value: ThemeColor; label: string; hex: string }[] = [
  { value: 'blue',    label: 'Ocean Blue',     hex: '#2563eb' },
  { value: 'indigo',  label: 'Indigo',         hex: '#6366f1' },
  { value: 'purple',  label: 'Royal Purple',   hex: '#7c3aed' },
  { value: 'teal',    label: 'Teal',           hex: '#14b8a6' },
  { value: 'emerald', label: 'Emerald',        hex: '#059669' },
  { value: 'green',   label: 'Forest Green',   hex: '#16a34a' },
  { value: 'cyan',    label: 'Cyan',           hex: '#0891b2' },
  { value: 'amber',   label: 'Amber',          hex: '#d97706' },
  { value: 'orange',  label: 'Orange',         hex: '#ea580c' },
  { value: 'crimson', label: 'Crimson',        hex: '#be123b' },
  { value: 'rose',    label: 'Rose',           hex: '#e11d48' },
  { value: 'pink',    label: 'Pink',           hex: '#db2777' },
  { value: 'slate',   label: 'Slate',          hex: '#475569' },
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
  { value: 'standard', label: 'Standard',  desc: 'Double border frame, navy official', thumbBg: '#f8fafc', headerBg: '#1e3a5f', headerH: 18, accentColor: '#1e3a5f', showBorder: true },
  { value: 'modern',   label: 'Modern',    desc: 'Side accent bar, clean transcript',  thumbBg: '#ffffff', headerBg: '#1d4ed8', headerH: 4,  accentColor: '#1d4ed8' },
  { value: 'minimal',  label: 'Minimal',   desc: 'Official typed letter style',        thumbBg: '#ffffff', headerBg: '#111827', headerH: 3,  accentColor: '#374151' },
  { value: 'royal',    label: 'Royal',     desc: 'Gold & navy prestigious university', thumbBg: '#fefefe', headerBg: '#0a1628', headerH: 22, accentColor: '#c9a84c' },
  { value: 'pearl',    label: 'Pearl',     desc: 'Triple border, green institutional', thumbBg: '#ffffff', headerBg: '#14532d', headerH: 16, accentColor: '#14532d', showBorder: true },
];

const CERTIFICATE_TEMPLATES: TemplateOption[] = [
  { value: 'classic',  label: 'Classic',   desc: 'Double borders, corner ornaments',   thumbBg: '#fefce8', headerBg: '#92400e', headerH: 5,  accentColor: '#92400e', showBorder: true },
  { value: 'elegant',  label: 'Elegant',   desc: 'Left sidebar, clean formal layout',  thumbBg: '#f8fafc', headerBg: '#4f46e5', headerH: 72, accentColor: '#4f46e5' },
  { value: 'modern',   label: 'Modern',    desc: 'Bold color header block',            thumbBg: '#ffffff', headerBg: '#0f172a', headerH: 26, accentColor: '#0f172a' },
  { value: 'royal',    label: 'Royal',     desc: 'Crimson & gold, ornate borders',     thumbBg: '#fff8f0', headerBg: '#7f1d1d', headerH: 22, accentColor: '#b45309', showBorder: true },
  { value: 'pearl',    label: 'Pearl',     desc: 'Split layout, minimal elegance',     thumbBg: '#fdf4ff', headerBg: '#6b21a8', headerH: 14, accentColor: '#6b21a8' },
];

const MAX_FILE_SIZE_MB = 2;

function validateImage(file: File): string | null {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (!allowedTypes.includes(file.type)) return 'Only PNG, JPG, SVG, WEBP, or ICO files are allowed.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
  if (file.size === 0) return 'File is empty. Please choose a valid image.';
  return null;
}

function TemplateGrid({
  templates, selected, onSelect, accentHex,
}: {
  templates: TemplateOption[];
  selected: string;
  onSelect: (v: string) => void;
  accentHex: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
      {templates.map((t) => {
        const isActive = selected === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            style={{
              padding: 0, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.2s',
              border: `2px solid ${isActive ? accentHex : '#e8e8e8'}`,
              background: 'transparent', overflow: 'hidden',
              boxShadow: isActive ? `0 0 0 3px ${accentHex}20` : 'none',
            }}
          >
            <div style={{ background: t.thumbBg, height: 68, position: 'relative', overflow: 'hidden' }}>
              <div style={{ background: t.headerBg, height: t.headerH, width: '100%' }} />
              <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ height: 4, flex: 2, background: '#d1d5db', borderRadius: 2 }} />
                  <div style={{ height: 4, flex: 1, background: '#e5e7eb', borderRadius: 2 }} />
                </div>
                {[[3,1,1,1,1],[3,1,1,1,1],[3,1,1,1,1]].map((cols, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 2 }}>
                    {cols.map((f, i) => (
                      <div key={i} style={{ height: 3, flex: f, background: i === 0 ? '#e5e7eb' : (ri === 0 ? t.accentColor + '55' : '#f3f4f6'), borderRadius: 1 }} />
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <div style={{ height: 1, width: 22, background: t.accentColor + '80', borderRadius: 1 }} />
                  <div style={{ height: 1, width: 22, background: t.accentColor + '80', borderRadius: 1 }} />
                </div>
              </div>
              {t.showBorder && (
                <div style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, border: `1.5px solid ${t.accentColor}40`, pointerEvents: 'none' }} />
              )}
              {isActive && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: accentHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleOutlined style={{ color: '#fff', fontSize: 9 }} />
                </div>
              )}
            </div>
            <div style={{ padding: '7px 9px', background: isActive ? accentHex + '08' : '#fafafa', borderTop: `1px solid ${isActive ? accentHex + '30' : '#f0f0f0'}` }}>
              <div style={{ fontWeight: 600, fontSize: 11, color: isActive ? accentHex : '#111827' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, lineHeight: 1.3 }}>{t.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const PREVIEW_NAV = [
  { icon: <BookOutlined />, label: 'Dashboard' },
  { icon: <TeamOutlined />, label: 'Students' },
  { icon: <UserOutlined />, label: 'Teachers' },
  { icon: <CalendarOutlined />, label: 'Attendance' },
];

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

  const currentColorHex = themeTokens[selectedColor]?.colorPrimary || '#2563eb';

  const hasChanges = useMemo(() => {
    if (!tenant) return false;
    return (
      selectedColor !== (tenant.branding?.primaryColor || 'blue') ||
      schoolName.trim() !== (tenant.branding?.schoolName || tenant.name || '').trim() ||
      !!logo || !!favicon ||
      marksheetTemplate !== (tenant.branding?.marksheetTemplate || 'standard') ||
      certificateTemplate !== (tenant.branding?.certificateTemplate || 'classic')
    );
  }, [tenant, selectedColor, schoolName, logo, favicon, marksheetTemplate, certificateTemplate]);

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
    return false;
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
      await api.put('/tenants/my/branding', formData);
      await refreshUser();
      setLogo(null);
      setFavicon(null);
      message.success('Branding saved successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save branding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BgColorsOutlined style={{ color: currentColorHex }} /> Branding &amp; Theme
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Customize your institution&apos;s visual identity, color scheme, and document templates
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasChanges && (
            <Tag color="warning" style={{ borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>
              Unsaved changes
            </Tag>
          )}
          <Button
            type="primary"
            loading={saving}
            icon={<SaveOutlined />}
            onClick={handleSave}
            style={{ borderRadius: 8, height: 38, fontWeight: 600, minWidth: 140 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
          onClose={() => setError('')}
        />
      )}

      <Row gutter={[20, 20]}>
        {/* ── Left column: settings ── */}
        <Col xs={24} lg={15}>

          {/* 1. Visual Identity */}
          <Card
            style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #f0f0f0' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: currentColorHex + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BgColorsOutlined style={{ color: currentColorHex, fontSize: 15 }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.3 }}>Visual Identity</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>School name, logo, and browser favicon</Text>
              </div>
            </div>

            {/* School Name */}
            <div style={{ marginBottom: 20 }}>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Display Name
              </Text>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. St. Mary's International School"
                size="large"
                style={{ borderRadius: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 5, display: 'block' }}>
                Appears in the sidebar, PDF headers, and certificates
              </Text>
            </div>

            {/* Logo */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13 }}>School Logo</Text>
                {(logo || logoPreview) && (
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={removeLogo} style={{ fontSize: 11 }}>Remove</Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 10, flexShrink: 0,
                  border: `2px dashed ${logoPreview ? currentColorHex + '60' : '#d9d9d9'}`,
                  background: logoPreview ? '#fff' : '#fafafa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {logoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <UploadOutlined style={{ color: '#bfbfbf', fontSize: 20 }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {logoError && <Alert message={logoError} type="error" showIcon style={{ marginBottom: 8, borderRadius: 6, fontSize: 12 }} />}
                  <Dragger
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    beforeUpload={handleLogoSelect}
                    showUploadList={false}
                    style={{ borderRadius: 8 }}
                  >
                    <p style={{ margin: 0 }}>
                      <UploadOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                    </p>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {logo ? `✓ ${logo.name} (${(logo.size / 1024).toFixed(1)} KB)` : 'Click or drag to upload'}
                    </Text>
                    <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 2 }}>PNG, SVG, WEBP · 200×200px · max 2MB</div>
                  </Dragger>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13 }}>Favicon</Text>
                {(favicon || faviconPreview) && (
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={removeFavicon} style={{ fontSize: 11 }}>Remove</Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Browser tab mockup */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    background: '#f1f3f4', borderRadius: '6px 6px 0 0',
                    padding: '5px 10px 5px 8px', display: 'flex', alignItems: 'center', gap: 5,
                    border: '1px solid #e0e0e0', borderBottom: 'none', width: 120,
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 2, flexShrink: 0,
                      border: `1px dashed ${faviconPreview ? currentColorHex + '60' : '#d9d9d9'}`,
                      background: '#fff', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {faviconPreview && <img src={faviconPreview} alt="favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                    <Text style={{ fontSize: 9, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {schoolName || 'School'}
                    </Text>
                  </div>
                  <div style={{ height: 20, background: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 4px 4px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {faviconError && <Alert message={faviconError} type="error" showIcon style={{ marginBottom: 8, borderRadius: 6, fontSize: 12 }} />}
                  <Dragger
                    accept=".ico,image/png,image/svg+xml"
                    beforeUpload={handleFaviconSelect}
                    showUploadList={false}
                    style={{ borderRadius: 8 }}
                  >
                    <p style={{ margin: 0 }}>
                      <UploadOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                    </p>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {favicon ? `✓ ${favicon.name} (${(favicon.size / 1024).toFixed(1)} KB)` : 'Click or drag to upload'}
                    </Text>
                    <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 2 }}>ICO or PNG · 32×32px · max 2MB</div>
                  </Dragger>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Theme Color */}
          <Card
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: currentColorHex + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: currentColorHex, display: 'inline-block' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.3 }}>Theme Color</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Applied instantly across the entire dashboard</Text>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 8 }}>
              {THEME_COLORS.map((c) => {
                const isActive = selectedColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColorChange(c.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 6px 9px',
                      borderRadius: 10,
                      border: `2px solid ${isActive ? c.hex : '#ebebeb'}`,
                      background: isActive ? c.hex + '0d' : '#fafafa',
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: isActive ? `0 0 0 3px ${c.hex}25` : 'none',
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `linear-gradient(135deg, ${c.hex}, ${c.hex}cc)`,
                      display: 'inline-block', marginBottom: 7,
                      boxShadow: isActive ? `0 4px 10px ${c.hex}55` : '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'box-shadow 0.15s',
                    }} />
                    <Text style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? c.hex : '#6b7280', textAlign: 'center', lineHeight: 1.2 }}>
                      {c.label}
                    </Text>
                    {isActive && (
                      <CheckCircleOutlined style={{ color: c.hex, fontSize: 11, position: 'absolute', top: 4, right: 5 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* ── Right column: live preview ── */}
        <Col xs={24} lg={9}>
          <div style={{ position: 'sticky', top: 24 }}>
            <Card
              style={{ borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
              styles={{ body: { padding: 0 } }}
            >
              {/* Card header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <EyeOutlined style={{ color: '#8c8c8c' }} />
                <Text strong style={{ fontSize: 13 }}>Live Preview</Text>
              </div>

              {/* Sidebar mockup — matches actual Sidebar.tsx (light theme) */}
              <div style={{ padding: 16, background: '#f5f5f5' }}>
                <div style={{
                  background: '#fff', borderRadius: 10, overflow: 'hidden',
                  border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {/* Brand header */}
                  <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: logoPreview ? 'transparent' : currentColorHex,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {logoPreview
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <BookOutlined style={{ color: '#fff', fontSize: 14 }} />
                        }
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {schoolName || 'Your School Name'}
                        </div>
                        <div style={{ fontSize: 9, color: '#8c8c8c' }}>School</div>
                      </div>
                    </div>
                  </div>

                  {/* Nav items */}
                  <div style={{ padding: '8px 8px' }}>
                    {PREVIEW_NAV.map((item, i) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 7, marginBottom: 2,
                          background: i === 0 ? currentColorHex + '18' : 'transparent',
                          color: i === 0 ? currentColorHex : '#595959',
                          fontSize: 11, fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        <span style={{ fontSize: 11 }}>{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active color summary */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Active theme</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: currentColorHex, display: 'inline-block' }} />
                  <Text style={{ fontSize: 12, fontWeight: 600, color: currentColorHex }}>
                    {THEME_COLORS.find(c => c.value === selectedColor)?.label || selectedColor}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Spec hints */}
            <Card
              style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginTop: 16 }}
              styles={{ body: { padding: '16px 18px' } }}
            >
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 10, color: '#374151' }}>
                File Specifications
              </Text>
              {[
                { label: 'Logo', spec: 'PNG, SVG, WEBP · min 200×200px · max 2MB' },
                { label: 'Favicon', spec: 'ICO or PNG · 32×32px · max 2MB' },
              ].map(({ label, spec }) => (
                <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11, minWidth: 48, fontWeight: 600 }}>{label}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{spec}</Text>
                </div>
              ))}
            </Card>
          </div>
        </Col>
      </Row>

      {/* ── Document Templates (full width) ── */}
      <Card
        style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginTop: 16 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: currentColorHex + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: currentColorHex, fontSize: 15 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.3 }}>Document Templates</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Choose the visual layout for official PDF documents</Text>
          </div>
        </div>

        <Tabs
          defaultActiveKey="marksheet"
          size="small"
          style={{ marginTop: -4 }}
          items={[
            {
              key: 'marksheet',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined /> Marksheet
                  <span style={{ fontSize: 10, background: currentColorHex + '18', color: currentColorHex, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {MARKSHEET_TEMPLATES.find(t => t.value === marksheetTemplate)?.label}
                  </span>
                </span>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <TemplateGrid
                    templates={MARKSHEET_TEMPLATES}
                    selected={marksheetTemplate}
                    onSelect={(v) => setMarksheetTemplate(v as any)}
                    accentHex={currentColorHex}
                  />
                </div>
              ),
            },
            {
              key: 'certificate',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafetyCertificateOutlined /> Certificate
                  <span style={{ fontSize: 10, background: currentColorHex + '18', color: currentColorHex, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {CERTIFICATE_TEMPLATES.find(t => t.value === certificateTemplate)?.label}
                  </span>
                </span>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <TemplateGrid
                    templates={CERTIFICATE_TEMPLATES}
                    selected={certificateTemplate}
                    onSelect={(v) => setCertificateTemplate(v as any)}
                    accentHex={currentColorHex}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Bottom save bar */}
      <div style={{
        marginTop: 24, padding: '14px 20px',
        background: hasChanges ? '#fffbe6' : '#fafafa',
        border: `1px solid ${hasChanges ? '#ffe58f' : '#f0f0f0'}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        transition: 'all 0.2s',
      }}>
        <Text style={{ fontSize: 13, color: hasChanges ? '#92400e' : '#8c8c8c' }}>
          {hasChanges
            ? 'You have unsaved changes — save to apply them across the platform.'
            : 'All changes are saved and applied.'}
        </Text>
        <Button
          type="primary"
          loading={saving}
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!hasChanges}
          style={{ borderRadius: 8, height: 38, fontWeight: 600, minWidth: 140, flexShrink: 0 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

    </div>
  );
}
