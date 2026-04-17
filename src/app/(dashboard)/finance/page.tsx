/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card, Typography, Button, Tag, Select, Skeleton, Modal, App,
  Form, Input, InputNumber, Table, Tooltip, Alert, Progress, Tabs,
} from 'antd';
import {
  PlayCircleOutlined, SettingOutlined, DollarOutlined, TeamOutlined,
  CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined,
  BankOutlined, ReloadOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { FeeSlip, Payslip, FeeStructure, Class, Student, Teacher, Tenant } from '@/types';
import { formatDate } from '@/lib/utils';
import { FeeSlipPDF, PayslipPDF } from '@/components/pdf/FinancePDFs';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';

const { Title, Text } = Typography;
const { Option } = Select;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable stat card
// ─────────────────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      padding: '14px 18px',
      borderRadius: 10,
      borderLeft: `4px solid ${color}`,
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{value}</div>
      {sub && <Text type="secondary" style={{ fontSize: 11 }}>{sub}</Text>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Month / Year picker (simple selects — no DatePicker dependency issues)
// ─────────────────────────────────────────────────────────────────────────────
function MonthYearPicker({
  value, onChange,
}: {
  value: { month: number; year: number };
  onChange: (v: { month: number; year: number }) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Select
        value={value.month}
        onChange={m => onChange({ ...value, month: m })}
        style={{ width: 130 }}
      >
        {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
      </Select>
      <Select
        value={value.year}
        onChange={y => onChange({ ...value, year: y })}
        style={{ width: 100 }}
      >
        {years.map(y => <Option key={y} value={y}>{y}</Option>)}
      </Select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEE STRUCTURES PANEL
// ─────────────────────────────────────────────────────────────────────────────
function FeeStructuresPanel({ classes }: { classes: Class[] }) {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const currentYear = new Date().getFullYear();
  const defaultYear = `${currentYear}-${currentYear + 1}`;

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/finance/fee-structures')
      .then(r => setStructures(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s: FeeStructure) => {
    setEditing(s);
    setModalOpen(true);
  };

  const onDelete = async (id: string) => {
    await api.delete(`/finance/fee-structures/${id}`);
    fetch();
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      await api.post('/finance/fee-structures', values);
      setModalOpen(false);
      fetch();
    } finally { setSaving(false); }
  };

  const cols = [
    {
      title: 'Class',
      render: (_: unknown, s: FeeStructure) => (
        <Text strong>{(s.classId as any).name ?? '—'}</Text>
      ),
    },
    {
      title: 'Academic Year',
      dataIndex: 'academicYear',
    },
    {
      title: 'Monthly Fee',
      render: (_: unknown, s: FeeStructure) => <Text strong>{fmt(s.monthlyFee)}</Text>,
    },
    {
      title: 'Due Day',
      render: (_: unknown, s: FeeStructure) => <Text>{s.dueDay}th of month</Text>,
    },
    {
      title: 'Late Fine / day',
      render: (_: unknown, s: FeeStructure) => s.lateFinePerDay > 0 ? fmt(s.lateFinePerDay) : <Text type="secondary">None</Text>,
    },
    {
      title: '',
      width: 80,
      render: (_: unknown, s: FeeStructure) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(s)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(s._id)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Text strong style={{ fontSize: 15 }}>Fee Structures</Text>
          <div style={{ fontSize: 13, color: '#64748b' }}>Define the monthly fee for each class. Set once — generate forever.</div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Structure</Button>
      </div>

      {loading ? <Skeleton active paragraph={{ rows: 4 }} /> : (
        structures.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            border: '2px dashed #e2e8f0', borderRadius: 12,
            color: '#94a3b8',
          }}>
            <SettingOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No fee structures yet</div>
            <div style={{ fontSize: 13 }}>Add a structure per class to enable one-click monthly fee generation.</div>
          </div>
        ) : (
          <Table
            dataSource={structures}
            columns={cols}
            rowKey="_id"
            pagination={false}
            size="middle"
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        )
      )}

      <Modal
        title={editing ? 'Edit Fee Structure' : 'Add Fee Structure'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={480}
        afterOpenChange={(open) => {
          if (!open) return;
          if (editing) {
            form.setFieldsValue({
              classId: (editing.classId as { _id: string } & typeof editing.classId)._id ?? editing.classId,
              academicYear: editing.academicYear,
              monthlyFee: editing.monthlyFee,
              admissionFee: editing.admissionFee,
              examFee: editing.examFee,
              lateFinePerDay: editing.lateFinePerDay,
              dueDay: editing.dueDay,
              remarks: editing.remarks,
            });
          } else {
            form.resetFields();
            form.setFieldsValue({ academicYear: defaultYear, dueDay: 10, monthlyFee: 0, admissionFee: 0, examFee: 0, lateFinePerDay: 0 });
          }
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="classId" label="Class" rules={[{ required: true }]} style={{ gridColumn: '1/-1' }}>
              <Select placeholder="Select class" disabled={!!editing}>
                {classes.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="academicYear" label="Academic Year" rules={[{ required: true }]} style={{ gridColumn: '1/-1' }}>
              <Input placeholder="e.g. 2024-2025" />
            </Form.Item>
            <Form.Item name="monthlyFee" label="Monthly Fee (₹)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="dueDay" label="Due Day of Month" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={28} />
            </Form.Item>
            <Form.Item name="admissionFee" label="Admission Fee (₹)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="lateFinePerDay" label="Late Fine / Day (₹)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block size="large">
            Save Structure
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEE SLIPS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function FeeSlipsPanel({ classes, tenant }: { classes: Class[]; tenant: Tenant | null }) {
  const { modal } = App.useApp();
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [academicYear, setAcademicYear] = useState(`${now.getFullYear()}-${now.getFullYear() + 1}`);
  const [slips, setSlips] = useState<FeeSlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSlips = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('month', String(period.month));
    params.set('year', String(period.year));
    if (filterStatus) params.set('status', filterStatus);
    if (filterClass) params.set('classId', filterClass);
    api.get(`/finance/fee-slips?${params}`)
      .then(r => setSlips(r.data.data))
      .finally(() => setLoading(false));
  }, [period, filterStatus, filterClass]);

  useEffect(() => { fetchSlips(); }, [fetchSlips]);

  const handleGenerate = async () => {
    setGenerating(true); setResult(null);
    try {
      const r = await api.post('/finance/generate-monthly-fees', {
        month: period.month,
        year: period.year,
        academicYear,
      });
      setResult(r.data.data);
      fetchSlips();
    } catch (err: any) {
      setResult(null);
      modal.error({ title: 'Generation failed', content: err?.response?.data?.message || 'Unknown error' });
    } finally { setGenerating(false); }
  };

  const markPaid = async (slip: FeeSlip) => {
    setUpdatingId(slip._id);
    try {
      await api.patch(`/finance/fee-slips/${slip._id}`, { status: 'paid' });
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  const markPending = async (slip: FeeSlip) => {
    setUpdatingId(slip._id);
    try {
      await api.patch(`/finance/fee-slips/${slip._id}`, { status: 'pending', paymentDate: null });
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  // Stats
  const total = slips.reduce((s, f) => s + f.netAmount, 0);
  const collected = slips.filter(f => f.status === 'paid').reduce((s, f) => s + f.netAmount, 0);
  const pending = slips.filter(f => f.status === 'pending').reduce((s, f) => s + f.netAmount, 0);
  const rate = total > 0 ? Math.round((collected / total) * 100) : 0;

  const STATUS_CFG: Record<string, { color: string; label: string }> = {
    paid: { color: 'success', label: 'Paid' },
    pending: { color: 'error', label: 'Pending' },
    partially_paid: { color: 'warning', label: 'Partial' },
  };

  const cols = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, slip: FeeSlip) => {
        const s = slip.studentId as Student;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>
              {s.name?.[0] ?? '?'}
            </div>
            <div>
              <Text strong style={{ fontSize: 13 }}>{s.name}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.admissionNo}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Class',
      render: (_: unknown, slip: FeeSlip) => (slip.classId as Class)?.name ?? '—',
    },
    {
      title: 'Amount',
      render: (_: unknown, slip: FeeSlip) => (
        <Text strong style={{ fontSize: 14 }}>{fmt(slip.netAmount)}</Text>
      ),
    },
    {
      title: 'Due',
      render: (_: unknown, slip: FeeSlip) => {
        const overdue = slip.status !== 'paid' && new Date(slip.dueDate) < new Date();
        return (
          <Text style={{ color: overdue ? '#dc2626' : 'inherit', fontSize: 13 }}>
            {formatDate(slip.dueDate)}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      render: (_: unknown, slip: FeeSlip) => (
        <Tag color={STATUS_CFG[slip.status]?.color}>
          {STATUS_CFG[slip.status]?.label ?? slip.status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      width: 140,
      render: (_: unknown, slip: FeeSlip) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {slip.status !== 'paid' ? (
            <Button
              size="small" type="primary" ghost
              loading={updatingId === slip._id}
              onClick={() => markPaid(slip)}
              style={{ fontSize: 12, minWidth: 82 }}
            >
              Mark Paid
            </Button>
          ) : (
            <Button
              size="small" danger ghost
              loading={updatingId === slip._id}
              onClick={() => markPending(slip)}
              style={{ fontSize: 12, minWidth: 82 }}
            >
              Undo
            </Button>
          )}
          <Tooltip title="Download PDF">
            <PDFDownloadButton
              document={<FeeSlipPDF student={slip.studentId as Student} slip={slip} tenant={tenant} />}
              fileName={`fee-${(slip.studentId as Student).admissionNo}-${slip.month}-${slip.year}.pdf`}
              buttonText=""
              icon={<FileTextOutlined />}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Period selector + generate button ── */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
              GENERATE FEES FOR
            </Text>
            <MonthYearPicker value={period} onChange={setPeriod} />
          </div>
          <div>
            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
              ACADEMIC YEAR
            </Text>
            <Input
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              placeholder="2024-2025"
              style={{ width: 130 }}
            />
          </div>
          <div style={{ paddingTop: 20 }}>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              loading={generating}
              onClick={handleGenerate}
              style={{ fontWeight: 600 }}
            >
              Generate {MONTHS[period.month - 1]} {period.year} Fees
            </Button>
          </div>
          {result && (
            <Alert
              type={result.created > 0 ? 'success' : 'info'}
              title={`${result.created} slips created · ${result.skipped} already existed`}
              showIcon
              closable
              onClose={() => setResult(null)}
              style={{ flex: 1, borderRadius: 8 }}
            />
          )}
        </div>
      </Card>

      {/* ── KPI strip ── */}
      {slips.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <KPI label="Total Billed" value={fmt(total)} color="#6366f1" sub={`${slips.length} students`} />
            <KPI label="Collected" value={fmt(collected)} color="#16a34a" sub={`${slips.filter(f => f.status === 'paid').length} paid`} />
            <KPI label="Outstanding" value={fmt(pending)} color="#dc2626" sub={`${slips.filter(f => f.status === 'pending').length} unpaid`} />
          </div>
          <Card size="small" style={{ borderRadius: 10 }} styles={{ body: { padding: '10px 16px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#64748b', minWidth: 110 }}>Collection Rate</Text>
              <Progress
                percent={rate}
                strokeColor={rate >= 80 ? '#16a34a' : rate >= 50 ? '#f59e0b' : '#dc2626'}
                style={{ flex: 1, marginBottom: 0 }}
                format={p => <Text strong>{p}%</Text>}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Filters + table ── */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14, marginRight: 4 }}>
            {MONTHS[period.month - 1]} {period.year} — Fee Slips
          </Text>
          <div style={{ flex: 1 }} />
          <Select
            allowClear placeholder="All classes"
            style={{ width: 140 }}
            onChange={v => setFilterClass(v ?? '')}
          >
            {classes.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
          </Select>
          <Select
            allowClear placeholder="All statuses"
            style={{ width: 130 }}
            onChange={v => setFilterStatus(v ?? '')}
          >
            <Option value="pending">Pending</Option>
            <Option value="partially_paid">Partial</Option>
            <Option value="paid">Paid</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchSlips} />
        </div>

        <Table
          dataSource={slips}
          columns={cols}
          rowKey="_id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', color: '#94a3b8' }}>
                <DollarOutlined style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                No fee slips for this period. Click &quot;Generate&quot; above to create them.
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL PANEL
// ─────────────────────────────────────────────────────────────────────────────
// ── Adjust Modal — own component so useForm + Form always mount together ──────
function AdjustModal({
  slip, onClose, onSaved,
}: {
  slip: Payslip | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Sync form values whenever slip changes
  useEffect(() => {
    if (slip) {
      form.setFieldsValue({
        allowances: slip.allowances,
        deductions: slip.deductions,
        remarks: slip.remarks,
      });
    }
  }, [slip, form]);

  const onFinish = async (values: any) => {
    if (!slip) return;
    setSaving(true);
    try {
      await api.patch(`/finance/payslips/${slip._id}`, values);
      onClose();
      onSaved();
    } finally { setSaving(false); }
  };

  const teacher = slip?.teacherId as Teacher | undefined;

  return (
    <Modal
      title={`Adjust — ${teacher?.name ?? ''}`}
      open={!!slip}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={460}
    >
      {slip && (
        <>
          <div style={{
            background: '#f8fafc', borderRadius: 8, padding: '12px 16px',
            marginBottom: 16, display: 'flex', justifyContent: 'space-between',
          }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Base Salary</Text>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(slip.baseSalary)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Current Net</Text>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(slip.netSalary)}</div>
            </div>
          </div>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="allowances" label="Allowances (₹)" style={{ marginBottom: 12 }}>
                <InputNumber style={{ width: '100%', minWidth: 160 }} min={0} precision={0} controls />
              </Form.Item>
              <Form.Item name="deductions" label="Deductions (₹)" style={{ marginBottom: 12 }}>
                <InputNumber style={{ width: '100%', minWidth: 160 }} min={0} precision={0} controls />
              </Form.Item>
            </div>
            <Form.Item name="remarks" label="Remarks" style={{ marginBottom: 16 }}>
              <Input.TextArea rows={2} style={{ resize: 'none' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} block size="large">
              Save Adjustments
            </Button>
          </Form>
        </>
      )}
    </Modal>
  );
}

function PayrollPanel({ tenant }: { tenant: Tenant | null }) {
  const { modal } = App.useApp();
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adjustSlip, setAdjustSlip] = useState<Payslip | null>(null);

  const fetchSlips = useCallback(() => {
    setLoading(true);
    api.get(`/finance/payslips?month=${period.month}&year=${period.year}`)
      .then(r => setSlips(r.data.data))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { fetchSlips(); }, [fetchSlips]);

  const handleRunPayroll = async () => {
    setRunning(true); setResult(null);
    try {
      const r = await api.post('/finance/run-monthly-payroll', { month: period.month, year: period.year });
      setResult(r.data.data);
      fetchSlips();
    } catch (err: any) {
      modal.error({ title: 'Payroll failed', content: err?.response?.data?.message || 'Unknown error' });
    } finally { setRunning(false); }
  };

  const markPaid = async (slip: Payslip) => {
    setUpdatingId(slip._id);
    try {
      await api.patch(`/finance/payslips/${slip._id}`, { status: 'paid' });
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  const markPending = async (slip: Payslip) => {
    setUpdatingId(slip._id);
    try {
      await api.patch(`/finance/payslips/${slip._id}`, { status: 'pending' });
      fetchSlips();
    } finally { setUpdatingId(null); }
  };

  // Stats
  const total = slips.reduce((s, p) => s + p.netSalary, 0);
  const paid = slips.filter(p => p.status === 'paid').reduce((s, p) => s + p.netSalary, 0);
  const pending = slips.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);
  const rate = total > 0 ? Math.round((paid / total) * 100) : 0;

  const cols = [
    {
      title: 'Employee',
      key: 'teacher',
      render: (_: unknown, slip: Payslip) => {
        const t = slip.teacherId as Teacher;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#f0fdf4', color: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>
              {t.name?.[0] ?? '?'}
            </div>
            <div>
              <Text strong style={{ fontSize: 13 }}>{t.name}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.employeeId} · {t.designation ?? 'Teacher'}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Salary Breakdown',
      render: (_: unknown, slip: Payslip) => (
        <div style={{ fontSize: 12, lineHeight: 1.8 }}>
          <span style={{ color: '#64748b' }}>Base </span><Text>{fmt(slip.baseSalary)}</Text>
          {slip.allowances > 0 && <span style={{ color: '#16a34a' }}> +{fmt(slip.allowances)}</span>}
          {slip.deductions > 0 && <span style={{ color: '#dc2626' }}> −{fmt(slip.deductions)}</span>}
        </div>
      ),
    },
    {
      title: 'Net Salary',
      render: (_: unknown, slip: Payslip) => (
        <Text strong style={{ fontSize: 15 }}>{fmt(slip.netSalary)}</Text>
      ),
    },
    {
      title: 'Status',
      render: (_: unknown, slip: Payslip) => (
        <Tag color={slip.status === 'paid' ? 'success' : 'warning'}>
          {slip.status === 'paid' ? 'Paid' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      width: 180,
      render: (_: unknown, slip: Payslip) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {slip.status !== 'paid' ? (
            <Button
              size="small" type="primary" ghost
              loading={updatingId === slip._id}
              onClick={() => markPaid(slip)}
              style={{ fontSize: 12, minWidth: 82 }}
            >
              Mark Paid
            </Button>
          ) : (
            <Button
              size="small" danger ghost
              loading={updatingId === slip._id}
              onClick={() => markPending(slip)}
              style={{ fontSize: 12, minWidth: 82 }}
            >
              Undo
            </Button>
          )}
          <Tooltip title="Adjust (allowances / deductions)">
            <Button size="small" style={{ fontSize: 12, minWidth: 42 }} icon={<EditOutlined />} onClick={() => setAdjustSlip(slip)} />
          </Tooltip>
          {slip.status === 'paid' && <Tooltip title="Download PDF">
            <PDFDownloadButton
              document={<PayslipPDF teacher={slip.teacherId as Teacher} slip={slip} tenant={tenant} />}
              fileName={`payslip-${(slip.teacherId as Teacher).employeeId}-${slip.month}-${slip.year}.pdf`}
              buttonText="DOC"
              icon={<FileTextOutlined />}
            />
          </Tooltip>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Period selector + run payroll button ── */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
              RUN PAYROLL FOR
            </Text>
            <MonthYearPicker value={period} onChange={setPeriod} />
          </div>
          <div style={{ paddingTop: 20 }}>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              loading={running}
              onClick={handleRunPayroll}
              style={{ fontWeight: 600, background: '#16a34a', borderColor: '#16a34a' }}
            >
              Run {MONTHS[period.month - 1]} {period.year} Payroll
            </Button>
          </div>
          {result && (
            <Alert
              type={result.created > 0 ? 'success' : 'info'}
              title={`${result.created} payslips generated · ${result.skipped} skipped`}
              showIcon
              closable
              onClose={() => setResult(null)}
              style={{ flex: 1, borderRadius: 8 }}
            />
          )}
        </div>
      </Card>

      {/* ── KPI strip ── */}
      {slips.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <KPI label="Total Payroll" value={fmt(total)} color="#6366f1" sub={`${slips.length} teachers`} />
            <KPI label="Disbursed" value={fmt(paid)} color="#16a34a" sub={`${slips.filter(p => p.status === 'paid').length} paid`} />
            <KPI label="Pending" value={fmt(pending)} color="#dc2626" sub={`${slips.filter(p => p.status === 'pending').length} pending`} />
          </div>
          <Card size="small" style={{ borderRadius: 10 }} styles={{ body: { padding: '10px 16px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#64748b', minWidth: 110 }}>Disbursal Rate</Text>
              <Progress
                percent={rate}
                strokeColor={rate >= 80 ? '#16a34a' : rate >= 50 ? '#f59e0b' : '#dc2626'}
                style={{ flex: 1, marginBottom: 0 }}
                format={p => <Text strong>{p}%</Text>}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Payslip table ── */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <Text strong style={{ fontSize: 14 }}>
            {MONTHS[period.month - 1]} {period.year} — Payslips
          </Text>
          <div style={{ flex: 1 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchSlips} />
        </div>
        <Table
          dataSource={slips}
          columns={cols}
          rowKey="_id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', color: '#94a3b8' }}>
                <TeamOutlined style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                No payslips for this period. Click &quot;Run Payroll&quot; above.
              </div>
            ),
          }}
        />
      </Card>

      <AdjustModal
        slip={adjustSlip}
        onClose={() => setAdjustSlip(null)}
        onSaved={fetchSlips}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — wrapped in App so useApp() has a provider for modal / message / notification
// ─────────────────────────────────────────────────────────────────────────────
function FinancePageInner() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/tenants/my')])
      .then(([cRes, tRes]) => {
        setClasses(cRes.data.data.classes ?? []);
        setTenant(tRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    {
      key: 'fees',
      label: <span><DollarOutlined style={{ marginRight: 6 }} />Student Fees</span>,
      children: loading ? <Skeleton active /> : <FeeSlipsPanel classes={classes} tenant={tenant} />,
    },
    {
      key: 'payroll',
      label: <span><TeamOutlined style={{ marginRight: 6 }} />Teacher Payroll</span>,
      children: loading ? <Skeleton active /> : <PayrollPanel tenant={tenant} />,
    },
    {
      key: 'setup',
      label: <span><SettingOutlined style={{ marginRight: 6 }} />Fee Setup</span>,
      children: loading ? <Skeleton active /> : <FeeStructuresPanel classes={classes} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Finance</Title>
        <Text type="secondary">
          Set up class fee structures once — then generate fees and run payroll in one click each month.
        </Text>
      </div>
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '8px 24px 24px' } }}>
        <Tabs items={tabs} defaultActiveKey="fees" />
      </Card>
    </div>
  );
}

export default function FinancePage() {
  return (
    <App>
      <FinancePageInner />
    </App>
  );
}
