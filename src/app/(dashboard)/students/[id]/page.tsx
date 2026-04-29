/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student, Class } from '@/types';
import api from '@/lib/api';
import {
  Button, Input, Card, Tag, Avatar, Alert, Typography, Select, Tabs, Skeleton, App, Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  FileTextOutlined, SafetyCertificateOutlined, LockOutlined,
  StopOutlined, CheckCircleOutlined, TrophyOutlined, SwapOutlined,
  EllipsisOutlined, DownloadOutlined, LoadingOutlined,
} from '@ant-design/icons';
import { formatDate, getInitials, flattenObject } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';

import { useAuth } from '@/context/AuthContext';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';
import AdmissionSlipPDF from '@/components/pdf/AdmissionSlipPDF';
import { Tenant } from '@/types';
import { imageUrlToBase64Png } from '@/lib/imageUtils';
import { getSafeLogoUrl } from '@/lib/utils';

const { Title, Text } = Typography;

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const STATUS_OPTIONS = ['active', 'inactive', 'graduated', 'transferred'] as const;

type FormState = {
  name: string; dob: string; gender: string; bloodGroup: string;
  religion: string; nationality: string; rollNo: string;
  admissionDate: string; previousSchool: string; status: string;
  classId: string; sectionId: string;
  address: {
    street: string; city: string; state: string; zip: string; country: string;
  };
  parent: {
    fatherName: string; motherName: string; guardianName: string;
    guardianPhone: string; guardianEmail: string; guardianRelation: string;
  };
  govtId: string;
};


function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
      <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', wordWrap: 'break-word', overflowWrap: 'break-word', lineHeight: 1.4 }}>
        {value || '—'}
      </Text>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</Text>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const EMPTY_FORM: FormState = {
  name: '', dob: '', gender: '', bloodGroup: '', religion: '', nationality: '',
  rollNo: '', admissionDate: '', previousSchool: '', status: 'active',
  classId: '', sectionId: '',
  address: {
    street: '', city: '', state: '', zip: '', country: '',
  },
  parent: {
    fatherName: '', motherName: '', guardianName: '',
    guardianPhone: '', guardianEmail: '', guardianRelation: '',
  },
  govtId: '',
};


export default function StudentProfilePage() {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [passModal, setPassModal] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    try {
      const res = await api.patch<{ data: Student }>(`/students/${id}/status`, { status });
      setStudent(res.data.data);
      populateForm(res.data.data);
      message.success(`Student marked as ${status}`);
    } catch {
      message.error('Failed to update student status');
    } finally {
      setStatusChanging(false);
    }
  };
  const [resolvedLogo, setResolvedLogo] = useState<string>(DEFAULT_LOGO);
  const [logoReady, setLogoReady] = useState(false);
  const [admissionLoading, setAdmissionLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const downloadAdmissionSlip = async () => {
    if (!logoReady || !student) return;
    setAdmissionLoading(true);
    try {
      const blob = await pdf(
        <AdmissionSlipPDF student={student} tenant={tenant} resolvedLogo={resolvedLogo} credentials={{ username: student.admissionNo }} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `admission-slip-${student.admissionNo}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { /* silently ignore */ }
    finally { setAdmissionLoading(false); }
  };

  useEffect(() => {
    Promise.all([
      api.get<{ data: Student }>(`/students/${id}`),
      api.get<{ data: { classes: Class[] } }>('/classes'),
      api.get<{ data: Tenant }>('/tenants/my'),
    ])
      .then(([sRes, cRes, tRes]) => {
        const s = sRes.data.data;
        setStudent(s);
        setClasses(cRes.data.data.classes);
        const t = tRes.data.data;
        setTenant(t);
        imageUrlToBase64Png(getSafeLogoUrl(t?.branding?.logo, DEFAULT_LOGO))
          .then((b64) => { setResolvedLogo(b64); setLogoReady(true); })
          .catch(() => { setResolvedLogo(DEFAULT_LOGO); setLogoReady(true); });
        populateForm(s);
      })
      .catch(() => router.push('/students'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const populateForm = (s: Student) => {
    const cls = typeof s.classId === 'object' ? s.classId : null;
    setForm({
      name: s.name ?? '',
      dob: s.dob ? s.dob.slice(0, 10) : '',
      gender: s.gender ?? '',
      bloodGroup: s.bloodGroup ?? '',
      religion: s.religion ?? '',
      nationality: s.nationality ?? '',
      rollNo: s.rollNo ?? '',
      admissionDate: s.admissionDate ? s.admissionDate.slice(0, 10) : '',
      previousSchool: s.previousSchool ?? '',
      status: s.status ?? 'active',
      classId: cls?._id ?? (typeof s.classId === 'string' ? s.classId : ''),
      sectionId: s.sectionId ?? '',
      address: {
        street: s.address?.street ?? '',
        city: s.address?.city ?? '',
        state: s.address?.state ?? '',
        zip: s.address?.zip ?? '',
        country: s.address?.country ?? '',
      },
      parent: {
        fatherName: s.parent?.fatherName ?? '',
        motherName: s.parent?.motherName ?? '',
        guardianName: s.parent?.guardianName ?? '',
        guardianPhone: s.parent?.guardianPhone ?? '',
        guardianEmail: s.parent?.guardianEmail ?? '',
        guardianRelation: s.parent?.guardianRelation ?? '',
      },
      govtId: s.govtId ?? '',
    });
  };


  const setF = (field: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [field]: v }));

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const fd = new FormData();
      const flatData = flattenObject(form);
      Object.entries(flatData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          fd.append(k, String(v));
        }
      });

      if (photo) fd.append('photo', photo);
      const res = await api.put<{ data: Student }>(`/students/${id}`, fd);
      setStudent(res.data.data);
      populateForm(res.data.data);
      setEditing(false);
      setPhoto(null);
      setPhotoPreview('');
      message.success('Student updated successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update student');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Skeleton active style={{ marginBottom: 16 }} />
        <div className="sp-main-grid">
          <Card><Skeleton active /></Card>
          <Card><Skeleton active /></Card>
        </div>
      </div>
    );
  }
  if (!student) return null;

  const cls = typeof student.classId === 'object' ? student.classId : null;
  const selectedClassData = classes.find((c) => c._id === form.classId);
  const displayPhoto = photoPreview || student.photo || undefined;

  const statusColor: Record<string, string> = {
    active: 'success', inactive: 'default', graduated: 'processing', transferred: 'warning',
  };

  const tabItems = [
    {
      key: 'personal',
      label: 'Personal',
      children: editing ? (
        <div className="sp-form-grid">
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Date of Birth</Text>
            <Input type="date" value={form.dob} onChange={(e) => setF('dob')(e.target.value)} />
          </div>
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Gender</Text>
            <Select style={{ width: '100%' }} value={form.gender || undefined} onChange={setF('gender')}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
          </div>
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Blood Group</Text>
            <Select style={{ width: '100%' }} value={form.bloodGroup || undefined} onChange={setF('bloodGroup')}
              options={BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }))} />
          </div>
          <FieldInput label="Religion" value={form.religion} onChange={setF('religion')} placeholder="Religion" />
          <FieldInput label="Nationality" value={form.nationality} onChange={setF('nationality')} placeholder="Indian" />
          <FieldInput label="Govt ID Proof" value={form.govtId} onChange={setF('govtId')} placeholder="Aadhar / Passport" />
        </div>
      ) : (
        <>
          <InfoRow label="Date of Birth" value={student.dob ? formatDate(student.dob) : undefined} />
          <InfoRow label="Gender" value={student.gender} />
          <InfoRow label="Blood Group" value={student.bloodGroup} />
          <InfoRow label="Religion" value={student.religion} />
          <InfoRow label="Nationality" value={student.nationality} />
          <InfoRow label="Govt ID Proof" value={student.govtId} />
        </>
      ),
    },
    {
      key: 'academic',
      label: 'Academic',
      children: editing ? (
        <div className="sp-form-grid">
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Class</Text>
            <Select style={{ width: '100%' }} value={form.classId || undefined}
              onChange={(v) => setForm((f) => ({ ...f, classId: v, sectionId: '' }))}
              options={classes.map((c) => ({ value: c._id, label: c.name }))} />
          </div>
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Section</Text>
            <Select style={{ width: '100%' }} value={form.sectionId || undefined} onChange={setF('sectionId')}
              options={selectedClassData?.sections.map((s) => ({ value: s.name, label: s.name })) ?? []} />
          </div>
          <FieldInput label="Roll Number" value={form.rollNo} onChange={setF('rollNo')} placeholder="Roll No." />
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Admission Date</Text>
            <Input type="date" value={form.admissionDate} onChange={(e) => setF('admissionDate')(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldInput label="Previous School" value={form.previousSchool} onChange={setF('previousSchool')} placeholder="Previous institution" />
          </div>
        </div>
      ) : (
        <>
          <InfoRow label="Admission No." value={student.admissionNo} />
          <InfoRow label="Roll No." value={student.rollNo} />
          <InfoRow label="Class" value={cls?.name} />
          <InfoRow label="Section" value={student.sectionId} />
          <InfoRow label="Admission Date" value={student.admissionDate ? formatDate(student.admissionDate) : undefined} />
          <InfoRow label="Previous School" value={student.previousSchool} />
          <InfoRow label="Status" value={student.status} />
        </>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      children: editing ? (
        <div className="sp-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldInput label="Street" value={form.address.street} onChange={(v) => setForm(f => ({ ...f, address: { ...f.address, street: v } }))} placeholder="Street address" />
          </div>
          <FieldInput label="City" value={form.address.city} onChange={(v) => setForm(f => ({ ...f, address: { ...f.address, city: v } }))} placeholder="City" />
          <FieldInput label="State" value={form.address.state} onChange={(v) => setForm(f => ({ ...f, address: { ...f.address, state: v } }))} placeholder="State" />
          <FieldInput label="Zip / PIN" value={form.address.zip} onChange={(v) => setForm(f => ({ ...f, address: { ...f.address, zip: v } }))} placeholder="Postal code" />
          <FieldInput label="Country" value={form.address.country} onChange={(v) => setForm(f => ({ ...f, address: { ...f.address, country: v } }))} placeholder="Country" />

        </div>
      ) : (
        <>
          <InfoRow label="Street" value={student.address?.street} />
          <InfoRow label="City" value={student.address?.city} />
          <InfoRow label="State" value={student.address?.state} />
          <InfoRow label="ZIP / PIN" value={student.address?.zip} />
          <InfoRow label="Country" value={student.address?.country} />
        </>
      ),
    },
    {
      key: 'parent',
      label: 'Parent',
      children: editing ? (
        <div className="sp-form-grid">
          <FieldInput label="Father's Name" value={form.parent.fatherName} onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, fatherName: v } }))} placeholder="Father's name" />
          <FieldInput label="Mother's Name" value={form.parent.motherName} onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, motherName: v } }))} placeholder="Mother's name" />
          <FieldInput label="Guardian Name" value={form.parent.guardianName} onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, guardianName: v } }))} placeholder="Guardian name" />
          <div>
            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Relation</Text>
            <Select style={{ width: '100%' }} value={form.parent.guardianRelation || undefined}
              onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, guardianRelation: v } }))}
              options={['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Other'].map((r) => ({ value: r.toLowerCase(), label: r }))} />
          </div>
          <FieldInput label="Guardian Phone" value={form.parent.guardianPhone} onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, guardianPhone: v } }))} placeholder="+91 9876543210" />
          <FieldInput label="Guardian Email" value={form.parent.guardianEmail} onChange={(v) => setForm(f => ({ ...f, parent: { ...f.parent, guardianEmail: v } }))} type="email" placeholder="guardian@email.com" />
        </div>
      ) : (

        <>
          <InfoRow label="Father's Name" value={student.parent?.fatherName} />
          <InfoRow label="Mother's Name" value={student.parent?.motherName} />
          <InfoRow label="Guardian" value={student.parent?.guardianName} />
          <InfoRow label="Relation" value={student.parent?.guardianRelation} />
          <InfoRow label="Phone" value={student.parent?.guardianPhone} />
          <InfoRow label="Email" value={student.parent?.guardianEmail} />
        </>
      ),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      children: <StudentAttendanceView studentId={id} />,
    },
    {
      key: 'fees',
      label: 'Fees',
      children: <StudentFeesView studentId={id} />,
    },
  ];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Top bar */}
      <div className="sp-topbar">
        <div className="sp-topbar-left">
          <Link href="/students"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ margin: 0 }}>{student.name}</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{student.admissionNo}</Text>
          </div>
        </div>
        <div className="sp-topbar-actions">
          {!editing ? (
            <>
              {/* Documents — visible to all roles */}
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    { key: 'marksheet', label: 'Marksheet', icon: <FileTextOutlined />, onClick: () => router.push(`/marksheet/${id}`) },
                    { key: 'certificate', label: 'New Certificate', icon: <SafetyCertificateOutlined />, onClick: () => router.push(`/certificates/new?studentId=${id}`) },
                  ],
                }}
              >
                <Button icon={<FileTextOutlined />} style={{ borderRadius: 8 }}>
                  Documents
                </Button>
              </Dropdown>

              {/* Manage — admin only: admission slip, status, reset password */}
              {(currentUser?.role === 'management' || currentUser?.role === 'saas_admin') && (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'admission',
                        label: admissionLoading ? 'Generating PDF…' : 'Admission Slip',
                        icon: admissionLoading ? <LoadingOutlined /> : <DownloadOutlined />,
                        disabled: !logoReady || admissionLoading,
                        onClick: downloadAdmissionSlip,
                      },
                      { type: 'divider' as const },
                      ...(student.status !== 'active'     ? [{ key: 'activate',  label: 'Activate',             icon: <CheckCircleOutlined />, onClick: () => handleStatusChange('active') }]      : []),
                      ...(student.status === 'active'     ? [{ key: 'deactivate',label: 'Deactivate',           icon: <StopOutlined />,        onClick: () => handleStatusChange('inactive') }]    : []),
                      ...(student.status !== 'graduated'  ? [{ key: 'graduate',  label: 'Mark as Graduated',    icon: <TrophyOutlined />,      onClick: () => handleStatusChange('graduated') }]   : []),
                      ...(student.status !== 'transferred'? [{ key: 'transfer',  label: 'Mark as Transferred',  icon: <SwapOutlined />,        onClick: () => handleStatusChange('transferred') }] : []),
                      { type: 'divider' as const },
                      { key: 'reset-pwd', label: 'Reset Password', icon: <LockOutlined />, onClick: () => setPassModal(true) },
                    ],
                  }}
                >
                  <Button
                    icon={<EllipsisOutlined />}
                    loading={statusChanging}
                    style={{ borderRadius: 8 }}
                  >
                    Manage
                  </Button>
                </Dropdown>
              )}

              {/* Edit — primary CTA */}
              <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)} style={{ borderRadius: 8 }}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button icon={<CloseOutlined />} onClick={() => { if (student) populateForm(student); setEditing(false); setError(''); }} disabled={saving}>Cancel</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ borderRadius: 8 }}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <div className="sp-main-grid">
        {/* Profile Card */}
        <Card style={{ borderRadius: 10, height: 'fit-content', minWidth: 0 }}>
          {/* Desktop: column-centered. Mobile: row (avatar left, info right) */}
          <div className="sp-profile-inner">
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                size={88}
                src={displayPhoto}
                style={{ background: '#eff6ff', color: '#2563eb', fontSize: 28, fontWeight: 700 }}
              >
                {!displayPhoto && getInitials(student.name)}
              </Avatar>
              {editing && (
                <label style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Change</Text>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
                  }} />
                </label>
              )}
            </div>

            <div className="sp-profile-info">
              {editing ? (
                <div>
                  <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Full Name</Text>
                  <Input value={form.name} onChange={(e) => setF('name')(e.target.value)} />
                </div>
              ) : (
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>{student.name}</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>{student.admissionNo}</Text>
                </div>
              )}

              {!editing && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  <Tag color={statusColor[student.status] || 'default'} style={{ textTransform: 'capitalize' }}>{student.status}</Tag>
                  {student.gender && <Tag style={{ textTransform: 'capitalize' }}>{student.gender}</Tag>}
                  {cls && <Tag>{cls.name}</Tag>}
                </div>
              )}

              {editing && (
                <div style={{ marginTop: 8 }}>
                  <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Status</Text>
                  <Select style={{ width: '100%' }} value={form.status} onChange={setF('status')}
                    options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </div>
              )}
            </div>
          </div>

          {!editing && (
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 12, paddingTop: 12 }}>
              <InfoRow label="Roll No." value={student.rollNo} />
              <InfoRow label="Admission" value={student.admissionDate ? formatDate(student.admissionDate) : undefined} />
              <InfoRow label="Blood Group" value={student.bloodGroup} />
              <InfoRow label="Nationality" value={student.nationality} />
            </div>
          )}
        </Card>

        {/* Tabs */}
        <Card style={{ borderRadius: 10, minWidth: 0 }}>
          <Tabs items={tabItems} defaultActiveKey="personal" />
        </Card>
      </div>

      <ResetPasswordModal
        open={passModal}
        onCancel={() => setPassModal(false)}
        userId={id}
        type="students"
      />

      <style>{`
        /* ── Top bar ─────────────────────────────── */
        .sp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .sp-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .sp-topbar-left .ant-typography {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sp-topbar-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        /* ── Main profile grid ───────────────────── */
        .sp-main-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 16px;
        }
        /* Prevent grid children from overflowing their column */
        .sp-main-grid > * {
          min-width: 0;
        }

        /* ── Profile card inner layout ───────────── */
        .sp-profile-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        .sp-profile-info {
          width: 100%;
        }

        /* ── Edit form grids (2-col) ─────────────── */
        .sp-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── Stat summary grids (3-col) ──────────── */
        .sp-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        /* ── Ant Design Tabs: scrollable on narrow screens ── */
        .sp-main-grid .ant-tabs-nav-wrap {
          overflow: hidden;
        }

        /* ── Tablet (≤ 768px) ────────────────────── */
        @media (max-width: 768px) {
          .sp-main-grid {
            grid-template-columns: 1fr;
          }
          /* On tablet+, profile card goes horizontal */
          .sp-profile-inner {
            flex-direction: row;
            align-items: flex-start;
            text-align: left;
          }
        }

        /* ── Mobile (≤ 576px) ────────────────────── */
        @media (max-width: 576px) {
          .sp-topbar-actions {
            width: 100%;
          }
          .sp-form-grid {
            grid-template-columns: 1fr;
          }
          .sp-stat-grid {
            grid-template-columns: 1fr 1fr;
          }
          /* Tighter card body padding */
          .sp-main-grid .ant-card-body {
            padding: 14px 12px;
          }
          /* Compact tab labels */
          .sp-main-grid .ant-tabs-tab {
            padding: 8px 6px;
            font-size: 12px;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

const SM = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtFee = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const FEE_CFG: Record<string, { color: string; bg: string; tagColor: string; label: string }> = {
  paid:           { color: '#16a34a', bg: '#f0fdf4', tagColor: 'success', label: 'Paid' },
  pending:        { color: '#dc2626', bg: '#fef2f2', tagColor: 'error',   label: 'Pending' },
  partially_paid: { color: '#d97706', bg: '#fffbeb', tagColor: 'warning', label: 'Partial' },
};

function StudentFeesView({ studentId }: { studentId: string }) {
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'saas_admin' || user?.role === 'management';

  const fetchSlips = () => {
    setLoading(true);
    api.get(`/finance/fee-slips?studentId=${studentId}`)
      .then((res: any) => setSlips(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlips(); }, [studentId]);

  const patch = async (slipId: string, body: Record<string, unknown>) => {
    setUpdatingId(slipId);
    try {
      await api.patch(`/finance/fee-slips/${slipId}`, body);
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  if (loading && slips.length === 0) return <Skeleton active paragraph={{ rows: 4 }} />;

  if (slips.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>💳</div>
        <Text type="secondary">No fee slips yet. Generate them from Finance → Student Fees.</Text>
      </div>
    );
  }

  const billed   = slips.reduce((s: number, f: any) => s + f.netAmount, 0);
  const collected = slips.filter((f: any) => f.status === 'paid').reduce((s: number, f: any) => s + f.netAmount, 0);
  const outstanding = slips.filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + f.netAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div className="sp-stat-grid">
        {[
          { label: 'Billed',       value: fmtFee(billed),      color: '#6366f1' },
          { label: 'Collected',    value: fmtFee(collected),   color: '#16a34a' },
          { label: 'Outstanding',  value: fmtFee(outstanding), color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '10px 12px', borderRadius: 8,
            background: '#f8fafc', borderLeft: `3px solid ${color}`,
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Slip list */}
      {slips.map((slip: any) => {
        const cfg = FEE_CFG[slip.status] ?? FEE_CFG.pending;
        const overdue = slip.status === 'pending' && new Date(slip.dueDate) < new Date();
        return (
          <div key={slip._id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10,
            border: `1px solid ${overdue ? '#fecaca' : '#e2e8f0'}`,
            background: overdue ? '#fff5f5' : '#fff',
          }}>
            {/* Month badge */}
            <div style={{
              width: 42, height: 42, borderRadius: 8, flexShrink: 0,
              background: cfg.bg, color: cfg.color,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, lineHeight: 1.2,
            }}>
              <span style={{ fontSize: 12 }}>{SM[slip.month]}</span>
              <span style={{ fontSize: 10, fontWeight: 400 }}>{String(slip.year).slice(2)}</span>
            </div>

            {/* Period + due */}
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 13 }}>{SM[slip.month]} {slip.year}</Text>
              <div style={{ fontSize: 11, color: overdue ? '#dc2626' : '#94a3b8' }}>
                Due {formatDate(slip.dueDate)}{overdue ? ' · Overdue' : ''}
              </div>
            </div>

            {/* Amount */}
            <Text strong style={{ fontSize: 14, marginRight: 8 }}>{fmtFee(slip.netAmount)}</Text>

            {/* Action: single button, not a dropdown */}
            {isAdmin ? (
              slip.status !== 'paid' ? (
                <Button
                  size="small" type="primary" ghost
                  loading={updatingId === slip._id}
                  onClick={() => patch(slip._id, { status: 'paid' })}
                  style={{ fontSize: 12 }}
                >
                  Mark Paid
                </Button>
              ) : (
                <Button
                  size="small" danger ghost
                  loading={updatingId === slip._id}
                  onClick={() => patch(slip._id, { status: 'pending' })}
                  style={{ fontSize: 12 }}
                >
                  Undo
                </Button>
              )
            ) : (
              <Tag color={cfg.tagColor} style={{ fontWeight: 600 }}>{cfg.label}</Tag>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  present:  { color: '#16a34a', bg: '#f0fdf4', label: 'Present' },
  absent:   { color: '#dc2626', bg: '#fef2f2', label: 'Absent' },
  late:     { color: '#ca8a04', bg: '#fefce8', label: 'Late' },
  'half-day': { color: '#ea580c', bg: '#fff7ed', label: 'Half Day' },
};

function StudentAttendanceView({ studentId }: { studentId: string }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0]!;
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]!);
  const [data, setData] = useState<{
    attendances: Array<{ date: string; records: Array<{ studentId: string; status: string; note: string }> }>;
    stats: { present: number; absent: number; late: number; halfDay: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const doFetch = (sd: string, ed: string) => {
    setLoading(true);
    api.get<{ data: typeof data }>(`/attendance/student/${studentId}?startDate=${sd}&endDate=${ed}`)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  // Initial load — only setState in async callbacks so no sync setState in effect body
  useEffect(() => {
    api.get<{ data: typeof data }>(`/attendance/student/${studentId}?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = data?.stats;
  const percentage = stats && stats.total > 0
    ? Math.round(((stats.present + stats.late * 0.5) / stats.total) * 100)
    : 0;

  const dailyRows = (data?.attendances ?? []).map((att) => {
    const rec = att.records.find((r) => {
      const sid = typeof r.studentId === 'object' ? (r.studentId as unknown as { _id: string })._id : r.studentId;
      return sid === studentId;
    });
    return rec ? { date: att.date, status: rec.status, note: rec.note } : null;
  }).filter(Boolean) as Array<{ date: string; status: string; note: string }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Date range filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
          <Text style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>From</Text>
          <Input type="date" size="small" value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%' }} />
        </div>
        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
          <Text style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>To</Text>
          <Input type="date" size="small" value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '100%' }} />
        </div>
        <Button size="small" type="primary" loading={loading}
          onClick={() => doFetch(startDate, endDate)}
          style={{ borderRadius: 6, flexShrink: 0 }}>
          Apply
        </Button>
      </div>

      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : !stats || stats.total === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
          <Text type="secondary">No attendance records found for this period.</Text>
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div className="sp-stat-grid">
            {[
              { label: 'Attendance', value: `${percentage}%`, color: percentage >= 75 ? '#16a34a' : '#dc2626' },
              { label: 'Days Present', value: stats.present, color: '#16a34a' },
              { label: 'Days Absent', value: stats.absent, color: '#dc2626' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '10px 12px', borderRadius: 8, background: '#f8fafc',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="sp-stat-grid">
            {[
              { label: 'Late', value: stats.late, color: '#ca8a04' },
              { label: 'Half Day', value: stats.halfDay, color: '#ea580c' },
              { label: 'Total Days', value: stats.total, color: '#6366f1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '10px 12px', borderRadius: 8, background: '#f8fafc',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Per-day history */}
          {dailyRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text strong style={{ fontSize: 13 }}>Daily Record</Text>
              {dailyRows.map(({ date, status, note }) => {
                const cfg = STATUS_CFG[status] ?? STATUS_CFG.present!;
                return (
                  <div key={date} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fff',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                      background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11,
                    }}>
                      {cfg.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 13 }}>{formatDate(date)}</Text>
                      {note && <div style={{ fontSize: 11, color: '#94a3b8' }}>{note}</div>}
                    </div>
                    <Tag color={status === 'present' ? 'success' : status === 'absent' ? 'error' : status === 'late' ? 'warning' : 'orange'}
                      style={{ fontWeight: 600 }}>
                      {cfg.label}
                    </Tag>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
