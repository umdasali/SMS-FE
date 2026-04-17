'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Class, Student } from '@/types';
import { imageUrlToBase64Png } from '@/lib/imageUtils';
import { getSafeLogoUrl, flattenObject } from '@/lib/utils';
import Link from 'next/link';
import {
  Button, Card, Form, Input, Select, Alert, Avatar, Typography,
  Row, Col, Divider, Upload, App,
} from 'antd';
import {
  ArrowLeftOutlined, UserAddOutlined, UserOutlined, InboxOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import AdmissionSlipPDF from '@/components/pdf/AdmissionSlipPDF';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import CredentialsModal from '@/components/modals/CredentialsModal';
import { Tenant } from '@/types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

interface StudentFormValues {
  name: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  govtId?: string;
  classId?: string;
  sectionId?: string;
  rollNo?: string;
  admissionDate?: string;
  previousSchool?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  parent?: {
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianRelation?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  };
}

export default function NewStudentPage() {
  App.useApp();
  const [form] = Form.useForm();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [resolvedLogo, setResolvedLogo] = useState<string>(DEFAULT_LOGO);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [credsModal, setCredsModal] = useState<{ username: string; tempPassword: string; studentData: Student; name: string } | null>(null);

  const selectedClass = Form.useWatch('classId', form);
  const selectedClassData = classes.find((c) => c._id === selectedClass);

  useEffect(() => {
    Promise.all([
      api.get<{ data: { classes: Class[] } }>('/classes'),
      api.get<{ data: Tenant }>('/tenants/my'),
    ]).then(([cRes, tRes]) => {
      setClasses(cRes.data.data.classes);
      const t = tRes.data.data;
      setTenant(t);
      const rawLogo = getSafeLogoUrl(t?.branding?.logo, DEFAULT_LOGO);
      imageUrlToBase64Png(rawLogo).then(setResolvedLogo).catch(() => setResolvedLogo(DEFAULT_LOGO));
    });
  }, []);

  const onFinish = async (values: StudentFormValues) => {
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      const flatData = flattenObject(values);

      Object.entries(flatData).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, String(val));
        }
      });

      if (photo) formData.append('photo', photo);

      const res = await api.post('/students', formData);
      const { student, username, tempPassword } = res.data.data;
      setCredsModal({ username, tempPassword, studentData: student, name: values.name });

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Divider titlePlacement="left" plain style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </Divider>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/students">
          <Button icon={<ArrowLeftOutlined />} type="text" />
        </Link>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserAddOutlined /> Register New Student
          </Title>
          <Text type="secondary">Fill all required information</Text>
        </div>
      </div>

      {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />}

      <Row gutter={24}>
        {/* Photo column */}
        <Col xs={24} lg={6}>
          <Card style={{ borderRadius: 10, textAlign: 'center' }}>
            <Title level={5}>Student Photo</Title>
            <div style={{ marginBottom: 16 }}>
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <Avatar size={100} icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#8c8c8c' }} />
              )}
            </div>
            <Dragger
              accept="image/*"
              beforeUpload={(file) => {
                setPhoto(file);
                setPhotoPreview(URL.createObjectURL(file));
                return false;
              }}
              showUploadList={false}
              style={{ borderRadius: 8 }}
            >
              <p><InboxOutlined style={{ color: '#bfbfbf' }} /></p>
              <p style={{ fontSize: 12 }}>Click to upload photo</p>
            </Dragger>
          </Card>
        </Col>

        {/* Main form */}
        <Col xs={24} lg={18}>
          <Card style={{ borderRadius: 10 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                nationality: 'Indian',
                address: { country: 'India' },
              }}
            >
              <SectionTitle title="Personal Information" />
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Name required' }, { min: 2, message: 'Minimum 2 characters' }]}
                  >
                    <Input placeholder="Student full name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="dob" label="Date of Birth">
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select
                      placeholder="Select"
                      style={{ width: '100%' }}
                      options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="bloodGroup" label="Blood Group">
                    <Select
                      placeholder="Select"
                      style={{ width: '100%' }}
                      options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => ({ value: bg, label: bg }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="religion" label="Religion">
                    <Input placeholder="Religion" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="nationality" label="Nationality">
                    <Input placeholder="Nationality" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="govtId" label="Govt ID Proof">
                    <Input placeholder="Aadhar / Passport" />
                  </Form.Item>
                </Col>
              </Row>

              <SectionTitle title="Academic Information" />
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="classId" label="Class">
                    <Select
                      placeholder="Select class"
                      style={{ width: '100%' }}
                      onChange={() => form.setFieldValue('sectionId', undefined)}
                      options={classes.map((c) => ({ value: c._id, label: c.name }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="sectionId" label="Section">
                    <Select
                      placeholder="Select section"
                      style={{ width: '100%' }}
                      options={selectedClassData?.sections.map((s) => ({ value: s.name, label: s.name })) ?? []}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="rollNo" label="Roll Number">
                    <Input placeholder="Roll No." />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="admissionDate" label="Admission Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="previousSchool" label="Previous School">
                    <Input placeholder="Previous institution name" />
                  </Form.Item>
                </Col>
              </Row>

              <SectionTitle title="Address" />
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name={['address', 'street']} label="Street">
                    <Input placeholder="Street address" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['address', 'city']} label="City">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['address', 'state']} label="State">
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['address', 'zip']} label="ZIP Code">
                    <Input placeholder="PIN Code" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['address', 'country']} label="Country">
                    <Input placeholder="Country" />
                  </Form.Item>
                </Col>
              </Row>

              <SectionTitle title="Parent / Guardian Information" />
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name={['parent', 'fatherName']} label="Father's Name">
                    <Input placeholder="Father's full name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['parent', 'motherName']} label="Mother's Name">
                    <Input placeholder="Mother's full name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['parent', 'guardianName']} label="Guardian Name">
                    <Input placeholder="Primary guardian" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['parent', 'guardianRelation']} label="Relation">
                    <Select
                      placeholder="Select"
                      style={{ width: '100%' }}
                      options={['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Other'].map((r) => ({ value: r.toLowerCase(), label: r }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name={['parent', 'guardianPhone']}
                    label="Guardian Phone"
                    rules={[{ pattern: /^\+?[0-9\s-]{7,15}$/, message: 'Invalid phone number' }]}
                  >
                    <Input placeholder="+91 9876543210" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={['parent', 'guardianEmail']} label="Guardian Email">
                    <Input type="email" placeholder="guardian@email.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Link href="/students">
                    <Button block size="large" style={{ borderRadius: 8 }}>Cancel</Button>
                  </Link>
                </Col>
                <Col span={12}>
                  <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ borderRadius: 8 }}>
                    Register Student
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {credsModal && (
        <CredentialsModal
          open
          role="student"
          name={credsModal.name}
          username={credsModal.username}
          tempPassword={credsModal.tempPassword}
          onClose={() => { setCredsModal(null); router.push('/students'); }}
          extra={
            <PDFDownloadButton
              document={<AdmissionSlipPDF student={credsModal.studentData} tenant={tenant} resolvedLogo={resolvedLogo} credentials={{ username: credsModal.username, tempPassword: credsModal.tempPassword }} />}
              fileName={`admission-slip-${credsModal.username}.pdf`}
              buttonText="Download Admission Slip PDF"
              icon={<FilePdfOutlined />}
            />
          }
        />
      )}
    </div>
  );
}
