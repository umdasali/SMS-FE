import { Modal, Form, Input, App } from 'antd';
import { useState } from 'react';
import api from '@/lib/api';

interface ResetPasswordModalProps {
  open: boolean;
  onCancel: () => void;
  userId: string;
  type: 'students' | 'teachers';
}

export default function ResetPasswordModal({ open, onCancel, userId, type }: ResetPasswordModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const endpoint = type === 'students' ? `/students/${userId}/password` : `/teachers/${userId}/password`;
      await api.put(endpoint, { password: values.password });
      
      message.success('Password reset successfully');
      form.resetFields();
      onCancel();
    } catch (err: any) {
      if (err.name === 'ValidationError') return;
      message.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Reset User Password"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Reset Password"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="password"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter new password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
