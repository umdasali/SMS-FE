'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Class, Subject, Teacher } from '@/types';
import {
  Button, Card, Tag, Modal, Form, Input, Select, Typography,
  Row, Col, Divider, Drawer, Alert, Space, Empty, Skeleton, Pagination, InputNumber, App, Avatar,
} from 'antd';
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ExperimentOutlined, TeamOutlined, SearchOutlined, UserOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import { themeTokens } from '@/lib/theme';

const { Title, Text } = Typography;

const CLASS_PREFIXES = ['Standard', 'Class', 'Grade', 'Semester'];

const getClassBadgeLabel = (name: string) => {
  const num = name.match(/\d+/)?.[0];
  if (num) return num;
  return name.replace(/\s+/g, '').slice(0, 2).toUpperCase();
};

export default function ClassesPage() {
  const { message } = App.useApp();
  const { color } = useTheme();
  const accent = themeTokens[color].colorPrimary;
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
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchClasses = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { classes: Class[]; total: number } }>(`/classes?${params.toString()}`)
      .then((res) => { setClasses(res.data.data.classes); setTotal(res.data.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses(page, limit, search);
    api.get<{ data: { teachers: Teacher[] } }>('/teachers').then((res) => setTeachers(res.data.data.teachers)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchInput = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchClasses(1, limit, val);
    }, 400);
  };

  const openNew = () => {
    setEditing(null); setSections(['A']); setError('');
    form.resetFields();
    form.setFieldsValue({ namePrefix: 'Class', academicYear: new Date().getFullYear().toString() });
    setOpen(true);
  };

  const openEdit = (cls: Class) => {
    setEditing(cls); setSections(cls.sections.map((s) => s.name)); setError('');
    const nameParts = cls.name.split(' ');
    let prefix = 'Class';
    let number: string | number = cls.name;
    if (nameParts.length > 1 && CLASS_PREFIXES.includes(nameParts[0]!)) {
      prefix = nameParts[0]!;
      const possibleNum = parseInt(nameParts.slice(1).join(' '));
      number = !isNaN(possibleNum) ? possibleNum : nameParts.slice(1).join(' ');
    } else {
      const matchedPrefix = CLASS_PREFIXES.find((p) => cls.name.startsWith(p));
      if (matchedPrefix) {
        prefix = matchedPrefix;
        const possibleNum = parseInt(cls.name.slice(matchedPrefix.length).trim());
        number = !isNaN(possibleNum) ? possibleNum : cls.name.slice(matchedPrefix.length).trim();
      }
    }
    form.setFieldsValue({ namePrefix: prefix, nameNumber: number, academicYear: cls.academicYear });
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
        sections: sections.map((name) => ({ name })),
      };
      if (editing) { await api.put(`/classes/${editing._id}`, payload); }
      else { await api.post('/classes', payload); }
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
    const tId = typeof sub.teacherId === 'object' && sub.teacherId ? sub.teacherId._id : (sub.teacherId as string);
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
      {/* Header */}
      <div className="cls-header">
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined /> Classes
          </Title>
          <Text type="secondary">{total} class{total !== 1 ? 'es' : ''} configured</Text>
        </div>
        <div className="cls-header-actions">
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search classes…"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            allowClear
            onClear={() => handleSearchInput('')}
            style={{ borderRadius: 8, flex: 1, minWidth: 180 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 8, flexShrink: 0 }}>
            Add Class
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card style={{ borderRadius: 12 }}><Skeleton active avatar paragraph={{ rows: 2 }} /></Card>
            </Col>
          ))}
        </Row>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <BookOutlined style={{ fontSize: 48, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
          <Title level={5} type="secondary" style={{ fontWeight: 400 }}>No classes yet</Title>
          <Text type="secondary">Create your first class to get started</Text>
          <div style={{ marginTop: 20 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 8 }}>
              Add Class
            </Button>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {classes.map((cls) => {
            const badge = getClassBadgeLabel(cls.name);
            return (
              <Col xs={24} sm={12} lg={8} key={cls._id}>
                <Card
                  className="cls-card"
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', borderLeft: `3px solid ${accent}` }}
                  styles={{ body: { padding: 0 } }}
                >
                  {/* Card header */}
                  <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Avatar
                      size={46}
                      style={{ background: `${accent}15`, color: accent, fontSize: 17, fontWeight: 700, flexShrink: 0, borderRadius: 10 }}
                    >
                      {badge}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, display: 'block', lineHeight: '1.3' }}>{cls.name}</Text>
                      <Tag color="default" style={{ fontSize: 11, marginTop: 4 }}>AY {cls.academicYear}</Tag>
                    </div>
                    <Space size={2} style={{ flexShrink: 0 }}>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(cls)} style={{ color: '#8c8c8c' }} />
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteClassId(cls._id)} />
                    </Space>
                  </div>

                  {/* Sections */}
                  <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <TeamOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {cls.sections.map((s) => (
                        <Tag key={s.name} style={{ borderRadius: 20, fontSize: 12 }}>{s.name}</Tag>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 18px' }}>
                    <Button
                      block
                      icon={<ExperimentOutlined />}
                      onClick={() => openSubjectsDrawer(cls)}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    >
                      Manage Subjects
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Pagination */}
      {total > 0 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={limit}
            total={total}
            showSizeChanger={false}
            onChange={(newPage) => { setPage(newPage); fetchClasses(newPage, limit, search); }}
            showTotal={(t, range) => `${range[0]}–${range[1]} of ${t}`}
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
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item label="Class Name" required style={{ marginBottom: 0 }}>
                <Row gutter={8}>
                  <Col span={10}>
                    <Form.Item name="namePrefix" rules={[{ required: true, message: 'Select prefix' }]}>
                      <Select options={CLASS_PREFIXES.map((p) => ({ value: p, label: p }))} />
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
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined />
            {subjectClass?.name} — Subjects
          </span>
        }
        open={!!subjectClass}
        onClose={() => setSubjectClass(null)}
        size="default"
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openNewSubject} style={{ borderRadius: 6 }}>
            Add Subject
          </Button>
        }
      >
        {subjectsLoading ? (
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            {[1, 2, 3].map((i) => <Card key={i} style={{ borderRadius: 8 }}><Skeleton active paragraph={{ rows: 1 }} /></Card>)}
          </Space>
        ) : subjects.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">No subjects yet for this class</Text>}
            style={{ marginTop: 40 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewSubject} style={{ borderRadius: 6 }}>
              Add First Subject
            </Button>
          </Empty>
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size={10}>
            {subjects.map((sub) => {
              const teacher = typeof sub.teacherId === 'object' && sub.teacherId ? sub.teacherId : null;
              return (
                <Card
                  key={sub._id}
                  size="small"
                  style={{ borderRadius: 10 }}
                  styles={{ body: { padding: '12px 14px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 14 }}>{sub.name}</Text>
                        <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{sub.code}</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Full marks: <b>{sub.fullMarks}</b></Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>Pass marks: <b>{sub.passMarks}</b></Text>
                      </div>
                      {teacher && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <Avatar size={18} icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#8c8c8c', fontSize: 10 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>{teacher.name}</Text>
                        </div>
                      )}
                    </div>
                    <Space size={2} style={{ flexShrink: 0 }}>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditSubject(sub)} />
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteSubjectId(sub._id)} />
                    </Space>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}

        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in {subjectClass?.name}
        </Text>
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
        {subjectError && <Alert message={subjectError} type="error" showIcon style={{ marginBottom: 16 }} />}
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
                  placeholder="Optional — select a teacher"
                  style={{ width: '100%' }}
                  options={[
                    { value: '__none__', label: 'None' },
                    ...teachers.map((t) => ({ value: t._id, label: t.name })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="fullMarks" label="Full Marks">
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="passMarks" label="Pass Marks">
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Delete confirmations */}
      <Modal
        title="Delete Class?"
        open={!!deleteClassId}
        onCancel={() => setDeleteClassId(null)}
        onOk={handleDelete}
        okText="Delete Class"
        okButtonProps={{ danger: true, loading: deletingClass }}
        cancelButtonProps={{ disabled: deletingClass }}
      >
        This will permanently remove the class and may affect students, subjects, and attendance data. This action cannot be undone.
      </Modal>
      <Modal
        title="Delete Subject?"
        open={!!deleteSubjectId}
        onCancel={() => setDeleteSubjectId(null)}
        onOk={handleDeleteSubject}
        okText="Delete Subject"
        okButtonProps={{ danger: true, loading: deletingSubject }}
        cancelButtonProps={{ disabled: deletingSubject }}
      >
        Marks and timetable entries linked to this subject may be affected. This action cannot be undone.
      </Modal>

      <style>{`
        .cls-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .cls-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }
        .cls-card {
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .cls-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }
        @media (max-width: 576px) {
          .cls-header { flex-direction: column; align-items: flex-start; }
          .cls-header-actions { width: 100%; flex-shrink: unset; }
        }
      `}</style>
    </div>
  );
}
