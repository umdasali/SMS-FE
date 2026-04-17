'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Student, Mark, Exam, Subject } from '@/types';
import api from '@/lib/api';
import { Button, Card, Tag, Select, Typography, Skeleton, Tabs } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getGradeColor } from '@/lib/utils';

const MarksheetPDF = dynamic(() => import('@/components/pdf/MarksheetPDF'), { ssr: false });

const { Title, Text } = Typography;

interface GroupedMarks {
  exam: Exam;
  marks: Mark[];
  total: number;
  obtained: number;
  percentage: number;
  grade: string;
}

export default function MarksheetPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { tenant } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [groupedMarks, setGroupedMarks] = useState<GroupedMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('all');
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Student }>(`/students/${studentId}`),
      api.get<{ data: { byExam: Record<string, Mark[]> } }>(`/exams/marks/student/${studentId}`),
    ])
      .then(([sRes, mRes]) => {
        setStudent(sRes.data.data);
        const { byExam } = mRes.data.data;
        const groups: GroupedMarks[] = Object.entries(byExam).map(([, examMarks]) => {
          const examData = examMarks[0]?.examId as Exam;
          const total = examMarks.reduce((s, m) => s + m.total, 0);
          const obtained = examMarks.reduce((s, m) => s + m.obtained, 0);
          const percentage = total > 0 ? Math.round((obtained / total) * 100) : 0;
          let grade = 'F';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B+';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C+';
          else if (percentage >= 40) grade = 'C';
          else if (percentage >= 33) grade = 'D';
          return { exam: examData, marks: examMarks, total, obtained, percentage, grade };
        });
        setGroupedMarks(groups);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div>
        <Skeleton active style={{ marginBottom: 16 }} />
        <Card style={{ borderRadius: 10, marginBottom: 16 }}><Skeleton active /></Card>
        <Card style={{ borderRadius: 10 }}><Skeleton active /></Card>
      </div>
    );
  }

  if (!student) return <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>Student not found.</div>;

  const filteredGroups = selectedExam === 'all'
    ? groupedMarks
    : groupedMarks.filter((g) => g.exam?._id === selectedExam);

  const cls = typeof student.classId === 'object' ? student.classId : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/students"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined /> Marksheet
          </Title>
          <Text type="secondary">{student.name} — {student.admissionNo}</Text>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={() => setShowPDF(!showPDF)}>
          {showPDF ? 'Hide PDF' : 'Download PDF'}
        </Button>
      </div>

      {groupedMarks.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <Select
            value={selectedExam}
            onChange={(v) => setSelectedExam(v ?? 'all')}
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'All Exams' },
              ...groupedMarks.map((g) => ({ value: g.exam?._id, label: g.exam?.name })),
            ]}
          />
        </div>
      )}

      {showPDF && student && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 16 }}>
          <MarksheetPDF student={student} groupedMarks={filteredGroups} tenant={tenant} />
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>No marks found for this student.</div>
      ) : (
        <Tabs
          defaultActiveKey="detailed"
          items={[
            {
              key: 'detailed',
              label: 'Detailed View',
              children: (
                <>
                  {filteredGroups.map((group) => (
                    <Card key={group.exam?._id} style={{ borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <Text strong style={{ fontSize: 15 }}>{group.exam?.name}</Text>
                          <Text type="secondary" style={{ display: 'block', fontSize: 13, textTransform: 'capitalize' }}>
                            {group.exam?.type} · {group.exam?.academicYear}
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 28, fontWeight: 700 }}>{group.percentage}%</div>
                          <Tag style={{ fontWeight: 700, color: getGradeColor(group.grade) }}>Grade: {group.grade}</Tag>
                        </div>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Subject</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Full Marks</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Pass Marks</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Obtained</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Grade</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.marks.map((mark) => {
                              const subject = mark.subjectId as Subject;
                              const passed = mark.obtained >= (subject?.passMarks || 33);
                              return (
                                <tr key={mark._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                                    {typeof subject === 'object' ? subject.name : '—'}
                                    {typeof subject === 'object' && <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>({subject.code})</Text>}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{mark.total}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#8c8c8c' }}>
                                    {typeof subject === 'object' ? subject.passMarks : 33}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{mark.obtained}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: getGradeColor(mark.grade) }}>{mark.grade}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                    <Tag color={passed ? 'success' : 'error'}>{passed ? 'Pass' : 'Fail'}</Tag>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #d9d9d9', background: '#fafafa', fontWeight: 600 }}>
                              <td style={{ padding: '8px 10px' }}>Total</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{group.total}</td>
                              <td style={{ padding: '8px 10px' }} />
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{group.obtained}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: 16, color: getGradeColor(group.grade) }}>{group.grade}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <Tag color={group.percentage >= 33 ? 'success' : 'error'} style={{ fontWeight: 700 }}>
                                  {group.percentage >= 33 ? 'PASS' : 'FAIL'}
                                </Tag>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </Card>
                  ))}
                </>
              )
            },
          ]}
        />
      )}
    </div>
  );
}
