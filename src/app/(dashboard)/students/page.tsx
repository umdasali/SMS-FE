'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Student, Class } from '@/types';
import api from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Avatar, Tag, Select, Typography, Space, Modal, Dropdown } from 'antd';
import {
  UserAddOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  MoreOutlined, TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getInitials, formatDate } from '@/lib/utils';

const { Text } = Typography;

const statusColor: Record<string, string> = {
  active: 'success', inactive: 'default', graduated: 'processing', transferred: 'warning',
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchStudents = (classId = classFilter, currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.append('classId', classId);
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { students: Student[]; total: number } }>(`/students?${params.toString()}`)
      .then((res) => {
        setStudents(res.data.data.students);
        setTotal(res.data.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents(classFilter, page, limit, search);
    api.get<{ data: { classes: Class[] } }>('/classes').then((res) => setClasses(res.data.data.classes));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    fetchStudents(classFilter, newPage, newPageSize, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchStudents(classFilter, 1, limit, val);
  };

  const handleFilterChange = (val: string) => {
    setClassFilter(val);
    setPage(1);
    fetchStudents(val, 1, limit, search);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteId}`);
      fetchStudents(classFilter, page, limit, search);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: ColumnsType<Student> = [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      render: (_, s) => (
        <Space>
          <Avatar src={s.photo || undefined} style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
            {getInitials(s.name)}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{s.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{s.admissionNo}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'classId',
      key: 'class',
      render: (_, s) => {
        const cls = s.classId;
        return <Text style={{ fontSize: 13 }}>{typeof cls === 'object' && cls ? cls.name : '—'}{s.sectionId ? ` — ${s.sectionId}` : ''}</Text>;
      },
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (v) => <Text style={{ textTransform: 'capitalize', fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: 'Admitted',
      dataIndex: 'admissionDate',
      key: 'admissionDate',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{v ? formatDate(v) : '—'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColor[v] || 'default'} style={{ textTransform: 'capitalize' }}>{v}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, s) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View Profile', icon: <EyeOutlined />, onClick: () => router.push(`/students/${s._id}`) },
              { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => router.push(`/students/${s._id}?edit=1`) },
              { type: 'divider' },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => setDeleteId(s._id) },
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
            <TeamOutlined /> Students
          </Typography.Title>
          <Text type="secondary">{total} student{total !== 1 ? 's' : ''} enrolled</Text>
        </div>
        <Link href="/students/new">
          <Button type="primary" icon={<UserAddOutlined />} size="medium" style={{ borderRadius: 8 }}>
            Add Student
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          value={classFilter}
          onChange={handleFilterChange}
          style={{ width: '100%', maxWidth: 220 }}
          size="middle"
          options={[
            { value: 'all', label: 'All Classes' },
            ...classes.map((c) => ({ value: c._id, label: c.name })),
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search students..."
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
        onSearchChange={handleSearchChange}
      />

      <Modal
        title="Delete Student?"
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onOk={handleDelete}
        okText="Delete Student"
        okButtonProps={{ danger: true, loading: deleting }}
        cancelButtonProps={{ disabled: deleting }}
      >
        This will permanently remove the student and all associated attendance and marks records. This action cannot be undone.
      </Modal>
    </div>
  );
}
