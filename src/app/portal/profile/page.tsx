'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, Teacher } from '@/types';
import api from '@/lib/api';
import { Card, Avatar, Tag, Typography, Skeleton, Row, Col } from 'antd';
import {
  UserOutlined, CalendarOutlined, HeartOutlined, GlobalOutlined,
  IdcardOutlined, BookOutlined, BlockOutlined, CheckCircleOutlined,
  HomeOutlined, EnvironmentOutlined, FlagOutlined, PhoneOutlined,
  MailOutlined, BankOutlined, StarOutlined, TeamOutlined, ContactsOutlined, ManOutlined, WomanOutlined
} from '@ant-design/icons';
import { formatDate, getInitials } from '@/lib/utils';

const { Text, Title } = Typography;

type InfoRowProps = { icon: React.ReactNode; label: string; value?: string | null };
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="bento-info-row">
      <div className="bento-icon-wrapper">{icon}</div>
      <div className="bento-info-content">
        <span className="bento-label">{label}</span>
        <span className="bento-value">{value || '—'}</span>
      </div>
    </div>
  );
}

export default function PortalProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const endpoint = user.role === 'student' ? '/students/me' : '/teachers/me';
    api.get<{ data: Student | Teacher }>(endpoint)
      .then((res) => setProfile(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        <Skeleton active avatar={{ size: 100 }} paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!profile) return <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>Profile not found.</div>;

  const isStudent = user?.role === 'student';
  const student = isStudent ? (profile as Student) : null;
  const teacher = !isStudent ? (profile as Teacher) : null;
  const name = student?.name || teacher?.name || '';
  const photo = student?.photo || teacher?.photo || undefined;

  return (
    <div className="portal-profile-container">
      <style>{`
        .portal-profile-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 12px;
          animation: floatIn 0.8s ease-out forwards;
        }

        .hero-banner {
          position: relative;
          min-height: 180px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--ant-color-primary) 0%, var(--ant-color-primary-active) 100%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 60px;
          display: flex;
          align-items: flex-end;
          padding: 20px 40px;
        }

        .hero-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(circle at 20% 150%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
                            radial-gradient(circle at 80% -50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
          pointer-events: none;
          border-radius: 16px;
        }

        .profile-identity-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 24px;
          z-index: 10;
          width: 100%;
        }

        .profile-avatar-wrapper {
          padding: 6px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
          transform: translateY(40px);
        }
        .profile-avatar-wrapper:hover {
          transform: translateY(32px) scale(1.05);
        }

        .profile-header-text {
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
          flex: 1;
          min-width: 0;
          padding-bottom: 8px;
        }

        .profile-header-tags {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .bento-card {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255,255,255,0.4) !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
          transition: all 0.3s ease !important;
          height: 100%;
          overflow: hidden;
        }
        .bento-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
          border-color: var(--ant-color-primary-border) !important;
        }

        .bento-card .ant-card-head {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          min-height: 52px;
          padding: 0 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bento-card .ant-card-head-title {
          font-weight: 700;
          font-size: 16px;
          color: #111827;
        }
        .bento-card .ant-card-body {
          padding: 16px;
        }

        .bento-info-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .bento-info-row:hover {
          background: rgba(0,0,0,0.02);
        }

        .bento-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--ant-color-primary-bg);
          color: var(--ant-color-primary);
          font-size: 18px;
          flex-shrink: 0;
        }

        .bento-info-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          flex: 1;
        }
        .bento-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bento-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.3;
        }

        @media (max-width: 768px) {
          .hero-banner {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px 16px 0 16px;
            margin-bottom: 70px;
          }
          .profile-identity-wrapper {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }
          .profile-header-text {
            padding-bottom: 0;
            margin-bottom: 12px;
          }
          .profile-header-text h2 {
            font-size: 24px !important;
            white-space: normal;
          }
          .profile-header-tags {
            justify-content: center;
          }
          .profile-avatar-wrapper {
            transform: translateY(50px);
          }
          .profile-avatar-wrapper:hover {
            transform: translateY(40px) scale(1.05);
          }
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero Header */}
      <div className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="profile-identity-wrapper">
          <div className="profile-avatar-wrapper">
            <Avatar
              size={100}
              src={photo}
              style={{ border: '2px solid #fff', background: 'var(--ant-color-primary-text)', fontSize: 32, fontWeight: 700 }}
            >
              {!photo && getInitials(name)}
            </Avatar>
          </div>
          <div className="profile-header-text">
            <Title level={2} style={{ color: 'white', margin: 0, letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</Title>
            <div className="profile-header-tags">
              {student && <Tag color="white" style={{ color: 'var(--ant-color-primary)', fontWeight: 600, border: 'none' }}>{student.admissionNo}</Tag>}
              {teacher && <Tag color="white" style={{ color: 'var(--ant-color-primary)', fontWeight: 600, border: 'none' }}>{teacher.employeeId}</Tag>}
              <Tag color="cyan" style={{ textTransform: 'uppercase', letterSpacing: 1, border: 'none' }}>{user?.role}</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid layout */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Personal Info */}
        <Col xs={24} md={10} lg={8}>
          <Card title="Personal Details" className="bento-card">
            <InfoRow icon={<UserOutlined />} label="Full Name" value={name} />
            {isStudent && student && (
              <>
                <InfoRow icon={<CalendarOutlined />} label="Date of Birth" value={student.dob ? formatDate(student.dob) : undefined} />
                <InfoRow icon={student.gender === 'female' ? <WomanOutlined /> : <ManOutlined />} label="Gender" value={student.gender} />
                <InfoRow icon={<HeartOutlined />} label="Blood Group" value={student.bloodGroup} />
                <InfoRow icon={<GlobalOutlined />} label="Nationality" value={student.nationality} />
              </>
            )}
            {!isStudent && teacher && (
              <>
                <InfoRow icon={<MailOutlined />} label="Email" value={teacher.email} />
                <InfoRow icon={<PhoneOutlined />} label="Phone" value={teacher.phone} />
                <InfoRow icon={<StarOutlined />} label="Experience" value={teacher.experience ? `${teacher.experience} years` : undefined} />
              </>
            )}
          </Card>
        </Col>

        {/* Right Column - Academic & Contact */}
        <Col xs={24} md={14} lg={16}>
          <Row gutter={[24, 24]}>
            {/* Top Right - Status / Academic */}
            <Col xs={24}>
              <Card title="Academic Profile" className="bento-card">
                {isStudent && student ? (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<IdcardOutlined />} label="Admission No." value={student.admissionNo} />
                    </Col>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<BookOutlined />} label="Class" value={typeof student.classId === 'object' ? student.classId?.name : undefined} />
                    </Col>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<BlockOutlined />} label="Section" value={student.sectionId} />
                    </Col>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<UserOutlined />} label="Roll No." value={student.rollNo} />
                    </Col>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<CalendarOutlined />} label="Admitted On" value={student.admissionDate ? formatDate(student.admissionDate) : undefined} />
                    </Col>
                    <Col xs={24} sm={12} xl={12}>
                      <InfoRow icon={<CheckCircleOutlined />} label="Current Status" value={student.status} />
                    </Col>
                  </Row>
                ) : (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <InfoRow icon={<BankOutlined />} label="Designation" value={teacher?.designation} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <InfoRow icon={<BookOutlined />} label="Qualification" value={teacher?.qualification} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <InfoRow icon={<StarOutlined />} label="Specialization" value={teacher?.specialization} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <InfoRow icon={<CalendarOutlined />} label="Join Date" value={teacher?.joinDate ? formatDate(teacher?.joinDate) : undefined} />
                    </Col>
                  </Row>
                )}
              </Card>
            </Col>

            {/* Bottom Right blocks (Students only generally have rich Parent/Address data here) */}
            {isStudent && student && (
              <>
                <Col xs={24} lg={12}>
                  <Card title={<span><TeamOutlined style={{ marginRight: 8 }} /> Guardianship</span>} className="bento-card">
                    <InfoRow icon={<ManOutlined />} label="Father's Name" value={student.parent?.fatherName} />
                    <InfoRow icon={<WomanOutlined />} label="Mother's Name" value={student.parent?.motherName} />
                    <InfoRow icon={<ContactsOutlined />} label="Primary Guardian" value={student.parent?.guardianName} />
                    <InfoRow icon={<PhoneOutlined />} label="Emergency Phone" value={student.parent?.guardianPhone} />
                    <InfoRow icon={<MailOutlined />} label="Guardian Email" value={student.parent?.guardianEmail} />
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title={<span><HomeOutlined style={{ marginRight: 8 }} /> Communication Address</span>} className="bento-card">
                    <InfoRow icon={<EnvironmentOutlined />} label="Street Address" value={student.address?.street} />
                    <InfoRow icon={<HomeOutlined />} label="City" value={student.address?.city} />
                    <InfoRow icon={<FlagOutlined />} label="State / Province" value={student.address?.state} />
                    <InfoRow icon={<GlobalOutlined />} label="Country" value={student.address?.country} />
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
