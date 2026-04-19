'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Exam, Student, Subject, Mark } from '@/types';
import {
  Button, Card, Alert, Typography, Skeleton, InputNumber, Tag, Space,
  Drawer, Statistic, Row, Col, Tooltip, Badge, Popconfirm, App,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, FilePdfOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { Teacher } from '@/types';

const MarksheetPDF = dynamic(() => import('@/components/pdf/MarksheetPDF'), { ssr: false });

const { Title, Text } = Typography;

interface MarkEntry { studentId: string; subjectId: string; obtained: number; total: number }

interface GroupedMarks {
  exam: Exam;
  marks: Mark[];
  total: number;
  obtained: number;
  percentage: number;
  grade: string;
}

function calcGrade(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

function gradeColor(g: string) {
  if (g === 'A+' || g === 'A') return '#16a34a';
  if (g === 'B+' || g === 'B') return '#2563eb';
  if (g === 'C+' || g === 'C' || g === 'D') return '#d97706';
  return '#dc2626';
}

export default function MarksEntryPage() {
  const { message } = App.useApp();
  const { examId } = useParams<{ examId: string }>();
  const { tenant, user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<Set<string> | null>(null);
  // marks[studentId][subjectId] = obtained score
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Marksheet drawer
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const teacherFetch = isTeacher
      ? api.get<{ data: Teacher }>('/teachers/me').catch(() => ({ data: { data: null } }))
      : Promise.resolve({ data: { data: null } });

    api.get<{ data: { exams: Exam[] } }>(`/exams?_id=${examId}`)
      .then(async (res) => {
        const e = res.data?.data?.exams?.[0];
        if (!e) return;
        setExam(e);
        const classId = typeof e.classId === 'object' ? e.classId?._id : e.classId;

        const [sRes, subRes, marksRes, teacherRes] = await Promise.all([
          api.get<{ data: { students: Student[] } }>(`/students?classId=${classId}&limit=200`),
          api.get<{ data: { subjects: Subject[] } }>(`/subjects?classId=${classId}`),
          api.get<{ data: Mark[] }>(`/exams/marks?examId=${examId}`).catch(() => ({ data: { data: [] } })),
          teacherFetch,
        ]);

        if (isTeacher && teacherRes.data.data) {
          const teacher = teacherRes.data.data as Teacher;
          const ids = new Set(
            (teacher.subjectIds ?? []).map((s) => (typeof s === 'object' ? s._id : s))
          );
          setAssignedSubjectIds(ids);
        }

        const studentList: Student[] = sRes.data?.data?.students ?? [];
        const subjectList: Subject[] = subRes.data?.data?.subjects ?? [];
        const savedMarks: Mark[] = marksRes.data?.data ?? [];

        setStudents(studentList);
        setSubjects(subjectList);

        // Build marks map — init to 0 then overlay saved values
        const init: Record<string, Record<string, number>> = {};
        studentList.forEach((s) => {
          init[s._id] = {};
          subjectList.forEach((sub) => { init[s._id]![sub._id] = 0; });
        });

        savedMarks.forEach((m) => {
          const sid = typeof m.studentId === 'object' ? (m.studentId as Student)._id : m.studentId;
          const subid = typeof m.subjectId === 'object' ? (m.subjectId as Subject)._id : m.subjectId;
          if (init[sid] !== undefined) {
            init[sid]![subid] = m.obtained ?? 0;
          }
        });

        setMarks(init);
      })
      .catch(() => setError('Failed to load exam data.'))
      .finally(() => setLoading(false));
  }, [examId, isTeacher]);

  const setMark = (studentId: string, subjectId: string, val: number) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [subjectId]: val } }));
  };

  const isSubjectAssigned = (subjectId: string) =>
    !assignedSubjectIds || assignedSubjectIds.has(subjectId);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const entries: MarkEntry[] = [];
      students.forEach((s) => {
        subjects.forEach((sub) => {
          if (!isSubjectAssigned(sub._id)) return;
          const obtained = marks[s._id]?.[sub._id] ?? 0;
          entries.push({ studentId: s._id, subjectId: sub._id, obtained, total: sub.fullMarks });
        });
      });
      await api.post('/exams/marks/bulk', { examId, marks: entries });
      message.success('Marks saved successfully');
    } catch {
      setError('Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Build GroupedMarks for a single student for the marksheet drawer
  const buildGroupedMarks = (student: Student): GroupedMarks[] => {
    if (!exam) return [];
    const studentMarks = subjects.map<Mark>((sub) => ({
      _id: `${student._id}-${sub._id}`,
      tenantId: '',
      examId: exam as Exam,
      studentId: student,
      subjectId: sub,
      obtained: marks[student._id]?.[sub._id] ?? 0,
      total: sub.fullMarks,
      grade: calcGrade(
        sub.fullMarks > 0
          ? Math.round(((marks[student._id]?.[sub._id] ?? 0) / sub.fullMarks) * 100)
          : 0
      ),
      createdAt: new Date().toISOString(),
    }));
    const total = studentMarks.reduce((s, m) => s + m.total, 0);
    const obtained = studentMarks.reduce((s, m) => s + m.obtained, 0);
    const percentage = total > 0 ? Math.round((obtained / total) * 100) : 0;
    return [{ exam, marks: studentMarks, total, obtained, percentage, grade: calcGrade(percentage) }];
  };

  const openMarksheet = (student: Student) => {
    setDrawerStudent(student);
    setDrawerOpen(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      </div>
    );
  }

  if (!exam) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Text type="secondary">Exam not found.</Text></div>;
  }

  // ── Summary per student ──────────────────────────────────────────────────────
  const studentSummaries = students.map((s) => {
    const obtained = subjects.reduce((sum, sub) => sum + (marks[s._id]?.[sub._id] ?? 0), 0);
    const total = subjects.reduce((sum, sub) => sum + sub.fullMarks, 0);
    const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
    return { student: s, obtained, total, pct, grade: calcGrade(pct), passed: pct >= 33 };
  });

  const passCount = studentSummaries.filter((s) => s.passed).length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/exams"><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0 }}>Enter Marks</Title>
          <Text type="secondary">{exam.name} — {exam.academicYear}</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            style={{ borderRadius: 8 }}
          >
            {saving ? 'Saving…' : 'Save Marks'}
          </Button>
        </Space>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          title={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
          onClose={() => setError(null)}
        />
      )}

      {students.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48, borderRadius: 10 }}>
          <Text type="secondary">No students found for this class.</Text>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 10 }}>
                <Statistic title="Students" value={students.length} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 10 }}>
                <Statistic title="Subjects" value={subjects.length} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 10 }}>
                <Statistic
                  title="Passed"
                  value={passCount}
                  suffix={`/ ${students.length}`}
                  styles={{ content: { color: '#16a34a' } }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 10 }}>
                <Statistic
                  title="Failed"
                  value={students.length - passCount}
                  suffix={`/ ${students.length}`}
                  styles={{ content: { color: '#dc2626' } }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Marks Table */}
          <Card
            style={{ borderRadius: 10, marginBottom: 16 }}
            title={
              <Text strong>
                Marks Entry — {students.length} student{students.length !== 1 ? 's' : ''} × {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </Text>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{
                      padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                      minWidth: 180, position: 'sticky', left: 0, background: '#fafafa', zIndex: 1,
                    }}>
                      Student
                    </th>
                    {subjects.map((sub) => (
                      <th key={sub._id} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, minWidth: 110 }}>
                        {sub.name}
                        <div style={{ fontSize: 11, fontWeight: 400, color: '#8c8c8c' }}>
                          {sub.code} · /{sub.fullMarks}
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, minWidth: 100 }}>
                      Total
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, minWidth: 80 }}>
                      %
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, minWidth: 80 }}>
                      Grade
                    </th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, minWidth: 110 }}>
                      Report
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map(({ student: s, obtained, total, pct, grade }) => (
                    <tr
                      key={s._id}
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      {/* Student name — sticky */}
                      <td style={{
                        padding: '8px 12px', position: 'sticky', left: 0,
                        background: '#fff', zIndex: 1,
                      }}>
                        <Text strong style={{ display: 'block', fontSize: 13 }}>{s.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{s.rollNo || s.admissionNo}</Text>
                      </td>

                      {/* Subject score inputs */}
                      {subjects.map((sub) => (
                        <td key={sub._id} style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <InputNumber
                            min={0}
                            max={sub.fullMarks}
                            value={marks[s._id]?.[sub._id] ?? 0}
                            onChange={(val) => setMark(s._id, sub._id, val ?? 0)}
                            disabled={!isSubjectAssigned(sub._id)}
                            style={{ width: 80, opacity: isSubjectAssigned(sub._id) ? 1 : 0.4 }}
                            size="small"
                          />
                        </td>
                      ))}

                      {/* Total */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>
                        {obtained} <Text type="secondary" style={{ fontWeight: 400 }}>/ {total}</Text>
                      </td>

                      {/* Percentage */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>
                        {pct}%
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <Tag style={{ fontWeight: 700, color: gradeColor(grade), borderColor: gradeColor(grade) }}>
                          {grade}
                        </Tag>
                      </td>

                      {/* Marksheet button */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <Space size={4}>
                          <Tooltip title="Preview marksheet">
                            <Button
                              size="small"
                              icon={<FilePdfOutlined />}
                              onClick={() => openMarksheet(s)}
                            >
                              Sheet
                            </Button>
                          </Tooltip>
                          <Tooltip title="Full marksheet page">
                            <Link href={`/marksheet/${s._id}`} target="_blank">
                              <Button size="small" icon={<FileTextOutlined />} />
                            </Link>
                          </Tooltip>
                          <Popconfirm
                            title="Clear Marks"
                            description="Reset this student's marks to 0?"
                            onConfirm={() => {
                              setMarks((prev) => {
                                const m = { ...prev };
                                m[s._id] = {};
                                subjects.forEach((sub) => m[s._id][sub._id] = 0);
                                return m;
                              });
                            }}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Tooltip title="Clear marks">
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Tooltip>
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Generate All Marksheets section */}
          <Card
            style={{ borderRadius: 10 }}
            title={
              <Space>
                <DownloadOutlined />
                <Text strong>Generate Marksheets</Text>
              </Space>
            }
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Click on a student to preview and download their individual marksheet as a PDF.
            </Text>
            <Row gutter={[12, 12]}>
              {studentSummaries.map(({ student: s, pct, grade, passed }) => (
                <Col key={s._id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => openMarksheet(s)}
                    style={{ borderRadius: 8, cursor: 'pointer', borderColor: passed ? '#f0fdf4' : '#fff5f5' }}
                    styles={{ body: { padding: '10px 14px' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge
                        dot
                        color={passed ? '#16a34a' : '#dc2626'}
                        style={{ top: 2 }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: passed ? '#f0fdf4' : '#fff5f5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13,
                          color: passed ? '#16a34a' : '#dc2626',
                        }}>
                          {grade}
                        </div>
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 13, display: 'block' }} ellipsis>{s.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{pct}% · {s.rollNo || s.admissionNo}</Text>
                      </div>
                      <FilePdfOutlined style={{ color: '#8c8c8c' }} />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}

      {/* Marksheet PDF Drawer */}
      <Drawer
        title={
          <Space>
            <FilePdfOutlined />
            <span>
              Marksheet — {drawerStudent?.name}
            </span>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="large"
        styles={{ body: { padding: 0 } }}
        extra={
          drawerStudent && (
            <Link href={`/marksheet/${drawerStudent._id}`} target="_blank">
              <Button icon={<FileTextOutlined />} size="small">Full Page</Button>
            </Link>
          )
        }
      >
        {drawerStudent && exam && (
          <MarksheetPDF
            student={drawerStudent}
            groupedMarks={buildGroupedMarks(drawerStudent)}
            tenant={tenant}
          />
        )}
      </Drawer>
    </div>
  );
}
