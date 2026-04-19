'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Student, Mark, Exam, Subject } from '@/types';
import api from '@/lib/api';
import { Button, Card, Tag, Select, Typography, Skeleton, Drawer, Space } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getGradeColor, resolveGrade } from '@/lib/utils';

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
  const { tenant, user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [groupedMarks, setGroupedMarks] = useState<GroupedMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');

  // PDF drawer — holds the groups for the currently-selected exam download
  const [pdfGroups, setPdfGroups] = useState<GroupedMarks[] | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');

  const openPdf = (groups: GroupedMarks[], title: string) => {
    setPdfGroups(groups);
    setPdfTitle(title);
  };
  const closePdf = () => setPdfGroups(null);

  // Students must use their own portal
  useEffect(() => {
    if (user?.role === 'student') router.replace('/portal/marksheet');
  }, [user, router]);

  useEffect(() => {
    if (user === null) return;
    if (user.role === 'student') return;

    Promise.all([
      api.get<{ data: Student }>(`/students/${studentId}`),
      api.get<{ data: { byExam: Record<string, Mark[]> } }>(`/exams/marks/student/${studentId}`),
    ])
      .then(([sRes, mRes]) => {
        setStudent(sRes.data.data);
        const byExam: Record<string, Mark[]> = mRes.data.data?.byExam ?? {};
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
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
        else setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [studentId, user]);

  if (loading) {
    return (
      <div>
        <Skeleton active style={{ marginBottom: 16 }} />
        <Card style={{ borderRadius: 10, marginBottom: 16 }}><Skeleton active /></Card>
        <Card style={{ borderRadius: 10 }}><Skeleton active /></Card>
      </div>
    );
  }

  if (forbidden) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
      You don&apos;t have permission to view this student&apos;s marksheet.
    </div>
  );

  if (fetchError) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
      Failed to load marksheet data. Please try refreshing the page.
    </div>
  );

  if (!student) return <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>Student not found.</div>;

  const academicYears = [...new Set(groupedMarks.map((g) => g.exam?.academicYear).filter(Boolean))].sort().reverse();

  const filteredGroups = selectedYear === 'all'
    ? groupedMarks
    : groupedMarks.filter((g) => g.exam?.academicYear === selectedYear);

  const groupedByYear: Record<string, GroupedMarks[]> = {};
  filteredGroups.forEach((g) => {
    const yr = g.exam?.academicYear || 'Unknown';
    if (!groupedByYear[yr]) groupedByYear[yr] = [];
    groupedByYear[yr].push(g);
  });
  const sortedYears = Object.keys(groupedByYear).sort().reverse();

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/students"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined /> Marksheet
          </Title>
          <Text type="secondary">{student.name} — {student.admissionNo}</Text>
        </div>
      </div>

      {/* Year filter */}
      {academicYears.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <Select
            value={selectedYear}
            onChange={(v) => setSelectedYear(v ?? 'all')}
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'All Academic Years' },
              ...academicYears.map((yr) => ({ value: yr, label: yr })),
            ]}
          />
        </div>
      )}

      {/* Empty state */}
      {filteredGroups.length === 0 ? (
        <Card style={{ borderRadius: 10, textAlign: 'center', padding: '32px 24px' }}>
          <FileTextOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 12 }} />
          <div style={{ color: '#595959', fontWeight: 500, marginBottom: 4 }}>No marks recorded yet</div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Marks for this student haven&apos;t been entered. Go to an exam and use the marks entry page to record them.
          </Text>
        </Card>
      ) : (
        <>
          {sortedYears.map((yr) => (
            <div key={yr}>
              {/* Year divider */}
              {(() => {
                const cls = groupedByYear[yr][0]?.exam?.classId;
                const className = typeof cls === 'object' && cls ? (cls as { name: string }).name : null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
                    <div style={{ height: 1, flex: 1, background: '#f0f0f0' }} />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                      {className ? `${className} · ` : ''}Academic Year {yr}
                    </Text>
                    <div style={{ height: 1, flex: 1, background: '#f0f0f0' }} />
                  </div>
                );
              })()}

              {groupedByYear[yr].map((group) => (
                <Card key={group.exam?._id} style={{ borderRadius: 10, marginBottom: 16 }}>
                  {/* Exam header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong style={{ fontSize: 15 }}>{group.exam?.name}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 13, textTransform: 'capitalize' }}>
                        {group.exam?.type}{group.exam?.term ? ` · ${group.exam.term}` : ''}
                        {(() => {
                          const cls = group.exam?.classId;
                          const name = typeof cls === 'object' && cls ? (cls as { name: string }).name : null;
                          return name ? ` · ${name}` : '';
                        })()}
                      </Text>
                    </div>
                    <Space align="center">
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{group.percentage}%</div>
                        <Tag style={{ fontWeight: 700, color: getGradeColor(group.grade) }}>Grade: {group.grade}</Tag>
                      </div>
                      <Button
                        icon={<FilePdfOutlined />}
                        size="small"
                        style={{ borderRadius: 8 }}
                        onClick={() => openPdf([group], group.exam?.name ?? 'Marksheet')}
                      >
                        Download
                      </Button>
                    </Space>
                  </div>

                  {/* Marks table */}
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
                                {typeof subject === 'object' && (
                                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>({subject.code})</Text>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{mark.total}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#8c8c8c' }}>
                                {typeof subject === 'object' ? subject.passMarks : 33}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{mark.obtained}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: getGradeColor(resolveGrade(mark)) }}>
                                {resolveGrade(mark)}
                              </td>
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
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: 16, color: getGradeColor(group.grade) }}>
                            {group.grade}
                          </td>
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
            </div>
          ))}
        </>
      )}

      {/* PDF Drawer — shared by per-exam and Download All */}
      <Drawer
        title={
          <Space>
            <FilePdfOutlined />
            <span>{student.name} — {pdfTitle}</span>
          </Space>
        }
        open={!!pdfGroups}
        onClose={closePdf}
        size="large"
        styles={{ body: { padding: 0 } }}
      >
        {pdfGroups && student && (
          <MarksheetPDF student={student} groupedMarks={pdfGroups} tenant={tenant} />
        )}
      </Drawer>
    </div>
  );
}
