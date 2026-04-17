'use client';

import { Modal, Button, Typography, message as antMessage } from 'antd';
import {
  CheckCircleFilled, CopyOutlined, DownloadOutlined,
  UserOutlined, LockOutlined, KeyOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
  role: 'student' | 'teacher';
  name: string;
  username: string;
  tempPassword: string;
  /** Optional extra node rendered below the credential cards (e.g. PDF download) */
  extra?: React.ReactNode;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    antMessage.success(`${label} copied to clipboard`);
  });
}

function downloadCredentials(name: string, username: string, password: string, role: string) {
  const content = [
    '================================================',
    `  ${role.toUpperCase()} LOGIN CREDENTIALS`,
    '================================================',
    '',
    `  Name     : ${name}`,
    `  Username : ${username}`,
    `  Password : ${password}`,
    '',
    '  IMPORTANT: Change the password after first login.',
    '  This file contains sensitive information.',
    '  Keep it safe and do not share publicly.',
    '',
    `  Generated : ${new Date().toLocaleString()}`,
    '================================================',
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `credentials-${username}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CredentialsModal({
  open, onClose, role, name, username, tempPassword, extra,
}: CredentialsModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Done"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={500}
      centered
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #166534 100%)',
        padding: '28px 28px 24px',
        borderRadius: '8px 8px 0 0',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
          <CheckCircleFilled style={{ fontSize: 28, color: '#86efac' }} />
        </div>
        <Title level={4} style={{ color: '#ffffff', margin: 0 }}>
          {role === 'student' ? 'Student' : 'Teacher'} Registered Successfully
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginTop: 4 }}>
          Share these login credentials with {name}
        </Text>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px' }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          These credentials are auto-generated. The password is shown only once — save it now.
        </Text>

        {/* Username card */}
        <div style={{
          border: '1.5px solid #e5e7eb',
          borderRadius: 10,
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#f9fafb',
            padding: '8px 14px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <UserOutlined style={{ color: '#6b7280', fontSize: 12 }} />
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </Text>
          </div>
          <div style={{
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
              {username}
            </Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(username, 'Username')}
              style={{ flexShrink: 0, borderRadius: 6 }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Password card */}
        <div style={{
          border: '1.5px solid #fde68a',
          borderRadius: 10,
          marginBottom: 20,
          overflow: 'hidden',
          background: '#fffbeb',
        }}>
          <div style={{
            background: '#fef3c7',
            padding: '8px 14px',
            borderBottom: '1px solid #fde68a',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <LockOutlined style={{ color: '#92400e', fontSize: 12 }} />
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Temporary Password
            </Text>
          </div>
          <div style={{
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#78350f', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
              {tempPassword}
            </Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(tempPassword, 'Password')}
              style={{ flexShrink: 0, borderRadius: 6, borderColor: '#f59e0b', color: '#92400e' }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px',
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: 8, marginBottom: 20,
        }}>
          <KeyOutlined style={{ color: '#ea580c', marginTop: 2, flexShrink: 0 }} />
          <Text style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.5 }}>
            This password is shown <strong>only once</strong> and cannot be recovered.
            Ask the user to change it after their first login.
          </Text>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <Button
            block
            icon={<DownloadOutlined />}
            onClick={() => downloadCredentials(name, username, tempPassword, role)}
            style={{ borderRadius: 8, height: 40 }}
          >
            Download Credentials (.txt)
          </Button>
          {extra}
        </div>
      </div>
    </Modal>
  );
}
