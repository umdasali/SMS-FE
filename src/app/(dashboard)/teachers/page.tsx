'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Teacher } from '@/types';
import api from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import {
  Button, Avatar, Tag, Typography, Space, Modal, Dropdown, App,
  Input, Select, Card, Row, Col,
} from 'antd';
import {
  UserAddOutlined, EyeOutlined, DeleteOutlined, MoreOutlined, UserOutlined,
  StopOutlined, CheckCircleOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getInitials } from '@/lib/utils';

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

export default function TeachersPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchTeachers = (
    p = page, l = limit,
    s = search, st = statusFilter, g = genderFilter,
  ) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p.toString(), limit: l.toString() });
    if (s)  params.append('search', s);
    if (st) params.append('status', st);
    if (g)  params.append('gender', g);

    api.get<{ data: { teachers: Teacher[]; total: number } }>(`/teachers?${params}`)
      .then((res) => { setTeachers(res.data.data.teachers); setTotal(res.data.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeachers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage); setLimit(newPageSize);
    fetchTeachers(newPage, newPageSize, search, statusFilter, genderFilter);
  };

  const handleSearchInput = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTeachers(1, limit, val, statusFilter, genderFilter);
    }, 400);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val ?? '');
    setPage(1);
    fetchTeachers(1, limit, search, val ?? '', genderFilter);
  };

  const handleGenderFilter = (val: string) => {
    setGenderFilter(val ?? '');
    setPage(1);
    fetchTeachers(1, limit, search, statusFilter, val ?? '');
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setGenderFilter(''); setPage(1);
    fetchTeachers(1, limit, '', '', '');
  };

  const hasFilters = search || statusFilter || genderFilter;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/teachers/${deleteId}`);
      fetchTeachers();
      message.success('Teacher deleted successfully');
    } finally { setDeleting(false); setDeleteId(null); }
  };

  const handleStatusChange = async (teacherId: string, status: string) => {
    try {
      await api.patch(`/teachers/${teacherId}/status`, { status });
      message.success(`Teacher marked as ${status}`);
      fetchTeachers();
    } catch { message.error('Failed to update teacher status'); }
  };

  const columns: ColumnsType<Teacher> = [
    {
      title: 'Teacher',
      dataIndex: 'name',
      key: 'name',
      render: (_, t) => (
        <Space>
          <Avatar src={t.photo || undefined} style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
            {getInitials(t.name)}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{t.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.employeeId}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Email',         dataIndex: 'email',         key: 'email',         render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Designation',   dataIndex: 'designation',   key: 'designation',   render: (v) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text> },
    { title: 'Qualification', dataIndex: 'qualification', key: 'qualification', render: (v) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text> },
    { title: 'Gender',        dataIndex: 'gender',        key: 'gender',        render: (v) => <Text style={{ fontSize: 13, textTransform: 'capitalize' }}>{v || '—'}</Text> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={v === 'active' ? 'success' : 'default'} style={{ textTransform: 'capitalize' }}>{v}</Tag>,
    },
    {
      title: '', key: 'actions', width: 48,
      render: (_, t) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view',   label: 'View',   icon: <EyeOutlined />,   onClick: () => router.push(`/teachers/${t._id}`) },
              { type: 'divider' },
              ...(t.status === 'active'
                ? [{ key: 'deactivate', label: 'Deactivate', icon: <StopOutlined />,        onClick: () => handleStatusChange(t._id, 'inactive') }]
                : [{ key: 'activate',   label: 'Activate',   icon: <CheckCircleOutlined />, onClick: () => handleStatusChange(t._id, 'active') }]
              ),
              { type: 'divider' },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => setDeleteId(t._id) },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined /> Teachers
          </Typography.Title>
          <Text type="secondary">{total} staff member{total !== 1 ? 's' : ''}</Text>
        </div>
        <Link href="/teachers/new">
          <Button type="primary" icon={<UserAddOutlined />} style={{ borderRadius: 8 }}>
            Add Teacher
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }} styles={{ body: { padding: '16px' } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={10} lg={9}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Search by name, designation, email or ID…"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              allowClear
              onClear={() => handleSearchInput('')}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={8} md={5} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={statusFilter || undefined}
              onChange={handleStatusFilter}
              allowClear
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={8} md={5} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Gender"
              value={genderFilter || undefined}
              onChange={handleGenderFilter}
              allowClear
              options={GENDER_OPTIONS}
            />
          </Col>
          {hasFilters && (
            <Col xs={24} sm={8} md={4} lg={3}>
              <Button onClick={clearFilters} style={{ borderRadius: 8, width: '100%' }}>
                Clear filters
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      <DataTable
        columns={columns}
        data={teachers}
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
      />

      <Modal
        title="Delete Teacher?"
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onOk={handleDelete}
        okText="Delete Teacher"
        okButtonProps={{ danger: true, loading: deleting }}
        cancelButtonProps={{ disabled: deleting }}
      >
        This will permanently remove the teacher and their associated data. This action cannot be undone.
      </Modal>
    </div>
  );
}
