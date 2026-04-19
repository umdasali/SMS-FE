'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Class, Student, Attendance } from '@/types';
import { Button, Input, Card, Select, Tag, Avatar, Typography, Row, Col, Skeleton } from 'antd';
import { BarChartOutlined, SearchOutlined } from '@ant-design/icons';
import { getInitials, formatDate } from '@/lib/utils';

const { Title, Text } = Typography;

interface StudentAttendanceSummary {
  student: Student;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  percentage: number;
}

export default function AttendanceReportPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]!);
  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<{ data: { classes: Class[] } }>('/classes').then((res) => setClasses(res.data.data.classes));
  }, []);

  const loadReport = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get<{ data: { students: Student[] } }>(`/students?classId=${classId}&limit=100`),
        api.get<{ data: Attendance[] }>(`/attendance?classId=${classId}&startDate=${startDate}&endDate=${endDate}`),
      ]);
      const sts = studentsRes.data.data.students;
      const records = attendanceRes.data.data;
      const result: StudentAttendanceSummary[] = sts.map((student) => {
        let present = 0, absent = 0, late = 0, halfDay = 0;
        records.forEach((att) => {
          const rec = att.records.find((r) => {
            const sid = typeof r.studentId === 'object' ? (r.studentId as Student)._id : r.studentId;
            return sid === student._id;
          });
          if (rec) {
            if (rec.status === 'present') present++;
            else if (rec.status === 'absent') absent++;
            else if (rec.status === 'late') late++;
            else if (rec.status === 'half-day') halfDay++;
          }
        });
        const total = present + absent + late + halfDay;
        const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
        return { student, total, present, absent, late, halfDay, percentage };
      });
      setSummaries(result);
    } finally { setLoading(false); }
  };

  const filtered = summaries.filter((s) =>
    s.student.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  const overall = summaries.length > 0
    ? Math.round(summaries.reduce((acc, s) => acc + s.percentage, 0) / summaries.length)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined /> Attendance Report
        </Title>
        <Text type="secondary">View student-wise attendance summary</Text>
      </div>

      {/* Filters */}
      <Card style={{ borderRadius: 10, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Class</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select class"
              value={classId || undefined}
              onChange={(v) => setClassId(v)}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>From Date</Text>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>To Date</Text>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Col>
          <Col xs={24} sm={12} md={6} style={{ paddingTop: 22 }}>
            <Button type="primary" block loading={loading} disabled={!classId} onClick={loadReport} style={{ borderRadius: 8 }}>
              Generate Report
            </Button>
          </Col>
        </Row>
      </Card>

      {summaries.length > 0 && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Students', value: summaries.length, color: '#1d1d1d' },
              { label: 'Avg Attendance', value: `${overall}%`, color: overall >= 75 ? '#16a34a' : '#dc2626' },
              { label: 'Above 75%', value: summaries.filter((s) => s.percentage >= 75).length, color: '#16a34a' },
              { label: 'Below 75%', value: summaries.filter((s) => s.percentage < 75).length, color: '#dc2626' },
            ].map((s) => (
              <Col xs={12} lg={6} key={s.label}>
                <Card style={{ borderRadius: 10 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>{s.label}</Text>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ marginBottom: 16 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#d9d9d9' }} />}
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>

          <Card style={{ borderRadius: 10, overflowX: 'auto' }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Student Attendance — {formatDate(startDate)} to {formatDate(endDate)}
            </Title>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Student</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Total Days</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>Present</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>Absent</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#ca8a04' }}>Late</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#ea580c' }}>Half Day</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: '8px 12px' }}>
                        <Skeleton active paragraph={false} />
                      </td>
                    </tr>
                  ))
                ) : filtered.map(({ student, total, present, absent, late, halfDay, percentage }) => (
                  <tr key={student._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar size={32} src={student.photo || undefined} style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600, fontSize: 12 }}>
                          {!student.photo && getInitials(student.name)}
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{student.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{student.admissionNo}</Text>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{total}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>{present}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>{absent}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#ca8a04' }}>{late}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#ea580c' }}>{halfDay}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <Tag color={percentage >= 75 ? 'success' : 'error'} style={{ fontWeight: 700 }}>
                        {percentage}%
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {!classId && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8c8c8c' }}>
          <BarChartOutlined style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }} />
          <Text type="secondary">Select a class and date range, then click &quot;Generate Report&quot;.</Text>
        </div>
      )}
    </div>
  );
}
