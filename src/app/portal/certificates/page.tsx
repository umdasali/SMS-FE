'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Certificate, Student } from '@/types';
import api from '@/lib/api';
import { Button, Card, Tag, Typography, Skeleton, Empty } from 'antd';
import { SafetyCertificateOutlined, DownloadOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';

const CertificatePDF = dynamic(() => import('@/components/pdf/CertificatePDF'), { ssr: false });

const { Title, Text } = Typography;

const typeColor: Record<string, string> = {
  transfer: 'blue', bonafide: 'green', character: 'purple',
  completion: 'orange', merit: 'gold',
};

export default function PortalCertificatesPage() {
  const { user, tenant } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get<{ data: Certificate[] }>('/certificates/my')
      .then(async (res) => {
        setCertificates(res.data.data);
        const sRes = await api.get<{ data: Student }>('/students/me');
        setStudent(sRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div>
        <Skeleton active style={{ marginBottom: 16 }} />
        <Card style={{ borderRadius: 10 }}><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined /> My Certificates
        </Title>
        <Text type="secondary">View and download your certificates</Text>
      </div>

      {certificates.length === 0 ? (
        <Empty description="No certificates issued yet." />
      ) : (
        certificates.map((cert) => (
          <div key={cert._id} style={{ marginBottom: 12 }}>
            <Card style={{ borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--ant-color-primary-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <SafetyCertificateOutlined style={{ fontSize: 20, color: 'var(--ant-color-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{cert.type} Certificate</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    Issued: {formatDate(cert.issuedDate)} · Serial: {cert.serialNo}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={typeColor[cert.type] || 'default'} style={{ textTransform: 'capitalize' }}>{cert.type}</Tag>
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => setActiveCert(activeCert === cert._id ? null : cert._id)}
                  >
                    {activeCert === cert._id ? 'Hide' : 'Download'}
                  </Button>
                </div>
              </div>
            </Card>

            {activeCert === cert._id && student && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0', marginTop: 8 }}>
                <CertificatePDF certificate={cert} student={student} tenant={tenant} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
