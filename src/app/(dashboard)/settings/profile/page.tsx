'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button, Input, Card, Avatar, Alert, Typography, Divider } from 'antd';
import {
  SaveOutlined, LockOutlined, UserOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { getInitials } from '@/lib/utils';

const { Title, Text } = Typography;

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleSaveProfile = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      if (avatar) formData.append('avatar', avatar);
      await api.put('/profile/me', formData);
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setAvatar(null);
      setAvatarPreview('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPw) { setError('Please fill all password fields'); return; }
    if (passwords.newPw !== passwords.confirm) { setError('New passwords do not match'); return; }
    if (passwords.newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSavingPw(true); setError(''); setSuccess('');
    try {
      await api.put('/profile/me/password', { currentPassword: passwords.current, newPassword: passwords.newPw });
      setSuccess('Password changed successfully!');
      setPasswords({ current: '', newPw: '', confirm: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined /> Profile Settings
        </Title>
        <Text type="secondary">Manage your account information</Text>
      </div>

      {success && <Alert title={success} type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 16, borderRadius: 8 }} closable />}
      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      {/* Profile Info */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined /> Personal Information
        </Title>
        <Divider style={{ margin: '8px 0 16px' }} />

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar
            size={72}
            src={avatarPreview || user?.avatar || undefined}
            style={{ background: 'var(--ant-color-primary)', fontSize: 22, fontWeight: 700, flexShrink: 0 }}
          >
            {!(avatarPreview || user?.avatar) && getInitials(user?.name || '')}
          </Avatar>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Profile Photo</Text>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: 13 }} />
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>JPG, PNG or WebP, max 2MB</Text>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Full Name</Text>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Phone</Text>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email</Text>
            <Input value={user?.email || ''} disabled />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Email cannot be changed</Text>
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Role</Text>
            <Input value={user?.role?.replace('_', ' ') || ''} disabled style={{ textTransform: 'capitalize' }} />
          </div>
        </div>

        <Button
          type="primary" icon={<SaveOutlined />} loading={saving}
          onClick={handleSaveProfile} style={{ marginTop: 16, borderRadius: 8 }}
        >
          Save Profile
        </Button>
      </Card>

      {/* Change Password */}
      <Card style={{ borderRadius: 10 }}>
        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LockOutlined /> Change Password
        </Title>
        <Divider style={{ margin: '8px 0 16px' }} />

        <div style={{ marginBottom: 12 }}>
          <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Current Password</Text>
          <Input.Password
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            placeholder="Enter current password"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>New Password</Text>
            <Input.Password
              value={passwords.newPw}
              onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Confirm New Password</Text>
            <Input.Password
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
            />
          </div>
        </div>
        <Button
          icon={<LockOutlined />} loading={savingPw}
          onClick={handleChangePassword} style={{ marginTop: 16, borderRadius: 8 }}
        >
          Change Password
        </Button>
      </Card>
    </div>
  );
}
