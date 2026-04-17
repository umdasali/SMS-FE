'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Subject, Class, Teacher } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Modal, Form, Input, Select, Typography, Space, Popconfirm, App, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchSubjects = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { subjects: Subject[], total: number } }>(`/subjects?${params.toString()}`)
      .then((res) => {
        setSubjects(res.data.data.subjects);
        setTotal(res.data.data.total);
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubjects(page, limit, search);
    api.get<{ data: { classes: Class[] } }>('/classes').then(res => setClasses(res.data.data.classes)).catch(() => {});
    api.get<{ data: { teachers: Teacher[] } }>('/teachers').then(res => setTeachers(res.data.data.teachers)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    fetchSubjects(newPage, newPageSize, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchSubjects(1, limit, val);
  };

  const openNew = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (sub: Subject) => {
    setEditing(sub);
    form.setFieldsValue({
      name: sub.name,
      code: sub.code,
      fullMarks: sub.fullMarks,
      passMarks: sub.passMarks,
      classId: typeof sub.classId === 'object' ? sub.classId?._id : sub.classId,
      teacherId: typeof sub.teacherId === 'object' ? sub.teacherId?._id : sub.teacherId,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/subjects/${editing._id}`, values);
        message.success('Subject updated successfully');
      } else {
        await api.post('/subjects', values);
        message.success('Subject created successfully');
      }
      setOpen(false);
      fetchSubjects(page, limit, search);
    } catch (err: unknown) {
      message.error('Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s._id !== id));
      message.success('Subject deleted successfully');
    } catch {
      message.error('Failed to delete subject');
    }
  };

  const columns: ColumnsType<Subject> = [
    {
      title: 'Subject Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, sub) => (
        <Space>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReadOutlined style={{ color: '#8c8c8c' }} />
          </div>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{sub.name}</Text>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{sub.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'classId',
      key: 'classId',
      render: (cls) => <Text>{typeof cls === 'object' ? cls?.name : '—'}</Text>
    },
    {
      title: 'Teacher',
      dataIndex: 'teacherId',
      key: 'teacherId',
      render: (t) => <Text>{typeof t === 'object' ? t?.name : '—'}</Text>
    },
    {
      title: 'Marks',
      key: 'marks',
      render: (_, sub) => (
        <Space orientation="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>Full: {sub.fullMarks}</Text>
          <Text style={{ fontSize: 12 }}>Pass: {sub.passMarks}</Text>
        </Space>
      )
    },
    {
      title: '',
      key: 'actions',
      render: (_, sub) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(sub)} />
          <Popconfirm
            title="Delete Subject"
            description="Are you sure you want to delete this subject?"
            onConfirm={() => handleDelete(sub._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Subjects</Title>
          <Text type="secondary">{total} subject{total !== 1 ? 's' : ''} configured</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="medium" style={{ borderRadius: 8 }} onClick={openNew}>
          Add Subject
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={subjects} 
        searchPlaceholder="Search subjects..." 
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
        onSearchChange={handleSearchChange}
      />

      <Modal
        title={editing ? "Edit Subject" : "Create New Subject"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        okText={editing ? "Save Changes" : "Create Subject"}
        confirmLoading={saving}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Subject Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Mathematics" />
          </Form.Item>
          <Form.Item name="code" label="Subject Code" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. MATH101" />
          </Form.Item>
          <Form.Item name="classId" label="Class" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select Class" options={classes.map(c => ({ value: c._id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="teacherId" label="Assigned Teacher">
            <Select placeholder="Select Teacher" allowClear options={teachers.map(t => ({ value: t._id, label: t.name }))} />
          </Form.Item>
          <Space>
            <Form.Item name="fullMarks" label="Full Marks" rules={[{ required: true }]} initialValue={100}>
              <InputNumber min={1} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="passMarks" label="Pass Marks" rules={[{ required: true }]} initialValue={33}>
              <InputNumber min={1} style={{ width: 120 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
