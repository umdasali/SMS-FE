'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, Routine, DaySchedule, Subject, Teacher } from '@/types';
import api from '@/lib/api';
import { Card, Tag, Typography, Skeleton, Empty } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const DAY_COLOR: Record<string, string> = {
  Monday: '#4f46e5', Tuesday: '#0891b2', Wednesday: '#059669',
  Thursday: '#d97706', Friday: '#dc2626', Saturday: '#7c3aed',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Returns "2025-2026" based on current date (new year starts in April) */
function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const start = month >= 4 ? year : year - 1;
  return `${start}-${start + 1}`;
}

export default function PortalSchedulePage() {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get<{ data: Student }>('/students/me').then(async (sRes) => {
      const student = sRes.data.data;
      const classId = typeof student.classId === 'object' ? student.classId?._id : student.classId;
      if (!classId) { setLoading(false); setNotFound(true); return; }

      const year = currentAcademicYear();
      setAcademicYear(year);

      const params = new URLSearchParams({ classId, academicYear: year });
      if (student.sectionId) params.set('sectionId', student.sectionId);

      try {
        const res = await api.get<{ data: Routine | null }>(`/routines?${params}`);
        if (res.data.data) {
          setRoutine(res.data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined /> Class Schedule
        </Title>
        <Text type="secondary">
          Your weekly timetable{academicYear ? ` · ${academicYear}` : ''}
        </Text>
      </div>

      {notFound || !routine ? (
        <Empty description="No routine has been set for your class yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {DAYS.map(day => {
            const daySchedule = routine.schedule.find((d: DaySchedule) => d.day === day);
            const periods = daySchedule?.periods ?? [];
            const color = DAY_COLOR[day];

            return (
              <Card
                key={day}
                size="small"
                style={{ borderRadius: 12, borderTop: `3px solid ${color}` }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: periods.length ? 12 : 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color, flexShrink: 0,
                  }} />
                  <Text strong style={{ fontSize: 13, color }}>{day}</Text>
                  {periods.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>No classes</Text>
                  )}
                </div>

                {periods.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {periods.map((period, idx) => {
                      const subject = period.subjectId as Subject | undefined;
                      const teacher = period.teacherId as Teacher | undefined;
                      return (
                        <div
                          key={idx}
                          style={{
                            background: `${color}10`,
                            border: `1px solid ${color}30`,
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}
                        >
                          <Text strong style={{ fontSize: 13, color, display: 'block' }}>
                            {typeof subject === 'object' ? subject?.name : '—'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <ClockCircleOutlined />
                            {period.startTime} – {period.endTime}
                          </Text>
                          {typeof teacher === 'object' && teacher?.name && (
                            <Tag style={{ marginTop: 4, fontSize: 10, padding: '0 6px' }}>
                              {teacher.name}
                            </Tag>
                          )}
                          {period.room && (
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                              Room {period.room}
                            </Text>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
