'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Tenant } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Tag, Typography, Card, Row, Col, Drawer, Alert, Statistic, Divider, Popconfirm, Skeleton, App } from 'antd';
import {
  BankOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined,
  TeamOutlined, UserOutlined, BookOutlined, TrophyOutlined, DollarOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '@/lib/utils';

const { Title, Text } = Typography;

interface TenantStats {
  students: number;
  teachers: number;
  classes: number;
  exams: number;
  totalFeesCollected: number;
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function InstitutionsPageInner() {
  const { modal } = App.useApp();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchTenants = () => {
    setLoading(true);
    api.get<{ data: Tenant[] }>('/tenants')
      .then((res) => setTenants(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTenants(); }, []);

  const openDrawer = async (t: Tenant) => {
    setSelected(t);
    setStats(null);
    setStatsLoading(true);
    try {
      const res = await api.get<{ data: TenantStats }>(`/tenants/${t._id}/stats`);
      setStats(res.data.data);
    } catch { /* stats unavailable */ }
    finally { setStatsLoading(false); }
  };

  const updateStatus = async (id: string, status: 'active' | 'inactive' | 'pending') => {
    setStatusUpdating(id);
    setError('');
    try {
      const res = await api.put<{ data: Tenant }>(`/tenants/${id}`, { status });
      setTenants((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
      if (selected?._id === id) setSelected(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const deleteTenant = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/tenants/${id}`);
      setTenants(prev => prev.filter(t => t._id !== id));
      if (selected?._id === id) setSelected(null);
      modal.success({ title: 'Institution deleted successfully' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      modal.error({ title: msg || 'Failed to delete institution' });
    } finally {
      setDeleting(null);
    }
  };

  const statusTag = (status: Tenant['status']) => (
    <Tag
      color={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'error'}
      style={{ textTransform: 'capitalize' }}
      icon={
        status === 'active' ? <CheckCircleOutlined /> :
        status === 'inactive' ? <CloseCircleOutlined /> :
        <ClockCircleOutlined />
      }
    >
      {status}
    </Tag>
  );

  const columns: ColumnsType<Tenant> = [
    {
      title: 'Institution',
      dataIndex: 'name',
      key: 'name',
      render: (_, t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.branding?.logo
              ? <img src={t.branding.logo} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
              : <BankOutlined style={{ color: '#64748b' }} />}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>{t.name}</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', fontFamily: 'monospace' }}>{t.schoolCode}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (v) => <Text style={{ textTransform: 'capitalize', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Location',
      render: (_, t) => <Text type="secondary" style={{ fontSize: 13 }}>{t.city}, {t.state}</Text>,
    },
    {
      title: 'Plan',
      render: (_, t) => <Tag style={{ fontSize: 11 }}>{t.subscription?.plan || 'Free'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v) => statusTag(v),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(v)}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, t) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => openDrawer(t)} />
          <Popconfirm
            title="Delete institution?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteTenant(t._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" loading={deleting === t._id} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const statsTotal = tenants.length;
  const statsActive = tenants.filter(t => t.status === 'active').length;
  const statsPending = tenants.filter(t => t.status === 'pending').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BankOutlined /> Institutions
        </Title>
        <Text type="secondary">Manage all registered institutions on SchoolFlow</Text>
      </div>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: statsTotal, color: '#2563eb' },
          { label: 'Active', value: statsActive, color: '#16a34a' },
          { label: 'Pending', value: statsPending, color: '#ea580c' },
          { label: 'Inactive', value: statsTotal - statsActive - statsPending, color: '#64748b' },
        ].map(s => (
          <Col xs={12} sm={6} key={s.label}>
            <Card style={{ borderRadius: 10 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>{s.label}</Text>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <DataTable
        columns={columns}
        data={tenants}
        searchPlaceholder="Search institutions..."
        searchKey="name"
        loading={loading}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BankOutlined /> {selected.name}
          </span>
        ) : null}
        size="default"
        extra={
          selected && (
            <Popconfirm
              title="Delete this institution?"
              description="All data will be permanently removed."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteTenant(selected._id)}
            >
              <Button danger icon={<DeleteOutlined />} size="small" loading={deleting === selected._id}>
                Delete
              </Button>
            </Popconfirm>
          )
        }
      >
        {selected && (
          <div>
            {/* Status + code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              {statusTag(selected.status)}
              <Text type="secondary" style={{ fontSize: 13, marginLeft: 'auto' }}>
                Code: <Text code style={{ fontSize: 13 }}>{selected.schoolCode}</Text>
              </Text>
            </div>

            {/* Usage stats */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', display: 'block', marginBottom: 12 }}>
                Usage
              </Text>
              {statsLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : stats ? (
                <Row gutter={[12, 12]}>
                  {[
                    { label: 'Students', value: stats.students, icon: <UserOutlined />, color: '#2563eb' },
                    { label: 'Teachers', value: stats.teachers, icon: <TeamOutlined />, color: '#7c3aed' },
                    { label: 'Classes', value: stats.classes, icon: <BookOutlined />, color: '#059669' },
                    { label: 'Exams', value: stats.exams, icon: <TrophyOutlined />, color: '#d97706' },
                  ].map(s => (
                    <Col span={12} key={s.label}>
                      <Statistic
                        title={<Text style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</Text>}
                        value={s.value}
                        styles={{ content: { fontSize: 22, fontWeight: 700, color: s.color } }}
                        prefix={s.icon}
                      />
                    </Col>
                  ))}
                  <Col span={24}>
                    <Statistic
                      title={<Text style={{ fontSize: 11, color: '#6b7280' }}>Fees Collected</Text>}
                      value={fmt(stats.totalFeesCollected)}
                      styles={{ content: { fontSize: 18, fontWeight: 700, color: '#16a34a' } }}
                      prefix={<DollarOutlined />}
                    />
                  </Col>
                </Row>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>Stats unavailable</Text>
              )}
            </div>

            {/* Institution details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Type', value: selected.type },
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone },
                { label: 'Location', value: `${selected.city}, ${selected.state}` },
                { label: 'Country', value: selected.country },
                { label: 'Joined', value: formatDate(selected.createdAt) },
                { label: 'Plan', value: selected.subscription?.plan || 'Free' },
                { label: 'Expires', value: selected.subscription?.expiresAt ? formatDate(selected.subscription.expiresAt) : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{label}</Text>
                  <Text strong style={{ fontSize: 13, textTransform: 'capitalize' }}>{value || '—'}</Text>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Address</Text>
                <Text strong style={{ fontSize: 13 }}>{selected.address || '—'}</Text>
              </div>
            </div>

            <Divider style={{ margin: '0 0 16px' }} />

            {/* Status control */}
            <Text style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>Update Status</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['active', 'inactive', 'pending'] as const).map(s => (
                <Button
                  key={s}
                  type={selected.status === s ? 'primary' : 'default'}
                  size="small"
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  loading={statusUpdating === selected._id}
                  onClick={() => updateStatus(selected._id, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function InstitutionsPage() {
  return (
    <App>
      <InstitutionsPageInner />
    </App>
  );
}
