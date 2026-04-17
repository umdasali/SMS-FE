'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Student, Mark, Exam, Subject } from '@/types';
import api from '@/lib/api';
import { Button, Card, Tag, Typography, Skeleton, Empty } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { getGradeColor } from '@/lib/utils';

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

export default function PortalMarksheetPage() {
  const { user, tenant } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [groupedMarks, setGroupedMarks] = useState<GroupedMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    Promise.all([api.get<{ data: Student }>('/students/me')])
      .then(async ([sRes]) => {
        const s = sRes.data.data;
        setStudent(s);
        const mRes = await api.get<{ data: { byExam: Record<string, Mark[]> } }>(`/exams/marks/student/${s._id}`);
        const { byExam } = mRes.data.data;
        const groups: GroupedMarks[] = Object.entries(byExam).map(([, examMarks]) => {
          const exam = examMarks[0]?.examId as Exam;
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
          return { exam, marks: examMarks, total, obtained, percentage, grade };
        });
        setGroupedMarks(groups);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined /> My Marksheet
          </Title>
          <Text type="secondary">View and download your academic results</Text>
        </div>
        {groupedMarks.length > 0 && (
          <Button icon={<DownloadOutlined />} type="primary" onClick={() => setShowPDF(!showPDF)}>
            {showPDF ? 'Hide PDF' : 'Download PDF'}
          </Button>
        )}
      </div>

      {showPDF && student && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 16 }}>
          <MarksheetPDF student={student} groupedMarks={groupedMarks} tenant={tenant} />
        </div>
      )}

      {groupedMarks.length === 0 ? (
        <Empty description="No marks available yet." />
      ) : (
        groupedMarks.map((group) => (
          <Card key={group.exam?._id} style={{ borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <Text strong style={{ fontSize: 15 }}>{group.exam?.name}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 13, textTransform: 'capitalize' }}>
                  {group.exam?.type} — {group.exam?.academicYear}
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
                  <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Marks</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Grade</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {group.marks.map((m) => {
                    const sub = m.subjectId as Subject;
                    const passed = m.obtained >= (typeof sub === 'object' ? sub.passMarks : 33);
                    return (
                      <tr key={m._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
