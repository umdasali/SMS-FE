'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FeeSlip } from '@/types';
import api from '@/lib/api';
import { Card, Tag, Typography, Skeleton, Empty, Progress } from 'antd';
import { DollarOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';

const { Title, Text } = Typography;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function PortalFeesPage() {
  const { user } = useAuth();
  const [slips, setSlips] = useState<FeeSlip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get<{ data: FeeSlip[] }>('/finance/fee-slips')
      .then(res => setSlips(res.data.data ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  const total = slips.reduce((s, f) => s + f.netAmount, 0);
  const paid = slips.filter(f => f.status === 'paid').reduce((s, f) => s + f.netAmount, 0);
  const pending = slips.filter(f => f.status !== 'paid').reduce((s, f) => s + f.netAmount, 0);
  const rate = total > 0 ? Math.round((paid / total) * 100) : 0;

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined /> Fee Slips
        </Title>
        <Text type="secondary">Your monthly fee payment history</Text>
      </div>

      {slips.length === 0 ? (
        <Empty description="No fee slips found." />
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Billed', value: fmt(total), color: '#6366f1', bg: '#eef2ff' },
              { label: 'Paid', value: fmt(paid), color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Outstanding', value: fmt(pending), color: '#dc2626', bg: '#fef2f2' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '12px 14px',
                borderRadius: 10, background: s.bg,
                borderLeft: `3px solid ${s.color}`,
              }}>
                <Text style={{ fontSize: 11, color: s.color, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>{s.label}</Text>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <Card size="small" style={{ borderRadius: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#64748b', minWidth: 110 }}>Payment Rate</Text>
              <Progress
                percent={rate}
                strokeColor={rate >= 80 ? '#16a34a' : rate >= 50 ? '#f59e0b' : '#dc2626'}
                style={{ flex: 1, marginBottom: 0 }}
              />
            </div>
          </Card>

          {/* Slip list grouped by year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...slips]
              .sort((a, b) => b.year - a.year || b.month - a.month)
              .map(slip => {
                const overdue = slip.status !== 'paid' && new Date(slip.dueDate) < new Date();
                return (
                  <Card
                    key={slip._id}
                    size="small"
                    style={{
                      borderRadius: 10,
                      borderLeft: `4px solid ${
                        slip.status === 'paid' ? '#16a34a' :
                        overdue ? '#dc2626' : '#f59e0b'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {MONTHS[(slip.month - 1)]} {slip.year}
                        </Text>
                        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarOutlined /> Due {formatDate(slip.dueDate)}
                          </Text>
                          {slip.paymentDate && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircleOutlined style={{ color: '#16a34a' }} /> Paid {formatDate(slip.paymentDate)}
                            </Text>
                          )}
                          {overdue && (
                            <Text style={{ fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined /> Overdue
                            </Text>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(slip.netAmount)}</div>
                        {slip.discount > 0 && (
                          <Text type="secondary" style={{ fontSize: 11 }}>-{fmt(slip.discount)}</Text>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Tag color={slip.status === 'paid' ? 'success' : overdue ? 'error' : 'warning'} style={{ textTransform: 'capitalize', margin: 0 }}>
                            {slip.status === 'partially_paid' ? 'Partial' : slip.status}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
