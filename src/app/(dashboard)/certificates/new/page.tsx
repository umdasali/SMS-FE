'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Student, Certificate, CertificateType } from '@/types';
import { Button, Card, Select, Alert, Typography, Row, Col, App } from 'antd';
import {
  ArrowLeftOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const CertificatePDF = dynamic(() => import('@/components/pdf/CertificatePDF'), { ssr: false });

const { Title, Text } = Typography;

const CERT_TYPES: { value: CertificateType; label: string; desc: string }[] = [
  { value: 'bonafide', label: 'Bonafide Certificate', desc: 'Confirms student enrollment' },
  { value: 'transfer', label: 'Transfer Certificate', desc: 'For transferring to another school' },
  { value: 'character', label: 'Character Certificate', desc: 'Certifies good conduct' },
  { value: 'completion', label: 'Completion Certificate', desc: 'Course/year completion' },
  { value: 'merit', label: 'Merit Certificate', desc: 'Academic excellence recognition' },
];

export default function NewCertificatePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [certType, setCertType] = useState<CertificateType>('bonafide');
  const [generating, setGenerating] = useState(false);
  const [generatedCert, setGeneratedCert] = useState<Certificate | null>(null);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState<Student | null>(null);

  useEffect(() => {
    api.get<{ data: { students: Student[] } }>('/students?limit=100')
      .then((res) => {
        setStudents(res.data.data.students);
        const preselect = searchParams.get('studentId');
        if (preselect && preselect !== 'null') setSelectedStudent(preselect);
      })
      .catch((err) => console.error('Failed to fetch students:', err));
  }, [searchParams]);

  useEffect(() => {
    if (selectedStudent && selectedStudent !== 'null') {
      api.get<{ data: Student }>(`/students/${selectedStudent}`)
        .then((res) => setStudentData(res.data.data))
        .catch((err) => console.error('Failed to fetch student:', err));
    }
  }, [selectedStudent]);

  const handleGenerate = async () => {
    if (!selectedStudent || !certType) return;
    setGenerating(true); setError('');
    try {
      const content: Record<string, unknown> = {
        studentName: studentData?.name,
        admissionNo: studentData?.admissionNo,
        classId: studentData?.classId,
        issuedBy: user?.name,
        date: new Date().toISOString(),
      };
      const res = await api.post<{ data: Certificate }>('/certificates', { studentId: selectedStudent, type: certType, content });
      setGeneratedCert(res.data.data);
      message.success('Certificate generated successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to generate certificate');
    } finally { setGenerating(false); }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/certificates"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined /> Issue Certificate
          </Title>
          <Text type="secondary">Generate and download student certificates</Text>
        </div>
      </div>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Card style={{ borderRadius: 10, marginBottom: 20 }}>
        <Title level={5}>Certificate Details</Title>

        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Select Student</Text>
          <Select
            value={selectedStudent || undefined}
            onChange={(v) => setSelectedStudent(v ?? '')}
            placeholder="Choose a student..."
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
            options={students.map((s) => ({ value: s._id, label: `${s.name} - ${s.admissionNo}` }))}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Text style={{ display: 'block', marginBottom: 10, fontWeight: 500 }}>Certificate Type</Text>
          <Row gutter={[12, 12]}>
            {CERT_TYPES.map((t) => (
              <Col xs={24} sm={12} key={t.value}>
                <button
                  type="button"
                  onClick={() => setCertType(t.value)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                    border: `2px solid ${certType === t.value ? 'var(--ant-color-primary)' : '#e8e8e8'}`,
                    background: certType === t.value ? 'var(--ant-color-primary-bg)' : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <Text strong style={{ display: 'block', fontSize: 13 }}>{t.label}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.desc}</Text>
                </button>
              </Col>
            ))}
          </Row>
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={generating}
          disabled={!selectedStudent || !certType}
          icon={<CheckCircleOutlined />}
          onClick={handleGenerate}
          style={{ borderRadius: 8 }}
        >
          {generating ? 'Generating...' : 'Generate Certificate'}
        </Button>
      </Card>

      {generatedCert && studentData && (
        <div>
          <Alert
            title={`Certificate generated! Serial: ${generatedCert.serialNo}`}
            type="success"
            showIcon
            style={{ marginBottom: 12, borderRadius: 8 }}
          />
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <CertificatePDF certificate={generatedCert} student={studentData} tenant={tenant} />
          </div>
        </div>
      )}
    </div>
  );
}
