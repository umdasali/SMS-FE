'use client';

import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { Class, Subject, Routine, DaySchedule } from '@/types';
import {
  Button, Card, Select, Tag, Typography, Alert, Spin, Space, Tooltip,
  Empty, Row, Col, Form, App, TimePicker, Input,
} from 'antd';
import {
  CalendarOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, ReloadOutlined,
  ClockCircleOutlined,
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
  startTime: string;
  endTime: string;
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

  useEffect(() => {
    api.get<{ success: boolean; data: { classes: Class[] } }>('/classes')
      .then((res) => setClasses(res.data?.data?.classes ?? []))
      .catch(() => setError('Failed to load classes'));
  }, []);

  const loadRoutine = async (cId: string, sId: string) => {
    if (!cId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ classId: cId });
      if (sId) params.append('sectionId', sId);

      const [routineRes, subjectsRes] = await Promise.all([
        api.get<{ success: boolean; data: Routine[] | Routine }>(`/routines?${params.toString()}`),
        api.get<{ success: boolean; data: { subjects: Subject[] } }>(`/subjects?classId=${cId}`),
      ]);

      const subjectList = subjectsRes.data?.data?.subjects ?? [];
      setSubjects(Array.isArray(subjectList) ? subjectList : []);

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

  const updatePeriod = (dayIdx: number, periodIdx: number, field: keyof EditablePeriod, val: string) => {
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
    setSaving(true); setSaved(false); setError(null);
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
    } finally { setSaving(false); }
  };

  const totalPeriods = schedule.reduce((sum, d) => sum + d.periods.length, 0);

  return (
    <div>
      {/* Header */}
      <div className="rt-header">
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined /> Class Routine
          </Title>
          <Text type="secondary">Manage weekly timetable for each class</Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {classId && (
            <Tooltip title="Reload routine">
              <Button icon={<ReloadOutlined />} onClick={() => loadRoutine(classId, sectionId)} disabled={loading} style={{ borderRadius: 8 }} />
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
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Routine'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
          onClose={() => setError(null)}
        />
      )}

      {/* Filter bar */}
      <Card style={{ borderRadius: 10, marginBottom: 20 }} styles={{ body: { padding: '16px' } }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Class</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select class"
              value={classId || undefined}
              onChange={(v) => {
                setClassId(v ?? '');
                setSectionId('');
                if (v) loadRoutine(v, '');
                else { setRoutine(null); setSchedule(DAYS.map((day) => ({ day, periods: [] }))); }
              }}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Section</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="All sections"
              value={sectionId || undefined}
              allowClear
              disabled={!classId}
              onChange={(v) => { const sid = v ?? ''; setSectionId(sid); if (classId) loadRoutine(classId, sid); }}
              options={selectedClass?.sections.map((s) => ({ value: s.name, label: s.name })) ?? []}
            />
          </Col>
          {classId && !loading && (
            <Col xs={24} sm={24} md={8}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 22 }}>
                <Tag color={routine ? 'green' : 'orange'} style={{ fontSize: 12 }}>
                  {routine ? 'Existing routine' : 'New routine'}
                </Tag>
                <Tag color="blue" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />{totalPeriods} period{totalPeriods !== 1 ? 's' : ''}
                </Tag>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Content */}
      {!classId ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
          <Title level={5} type="secondary" style={{ fontWeight: 400 }}>No class selected</Title>
          <Text type="secondary">Select a class above to view or build its weekly timetable.</Text>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12 }}><Text type="secondary">Loading routine…</Text></div>
        </div>
      ) : (
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          {DAYS.map((_, dayIdx) => {
            const daySchedule = schedule[dayIdx]!;
            const color = DAY_COLOR[daySchedule.day] ?? '#4f46e5';
            const hasPeriods = daySchedule.periods.length > 0;
            return (
              <Card
                key={daySchedule.day}
                style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                styles={{ body: { padding: '14px 16px' }, header: { borderBottom: hasPeriods ? '1px solid #f0f0f0' : 'none', paddingBottom: hasPeriods ? undefined : 0 } }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${color}15`, color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}>
                      {DAY_SHORT[daySchedule.day]}
                    </span>
                    <Text strong style={{ fontSize: 14 }}>{daySchedule.day}</Text>
                    {hasPeriods && (
                      <Tag style={{ background: `${color}12`, color, border: `1px solid ${color}30`, fontSize: 11 }}>
                        {daySchedule.periods.length} period{daySchedule.periods.length !== 1 ? 's' : ''}
                      </Tag>
                    )}
                  </div>
                }
                extra={
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    type="dashed"
                    onClick={() => addPeriod(dayIdx)}
                    style={{ borderRadius: 6 }}
                  >
                    Add Period
                  </Button>
                }
              >
                {!hasPeriods ? (
                  <button
                    onClick={() => addPeriod(dayIdx)}
                    style={{
                      width: '100%', padding: '14px', border: '1.5px dashed #e8e8e8',
                      borderRadius: 8, background: 'transparent', cursor: 'pointer',
                      color: '#bfbfbf', fontSize: 13, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.color = color; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e8e8'; (e.currentTarget as HTMLButtonElement).style.color = '#bfbfbf'; }}
                  >
                    <PlusOutlined /> Click to add a period for {daySchedule.day}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Column headers — desktop only */}
                    <div className="rt-period-header">
                      <div style={{ width: 28 }} />
                      <div className="rt-col-time"><Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start</Text></div>
                      <div className="rt-col-time"><Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>End</Text></div>
                      <div className="rt-col-subject"><Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</Text></div>
                      <div className="rt-col-room"><Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Room</Text></div>
                      <div style={{ width: 28 }} />
                    </div>

                    {daySchedule.periods.map((period, periodIdx) => (
                      <div key={periodIdx} className="rt-period-row">
                        {/* Period number badge */}
                        <div className="rt-period-num" style={{ background: `${color}15`, color }}>
                          {periodIdx + 1}
                        </div>

                        {/* Start time */}
                        <div className="rt-col-time">
                          <Text className="rt-mobile-label">Start</Text>
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

                        {/* End time */}
                        <div className="rt-col-time">
                          <Text className="rt-mobile-label">End</Text>
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

                        {/* Subject */}
                        <div className="rt-col-subject">
                          <Text className="rt-mobile-label">Subject</Text>
                          <Select
                            size="small"
                            style={{ width: '100%' }}
                            placeholder={subjects.length === 0 ? 'No subjects' : 'Select subject'}
                            value={period.subjectId || undefined}
                            onChange={(v) => updatePeriod(dayIdx, periodIdx, 'subjectId', v ?? '')}
                            options={subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` }))}
                            showSearch
                            optionFilterProp="label"
                            allowClear
                          />
                        </div>

                        {/* Room — plain input */}
                        <div className="rt-col-room">
                          <Text className="rt-mobile-label">Room</Text>
                          <Input
                            size="small"
                            placeholder="e.g. 101"
                            value={period.room}
                            onChange={(e) => updatePeriod(dayIdx, periodIdx, 'room', e.target.value)}
                          />
                        </div>

                        {/* Delete */}
                        <Tooltip title="Remove period">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removePeriod(dayIdx, periodIdx)}
                          />
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </Space>
      )}

      {/* Save footer bar — visible when editing */}
      {classId && !loading && (
        <div className="rt-save-footer">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            style={{ borderRadius: 8 }}
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Routine'}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {totalPeriods} period{totalPeriods !== 1 ? 's' : ''} across {schedule.filter((d) => d.periods.length > 0).length} day{schedule.filter((d) => d.periods.length > 0).length !== 1 ? 's' : ''}
          </Text>
        </div>
      )}

      <style>{`
        .rt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 576px) {
          .rt-header { flex-direction: column; align-items: flex-start; }
        }

        /* Period row layout */
        .rt-period-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
          transition: border-color 0.2s;
        }
        .rt-period-row:hover { border-color: #d9d9d9; }

        .rt-period-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
        }

        .rt-period-num {
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }

        .rt-col-time  { flex: 0 0 90px; min-width: 0; }
        .rt-col-subject { flex: 1 1 160px; min-width: 0; }
        .rt-col-room  { flex: 0 0 90px; min-width: 0; }

        .rt-mobile-label { display: none; }

        /* Save footer */
        .rt-save-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          padding: 14px 0 4px;
          border-top: 1px solid #f0f0f0;
        }

        @media (max-width: 768px) {
          .rt-period-header { display: none; }
          .rt-period-row { flex-wrap: wrap; gap: 10px; }
          .rt-mobile-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #8c8c8c;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 3px;
          }
          .rt-col-time    { flex: 1 1 100px; }
          .rt-col-subject { flex: 1 1 100%; order: 3; }
          .rt-col-room    { flex: 1 1 100px; }
        }
        @media (max-width: 480px) {
          .rt-col-time, .rt-col-room { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
}
