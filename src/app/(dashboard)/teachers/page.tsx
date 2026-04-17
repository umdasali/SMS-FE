'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Teacher } from '@/types';
import api from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Avatar, Tag, Typography, Space, Modal, Dropdown } from 'antd';
import {
  UserAddOutlined, EyeOutlined, DeleteOutlined, MoreOutlined, UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getInitials } from '@/lib/utils';

const { Text } = Typography;

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchTeachers = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { teachers: Teacher[]; total: number } }>(`/teachers?${params.toString()}`)
      .then((res) => {
        setTeachers(res.data.data.teachers);
        setTotal(res.data.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeachers(page, limit, search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    fetchTeachers(newPage, newPageSize, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchTeachers(1, limit, val);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/teachers/${deleteId}`);
      fetchTeachers(page, limit, search);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
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
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Designation', dataIndex: 'designation', key: 'designation', render: (v) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text> },
    { title: 'Qualification', dataIndex: 'qualification', key: 'qualification', render: (v) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text> },
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
              { key: 'view', label: 'View', icon: <EyeOutlined />, onClick: () => router.push(`/teachers/${t._id}`) },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined /> Teachers
          </Typography.Title>
          <Text type="secondary">{total} staff member{total !== 1 ? 's' : ''}</Text>
        </div>
        <Link href="/teachers/new">
          <Button type="primary" icon={<UserAddOutlined />} size="medium" style={{ borderRadius: 8 }}>
            Add Teacher
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        searchPlaceholder="Search teachers..."
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
        onSearchChange={handleSearchChange}
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
