'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Exam, Class, Teacher } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Tag, Form, Modal, Input, Select, Typography, Space, Popconfirm, App } from 'antd';
import { FileTextOutlined, PlusOutlined, ReadOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

const EXAM_TYPES = ['unit', 'mid', 'final', 'practical', 'assignment'] as const;

const typeColor: Record<string, string> = {
  unit: 'blue', mid: 'purple', final: 'red', practical: 'green', assignment: 'gold',
};
const typeLabel: Record<string, string> = {
  unit: 'Unit Test', mid: 'Mid Term', final: 'Final', practical: 'Practical', assignment: 'Assignment',
};

export default function ExamsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchExams = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { exams: Exam[], total: number } }>(`/exams?${params.toString()}`)
      .then((res) => {
        setExams(res.data.data.exams);
        setTotal(res.data.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams(page, limit, search);
    if (isTeacher) {
      // Fetch teacher profile to get assigned classIds, then filter classes list
      api.get<{ data: Teacher }>('/teachers/me').then((res) => {
        const teacher = res.data.data;
        if (teacher?.classIds) {
          const assignedIds = new Set(teacher.classIds.map((c) => (typeof c === 'object' ? c._id : c)));
          api.get<{ data: { classes: Class[] } }>('/classes').then((cr) => {
            setClasses(cr.data.data.classes.filter((c) => assignedIds.has(c._id)));
          }).catch(() => {});
        }
      }).catch(() => {
        api.get<{ data: { classes: Class[] } }>('/classes').then((res) => setClasses(res.data.data.classes)).catch(() => {});
      });
    } else {
      api.get<{ data: { classes: Class[] } }>('/classes').then((res) => setClasses(res.data.data.classes)).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    fetchExams(newPage, newPageSize, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchExams(1, limit, val);
  };

  const handleCreate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      const res = await api.post<{ data: Exam }>('/exams', {
        ...values,
        academicYear: values.academicYear || new Date().getFullYear().toString(),
      });
      setExams((prev) => [res.data.data, ...prev]);
      setOpen(false);
      form.resetFields();
      form.setFieldsValue({ type: 'mid', academicYear: new Date().getFullYear().toString() });
      fetchExams(page, limit, search);
      message.success('Exam created successfully');
    } catch (err) { console.error(err); message.error('Failed to create exam'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/exams/${id}`);
      fetchExams(page, limit, search);
      message.success('Exam deleted successfully');
    } catch {
      message.error('Failed to delete exam');
    }
  };

  const columns: ColumnsType<Exam> = [
    {
      title: 'Exam Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, e) => (
        <Space>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: '#8c8c8c' }} />
          </div>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{e.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{e.academicYear}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'classId',
      key: 'class',
      render: (cls) => (
        <Space>
          <ReadOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 13 }}>{typeof cls === 'object' ? cls?.name : '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v) => <Tag color={typeColor[v] || 'default'}>{typeLabel[v] || v}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text type="secondary" style={{ fontSize: 13 }}>{v ? formatDate(v) : '—'}</Text>
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, e) => (
        <Space>
          <Link href={`/exams/${e._id}/marks`}>
            <Button size="small" style={{ borderRadius: 6 }}>Enter Marks</Button>
          </Link>
          {!isTeacher && (
            <Popconfirm
              title="Delete Exam"
              description="Are you sure you want to delete this exam? All associated marks will be lost."
              onConfirm={() => handleDelete(e._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small">
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Exams</Title>
          <Text type="secondary">{total} exam{total !== 1 ? 's' : ''} configured</Text>
        </div>
        {!isTeacher && (
          <Button type="primary" icon={<PlusOutlined />} size="medium" style={{ borderRadius: 8 }} onClick={() => setOpen(true)}>
            Create Exam
          </Button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={exams} 
        searchPlaceholder="Search exams..." 
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
        onSearchChange={handleSearchChange}
      />

      <Modal
        title="Create New Exam"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleCreate}
        okText="Create Exam"
        confirmLoading={saving}
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'mid', academicYear: new Date().getFullYear().toString() }}>
          <Form.Item name="name" label="Exam Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Mid-Term 2024" />
          </Form.Item>
          <Form.Item name="classId" label="Class" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select class"
              style={{ width: '100%' }}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select
              style={{ width: '100%' }}
              options={EXAM_TYPES.map((t) => ({ value: t, label: typeLabel[t] }))}
            />
          </Form.Item>
          <Form.Item name="academicYear" label="Academic Year">
            <Input />
          </Form.Item>
          <Form.Item name="term" label="Term / Semester">
            <Input placeholder="e.g. Term 1" />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="End Date">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
