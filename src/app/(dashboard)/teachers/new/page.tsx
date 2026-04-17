'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button, Input, Card, Select, Alert, Typography, Divider, App } from 'antd';
import { ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons';
import CredentialsModal from '@/components/modals/CredentialsModal';

const { Title, Text } = Typography;

export default function NewTeacherPage() {
  App.useApp();
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [credsModal, setCredsModal] = useState<{ username: string; tempPassword: string; name: string } | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', dob: '', gender: '',
    qualification: '', specialization: '', experience: '', designation: '', joinDate: '',
    govtId: '', panCard: '', salary: '',
    'address.street': '', 'address.city': '', 'address.state': '', 'address.country': 'India',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    if (form.phone && !/^\+?[0-9\s-]{7,15}$/.test(form.phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (!v) return;
        formData.append(k, v);
      });
      if (photo) formData.append('photo', photo);

      const res = await api.post('/teachers', formData);
      const { username, tempPassword } = res.data.data;
      setCredsModal({ username, tempPassword, name: form.name });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to add teacher');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/teachers"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserAddOutlined /> Add New Teacher
          </Title>
          <Text type="secondary">Fill in the teacher&apos;s details</Text>
        </div>
      </div>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        {/* Photo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', border: '2px dashed #d9d9d9',
            background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {photoPreview
              ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
              : <span style={{ fontSize: 28 }}>👤</span>
            }
          </div>
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); }
          }} style={{ fontSize: 13 }} />
        </div>

        <Divider titlePlacement="left" plain style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase' }}>Personal Info</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Full Name *</Text>
            <Input value={form.name} onChange={set('name')} placeholder="Full name" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email *</Text>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="Email" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Phone</Text>
            <Input value={form.phone} onChange={set('phone')} placeholder="Phone" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date of Birth</Text>
            <Input type="date" value={form.dob} onChange={set('dob')} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Gender</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select"
              value={form.gender || undefined}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
        </div>

        <Divider titlePlacement="left" plain style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase' }}>Professional Info</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Designation</Text>
            <Input value={form.designation} onChange={set('designation')} placeholder="Teacher / HOD / Principal" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Join Date</Text>
            <Input type="date" value={form.joinDate} onChange={set('joinDate')} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Qualification</Text>
            <Input value={form.qualification} onChange={set('qualification')} placeholder="B.Ed, M.Sc, etc." />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Specialization</Text>
            <Input value={form.specialization} onChange={set('specialization')} placeholder="Mathematics, Science, etc." />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Experience (years)</Text>
            <Input type="number" min="0" value={form.experience} onChange={set('experience')} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Govt ID Proof</Text>
            <Input value={form.govtId} onChange={set('govtId')} placeholder="Aadhar / Passport" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>PAN Card ID</Text>
            <Input value={form.panCard} onChange={set('panCard')} placeholder="PAN Number" />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Monthly Salary (Base)</Text>
            <Input type="number" value={form.salary} onChange={set('salary')} placeholder="Base Salary" />
          </div>
        </div>

        <Divider titlePlacement="left" plain style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase' }}>Address</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Street</Text>
            <Input value={form['address.street']} onChange={set('address.street')} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>City</Text>
            <Input value={form['address.city']} onChange={set('address.city')} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>State</Text>
            <Input value={form['address.state']} onChange={set('address.state')} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Country</Text>
            <Input value={form['address.country']} onChange={set('address.country')} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/teachers" style={{ flex: 1 }}>
          <Button block style={{ borderRadius: 8 }}>Cancel</Button>
        </Link>
        <Button type="primary" block loading={submitting} onClick={onSubmit} style={{ flex: 1, borderRadius: 8 }}>
          Add Teacher
        </Button>
      </div>

      {credsModal && (
        <CredentialsModal
          open
          role="teacher"
          name={credsModal.name}
          username={credsModal.username}
          tempPassword={credsModal.tempPassword}
          onClose={() => { setCredsModal(null); router.push('/teachers'); }}
        />
      )}
    </div>
  );
}
