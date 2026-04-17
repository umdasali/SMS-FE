'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Certificate } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Tag, Typography, Space, Popconfirm, App } from 'antd';
import { SafetyCertificateOutlined, PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '@/lib/utils';

const { Text } = Typography;

const typeColor: Record<string, string> = {
  transfer: 'blue', bonafide: 'green', character: 'purple',
  completion: 'orange', merit: 'gold',
};

export default function CertificatesPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchCertificates = (currentPage = page, currentLimit = limit, currentSearch = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    if (currentSearch) params.append('search', currentSearch);

    api.get<{ data: { certificates: Certificate[], total: number } }>(`/certificates?${params.toString()}`)
      .then((res) => {
        setCertificates(res.data.data.certificates);
        setTotal(res.data.data.total);
      })
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCertificates(page, limit, search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    fetchCertificates(newPage, newPageSize, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchCertificates(1, limit, val);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/certificates/${id}`);
      fetchCertificates(page, limit, search);
      message.success('Certificate deleted successfully');
    } catch (err) {
      message.error('Failed to delete certificate');
    }
  };

  const columns: ColumnsType<Certificate> = [
    {
      title: 'Serial No.',
      dataIndex: 'serialNo',
      key: 'serialNo',
      render: (v) => <code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{v}</code>,
    },
    {
      title: 'Student',
      dataIndex: 'studentId',
      key: 'student',
      render: (s) => <Text strong style={{ fontSize: 13 }}>{s && typeof s === 'object' ? s.name : String(s || '')}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v) => <Tag color={typeColor[v] || 'default'} style={{ textTransform: 'capitalize' }}>{v}</Tag>,
    },
    {
      title: 'Issued On',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      render: (v) => <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(v)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={v === 'issued' ? 'success' : 'error'} style={{ textTransform: 'capitalize' }}>{v}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_, cert) => {
        const s = cert.studentId;
        const studentId = s && typeof s === 'object' ? s._id : s;
        return (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => router.push(`/certificates/${cert._id}`)}
            >
              View
            </Button>
            <Popconfirm
              title="Delete Certificate"
              description="Are you sure you want to delete this certificate?"
              onConfirm={() => handleDelete(cert._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined /> Certificates
          </Typography.Title>
          <Text type="secondary">{total} certificate{total !== 1 ? 's' : ''} issued</Text>
        </div>
        <Link href="/certificates/new">
          <Button type="primary" icon={<PlusOutlined />} size="medium" style={{ borderRadius: 8 }}>
            Issue Certificate
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={certificates}
        searchPlaceholder="Search by student name or serial..."
        loading={loading}
        total={total}
        currentPage={page}
        pageSize={limit}
        onPaginationChange={handleTableChange}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
