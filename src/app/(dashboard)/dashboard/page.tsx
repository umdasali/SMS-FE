'use client';

import { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Typography, Skeleton, Empty, Modal } from 'antd';
import {
  TeamOutlined, UserOutlined, BookOutlined, RiseOutlined, CalendarOutlined,
  ClockCircleOutlined, ArrowRightOutlined, NotificationOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Announcement } from '@/types';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

const statConfig = [
  {
    key: 'totalStudents' as const,
    title: 'Total Students',
    icon: <TeamOutlined />,
    color: '#2563eb',
    bg: '#eff6ff',
    getValue: (s: DashboardStats) => s.counts.totalStudents,
    getDesc: (s: DashboardStats) => `${s.counts.activeStudents} active`,
  },
  {
    key: 'totalTeachers' as const,
    title: 'Teachers',
    icon: <UserOutlined />,
    color: '#16a34a',
    bg: '#f0fdf4',
    getValue: (s: DashboardStats) => s.counts.totalTeachers,
    getDesc: () => 'Staff members',
  },
  {
    key: 'totalClasses' as const,
    title: 'Classes',
    icon: <BookOutlined />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    getValue: (s: DashboardStats) => s.counts.totalClasses,
    getDesc: () => 'Active classes',
  },
  {
    key: 'attendance' as const,
    title: "Today's Attendance",
    icon: <RiseOutlined />,
    color: '#ea580c',
    bg: '#fff7ed',
    getValue: (s: DashboardStats) => `${s.attendance.todayPercentage}%`,
    getDesc: () => 'Present today',
  },
];

const examTypeColor: Record<string, string> = {
  unit: 'blue', mid: 'orange', final: 'red', practical: 'green', assignment: 'purple',
};

function getDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function UrgencyBadge({ days }: { days: number }) {
  if (days === 0) return <Tag color="error" icon={<ClockCircleOutlined />} style={{ fontWeight: 600 }}>Today</Tag>;
  if (days === 1) return <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 600 }}>Tomorrow</Tag>;
  if (days <= 7) return <Tag color="orange" style={{ fontWeight: 600 }}>in {days} days</Tag>;
  return <Tag color="default" style={{ fontWeight: 500 }}>in {days} days</Tag>;
}

function urgencyBarColor(days: number): string {
  if (days === 0) return '#dc2626';
  if (days === 1) return '#ea580c';
  if (days <= 7) return '#d97706';
  return '#2563eb';
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8,
      padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <Text type="secondary" style={{ fontSize: 11 }}>{label ? formatDate(label) : ''}</Text>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{payload[0].value}% attendance</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncement, setReadAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    api.get<{ data: DashboardStats }>('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<{ data: { announcements: Announcement[] } }>('/announcements?limit=5')
      .then((res) => setRecentAnnouncements(res.data.data.announcements))
      .catch(console.error);
  }, []);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={12} lg={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}><Card style={{ height: 300 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
          <Col xs={24} lg={8}><Card style={{ height: 300 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Title>
        <Text type="secondary">Here&apos;s what&apos;s happening at your institution today.</Text>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statConfig.map((cfg) => {
          const value = stats ? cfg.getValue(stats) : '—';
          const desc = stats ? cfg.getDesc(stats) : '';
          return (
            <Col xs={24} sm={12} lg={6} key={cfg.key}>
              <Card
                style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}
                styles={{ body: { padding: '18px 20px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {cfg.title}
                    </Text>
                    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: '6px 0 4px' }}>
                      {value}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{desc}</Text>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: cfg.color, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Chart + Upcoming Exams */}
      <Row gutter={[16, 16]} style={{ marginBottom: recentAnnouncements.length ? 16 : 0 }}>
        {/* Attendance Chart */}
        <Col xs={24} lg={16}>
          <Card
            title="Attendance Trend"
            extra={<Tag color="blue">{stats?.attendance.todayPercentage ?? 0}% today</Tag>}
            style={{ borderRadius: 10 }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
              Last 7 days attendance percentage
            </Text>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={stats?.attendance.trend || []}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#8c8c8c' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8c8c8c' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#attGrad)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Upcoming Exams */}
        <Col xs={24} lg={8}>
          <Card
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />Upcoming Exams</span>}
            extra={
              stats?.upcomingExams.length
                ? <Link href="/exams"><ArrowRightOutlined style={{ color: '#8c8c8c' }} /></Link>
                : null
            }
            style={{ borderRadius: 10 }}
            styles={{ body: { padding: '8px 16px 12px' } }}
          >
            {!stats?.upcomingExams.length ? (
              <Empty description="No upcoming exams scheduled" style={{ margin: '24px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {stats.upcomingExams.map((exam) => {
                  const days = exam.startDate ? getDaysUntil(exam.startDate) : 99;
                  const barColor = urgencyBarColor(days);
                  const cls = typeof exam.classId === 'object' && exam.classId
                    ? (exam.classId as { name: string }).name
                    : null;
                  return (
                    <Link href="/exams" key={exam._id} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 0',
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Urgency bar */}
                        <div style={{
                          width: 3, minHeight: 40, borderRadius: 4,
                          background: barColor, flexShrink: 0, marginTop: 2,
                        }} />

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.4', color: '#111827' }}>
                            {exam.name}
                          </Text>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                            {cls && (
                              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{cls}</Text>
                            )}
                            {cls && <span style={{ fontSize: 10, color: '#d1d5db' }}>·</span>}
                            <Tag
                              color={examTypeColor[exam.type] ?? 'default'}
                              style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', textTransform: 'capitalize', margin: 0 }}
                            >
                              {exam.type}
                            </Tag>
                            {exam.academicYear && (
                              <>
                                <span style={{ fontSize: 10, color: '#d1d5db' }}>·</span>
                                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{exam.academicYear}</Text>
                              </>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
                            {exam.startDate ? formatDate(exam.startDate) : 'Date TBD'}
                            {exam.endDate && exam.endDate !== exam.startDate
                              ? ` – ${formatDate(exam.endDate)}`
                              : ''}
                          </Text>
                        </div>

                        {/* Days badge */}
                        <div style={{ flexShrink: 0, paddingTop: 2 }}>
                          <UrgencyBadge days={days} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Announcements */}
      {recentAnnouncements.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card
              title={<span><NotificationOutlined style={{ marginRight: 8 }} />Announcements</span>}
              extra={<Link href="/announcements"><ArrowRightOutlined style={{ color: '#8c8c8c' }} /></Link>}
              style={{ borderRadius: 10 }}
              styles={{ body: { padding: '4px 16px 12px' } }}
            >
              {recentAnnouncements.map((a, i) => {
                const truncated = a.content.length > 100;
                return (
                  <div
                    key={a._id}
                    onClick={() => setReadAnnouncement(a)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < recentAnnouncements.length - 1 ? '1px solid #f5f5f5' : 'none',
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: a.isActive ? 'var(--ant-color-primary-bg)' : '#f5f5f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: a.isActive ? 'var(--ant-color-primary)' : '#bfbfbf', fontSize: 14,
                    }}>
                      <NotificationOutlined />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 13 }}>{a.title}</Text>
                        <Tag
                          color={a.targetAudience === 'all' ? 'green' : a.targetAudience === 'students' ? 'blue' : 'purple'}
                          style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0 }}
                        >
                          {a.targetAudience}
                        </Tag>
                        {!a.isActive && (
                          <Tag style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0 }}>Hidden</Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        {truncated ? `${a.content.slice(0, 100)}…` : a.content}
                        {truncated && (
                          <Text style={{ fontSize: 12, color: 'var(--ant-color-primary)', marginLeft: 4 }}>
                            Read more
                          </Text>
                        )}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, paddingTop: 2 }}>
                      {formatDate(a.createdAt)}
                    </Text>
                  </div>
                );
              })}
            </Card>
          </Col>
        </Row>
      )}

      {/* Full announcement reader */}
      <Modal
        open={!!readAnnouncement}
        onCancel={() => setReadAnnouncement(null)}
        footer={null}
        title={
          readAnnouncement && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: 24 }}>
              <span>{readAnnouncement.title}</span>
              <Tag
                color={readAnnouncement.targetAudience === 'all' ? 'green' : readAnnouncement.targetAudience === 'students' ? 'blue' : 'purple'}
                style={{ fontSize: 11, margin: 0 }}
              >
                {readAnnouncement.targetAudience}
              </Tag>
            </div>
          )
        }
        width={520}
      >
        {readAnnouncement && (
          <div style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', display: 'block' }}>
              {readAnnouncement.content}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
              Posted on {formatDate(readAnnouncement.createdAt)}
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
}
