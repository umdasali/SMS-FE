'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Class, Student, AttendanceStatus } from '@/types';
import {
  Button, Card, Select, Typography, Space, Alert, Avatar, Tag, Row, Col, DatePicker,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, SaveOutlined,
} from '@ant-design/icons';
import { getInitials, formatDate } from '@/lib/utils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type AttendanceEntry = { studentId: string; status: AttendanceStatus; note: string };

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { value: 'present', label: 'Present', icon: <CheckCircleOutlined />, color: '#16a34a', bg: '#f0fdf4' },
  { value: 'absent', label: 'Absent', icon: <CloseCircleOutlined />, color: '#dc2626', bg: '#fef2f2' },
  { value: 'late', label: 'Late', icon: <ClockCircleOutlined />, color: '#ca8a04', bg: '#fefce8' },
  { value: 'half-day', label: 'Half Day', icon: <ClockCircleOutlined />, color: '#ea580c', bg: '#fff7ed' },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<{ data: { classes: Class[] } }>('/classes').then((res) => setClasses(res.data.data.classes));
  }, []);

  const loadStudents = async (cId: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: { students: Student[] } }>(`/students?classId=${cId}&limit=100`);
      const sts = res.data.data.students;
      setStudents(sts);
      const init: Record<string, AttendanceEntry> = {};
      sts.forEach((s) => { init[s._id] = { studentId: s._id, status: 'present', note: '' }; });
      setEntries(init);
    } finally { setLoading(false); }
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => ({ ...prev, [studentId]: { ...prev[studentId]!, status } }));
  };

  const handleSave = async () => {
    if (!classId || !date) return;
    setSaving(true); setSuccess(false);
    try {
      await api.post('/attendance', { classId, sectionId, date, records: Object.values(entries) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const selectedClass = classes.find((c) => c._id === classId);
  const counts = Object.values(entries).reduce(
    (acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Mark Attendance</Title>
        <Text type="secondary">Record daily attendance for your class</Text>
      </div>

      {/* Filters */}
      <Card style={{ borderRadius: 10, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date</Text>
              <DatePicker
                value={dayjs(date)}
                onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0])}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Class</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select class"
                onChange={(v) => { setClassId(v); setSectionId(''); loadStudents(v); }}
                options={classes.map((c) => ({ value: c._id, label: c.name }))}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Section</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="All"
                value={sectionId || undefined}
                onChange={setSectionId}
                allowClear
                options={selectedClass?.sections.map((s) => ({ value: s.name, label: s.name })) ?? []}
              />
            </div>
          </Col>
          {students.length > 0 && (
            <Col xs={24} sm={12} md={6}>
              <Space wrap>
                {STATUS_OPTIONS.map((opt) => (
                  <Tag key={opt.value} color="default" style={{ fontSize: 12 }}>
                    {opt.label}: {counts[opt.value] || 0}
                  </Tag>
                ))}
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      {success && (
        <Alert title="Attendance saved successfully!" type="success" showIcon style={{ marginBottom: 16, borderRadius: 8 }} closable />
      )}

      {loading ? (
        <Card style={{ borderRadius: 10 }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ height: 60, background: '#f5f5f5', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
            ))}
          </Space>
        </Card>
      ) : students.length > 0 ? (
        <>
          <Card
            title={`${students.length} Students — ${formatDate(date)}`}
            style={{ borderRadius: 10, marginBottom: 16 }}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size={8}>
              {students.map((student) => {
                const entry = entries[student._id];
                return (
                  <div
                    key={student._id}
                    className="attendance-row"
                  >
                    <Avatar src={student.photo || undefined} style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600, flexShrink: 0 }}>
                      {getInitials(student.name)}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 13, display: 'block' }}>{student.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{student.rollNo || student.admissionNo}</Text>
                    </div>
                    <div className="attendance-row-actions">
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = entry?.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setStatus(student._id, opt.value)}
                            style={{
                              padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                              border: `1px solid ${isActive ? opt.color : '#e8e8e8'}`,
                              background: isActive ? opt.bg : '#fff',
                              color: isActive ? opt.color : '#8c8c8c',
                              cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: 4,
                              flex: '1 1 auto', justifyContent: 'center'
                            }}
                          >
                            {opt.icon} <span className="status-label">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Space>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary" size="large"
              icon={<SaveOutlined />} loading={saving}
              onClick={handleSave} style={{ borderRadius: 8, width: '100%', maxWidth: 160 }}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>

          <style>{`
            .attendance-row {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 14px;
              border-radius: 8px;
              border: 1px solid #f0f0f0;
              background: #fff;
              transition: all 0.2s;
            }
            .attendance-row-actions {
              display: flex;
              gap: 6px;
              flex-wrap: wrap;
            }
            @media (max-width: 768px) {
              .attendance-row {
                flex-wrap: wrap;
              }
              .attendance-row-actions {
                width: 100%;
                margin-top: 4px;
              }
            }
            @media (max-width: 480px) {
              .attendance-row {
                padding: 12px;
                gap: 10px;
              }
              .status-label { font-size: 10px; }
              .attendance-row-actions button {
                padding: 6px 4px !important;
                font-size: 10px !important;
                flex: 1 1 45%;
              }
            }
          `}</style>
        </>
      ) : classId ? (
        <Card style={{ textAlign: 'center', padding: 40, borderRadius: 10 }}>
          <Text type="secondary">No students found in this class.</Text>
        </Card>
      ) : (
        <Card style={{ textAlign: 'center', padding: 40, borderRadius: 10 }}>
          <Text type="secondary">Select a class to start marking attendance.</Text>
        </Card>
      )}
    </div>
  );
}
