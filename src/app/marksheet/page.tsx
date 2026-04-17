'use client';

import { useState } from 'react';
import { Button, Card, Form, Input, Select, Tag, Typography, Alert, Divider } from 'antd';
import { SearchOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { getGradeColor } from '@/lib/utils';

const { Title, Text } = Typography;
const { Option } = Select;

interface MarkEntry {
  _id: string;
  obtained: number;
  total: number;
  grade: string;
  subjectId: { name: string; code: string; passMarks: number } | string;
  examId: { _id: string; name: string; type: string; academicYear: string; term?: string };
}

interface ExamGroup {
  exam: { _id: string; name: string; type: string; academicYear: string; term?: string };
  marks: MarkEntry[];
}

interface LookupResult {
  student: { name: string; admissionNo: string; rollNo: string; classId: { name: string } | string; sectionId: string };
  institution: { name: string; schoolCode: string };
  byExam: Record<string, MarkEntry[]>;
}

const currentYear = new Date().getFullYear();
const YEARS = [`${currentYear - 1}-${currentYear}`, `${currentYear}-${currentYear + 1}`];

export default function PublicMarksheetPage() {
  const [form] = Form.useForm();
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values: { schoolCode: string; rollNo: string; academicYear?: string }) => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ schoolCode: values.schoolCode.trim(), rollNo: values.rollNo.trim() });
      if (values.academicYear) params.set('academicYear', values.academicYear);
      const res = await api.get<{ data: LookupResult }>(`/public/marksheet?${params}`);
      setResult(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Not found. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const groups: ExamGroup[] = result
    ? Object.values(result.byExam).map(marks => ({
        exam: marks[0]?.examId,
        marks,
      }))
    : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#1d4ed8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FileTextOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <Title level={2} style={{ margin: 0 }}>Marksheet Lookup</Title>
          <Text type="secondary">Enter your school code and roll number to view your results</Text>
        </div>

        {/* Lookup form */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="schoolCode" label="School Code" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. SCH001" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="rollNo" label="Roll Number" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. 42" />
              </Form.Item>
            </div>
            <Form.Item name="academicYear" label="Academic Year (optional)">
              <Select placeholder="All years" allowClear>
                {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
              </Select>
            </Form.Item>
            {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}
            <Button type="primary" htmlType="submit" loading={loading} block size="large" icon={<SearchOutlined />}>
              Look Up Marksheet
            </Button>
          </Form>
        </Card>

        {/* Results */}
        {result && (
          <div>
            {/* Student header */}
            <Card style={{ borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: '#fff',
                }}>
                  {result.student.name[0]}
                </div>
                <div>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700, display: 'block' }}>{result.student.name}</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 11 }}>
                      Roll #{result.student.rollNo}
                    </Tag>
                    <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 11 }}>
                      <BookOutlined style={{ marginRight: 4 }} />
                      {typeof result.student.classId === 'object' ? result.student.classId.name : result.student.classId}
                      {result.student.sectionId ? ` – ${result.student.sectionId}` : ''}
                    </Tag>
                    <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#c7d2fe', fontSize: 11 }}>
                      {result.institution.name}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>

            {groups.length === 0 ? (
              <Card style={{ borderRadius: 12, textAlign: 'center', padding: '24px 0' }}>
                <Text type="secondary">No marks found for the selected criteria.</Text>
              </Card>
            ) : (
              groups.map(group => {
                const total = group.marks.reduce((s, m) => s + m.total, 0);
                const obtained = group.marks.reduce((s, m) => s + m.obtained, 0);
                const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
                let grade = 'F';
                if (pct >= 90) grade = 'A+';
                else if (pct >= 80) grade = 'A';
                else if (pct >= 70) grade = 'B+';
                else if (pct >= 60) grade = 'B';
                else if (pct >= 50) grade = 'C+';
                else if (pct >= 40) grade = 'C';
                else if (pct >= 33) grade = 'D';

                return (
                  <Card key={group.exam?._id} style={{ borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <Text strong style={{ fontSize: 15 }}>{group.exam?.name}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'capitalize' }}>
                          {group.exam?.type}{group.exam?.term ? ` · ${group.exam.term}` : ''} · {group.exam?.academicYear}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{pct}%</div>
                        <Tag style={{ fontWeight: 700, color: getGradeColor(grade), border: 'none', background: '#f9fafb' }}>
                          Grade: {grade}
                        </Tag>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Subject</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Marks</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Grade</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.marks.map(m => {
                          const sub = m.subjectId as { name: string; passMarks: number };
                          const passed = m.obtained >= (typeof sub === 'object' ? (sub.passMarks ?? 33) : 33);
                          return (
                            <tr key={m._id} style={{ borderTop: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px 10px' }}>{typeof sub === 'object' ? sub.name : '—'}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{m.obtained}/{m.total}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: getGradeColor(m.grade) }}>{m.grade}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <Tag color={passed ? 'success' : 'error'}>{passed ? 'Pass' : 'Fail'}</Tag>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
