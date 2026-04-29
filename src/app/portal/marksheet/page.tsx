'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Student, Mark, Exam, Subject } from '@/types';
import api from '@/lib/api';
import { Button, Card, Tag, Typography, Skeleton, Empty } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { getGradeColor, resolveGrade } from '@/lib/utils';

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
    if (!user) return;
    if (user.role !== 'student') { setLoading(false); return; }

    api.get<{ data: Student }>('/students/me')
      .then(async (sRes) => {
        const s = sRes.data.data;
        setStudent(s);
        const mRes = await api.get<{ data: { byExam: Record<string, Mark[]> } }>(`/exams/marks/student/${s._id}`);
        const byExam: Record<string, Mark[]> = mRes.data.data?.byExam ?? {};
        const groups: GroupedMarks[] = Object.entries(byExam).map(([, examMarks]) => {
          const exam = examMarks[0]?.examId as Exam;
          const total = examMarks.reduce((acc, m) => acc + m.total, 0);
          const obtained = examMarks.reduce((acc, m) => acc + m.obtained, 0);
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
      .catch(() => { /* marks unavailable — empty state handles display */ })
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
      <style>{`
        .marksheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
        .exam-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .exam-card-summary { text-align: right; flex-shrink: 0; }
        @media (max-width: 480px) {
          .exam-card-header { flex-wrap: wrap; }
          .exam-card-summary { text-align: left; }
        }
      `}</style>
      <div className="marksheet-header">
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
            <div className="exam-card-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 15 }}>{group.exam?.name}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 13, textTransform: 'capitalize' }}>
                  {group.exam?.type} — {group.exam?.academicYear}
                </Text>
              </div>
              <div className="exam-card-summary">
                <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{group.percentage}%</div>
                <Tag style={{ fontWeight: 700, color: getGradeColor(group.grade), marginTop: 4 }}>Grade: {group.grade}</Tag>
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
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: getGradeColor(resolveGrade(m)) }}>{resolveGrade(m)}</td>
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
