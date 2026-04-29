'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Asset, AssetAssignment, AssetStats, Student } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import {
  Button, Typography, Space, Popconfirm, App, Tabs, Modal,
  Form, Input, Select, DatePicker, Card, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  GiftOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '@/lib/utils';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function AssetsPage() {
  const { message } = App.useApp();

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<AssetStats>({ totalAssetTypes: 0, totalIssuances: 0, studentsIssuedAssets: 0 });

  const fetchStats = useCallback(() => {
    api.get<{ data: AssetStats }>('/assets/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {});
  }, []);

  // ── Asset Types ────────────────────────────────────────────────────────────
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const fetchAssets = useCallback(() => {
    setAssetsLoading(true);
    api.get<{ data: Asset[] }>('/assets')
      .then((r) => setAssets(r.data.data))
      .catch(() => setAssets([]))
      .finally(() => setAssetsLoading(false));
  }, []);

  // ── Asset modal (create / edit) ────────────────────────────────────────────
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm] = Form.useForm();
  const [assetSaving, setAssetSaving] = useState(false);

  const openAssetModal = (asset: Asset | null = null) => {
    setEditingAsset(asset);
    assetForm.setFieldsValue({ name: asset?.name || '', description: asset?.description || '' });
    setAssetModalOpen(true);
  };

  const handleAssetSave = async () => {
    const values = await assetForm.validateFields();
    setAssetSaving(true);
    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset._id}`, values);
        message.success('Asset updated');
      } else {
        await api.post('/assets', values);
        message.success('Asset created');
      }
      setAssetModalOpen(false);
      assetForm.resetFields();
      fetchAssets();
      fetchStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Failed to save asset');
    } finally {
      setAssetSaving(false);
    }
  };

  const handleAssetDelete = async (id: string) => {
    try {
      await api.delete(`/assets/${id}`);
      message.success('Asset deleted');
      fetchAssets();
      fetchStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Failed to delete asset');
    }
  };

  // ── Assignments ────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignPage, setAssignPage] = useState(1);
  const [assignLimit, setAssignLimit] = useState(10);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignTotal, setAssignTotal] = useState(0);
  const [assetFilter, setAssetFilter] = useState<string>('');

  const fetchAssignments = useCallback((
    pg = assignPage, lm = assignLimit, sr = assignSearch, af = assetFilter
  ) => {
    setAssignmentsLoading(true);
    const params = new URLSearchParams();
    params.append('page', pg.toString());
    params.append('limit', lm.toString());
    if (sr) params.append('search', sr);
    if (af) params.append('assetId', af);

    api.get<{ data: { assignments: AssetAssignment[]; total: number } }>(`/assets/assignments?${params}`)
      .then((r) => {
        setAssignments(r.data.data.assignments);
        setAssignTotal(r.data.data.total);
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Issue Asset modal ──────────────────────────────────────────────────────
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm] = Form.useForm();
  const [issueSaving, setIssueSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const loadStudents = (search = '') => {
    setStudentsLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    api.get<{ data: { students: Student[] } }>(`/students?${params}`)
      .then((r) => setStudents(r.data.data.students || []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  };

  const openIssueModal = () => {
    issueForm.resetFields();
    issueForm.setFieldValue('assignedDate', dayjs());
    loadStudents();
    setIssueModalOpen(true);
  };

  const handleIssueSave = async () => {
    const values = await issueForm.validateFields();
    setIssueSaving(true);
    try {
      await api.post('/assets/assignments', {
        ...values,
        assignedDate: values.assignedDate ? values.assignedDate.toISOString() : undefined,
      });
      message.success('Asset issued successfully');
      setIssueModalOpen(false);
      fetchAssignments(assignPage, assignLimit, assignSearch, assetFilter);
      fetchStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Failed to issue asset');
    } finally {
      setIssueSaving(false);
    }
  };

  const handleAssignmentDelete = async (id: string) => {
    try {
      await api.delete(`/assets/assignments/${id}`);
      message.success('Record deleted');
      fetchAssignments(assignPage, assignLimit, assignSearch, assetFilter);
      fetchStats();
    } catch {
      message.error('Failed to delete record');
    }
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    fetchAssets();
    fetchAssignments(1, 10, '', '');
  }, [fetchStats, fetchAssets, fetchAssignments]);

  // ── Columns ────────────────────────────────────────────────────────────────
  const assetColumns: ColumnsType<Asset> = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: 'Added On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(v)}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, asset) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openAssetModal(asset)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Asset"
            description="This will fail if there are issuance records for this asset."
            onConfirm={() => handleAssetDelete(asset._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const assignmentColumns: ColumnsType<AssetAssignment> = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      key: 'student',
      render: (s) => {
        if (s && typeof s === 'object') {
          return (
            <div>
              <Text strong style={{ fontSize: 13 }}>{s.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>{s.admissionNo}</Text>
            </div>
          );
        }
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Asset',
      dataIndex: 'assetId',
      key: 'asset',
      render: (a) => (
        <Text style={{ fontSize: 13 }}>
          {a && typeof a === 'object' ? a.name : '—'}
        </Text>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'studentId',
      key: 'class',
      render: (s) => {
        if (s && typeof s === 'object' && s.classId && typeof s.classId === 'object') {
          return <Text type="secondary" style={{ fontSize: 13 }}>{s.classId.name}</Text>;
        }
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Issued On',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(v)}</Text>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, row) => (
        <Popconfirm
          title="Delete Record"
          description="Remove this issuance record?"
          onConfirm={() => handleAssignmentDelete(row._id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <GiftOutlined /> Assets
        </Typography.Title>
        <Text type="secondary">Manage school-issued assets and track issuances</Text>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Asset Types"
              value={stats.totalAssetTypes}
              prefix={<AppstoreOutlined style={{ color: 'var(--ant-color-primary)' }} />}
              styles={{ content: { color: 'var(--ant-color-primary)' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Total Issuances"
              value={stats.totalIssuances}
              prefix={<UnorderedListOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Students Issued Assets"
              value={stats.studentsIssuedAssets}
              prefix={<GiftOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="assets"
        items={[
          {
            key: 'assets',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AppstoreOutlined /> Asset Types
              </span>
            ),
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8 }} onClick={() => openAssetModal()}>
                    Add Asset Type
                  </Button>
                </div>
                <DataTable
                  columns={assetColumns}
                  data={assets}
                  searchPlaceholder="Search asset types..."
                  loading={assetsLoading}
                />
              </div>
            ),
          },
          {
            key: 'issuances',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UnorderedListOutlined /> Issuances
              </span>
            ),
            children: (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                  <Select
                    allowClear
                    placeholder="Filter by asset type"
                    style={{ width: 220 }}
                    options={assets.map((a) => ({ value: a._id, label: a.name }))}
                    value={assetFilter || undefined}
                    onChange={(val) => {
                      const v = val || '';
                      setAssetFilter(v);
                      setAssignPage(1);
                      fetchAssignments(1, assignLimit, assignSearch, v);
                    }}
                  />
                  <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8 }} onClick={openIssueModal}>
                    Issue Asset
                  </Button>
                </div>
                <DataTable
                  columns={assignmentColumns}
                  data={assignments}
                  searchPlaceholder="Search by student name..."
                  loading={assignmentsLoading}
                  total={assignTotal}
                  currentPage={assignPage}
                  pageSize={assignLimit}
                  onPaginationChange={(pg, lm) => {
                    setAssignPage(pg);
                    setAssignLimit(lm);
                    fetchAssignments(pg, lm, assignSearch, assetFilter);
                  }}
                  onSearchChange={(val) => {
                    setAssignSearch(val);
                    setAssignPage(1);
                    fetchAssignments(1, assignLimit, val, assetFilter);
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* Add / Edit Asset Modal */}
      <Modal
        title={editingAsset ? 'Edit Asset Type' : 'Add Asset Type'}
        open={assetModalOpen}
        onCancel={() => { setAssetModalOpen(false); assetForm.resetFields(); }}
        onOk={handleAssetSave}
        okText={editingAsset ? 'Update' : 'Add'}
        confirmLoading={assetSaving}
        forceRender
      >
        <Form form={assetForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Asset Name" rules={[{ required: true, message: 'Asset name is required' }]}>
            <Input placeholder="e.g. School Bag, ID Card, ID Card Ribbon" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Issue Asset Modal */}
      <Modal
        title="Issue Asset to Student"
        open={issueModalOpen}
        onCancel={() => setIssueModalOpen(false)}
        onOk={handleIssueSave}
        okText="Issue"
        confirmLoading={issueSaving}
        forceRender
      >
        <Form form={issueForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="studentId" label="Student" rules={[{ required: true, message: 'Please select a student' }]}>
            <Select
              showSearch
              placeholder="Search and select student"
              loading={studentsLoading}
              filterOption={false}
              onSearch={(val) => loadStudents(val)}
              options={students.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.admissionNo})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="assetId" label="Asset" rules={[{ required: true, message: 'Please select an asset' }]}>
            <Select
              placeholder="Select asset type"
              options={assets.map((a) => ({ value: a._id, label: a.name }))}
            />
          </Form.Item>
          <Form.Item name="assignedDate" label="Issue Date" rules={[{ required: true, message: 'Please select a date' }]}>
            <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes (e.g. replacement card)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
