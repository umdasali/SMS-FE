'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Certificate, Student } from '@/types';
import { Button, Card, Typography, Skeleton, Alert } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const CertificatePDF = dynamic(() => import('@/components/pdf/CertificatePDF'), { ssr: false });

const { Title, Text } = Typography;

export default function ViewCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tenant } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Certificate }>(`/certificates/${id}`)
      .then((res) => {
        setCertificate(res.data.data);
      })
      .catch((err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Failed to fetch certificate details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 842, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div style={{ maxWidth: 842, margin: '0 auto' }}>
        <Alert
          title={error || 'Certificate not found'}
          type="error"
          showIcon
          action={
            <Link href="/certificates">
              <Button size="small">Back to List</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const student = certificate.studentId as Student;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/certificates"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined /> Certificate Details
          </Title>
          <Text type="secondary">
            Issued to {student.name} on {formatDate(certificate.issuedDate)}
          </Text>
        </div>
      </div>

      <Card style={{ borderRadius: 12, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <CertificatePDF 
          certificate={certificate} 
          student={student} 
          tenant={tenant} 
        />
      </Card>
      
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Serial No: <Text code>{certificate.serialNo}</Text> • Generated on {formatDate(certificate.createdAt)}
        </Text>
      </div>
    </div>
  );
}
