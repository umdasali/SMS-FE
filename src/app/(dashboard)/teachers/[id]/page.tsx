'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Teacher, Class, Subject } from '@/types';
import {
  Button, Input, Card, Tag, Avatar, Alert, Typography, Divider, Modal, Skeleton, Space, Select, App,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, SaveOutlined, UserOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined, BookOutlined, DeleteOutlined, LockOutlined,
  DollarOutlined, IdcardOutlined, SafetyOutlined, TeamOutlined,
  StopOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { Tabs } from 'antd';
import { getInitials, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';

const { Title, Text } = Typography;

export default function TeacherProfilePage() {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Teacher>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const { user: currentUser } = useAuth();

  // Assignment state
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Teacher }>(`/teachers/${id}`),
      api.get<{ data: { classes: Class[] } }>('/classes'),
      api.get<{ data: { subjects: Subject[] } }>('/subjects'),
    ]).then(([tRes, cRes, sRes]) => {
      const t = tRes.data.data;
      setTeacher(t);
      setForm(t);
      setAvailableClasses(cRes.data.data.classes ?? []);
      setAvailableSubjects(sRes.data.data.subjects ?? []);
      setSelectedClassIds(
        (t.classIds ?? []).map((c) => (typeof c === 'object' ? c._id : c))
      );
      setSelectedSubjectIds(
        (t.subjectIds ?? []).map((s) => (typeof s === 'object' ? s._id : s))
      );
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      const { _id, tenantId, userId, createdAt, classIds, subjectIds, ...rest } = form;
      void _id; void tenantId; void userId; void createdAt; void classIds; void subjectIds;

      Object.entries(rest).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'string') formData.append(k, v);
        else if (typeof v === 'number') formData.append(k, String(v));
        else if (Array.isArray(v)) {
          v.forEach((item) => {
            const val = typeof item === 'object' && item !== null ? (item as { _id: string })._id : String(item);
            if (val) formData.append(k, val);
          });
        }
      });

      if (photo) formData.append('photo', photo);
      const res = await api.put<{ data: Teacher }>(`/teachers/${id}`, formData);
      setTeacher(res.data.data);
      setEditing(false);
      setPhoto(null);
      setPhotoPreview('');
      message.success('Teacher updated successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update teacher');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    try {
      const res = await api.patch<{ data: Teacher }>(`/teachers/${id}/status`, { status });
      setTeacher(res.data.data);
      message.success(`Teacher marked as ${status}`);
    } catch {
      message.error('Failed to update teacher status');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleSaveAssignments = async () => {
    setSavingAssignments(true); setAssignmentError('');
    try {
      // Send JSON so empty arrays are transmitted correctly (FormData cannot represent [])
      const res = await api.put<{ data: Teacher }>(`/teachers/${id}`, {
        classIds: selectedClassIds,
        subjectIds: selectedSubjectIds,
      });
      const updated = res.data.data;
      setTeacher((prev) => prev ? { ...prev, classIds: updated.classIds, subjectIds: updated.subjectIds } : prev);
      setSelectedClassIds(
        (updated.classIds ?? []).map((c) => (typeof c === 'object' ? c._id : c))
      );
      setSelectedSubjectIds(
        (updated.subjectIds ?? []).map((s) => (typeof s === 'object' ? s._id : s))
      );
      message.success('Assignments saved successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAssignmentError(msg || 'Failed to save assignments');
    } finally { setSavingAssignments(false); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Skeleton active style={{ marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <Card><Skeleton active /></Card>
          <Card><Skeleton active /></Card>
        </div>
      </div>
    );
  }

  if (!teacher) return <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>Teacher not found.</div>;

  const setField = (field: keyof Teacher) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const assignedClassNames = (teacher.classIds ?? []).map((c) =>
    typeof c === 'object' ? c.name : (availableClasses.find((ac) => ac._id === c)?.name ?? c)
  );
  const assignedSubjectNames = (teacher.subjectIds ?? []).map((s) =>
    typeof s === 'object' ? s.name : (availableSubjects.find((as) => as._id === s)?.name ?? s)
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/teachers"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined /> Teacher Profile
          </Title>
          <Text type="secondary">{teacher.employeeId}</Text>
        </div>
        {editing ? (
          <Space>
            <Button onClick={() => { setEditing(false); setForm(teacher); }}>Cancel</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ borderRadius: 8 }}>
              Save Changes
            </Button>
          </Space>
        ) : (
          <Space>
            {(currentUser?.role === 'management' || currentUser?.role === 'saas_admin') && (
              <>
                <Button
                  icon={teacher.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                  loading={statusChanging}
                  onClick={() => handleStatusChange(teacher.status === 'active' ? 'inactive' : 'active')}
                  style={{ borderRadius: 8 }}
                  danger={teacher.status === 'active'}
                >
                  {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => setPassModal(true)}
                  style={{ borderRadius: 8 }}
                >
                  Reset Password
                </Button>
              </>
            )}
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)} style={{ borderRadius: 8 }}>Edit</Button>
          </Space>
        )}
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Avatar Card */}
        <Card style={{ borderRadius: 10, height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={100}
              src={photoPreview || teacher.photo || undefined}
              style={{ background: '#dcfce7', color: '#16a34a', fontSize: 32, fontWeight: 700 }}
            >
              {!(photoPreview || teacher.photo) && getInitials(teacher.name)}
            </Avatar>
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16, display: 'block' }}>{teacher.name}</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>{teacher.designation || 'Teacher'}</Text>
              <div style={{ marginTop: 6 }}>
                <Tag color={teacher.status === 'active' ? 'success' : 'error'} style={{ textTransform: 'capitalize' }}>
                  {teacher.status}
                </Tag>
              </div>
            </div>

            {editing && (
              <div style={{ width: '100%' }}>
                <Text style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Change Photo</Text>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: 12, width: '100%' }} />
              </div>
            )}

            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#8c8c8c' }}>
                <MailOutlined /><Text type="secondary" style={{ fontSize: 13 }}>{teacher.email}</Text>
              </div>
              {teacher.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#8c8c8c' }}>
                  <PhoneOutlined /><Text type="secondary" style={{ fontSize: 13 }}>{teacher.phone}</Text>
                </div>
              )}
              {teacher.joinDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8c8c8c' }}>
                  <CalendarOutlined /><Text type="secondary" style={{ fontSize: 13 }}>Joined {formatDate(teacher.joinDate)}</Text>
                </div>
              )}
            </div>

            {/* Classes */}
            {assignedClassNames.length > 0 && (
              <div style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <TeamOutlined /> Classes
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {assignedClassNames.map((name, i) => (
                    <Tag key={i} color="blue" style={{ fontSize: 11 }}>{name}</Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Subjects */}
            {assignedSubjectNames.length > 0 && (
              <div style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <BookOutlined /> Subjects
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {assignedSubjectNames.map((name, i) => (
                    <Tag key={i} color="purple" style={{ fontSize: 11 }}>{name}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs Column */}
        <div>
          <Card style={{ borderRadius: 10 }}>
            <Tabs defaultActiveKey="details" items={[
              {
                key: 'details',
                label: 'Professional Details',
                icon: <SafetyOutlined />,
                children: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {editing ? (
                      <>
                        {([
                          { label: 'Full Name', field: 'name' },
                          { label: 'Designation', field: 'designation' },
                          { label: 'Qualification', field: 'qualification' },
                          { label: 'Specialization', field: 'specialization' },
                          { label: 'Phone', field: 'phone' },
                        ] as { label: string; field: keyof Teacher }[]).map(({ label, field }) => (
                          <div key={field}>
                            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</Text>
                            <Input value={(form[field] as string) || ''} onChange={setField(field)} />
                          </div>
                        ))}
                        <div>
                          <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Experience (years)</Text>
                          <Input type="number" value={form.experience || ''} onChange={(e) => setForm((f) => ({ ...f, experience: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Join Date</Text>
                          <Input type="date" value={form.joinDate?.split('T')[0] || ''} onChange={setField('joinDate')} />
                        </div>
                        <div>
                          <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Date of Birth</Text>
                          <Input type="date" value={form.dob?.split('T')[0] || ''} onChange={setField('dob')} />
                        </div>
                        <div>
                          <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Govt ID Proof</Text>
                          <Input value={form.govtId || ''} onChange={setField('govtId')} placeholder="Aadhar / Passport" />
                        </div>
                        <div>
                          <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>PAN Card</Text>
                          <Input value={form.panCard || ''} onChange={setField('panCard')} placeholder="PAN Number" />
                        </div>
                        {(currentUser?.role === 'management' || currentUser?.role === 'saas_admin') && (
                          <div>
                            <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Monthly Salary</Text>
                            <Input type="number" value={form.salary || ''} onChange={(e) => setForm((f) => ({ ...f, salary: Number(e.target.value) }))} placeholder="Base Salary" />
                          </div>
                        )}
                      </>
                    ) : (
                      [
                        { label: 'Full Name', value: teacher.name },
                        { label: 'Designation', value: teacher.designation || '—' },
                        { label: 'Qualification', value: teacher.qualification || '—' },
                        { label: 'Specialization', value: teacher.specialization || '—' },
                        { label: 'Experience', value: teacher.experience ? `${teacher.experience} years` : '—' },
                        { label: 'Phone', value: teacher.phone || '—' },
                        { label: 'Join Date', value: teacher.joinDate ? formatDate(teacher.joinDate) : '—' },
                        { label: 'Date of Birth', value: teacher.dob ? formatDate(teacher.dob) : '—' },
                        { label: 'Govt ID Proof', value: teacher.govtId || '—' },
                        { label: 'PAN Card', value: teacher.panCard || '—' },
                        ...(currentUser?.role === 'management' || currentUser?.role === 'saas_admin' ? [
                          { label: 'Salary (Monthly)', value: teacher.salary ? `INR ${teacher.salary.toLocaleString()}` : '—' }
                        ] : []),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{label}</Text>
                          <Text strong style={{ fontSize: 13 }}>{value}</Text>
                        </div>
                      ))
                    )}
                  </div>
                )
              },
              {
                key: 'assignments',
                label: 'Assignments',
                icon: <BookOutlined />,
                children: (
                  <div>
                    {assignmentError && (
                      <Alert message={assignmentError} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <Text style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        <TeamOutlined style={{ marginRight: 6 }} />Assigned Classes
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Select the classes this teacher is responsible for.
                      </Text>
                      <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select classes..."
                        value={selectedClassIds}
                        onChange={setSelectedClassIds}
                        optionFilterProp="label"
                        options={availableClasses.map((c) => ({ value: c._id, label: c.name }))}
                      />
                    </div>

                    <Divider style={{ margin: '0 0 20px' }} />

                    <div style={{ marginBottom: 20 }}>
                      <Text style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        <BookOutlined style={{ marginRight: 6 }} />Assigned Subjects
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Select the subjects this teacher teaches.
                      </Text>
                      <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select subjects..."
                        value={selectedSubjectIds}
                        onChange={setSelectedSubjectIds}
                        optionFilterProp="label"
                        options={availableSubjects.map((s) => ({
                          value: s._id,
                          label: `${s.name}${typeof s.classId === 'object' && s.classId ? ` (${s.classId.name})` : ''}`,
                        }))}
                      />
                    </div>

                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingAssignments}
                      onClick={handleSaveAssignments}
                      style={{ borderRadius: 8 }}
                    >
                      Save Assignments
                    </Button>
                  </div>
                )
              },
              {
                key: 'payroll',
                label: 'Payroll',
                icon: <DollarOutlined />,
                children: <TeacherPayrollView teacherId={id} />
              }
            ]} />
          </Card>

          <div style={{ marginTop: 16 }}>
            <Button danger icon={<DeleteOutlined />} size="small" onClick={() => setDeleteOpen(true)} style={{ borderRadius: 8 }}>
              Delete Teacher
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="Delete Teacher?"
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onOk={async () => {
          setDeleting(true);
          try { await api.delete(`/teachers/${id}`); router.push('/teachers'); }
          finally { setDeleting(false); setDeleteOpen(false); }
        }}
        okText="Delete Teacher"
        okButtonProps={{ danger: true, loading: deleting }}
      >
        This will permanently remove this teacher and all associated data. This action cannot be undone.
      </Modal>

      <ResetPasswordModal
        open={passModal}
        onCancel={() => setPassModal(false)}
        userId={id}
        type="teachers"
      />
    </div>
  );
}

const SM_PAY = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtPay = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function TeacherPayrollView({ teacherId }: { teacherId: string }) {
  const [slips, setSlips] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'saas_admin' || user?.role === 'management';

  const fetchSlips = () => {
    setLoading(true);
    api.get(`/finance/payslips?teacherId=${teacherId}`)
      .then((res: { data: { data: Record<string, unknown>[] } }) => setSlips(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlips(); }, [teacherId]);

  const patch = async (slipId: string, body: Record<string, unknown>) => {
    setUpdatingId(slipId);
    try {
      await api.patch(`/finance/payslips/${slipId}`, body);
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  if (loading && slips.length === 0) return <Skeleton active paragraph={{ rows: 4 }} />;

  if (slips.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
        <Text type="secondary">No payslips yet. Run payroll from Finance → Teacher Payroll.</Text>
      </div>
    );
  }

  const totalNet     = slips.reduce((s, p) => s + (p.netSalary as number), 0);
  const totalPaid    = slips.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.netSalary as number), 0);
  const totalPending = slips.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.netSalary as number), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Total',      value: fmtPay(totalNet),     color: '#6366f1' },
          { label: 'Disbursed',  value: fmtPay(totalPaid),    color: '#16a34a' },
          { label: 'Pending',    value: fmtPay(totalPending), color: '#dc2626' },
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

      {/* Payslip list */}
      {slips.map((slip) => {
        const isPaid = slip.status === 'paid';
        return (
          <div key={slip._id as string} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 8, flexShrink: 0,
              background: isPaid ? '#f0fdf4' : '#fffbeb',
              color: isPaid ? '#16a34a' : '#d97706',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, lineHeight: 1.2,
            }}>
              <span style={{ fontSize: 12 }}>{SM_PAY[slip.month as number]}</span>
              <span style={{ fontSize: 10, fontWeight: 400 }}>{String(slip.year).slice(2)}</span>
            </div>

            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 13 }}>{SM_PAY[slip.month as number]} {slip.year as number}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                Base {fmtPay(slip.baseSalary as number)}
                {(slip.allowances as number) > 0 && <span style={{ color: '#16a34a' }}> +{fmtPay(slip.allowances as number)}</span>}
                {(slip.deductions as number) > 0 && <span style={{ color: '#dc2626' }}> −{fmtPay(slip.deductions as number)}</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <Text strong style={{ fontSize: 14 }}>{fmtPay(slip.netSalary as number)}</Text>
              {Boolean(slip.paymentDate) && (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(String(slip.paymentDate))}</div>
              )}
            </div>

            {isAdmin ? (
              isPaid ? (
                <Button
                  size="small" danger ghost
                  loading={updatingId === slip._id}
                  onClick={() => patch(slip._id as string, { status: 'pending' })}
                  style={{ fontSize: 12, minWidth: 60 }}
                >
                  Undo
                </Button>
              ) : (
                <Button
                  size="small" type="primary" ghost
                  loading={updatingId === slip._id}
                  onClick={() => patch(slip._id as string, { status: 'paid' })}
                  style={{ fontSize: 12, minWidth: 84 }}
                >
                  Mark Paid
                </Button>
              )
            ) : (
              <Tag color={isPaid ? 'success' : 'warning'} style={{ fontWeight: 600 }}>
                {isPaid ? 'Paid' : 'Pending'}
              </Tag>
            )}
          </div>
        );
      })}
    </div>
  );
}
