'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Tenant } from '@/types';
import { Card, Row, Col, Tag, Typography, Skeleton } from 'antd';
import {
  BankOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SaasAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Tenant[] }>('/tenants')
      .then((res) => setTenants(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    pending: tenants.filter((t) => t.status === 'pending').length,
    school: tenants.filter((t) => t.type === 'school').length,
  };

  const statCards = [
    { label: 'Total Institutions', value: stats.total, icon: <BankOutlined />, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active', value: stats.active, icon: <CheckCircleOutlined />, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending', value: stats.pending, icon: <ClockCircleOutlined />, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Schools', value: stats.school, icon: <TeamOutlined />, color: '#7c3aed', bg: '#f5f3ff' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>SaaS Admin Dashboard</Title>
        <Text type="secondary">Overview of all institutions on SchoolFlow</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {loading
          ? [1,2,3,4].map((i) => (
              <Col xs={12} lg={6} key={i}>
                <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
              </Col>
            ))
          : statCards.map((s) => (
              <Col xs={12} lg={6} key={s.label}>
                <Card style={{ borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>{s.label}</Text>
                      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>{s.value}</div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18 }}>
                      {s.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
      </Row>

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>Recent Institutions</Title>
        {loading ? (
          [1,2,3].map((i) => <Card key={i} style={{ marginBottom: 8, borderRadius: 8 }}><Skeleton active paragraph={{ rows: 1 }} /></Card>)
        ) : tenants.slice(0, 10).map((t) => (
          <Card key={t._id} style={{ marginBottom: 8, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BankOutlined style={{ color: '#64748b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 14 }}>{t.name}</Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', textTransform: 'capitalize' }}>
                  {t.type} · {t.city}, {t.state}
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.schoolCode}</Tag>
                <Tag color={t.status === 'active' ? 'success' : t.status === 'pending' ? 'warning' : 'error'} style={{ textTransform: 'capitalize' }}>
                  {t.status}
                </Tag>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
