'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, Exam, Class } from '@/types';
import api from '@/lib/api';
import { Card, Tag, Typography, Skeleton, Empty, Badge } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';

const { Title, Text } = Typography;

const EXAM_TYPE_COLOR: Record<string, string> = {
  unit: 'blue',
  mid: 'orange',
  final: 'red',
  practical: 'purple',
  assignment: 'cyan',
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function PortalExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get<{ data: Student }>('/students/me').then(async (sRes) => {
      const student = sRes.data.data;
      const classId = typeof student.classId === 'object' ? student.classId?._id : student.classId;
      if (!classId) { setLoading(false); return; }

      const res = await api.get<{ data: { exams: Exam[] } }>(`/exams?classId=${classId}&limit=50`);
      const all = res.data.data.exams ?? [];

      // Split: upcoming (startDate >= today or no date) vs past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = all.filter(e => !e.startDate || new Date(e.startDate) >= today);
      const past = all.filter(e => e.startDate && new Date(e.startDate) < today);
      // Sort upcoming by startDate asc, past by desc
      upcoming.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
      past.sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
      setExams([...upcoming, ...past]);
    }).finally(() => setLoading(false));
  }, [user]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = exams.filter(e => !e.startDate || new Date(e.startDate) >= today);
  const past = exams.filter(e => e.startDate && new Date(e.startDate) < today);

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined /> Exams
        </Title>
        <Text type="secondary">Your class exam schedule and history</Text>
      </div>

      {exams.length === 0 ? (
        <Empty description="No exams scheduled yet." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', display: 'block', marginBottom: 12 }}>
                Upcoming · {upcoming.length}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(exam => {
                  const days = daysUntil(exam.startDate);
                  const isToday = days === 0;
                  const isSoon = days !== null && days <= 3 && days > 0;
                  return (
                    <Card
                      key={exam._id}
                      size="small"
                      style={{
                        borderRadius: 10,
                        borderLeft: `4px solid ${isToday ? '#dc2626' : isSoon ? '#f59e0b' : '#3b82f6'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text strong style={{ fontSize: 14 }}>{exam.name}</Text>
                            <Tag color={EXAM_TYPE_COLOR[exam.type] ?? 'default'} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                              {exam.type}
                            </Tag>
                            {exam.term && <Tag style={{ fontSize: 11 }}>{exam.term}</Tag>}
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                            {exam.startDate && (
                              <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CalendarOutlined /> {formatDate(exam.startDate)}
                                {exam.endDate && exam.endDate !== exam.startDate && ` – ${formatDate(exam.endDate)}`}
                              </Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <BookOutlined /> {typeof exam.classId === 'object' ? (exam.classId as Class).name : ''}
                            </Text>
                          </div>
                        </div>
                        {days !== null && (
                          <Badge
                            count={
                              isToday ? 'Today' :
                              days < 0 ? '' :
                              `${days}d left`
                            }
                            style={{
                              background: isToday ? '#dc2626' : isSoon ? '#f59e0b' : '#3b82f6',
                              fontSize: 11, fontWeight: 600,
                            }}
                          />
                        )}
                        {!exam.startDate && (
                          <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: 11 }}>
                            Date TBD
                          </Tag>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', display: 'block', marginBottom: 12 }}>
                Past · {past.length}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map(exam => (
                  <Card
                    key={exam._id}
                    size="small"
                    style={{ borderRadius: 10, borderLeft: '4px solid #e5e7eb', opacity: 0.75 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 14 }}>{exam.name}</Text>
                          <Tag color={EXAM_TYPE_COLOR[exam.type] ?? 'default'} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                            {exam.type}
                          </Tag>
                        </div>
                        {exam.startDate && (
                          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <CalendarOutlined /> {formatDate(exam.startDate)}
                          </Text>
                        )}
                      </div>
                      <Tag color="default" style={{ fontSize: 11 }}>Completed</Tag>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
