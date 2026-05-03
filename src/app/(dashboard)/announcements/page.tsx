'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  App, Card, Button, Tag, Switch, Modal, Form, Input, Select,
  Popconfirm, Typography, Spin, Empty, Pagination,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, NotificationOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Announcement } from '@/types';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const { Title, Text } = Typography;
const { TextArea } = Input;

const audienceColor: Record<string, string> = { all: 'green', students: 'blue', teachers: 'purple' };
const audienceLabel: Record<string, string> = { all: 'All', students: 'Students', teachers: 'Teachers' };

export default function AnnouncementsPage() {
  const { message } = App.useApp();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [audienceFilter, setAudienceFilter] = useState('');
  const LIMIT = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (audienceFilter) params.set('audience', audienceFilter);
      const res = await api.get<{ data: { announcements: Announcement[]; total: number } }>(
        `/announcements?${params}`
      );
      setAnnouncements(res.data.data.announcements);
      setTotal(res.data.data.total);
    } catch {
      message.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [page, audienceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ targetAudience: 'all', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    form.setFieldsValue({
      title: a.title,
      content: a.content,
      targetAudience: a.targetAudience,
      isActive: a.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/announcements/${editing._id}`, values);
        message.success('Announcement updated');
      } else {
        await api.post('/announcements', values);
        message.success('Announcement created');
      }
      setModalOpen(false);
      load();
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      message.success('Deleted');
      load();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleToggle = async (a: Announcement) => {
    try {
      await api.put(`/announcements/${a._id}`, { isActive: !a.isActive });
      load();
    } catch {
      message.error('Failed to update status');
    }
  };

  return (
    <>
      <style>{`
        .ann-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .ann-header-btn { flex-shrink: 0; }
        .ann-filters { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .ann-row { padding: 16px; border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }
        .ann-row:last-child { border-bottom: none; }
        .ann-row:hover { background: #fafafa; }
        .ann-row-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
        .ann-row-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
        .ann-pagination { display: flex; align-items: center; justify-content: flex-end; padding: 12px 16px; border-top: 1px solid #f0f0f0; }
        @media (max-width: 480px) {
          .ann-header { flex-direction: column; }
          .ann-header-btn { width: 100%; }
          .ann-filters { flex-direction: column; align-items: stretch; }
          .ann-filters-count { text-align: right; }
        }
      `}</style>

      {/* Header */}
      <div className="ann-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>Announcements</Title>
          <Text type="secondary">Post updates for students and teachers</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          className="ann-header-btn"
          block={false}
          style={{ whiteSpace: 'nowrap' }}
        >
          New Announcement
        </Button>
      </div>

      {/* Filters */}
      <div className="ann-filters">
        <Select
          style={{ width: '100%', maxWidth: 220 }}
          placeholder="Filter by audience"
          allowClear
          value={audienceFilter || undefined}
          onChange={(v) => { setAudienceFilter(v || ''); setPage(1); }}
          options={[
            { value: 'all', label: 'All (Students & Teachers)' },
            { value: 'students', label: 'Students Only' },
            { value: 'teachers', label: 'Teachers Only' },
          ]}
          suffixIcon={<NotificationOutlined style={{ color: '#8c8c8c' }} />}
        />
        <Text type="secondary" className="ann-filters-count" style={{ fontSize: 13, marginLeft: 'auto' }}>
          {announcements.filter((a) => a.isActive).length} active · {total} total
        </Text>
      </div>

      {/* List */}
      <Card style={{ borderRadius: 10 }} styles={{ body: { padding: 0 } }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin />
          </div>
        ) : announcements.length === 0 ? (
          <Empty
            description="No announcements yet. Create one to get started."
            style={{ margin: '48px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {announcements.map((a) => (
              <div key={a._id} className="ann-row">
                {/* Title + tags row */}
                <div className="ann-row-top">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: a.isActive ? 'var(--ant-color-primary-bg)' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.isActive ? 'var(--ant-color-primary)' : '#bfbfbf',
                    fontSize: 14, marginTop: 1,
                  }}>
                    <NotificationOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 14 }}>{a.title}</Text>
                      <Tag
                        color={audienceColor[a.targetAudience] || 'default'}
                        style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px', margin: 0 }}
                      >
                        {audienceLabel[a.targetAudience] || a.targetAudience}
                      </Tag>
                      {!a.isActive && (
                        <Tag style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px', margin: 0, color: '#8c8c8c' }}>
                          Hidden
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.55, display: 'block' }}>
                      {a.content.length > 120 ? `${a.content.slice(0, 120)}…` : a.content}
                    </Text>
                  </div>
                </div>

                {/* Footer: status + date + actions */}
                <div className="ann-row-footer" style={{ paddingLeft: 44 }}>
                  <Switch
                    size="small"
                    checked={a.isActive}
                    onChange={() => handleToggle(a)}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(a.createdAt)}</Text>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(a)}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete this announcement?"
                      onConfirm={() => handleDelete(a._id)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="ann-pagination">
              <Pagination
                current={page}
                total={total}
                pageSize={LIMIT}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
                showTotal={(t, [s, e]) => `${s}–${e} of ${t}`}
                size="small"
              />
            </div>
          </>
        )}
      </Card>

      {/* Create / Edit modal */}
      <Modal
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Save Changes' : 'Create'}
        confirmLoading={saving}
        forceRender
        width={520}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="e.g. School closed on Monday" maxLength={150} showCount />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Content is required' }]}
          >
            <TextArea rows={4} placeholder="Write your announcement…" maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="targetAudience" label="Target Audience">
            <Select
              options={[
                { value: 'all', label: 'All (Students & Teachers)' },
                { value: 'students', label: 'Students Only' },
                { value: 'teachers', label: 'Teachers Only' },
              ]}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Visible" valuePropName="checked">
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
