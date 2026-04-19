'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Teacher } from '@/types';
import {
  Card, Avatar, Typography, Tag, Skeleton, Alert, Row, Col, Divider,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, BankOutlined, BookOutlined,
  CalendarOutlined, IdcardOutlined, TeamOutlined,
} from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
      <span style={{ color: '#8c8c8c', fontSize: 15, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
          {label}
        </Text>
        <Text strong style={{ fontSize: 13 }}>{value || '—'}</Text>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#8c8c8c', display: 'block', marginBottom: 4,
    }}>
      {children}
    </Text>
  );
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Teacher }>('/teachers/me')
      .then((res) => setTeacher(res.data.data))
      .catch(() => setError('Failed to load your profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Alert message={error || 'Profile not found.'} type="error" showIcon />
      </div>
    );
  }

  const fullAddress = [
    teacher.address?.street,
    teacher.address?.city,
    teacher.address?.state,
    teacher.address?.zip,
    teacher.address?.country,
  ].filter(Boolean).join(', ');

  const assignedClasses = Array.isArray(teacher.classIds)
    ? teacher.classIds.map((c) => (typeof c === 'object' ? c.name : c))
    : [];

  const assignedSubjects = Array.isArray(teacher.subjectIds)
    ? teacher.subjectIds.map((s) => (typeof s === 'object' ? s.name : s))
    : [];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>My Profile</Title>
        <Text type="secondary">Your personal and professional details</Text>
      </div>

      {/* Header card */}
      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Avatar
            src={teacher.photo || undefined}
            size={80}
            style={{ background: 'var(--ant-color-primary)', fontSize: 28, fontWeight: 700, flexShrink: 0 }}
          >
            {teacher.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ margin: 0 }}>{teacher.name}</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>{teacher.designation || 'Teacher'}</Text>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="blue" icon={<IdcardOutlined />}>{teacher.employeeId}</Tag>
              <Tag
                color={teacher.status === 'active' ? 'success' : 'default'}
                style={{ textTransform: 'capitalize' }}
              >
                {teacher.status}
              </Tag>
              {user?.email && (
                <Tag icon={<MailOutlined />}>{user.email}</Tag>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Personal Information */}
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 12, height: '100%' }}>
            <SectionHeading>Personal Information</SectionHeading>
            <Divider style={{ margin: '8px 0 4px' }} />
            <InfoRow icon={<UserOutlined />} label="Full Name" value={teacher.name} />
            <InfoRow icon={<MailOutlined />} label="Email" value={teacher.email} />
            <InfoRow icon={<PhoneOutlined />} label="Phone" value={teacher.phone} />
            <InfoRow
              icon={<CalendarOutlined />}
              label="Date of Birth"
              value={teacher.dob ? formatDate(teacher.dob) : undefined}
            />
            <InfoRow
              icon={<UserOutlined />}
              label="Gender"
              value={teacher.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) : undefined}
            />
            {fullAddress && (
              <InfoRow icon={<BankOutlined />} label="Address" value={fullAddress} />
            )}
          </Card>
        </Col>

        {/* Professional Information */}
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 12, height: '100%' }}>
            <SectionHeading>Professional Details</SectionHeading>
            <Divider style={{ margin: '8px 0 4px' }} />
            <InfoRow icon={<IdcardOutlined />} label="Employee ID" value={teacher.employeeId} />
            <InfoRow icon={<BankOutlined />} label="Designation" value={teacher.designation} />
            <InfoRow icon={<BookOutlined />} label="Qualification" value={teacher.qualification} />
            <InfoRow icon={<BookOutlined />} label="Specialization" value={teacher.specialization} />
            <InfoRow
              icon={<CalendarOutlined />}
              label="Experience"
              value={teacher.experience !== undefined ? `${teacher.experience} year${teacher.experience !== 1 ? 's' : ''}` : undefined}
            />
            <InfoRow
              icon={<CalendarOutlined />}
              label="Join Date"
              value={teacher.joinDate ? formatDate(teacher.joinDate) : undefined}
            />
          </Card>
        </Col>

        {/* Assigned Classes */}
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 12 }}>
            <SectionHeading>
              <TeamOutlined style={{ marginRight: 6 }} />
              Assigned Classes
            </SectionHeading>
            <Divider style={{ margin: '8px 0 12px' }} />
            {assignedClasses.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {assignedClasses.map((cls, i) => (
                  <Tag key={i} color="blue" style={{ fontSize: 13, padding: '4px 10px' }}>{cls}</Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>No classes assigned yet.</Text>
            )}
          </Card>
        </Col>

        {/* Assigned Subjects */}
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 12 }}>
            <SectionHeading>
              <BookOutlined style={{ marginRight: 6 }} />
              Assigned Subjects
            </SectionHeading>
            <Divider style={{ margin: '8px 0 12px' }} />
            {assignedSubjects.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {assignedSubjects.map((sub, i) => (
                  <Tag key={i} color="purple" style={{ fontSize: 13, padding: '4px 10px' }}>{sub}</Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>No subjects assigned yet.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
