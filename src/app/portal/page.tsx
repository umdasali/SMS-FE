'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, Announcement } from '@/types';
import api from '@/lib/api';
import { Card, Col, Row, Tag, Typography, Skeleton, Empty } from 'antd';
import {
  NotificationOutlined, FileTextOutlined, CalendarOutlined,
  DollarOutlined, SafetyCertificateOutlined, TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const { Title, Text } = Typography;

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
}

const audienceColor: Record<string, string> = { all: 'green', students: 'blue', teachers: 'purple' };

const STUDENT_QUICK_LINKS = [
  { href: '/portal/marksheet',    label: 'Marksheet',    icon: <FileTextOutlined /> },
  { href: '/portal/exams',        label: 'Exams',        icon: <TrophyOutlined /> },
  { href: '/portal/schedule',     label: 'Schedule',     icon: <CalendarOutlined /> },
  { href: '/portal/fees',         label: 'Fees',         icon: <DollarOutlined /> },
  { href: '/portal/certificates', label: 'Certs',        icon: <SafetyCertificateOutlined /> },
  { href: '/portal/profile',      label: 'Profile',      icon: <UserOutlined /> },
];

const TEACHER_QUICK_LINKS = [
  { href: '/portal/profile',  label: 'Profile',  icon: <UserOutlined /> },
  { href: '/portal/schedule', label: 'Schedule', icon: <CalendarOutlined /> },
];

export default function PortalHomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [examCount, setExamCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        const annRes = await api.get<{ data: { announcements: Announcement[] } }>('/announcements?limit=10');
        setAnnouncements(annRes.data.data.announcements);

        if (user.role === 'student') {
          const sRes = await api.get<{ data: Student }>('/students/me');
          const s = sRes.data.data;
          setStudent(s);

          const [attRes, markRes] = await Promise.all([
            api.get<{ data: { stats: AttendanceStats } }>(`/attendance/student/${s._id}`),
            api.get<{ data: { byExam: Record<string, unknown[]> } }>(`/exams/marks/student/${s._id}`),
          ]);
          setAttendance(attRes.data.data.stats);
          setExamCount(Object.keys(markRes.data.data?.byExam ?? {}).length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const attendancePct =
    attendance && attendance.total > 0
      ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100)
      : null;

  const quickLinks = user?.role === 'student' ? STUDENT_QUICK_LINKS : TEACHER_QUICK_LINKS;

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
        {user?.role === 'student' && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[1, 2, 3].map((i) => (
              <Col xs={8} key={i}>
                <Card styles={{ body: { padding: 16 } }}><Skeleton active paragraph={{ rows: 1 }} /></Card>
              </Col>
            ))}
          </Row>
        )}
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </Title>
        <Text type="secondary">Here&apos;s your overview for today.</Text>
      </div>

      {/* Student stats */}
      {user?.role === 'student' && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 10 }} styles={{ body: { padding: '14px 16px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Attendance
                  </Text>
                  <div style={{
                    fontSize: 26, fontWeight: 700, marginTop: 2,
                    color: attendancePct !== null && attendancePct < 75 ? '#ef4444' : '#16a34a',
                  }}>
                    {attendancePct !== null ? `${attendancePct}%` : '—'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {attendance ? `${attendance.present} days present` : 'No records'}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card style={{ borderRadius: 10 }} styles={{ body: { padding: '14px 16px' } }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Exams
              </Text>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{examCount}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>Results available</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card style={{ borderRadius: 10 }} styles={{ body: { padding: '14px 16px' } }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Class
              </Text>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>
                {student && typeof student.classId === 'object' ? student.classId?.name : '—'}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {student ? `#${student.admissionNo}` : ''}
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* Quick links */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {quickLinks.map((link) => (
          <Col xs={8} sm={4} key={link.href}>
            <Link href={link.href}>
              <Card
                hoverable
                style={{ borderRadius: 10, textAlign: 'center' }}
                styles={{ body: { padding: '14px 8px' } }}
              >
                <div style={{ fontSize: 20, color: 'var(--ant-color-primary)', marginBottom: 6 }}>
                  {link.icon}
                </div>
                <Text style={{ fontSize: 12, fontWeight: 500 }}>{link.label}</Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Announcements */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationOutlined />
            <span>Announcements</span>
          </div>
        }
        style={{ borderRadius: 10 }}
        styles={{ body: { padding: '4px 16px 16px' } }}
      >
        {announcements.length === 0 ? (
          <Empty
            description="No announcements right now"
            style={{ margin: '24px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>
            {announcements.map((a, i) => (
              <div
                key={a._id}
                style={{
                  padding: '14px 0',
                  borderBottom: i < announcements.length - 1 ? '1px solid #f5f5f5' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--ant-color-primary-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ant-color-primary)', fontSize: 16,
                  }}>
                    <NotificationOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: 13 }}>{a.title}</Text>
                      <Tag
                        color={audienceColor[a.targetAudience] || 'default'}
                        style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0 }}
                      >
                        {a.targetAudience}
                      </Tag>
                    </div>
                    <Text style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{a.content}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      {formatDate(a.createdAt)}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
