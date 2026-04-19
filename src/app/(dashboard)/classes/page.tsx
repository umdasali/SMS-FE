'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Class, Subject, Teacher } from '@/types';
import {
  Button, Card, Tag, Modal, Form, Input, Select, Typography,
  Row, Col, Divider, Drawer, Alert, Space, Empty, Skeleton, Pagination, InputNumber, App,
} from 'antd';
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ExperimentOutlined, TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CLASS_PREFIXES = ['Standard', 'Class', 'Grade', 'Semester'];

export default function ClassesPage() {
  const { message } = App.useApp();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form] = Form.useForm();
  const [sections, setSections] = useState<string[]>(['A']);
  const [sectionInput, setSectionInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [subjectClass, setSubjectClass] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm] = Form.useForm();
  const [subjectError, setSubjectError] = useState('');
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deletingSubject, setDeletingSubject] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchClasses = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);
    
    api.get<{ data: { classes: Class[], total: number } }>(`/classes?${params.toString()}`)
      .then((res) => {
        setClasses(res.data.data.classes);
        setTotal(res.data.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses(page, limit, search);
    api.get<{ data: { teachers: Teacher[] } }>('/teachers').then((res) => setTeachers(res.data.data.teachers)).catch(() => { });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null); setSections(['A']); setError('');
    form.resetFields(); 
    form.setFieldsValue({ 
      namePrefix: 'Class',
      academicYear: new Date().getFullYear().toString() 
    });
    setOpen(true);
  };

  const openEdit = (cls: Class) => {
    setEditing(cls); setSections(cls.sections.map((s) => s.name)); setError('');
    
    // Attempt to split name into prefix and number
    const nameParts = cls.name.split(' ');
    let prefix = 'Class';
    let number: string | number = cls.name;

    if (nameParts.length > 1 && CLASS_PREFIXES.includes(nameParts[0])) {
      prefix = nameParts[0];
      const possibleNum = parseInt(nameParts.slice(1).join(' '));
      number = !isNaN(possibleNum) ? possibleNum : nameParts.slice(1).join(' ');
    } else {
      // If first word isn't a known prefix, check if it starts with a known prefix
      const matchedPrefix = CLASS_PREFIXES.find(p => cls.name.startsWith(p));
      if (matchedPrefix) {
        prefix = matchedPrefix;
        const possibleNum = parseInt(cls.name.slice(matchedPrefix.length).trim());
        number = !isNaN(possibleNum) ? possibleNum : cls.name.slice(matchedPrefix.length).trim();
      }
    }

    form.setFieldsValue({ 
      namePrefix: prefix, 
      nameNumber: number,
      academicYear: cls.academicYear 
    });
    setOpen(true);
  };

  const addSection = () => {
    const val = sectionInput.trim().toUpperCase();
    if (val && !sections.includes(val)) { setSections((p) => [...p, val]); setSectionInput(''); }
  };

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    if (sections.length === 0) { setError('At least one section is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { 
        name: `${values.namePrefix} ${values.nameNumber}`.trim(),
        academicYear: values.academicYear,
        sections: sections.map((name) => ({ name })) 
      };
      if (editing) {
        await api.put(`/classes/${editing._id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      fetchClasses(page, limit, search);
      setOpen(false);
      message.success(editing ? 'Class updated successfully' : 'Class created successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save class');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteClassId) return;
    setDeletingClass(true);
    try {
      await api.delete(`/classes/${deleteClassId}`);
      fetchClasses(page, limit, search);
      message.success('Class deleted');
    } finally { setDeletingClass(false); setDeleteClassId(null); }
  };

  const openSubjectsDrawer = async (cls: Class) => {
    setSubjectClass(cls); setSubjectsLoading(true);
    try {
      const res = await api.get<{ data: { subjects: Subject[] } }>(`/subjects?classId=${cls._id}`);
      setSubjects(res.data.data.subjects);
    } catch { setSubjects([]); }
    finally { setSubjectsLoading(false); }
  };

  const openNewSubject = () => {
    setEditingSubject(null); setSubjectError('');
    subjectForm.resetFields(); subjectForm.setFieldsValue({ fullMarks: 100, passMarks: 33 });
    setSubjectOpen(true);
  };

  const openEditSubject = (sub: Subject) => {
    setEditingSubject(sub); setSubjectError('');
    const tId = typeof sub.teacherId === 'object' && sub.teacherId ? sub.teacherId._id : sub.teacherId as string;
    subjectForm.setFieldsValue({ name: sub.name, code: sub.code, fullMarks: sub.fullMarks, passMarks: sub.passMarks, teacherId: tId || '__none__' });
    setSubjectOpen(true);
  };

  const handleSaveSubject = async () => {
    const values = await subjectForm.validateFields().catch(() => null);
    if (!values) return;
    setSubjectSaving(true); setSubjectError('');
    try {
      const payload = {
        classId: subjectClass!._id,
        name: values.name,
        code: values.code.toUpperCase(),
        fullMarks: Number(values.fullMarks),
        passMarks: Number(values.passMarks),
        ...(values.teacherId && values.teacherId !== '__none__' ? { teacherId: values.teacherId } : {}),
      };
      if (editingSubject) {
        const res = await api.put<{ data: Subject }>(`/subjects/${editingSubject._id}`, payload);
        setSubjects((p) => p.map((s) => (s._id === editingSubject._id ? res.data.data : s)));
      } else {
        const res = await api.post<{ data: Subject }>('/subjects', payload);
        setSubjects((p) => [...p, res.data.data]);
      }
      setSubjectOpen(false);
      message.success(editingSubject ? 'Subject updated' : 'Subject added');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubjectError(msg || 'Failed to save subject');
    } finally { setSubjectSaving(false); }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectId) return;
    setDeletingSubject(true);
    try {
      await api.delete(`/subjects/${deleteSubjectId}`);
      setSubjects((p) => p.filter((s) => s._id !== deleteSubjectId));
      message.success('Subject deleted');
    } finally { setDeletingSubject(false); setDeleteSubjectId(null); }
  };

  return (
    <div>
      <div className="classes-header">
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined /> Classes
          </Title>
          <Text type="secondary">{total} classes configured</Text>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: 450 }}>
          <Input
            placeholder="Search classes..."
            allowClear
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              setPage(1);
              fetchClasses(1, limit, val);
            }}
            style={{ flex: 1, minWidth: 200, borderRadius: 8 }}
            prefix={<PlusOutlined style={{ display: 'none' }} />} // Just to match structure
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 8 }}>
            Add Class
          </Button>
        </div>
      </div>

      <style>{`
        .classes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        @media (max-width: 576px) {
          .classes-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => <Col xs={24} md={12} lg={8} key={i}><Card><Skeleton active /></Card></Col>)}
        </Row>
      ) : classes.length === 0 ? (
        <Empty description="No classes yet. Create your first class to get started." />
      ) : (
        <Row gutter={[16, 16]}>
          {classes.map((cls) => (
            <Col xs={24} md={12} lg={8} key={cls._id}>
              <Card
                style={{ borderRadius: 10 }}
                title={<div><Title level={5} style={{ margin: 0 }}>{cls.name}</Title><Text type="secondary" style={{ fontSize: 12 }}>Academic Year: {cls.academicYear}</Text></div>}
                extra={
                  <Space>
                    <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(cls)} />
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => setDeleteClassId(cls._id)} />
                  </Space>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <Space><TeamOutlined style={{ color: '#8c8c8c' }} /><Text type="secondary">{cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}</Text></Space>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cls.sections.map((s) => <Tag key={s.name}>Section {s.name}</Tag>)}
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <Button
                  type="text" block icon={<ExperimentOutlined />}
                  style={{ color: '#8c8c8c', justifyContent: 'flex-start' }}
                  onClick={() => openSubjectsDrawer(cls)}
                >
                  Manage Subjects
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {total > 0 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={limit}
            total={total}
            showSizeChanger
            pageSizeOptions={['12', '24', '48', '96']}
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setLimit(newPageSize);
              fetchClasses(newPage, newPageSize, search);
            }}
            showTotal={(t, range) => `${range[0]}–${range[1]} of ${t} classes`}
          />
        </div>
      )}

      {/* Class modal */}
      <Modal
        title={editing ? 'Edit Class' : 'Create New Class'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Save Changes' : 'Create Class'}
        confirmLoading={saving}
      >
        {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item label="Class Name" required style={{ marginBottom: 0 }}>
                <Row gutter={8}>
                  <Col span={10}>
                    <Form.Item name="namePrefix" rules={[{ required: true, message: 'Select prefix' }]}>
                      <Select options={CLASS_PREFIXES.map(p => ({ value: p, label: p }))} />
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <Form.Item name="nameNumber" rules={[{ required: true, message: 'Enter number' }]}>
                      <InputNumber placeholder="e.g. 10" style={{ width: '100%' }} min={1} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="academicYear" label="Academic Year" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="2026" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Sections">
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input
                placeholder="Section name (A, B, Science)"
                value={sectionInput}
                onChange={(e) => setSectionInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSection(); } }}
              />
              <Button onClick={addSection}>Add</Button>
            </Space.Compact>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sections.map((s) => (
                <Tag key={s} closable onClose={() => setSections((p) => p.filter((x) => x !== s))}>{s}</Tag>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Subjects Drawer */}
      <Drawer
        title={<span><ExperimentOutlined style={{ marginRight: 8 }} />Subjects — {subjectClass?.name}</span>}
        open={!!subjectClass}
        onClose={() => setSubjectClass(null)}
        size="default"
        extra={<Button type="primary" icon={<PlusOutlined />} size="small" onClick={openNewSubject}>Add Subject</Button>}
      >
        {subjectsLoading ? (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {[1, 2, 3].map((i) => <Card key={i}><Skeleton active /></Card>)}
          </Space>
        ) : subjects.length === 0 ? (
          <Empty description="No subjects yet for this class." />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size={8}>
            {subjects.map((sub) => {
              const teacher = typeof sub.teacherId === 'object' && sub.teacherId ? sub.teacherId : null;
              return (
                <Card key={sub._id} size="small" style={{ borderRadius: 8 }}
                  extra={
                    <Space>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditSubject(sub)} />
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteSubjectId(sub._id)} />
                    </Space>
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text strong>{sub.name}</Text>
                    <Tag style={{ fontFamily: 'monospace' }}>{sub.code}</Tag>
                  </div>
                  <Space separator="·">
                    <Text type="secondary" style={{ fontSize: 12 }}>Full: {sub.fullMarks}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Pass: {sub.passMarks}</Text>
                    {teacher && <Text type="secondary" style={{ fontSize: 12 }}>Teacher: {teacher.name}</Text>}
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Drawer>

      {/* Subject modal */}
      <Modal
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        open={subjectOpen}
        onCancel={() => setSubjectOpen(false)}
        onOk={handleSaveSubject}
        okText={editingSubject ? 'Save Changes' : 'Add Subject'}
        confirmLoading={subjectSaving}
      >
        {subjectError && <Alert title={subjectError} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={subjectForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label="Subject Name" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Mathematics" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="code" label="Subject Code" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. MATH" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="teacherId" label="Assign Teacher">
                <Select
                  placeholder="Optional"
                  style={{ width: '100%' }}
                  options={[
                    { value: '__none__', label: 'None' },
                    ...teachers.map((t) => ({ value: t._id, label: t.name })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="fullMarks" label="Full Marks"><Input type="number" min={1} /></Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="passMarks" label="Pass Marks"><Input type="number" min={1} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Delete confirmations */}
      <Modal title="Delete Class?" open={!!deleteClassId} onCancel={() => setDeleteClassId(null)} onOk={handleDelete} okText="Delete Class" okButtonProps={{ danger: true, loading: deletingClass }}>
        This will permanently remove the class and may affect students, subjects, and attendance data.
      </Modal>
      <Modal title="Delete Subject?" open={!!deleteSubjectId} onCancel={() => setDeleteSubjectId(null)} onOk={handleDeleteSubject} okText="Delete Subject" okButtonProps={{ danger: true, loading: deletingSubject }}>
        Marks and timetable entries linked to this subject may be affected. This action cannot be undone.
      </Modal>
    </div>
  );
}
