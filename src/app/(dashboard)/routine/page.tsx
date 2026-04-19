'use client';

import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { Class, Subject, Routine, DaySchedule } from '@/types';
import {
  Button, Card, Select, Tag, Typography, Alert, Spin, Space, Tooltip, Empty, Row, Col, Form, App, TimePicker,
} from 'antd';
import {
  CalendarOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DAYS: DaySchedule['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

const DAY_COLOR: Record<string, string> = {
  Monday: '#4f46e5', Tuesday: '#0891b2', Wednesday: '#059669',
  Thursday: '#d97706', Friday: '#dc2626', Saturday: '#7c3aed',
};

type EditablePeriod = {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  subjectId: string;
  room: string;
};

type EditableSchedule = {
  day: DaySchedule['day'];
  periods: EditablePeriod[];
};

function toTimeString(d: Dayjs | null): string {
  return d ? d.format('HH:mm') : '';
}

function toDayjs(t: string): Dayjs | null {
  if (!t) return null;
  return dayjs(`2000-01-01 ${t}`);
}

export default function RoutinePage() {
  const { message } = App.useApp();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [schedule, setSchedule] = useState<EditableSchedule[]>(
    DAYS.map((day) => ({ day, periods: [] }))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c._id === classId);

  // Load class list on mount
  useEffect(() => {
    api.get<{ success: boolean; data: { classes: Class[] } }>('/classes')
      .then((res) => {
        const list = res.data?.data?.classes ?? [];
        setClasses(list);
      })
      .catch(() => setError('Failed to load classes'));
  }, []);

  const loadRoutine = async (cId: string, sId: string) => {
    if (!cId) return;
    setLoading(true);
    setError(null);
    try {
      // Build query — only include sectionId when non-empty
      const params = new URLSearchParams({ classId: cId });
      if (sId) params.append('sectionId', sId);

      const [routineRes, subjectsRes] = await Promise.all([
        api.get<{ success: boolean; data: Routine[] | Routine }>(`/routines?${params.toString()}`),
        api.get<{ success: boolean; data: { subjects: Subject[] } }>(`/subjects?classId=${cId}`),
      ]);

      // Subjects
      const subjectList = subjectsRes.data?.data?.subjects ?? [];
      setSubjects(Array.isArray(subjectList) ? subjectList : []);

      // Routine — backend may return array or single object
      const rawRoutine = routineRes.data?.data;
      const existing: Routine | null = Array.isArray(rawRoutine)
        ? (rawRoutine[0] ?? null)
        : (rawRoutine ?? null);

      if (existing) {
        setRoutine(existing);
        setSchedule(
          DAYS.map((day) => {
            const dayData = existing.schedule?.find((d) => d.day === day);
            return {
              day,
              periods: (dayData?.periods ?? []).map((p) => ({
                startTime: p.startTime ?? '',
                endTime: p.endTime ?? '',
                subjectId:
                  typeof p.subjectId === 'object' && p.subjectId !== null
                    ? (p.subjectId as Subject)._id
                    : (p.subjectId as string) ?? '',
                room: p.room ?? '',
              })),
            };
          })
        );
      } else {
        setRoutine(null);
        setSchedule(DAYS.map((day) => ({ day, periods: [] })));
      }
    } catch (err) {
      console.error('loadRoutine error:', err);
      setError('Failed to load routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addPeriod = (dayIdx: number) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[dayIdx] = {
        ...updated[dayIdx]!,
        periods: [
          ...updated[dayIdx]!.periods,
          { startTime: '08:00', endTime: '09:00', subjectId: '', room: '' },
        ],
      };
      return updated;
    });
  };

  const removePeriod = (dayIdx: number, periodIdx: number) => {
    setSchedule((prev) => {
      const updated = [...prev];
      const periods = [...updated[dayIdx]!.periods];
      periods.splice(periodIdx, 1);
      updated[dayIdx] = { ...updated[dayIdx]!, periods };
      return updated;
    });
  };

  const updatePeriod = (
    dayIdx: number,
    periodIdx: number,
    field: keyof EditablePeriod,
    val: string
  ) => {
    setSchedule((prev) => {
      const updated = [...prev];
      const periods = [...updated[dayIdx]!.periods];
      periods[periodIdx] = { ...periods[periodIdx]!, [field]: val };
      updated[dayIdx] = { ...updated[dayIdx]!, periods };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = {
        classId,
        ...(sectionId ? { sectionId } : {}),
        academicYear: new Date().getFullYear().toString(),
        schedule: schedule.filter((d) => d.periods.length > 0),
      };
      if (routine) {
        await api.put(`/routines/${routine._id}`, payload);
      } else {
        const res = await api.post<{ data: Routine }>('/routines', payload);
        setRoutine(res.data?.data ?? null);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      message.success('Routine saved successfully');
    } catch (err) {
      console.error('handleSave error:', err);
      setError('Failed to save routine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalPeriods = schedule.reduce((sum, d) => sum + d.periods.length, 0);

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="routine-header">
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined /> Class Routine
          </Title>
          <Text type="secondary">Manage weekly timetable for each class</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {classId && (
            <Tooltip title="Reload routine">
              <Button icon={<ReloadOutlined />} onClick={() => loadRoutine(classId, sectionId)} disabled={loading} />
            </Tooltip>
          )}
          {classId && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              style={{ borderRadius: 8 }}
            >
              <span className="save-btn-text">{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Routine'}</span>
              <span className="save-btn-icon-only">{saved ? '✓' : ''}</span>
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .routine-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .save-btn-icon-only { display: none; }
        @media (max-width: 576px) {
          .routine-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .save-btn-text { display: none; }
          .save-btn-icon-only { display: inline; }
        }
      `}</style>

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

      {/* Filters */}
      <Card style={{ borderRadius: 10, marginBottom: 20 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Class" style={{ marginBottom: 0 }}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select class"
                value={classId || undefined}
                onChange={(v) => {
                  setClassId(v ?? '');
                  setSectionId('');
                  if (v) loadRoutine(v, '');
                  else {
                    setRoutine(null);
                    setSchedule(DAYS.map((day) => ({ day, periods: [] })));
                  }
                }}
                options={classes.map((c) => ({ value: c._id, label: c.name }))}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Section" style={{ marginBottom: 0 }}>
              <Select
                style={{ width: '100%' }}
                placeholder="All sections"
                value={sectionId || undefined}
                allowClear
                disabled={!classId}
                onChange={(v) => {
                  const sid = v ?? '';
                  setSectionId(sid);
                  if (classId) loadRoutine(classId, sid);
                }}
                options={
                  selectedClass?.sections.map((s) => ({ value: s.name, label: s.name })) ?? []
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      {!classId ? (
        <Card style={{ borderRadius: 10 }}>
          <Empty
            image={<CalendarOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            styles={{ image: { height: 72 } }}
            description={
              <Text type="secondary">Select a class to view or edit its timetable.</Text>
            }
          />
        </Card>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" description="Loading routine…" />
        </div>
      ) : (
        <>
          {classId && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                {routine ? 'Editing existing routine' : 'No routine found — you can create one below.'}{' '}
                &nbsp;
                <Tag color="blue">{totalPeriods} total periods</Tag>
              </Text>
            </div>
          )}
          {DAYS.map((_, dayIdx) => {
            const daySchedule = schedule[dayIdx]!;
            const color = DAY_COLOR[daySchedule.day] ?? '#4f46e5';
            return (
              <Card
                key={daySchedule.day}
                style={{ borderRadius: 10, marginBottom: 12 }}
                styles={{ header: { borderBottom: `2px solid ${color}20` } }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: `${color}18`,
                        color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {DAY_SHORT[daySchedule.day]}
                    </span>
                    <Text strong>{daySchedule.day}</Text>
                    <Tag color={daySchedule.periods.length > 0 ? 'blue' : 'default'}>
                      {daySchedule.periods.length} period{daySchedule.periods.length !== 1 ? 's' : ''}
                    </Tag>
                  </div>
                }
                extra={
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    type="dashed"
                    onClick={() => addPeriod(dayIdx)}
                  >
                    Add Period
                  </Button>
                }
              >
                {daySchedule.periods.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    No periods added for {daySchedule.day}.
                  </Text>
                ) : (
                  daySchedule.periods.map((period, periodIdx) => (
                    <div
                      key={periodIdx}
                      className="routine-period-row"
                    >
                      {/* Times */}
                      <div className="period-field-time">
                        <div>
                          <Text className="field-label">Start</Text>
                          <TimePicker
                            size="small"
                            format="HH:mm"
                            minuteStep={5}
                            style={{ width: '100%' }}
                            value={toDayjs(period.startTime)}
                            onChange={(v) => updatePeriod(dayIdx, periodIdx, 'startTime', toTimeString(v))}
                            needConfirm={false}
                          />
                        </div>
                        <div>
                          <Text className="field-label">End</Text>
                          <TimePicker
                            size="small"
                            format="HH:mm"
                            minuteStep={5}
                            style={{ width: '100%' }}
                            value={toDayjs(period.endTime)}
                            onChange={(v) => updatePeriod(dayIdx, periodIdx, 'endTime', toTimeString(v))}
                            needConfirm={false}
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="period-field-subject">
                        <Text className="field-label">Subject</Text>
                        <Select
                          size="small"
                          style={{ width: '100%' }}
                          placeholder={subjects.length === 0 ? 'No subjects' : 'Select subject'}
                          value={period.subjectId || undefined}
                          onChange={(v) => updatePeriod(dayIdx, periodIdx, 'subjectId', v ?? '')}
                          options={subjects.map((s) => ({
                            value: s._id,
                            label: `${s.name} (${s.code})`,
                          }))}
                          showSearch
                          optionFilterProp="label"
                          allowClear
                        />
                      </div>

                      {/* Room & Delete */}
                      <div className="period-field-meta">
                        <div style={{ flex: 1 }}>
                          <Text className="field-label">Room</Text>
                          <Select
                            size="small"
                            style={{ width: '100%' }}
                            placeholder="Room"
                            value={period.room || undefined}
                            onChange={(v) => updatePeriod(dayIdx, periodIdx, 'room', v ?? '')}
                            options={['101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
                              'Lab-1', 'Lab-2', 'Gym', 'Library', 'Hall'].map((r) => ({ value: r, label: r }))}
                            showSearch
                            allowClear
                          />
                        </div>
                        <Tooltip title="Remove">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removePeriod(dayIdx, periodIdx)}
                            style={{ marginTop: 22 }}
                          />
                        </Tooltip>
                      </div>

                      <style>{`
                        .routine-period-row {
                          display: flex;
                          gap: 12px;
                          padding: 12px;
                          background: #fafafa;
                          border-radius: 8px;
                          margin-bottom: 8px;
                          border: 1px solid #f0f0f0;
                          align-items: flex-start;
                        }
                        .field-label {
                          display: block;
                          font-size: 11px;
                          margin-bottom: 4px;
                          font-weight: 500;
                          color: #8c8c8c;
                        }
                        .period-field-time {
                          display: flex;
                          gap: 8px;
                          min-width: 180px;
                        }
                        .period-field-subject {
                          flex: 1;
                          min-width: 150px;
                        }
                        .period-field-meta {
                          display: flex;
                          gap: 8px;
                          min-width: 120px;
                        }
                        @media (max-width: 992px) {
                          .routine-period-row {
                            flex-wrap: wrap;
                          }
                          .period-field-time, .period-field-subject, .period-field-meta {
                            flex: 1 1 200px;
                          }
                        }
                        @media (max-width: 576px) {
                          .period-field-time {
                            min-width: 100%;
                          }
                          .period-field-subject {
                            min-width: 100%;
                          }
                          .period-field-meta {
                            min-width: 100%;
                          }
                        }
                      `}</style>
                    </div>
                  ))
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
