'use client';

import {
  PDFDownloadLink, PDFViewer, Document, Page,
  Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Certificate, Student, Tenant, CertificateType, ThemeColor } from '@/types';
import { themeTokens } from '@/lib/theme';
import { getSafeLogoUrl } from '@/lib/utils';
import { imageUrlToBase64Png } from '@/lib/imageUtils';
import { PDFDownloadButton } from './PDFDownloadButton';

const { Text: AntText } = Typography;

interface Props {
  certificate: Certificate;
  student: Student;
  tenant: Tenant | null;
}

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

interface TemplateProps {
  student: Student;
  certificate: Certificate;
  primaryColor: string;
  schoolName: string;
  logoUrl: string;
  tenant: Tenant | null;
  schoolInitials: string;
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const shared = StyleSheet.create({
  logoImg: { objectFit: 'contain' },
  bodyText: { fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.8, textAlign: 'center', color: '#475569', maxWidth: 580 },
  recipientName: { fontFamily: 'Helvetica-Bold', fontSize: 36, textAlign: 'center', marginVertical: 10 },
  certTitle: { fontFamily: 'Helvetica-Bold', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center' },
  sigLine: { width: 140, borderBottomWidth: 1.5, borderBottomColor: '#e2e8f0', marginBottom: 6 },
  sigTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sigSub: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase' },
  sealInitial: { fontFamily: 'Helvetica-Bold', fontSize: 22 },
  sealText: { fontSize: 6, letterSpacing: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
});

const CERT_TITLES: Record<CertificateType, string> = {
  bonafide: 'Bonafide Certificate',
  transfer: 'Transfer Certificate',
  character: 'Character Certificate',
  completion: 'Completion Certificate',
  merit: 'Certificate of Merit',
};

const CERT_BODY: Record<CertificateType, (n: string, s: string, c: string) => string> = {
  bonafide: (n, s, c) => `This is to certify that ${n} is a bonafide student of ${s}, currently enrolled in ${c}. This certificate is issued as official evidence of enrollment.`,
  transfer: (n, s, c) => `This is to certify that ${n} was a student of ${s}, having completed their academic tenure in ${c}. The student is cleared for admission to any recognized institution.`,
  character: (n, s, c) => `This certifies that ${n}, a student of ${c} at ${s}, has demonstrated exemplary moral character, sincere dedication, and commendable conduct throughout their stay.`,
  completion: (n, s, c) => `${n} has successfully completed the prescribed curriculum for ${c} at ${s}. All required academic and institutional standards have been successfully fulfilled.`,
  merit: (n, s, c) => `This Certificate of Merit is awarded to ${n} of ${c} at ${s} in recognition of outstanding achievements, dedication, and exemplary overall academic performance.`,
};

/**
 * Robustly extracts the class name from student or certificate data fallbacks.
 */
function getStudentClass(student: Student, certificate: Certificate): string {
  // 1. Direct object on student
  if (typeof student.classId === 'object' && student.classId?.name) {
    return student.classId.name;
  }

  // 2. Fallback to certificate content (if saved during generation)
  const content = certificate.content as any;
  if (typeof content?.classId === 'object' && content?.classId?.name) {
    return content.classId.name;
  }

  if (typeof content?.className === 'string') {
    return content.className;
  }

  // 3. Last resort string ID (highly unlikely to be readable but better than nothing)
  if (typeof student.classId === 'string' && !student.classId.match(/^[0-9a-fA-F]{24}$/)) {
    return student.classId;
  }

  return '—';
}

function SignatureRow({ primaryColor, leftLabel, rightLabel }: { primaryColor: string; leftLabel: string; rightLabel: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', paddingHorizontal: 40, marginTop: 'auto' }}>
      <View style={{ alignItems: 'center' }}>
        <View style={shared.sigLine} />
        <Text style={[shared.sigTitle, { color: primaryColor }]}>{leftLabel}</Text>
        <Text style={shared.sigSub}>Authorized Signatory</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={shared.sigLine} />
        <Text style={[shared.sigTitle, { color: primaryColor }]}>{rightLabel}</Text>
        <Text style={shared.sigSub}>Administrative Head</Text>
      </View>
    </View>
  );
}

// ── TEMPLATE: CLASSIC ─────────────────────────────────────────────────────────
function ClassicCertificate({ student, certificate, primaryColor, schoolName, logoUrl, tenant, schoolInitials }: TemplateProps) {
  const cls = getStudentClass(student, certificate);
  const bodyText = CERT_BODY[certificate.type]?.(student.name, schoolName, cls) || '';

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 40, backgroundColor: '#ffffff' }}>
      {/* Decorative Borders */}
      <View style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderTopWidth: 8, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 8, borderColor: primaryColor + '10', borderRadius: 16 }} fixed />
      <View style={{ position: 'absolute', top: 32, left: 32, right: 32, bottom: 32, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2, borderColor: primaryColor, borderRadius: 8, opacity: 0.6 }} fixed />

      <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
        <Image src={logoUrl} style={{ width: 70, height: 70, borderRadius: 12, marginBottom: 12 }} />
        <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1.5 }}>{schoolName}</Text>
        <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{[tenant?.address, tenant?.city].filter(Boolean).join(', ')}</Text>

        <View style={{ height: 2, width: 80, backgroundColor: primaryColor, marginVertical: 20, borderRadius: 1 }} />

        <Text style={[shared.certTitle, { color: '#1e293b' }]}>{CERT_TITLES[certificate.type]}</Text>
        <Text style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginVertical: 10 }}>This is to certify that</Text>
        <Text style={[shared.recipientName, { color: primaryColor }]}>{student.name}</Text>
        <Text style={shared.bodyText}>{bodyText}</Text>

        <SignatureRow primaryColor={primaryColor} leftLabel="Controller of Exams" rightLabel="The Principal" />
      </View>
    </Page>
  );
}

// ── TEMPLATE: ELEGANT ─────────────────────────────────────────────────────────
function ElegantCertificate({ student, certificate, primaryColor, schoolName, logoUrl, tenant, schoolInitials }: TemplateProps) {
  const cls = getStudentClass(student, certificate);
  const bodyText = CERT_BODY[certificate.type]?.(student.name, schoolName, cls) || '';

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 0, backgroundColor: '#ffffff' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 20, height: '100%', backgroundColor: primaryColor }} fixed />

      <View style={{ flex: 1, padding: 50, paddingLeft: 70 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <View>
            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{schoolName}</Text>
            <Text style={{ fontSize: 10, color: primaryColor, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>Institutional Excellence</Text>
          </View>
          <Image src={logoUrl} style={{ width: 64, height: 64, borderRadius: 32 }} />
        </View>

        <Text style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 5, color: '#94a3b8', marginBottom: 20 }}>{CERT_TITLES[certificate.type]}</Text>
        <Text style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>Proudly presented to</Text>
        <Text style={{ fontSize: 48, fontFamily: 'Helvetica-Bold', color: primaryColor, marginBottom: 8 }}>{student.name}</Text>
        <View style={{ height: 4, width: 300, backgroundColor: primaryColor + '15', borderRadius: 2, marginBottom: 20 }} />

        <Text style={[shared.bodyText, { textAlign: 'left', fontSize: 12 }]}>{bodyText}</Text>

        <SignatureRow primaryColor={primaryColor} leftLabel="Academic Registrar" rightLabel="President" />
      </View>
    </Page>
  );
}

// ── TEMPLATE: MODERN ──────────────────────────────────────────────────────────
function ModernCertificate({ student, certificate, primaryColor, schoolName, logoUrl, tenant, schoolInitials }: TemplateProps) {
  const cls = getStudentClass(student, certificate);
  const bodyText = CERT_BODY[certificate.type]?.(student.name, schoolName, cls) || '';

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 40, backgroundColor: '#fcfcfc' }}>
      {/* Geometric Accents */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: 200, height: 200, backgroundColor: primaryColor + '05', borderRadius: 100, marginLeft: -100, marginTop: -100 }} fixed />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 300, height: 300, backgroundColor: primaryColor + '05', borderRadius: 150, marginRight: -150, marginBottom: -150 }} fixed />

      <View style={{ flex: 1, borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 24, backgroundColor: '#ffffff', padding: 40, alignItems: 'center' }}>
        <View style={{ width: 120, height: 4, backgroundColor: primaryColor, borderRadius: 2, marginBottom: 30 }} />

        <Image src={logoUrl} style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 16 }} />
        <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 2 }}>{schoolName}</Text>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: -0.5 }}>{CERT_TITLES[certificate.type]}</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginVertical: 12 }}>Awarded to</Text>
          <Text style={{ fontSize: 42, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{student.name}</Text>
          <Text style={[shared.bodyText, { marginTop: 20 }]}>{bodyText}</Text>
        </View>

        <SignatureRow primaryColor={primaryColor} leftLabel="Verifier" rightLabel="Director" />
      </View>
    </Page>
  );
}

// ── TEMPLATE: ROYAL ───────────────────────────────────────────────────────────
function RoyalCertificate({ student, certificate, primaryColor, schoolName, logoUrl, tenant, schoolInitials }: TemplateProps) {
  const cls = getStudentClass(student, certificate);
  const bodyText = CERT_BODY[certificate.type]?.(student.name, schoolName, cls) || '';
  const gold = '#d4af37';
  const navy = '#0f172a';

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 40, backgroundColor: '#ffffff' }}>
      <View style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 2, borderColor: gold, borderRadius: 4 }} fixed />
      <View style={{ position: 'absolute', top: 25, left: 25, right: 25, bottom: 25, borderWidth: 10, borderColor: navy, borderRadius: 4 }} fixed />

      <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <View style={{ height: 1.5, width: 100, backgroundColor: gold }} />
          <Image src={logoUrl} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: gold }} />
          <View style={{ height: 1.5, width: 100, backgroundColor: gold }} />
        </View>

        <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: navy, letterSpacing: 1 }}>{schoolName}</Text>
        <Text style={{ fontSize: 11, color: gold, textTransform: 'uppercase', letterSpacing: 4, marginTop: 8 }}>Prestigious Recognition</Text>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20, borderRadius: 8, padding: 30 }}>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: navy, textTransform: 'uppercase' }}>{CERT_TITLES[certificate.type]}</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>Honorably Conferred Upon</Text>
          <Text style={{ fontSize: 40, fontFamily: 'Helvetica-Bold', color: navy, borderBottomWidth: 2, borderBottomColor: gold }}>{student.name}</Text>
          <Text style={[shared.bodyText, { marginTop: 16, color: '#334155' }]}>{bodyText}</Text>
        </View>

        <SignatureRow primaryColor={gold} leftLabel="Senate Head" rightLabel="Chancellor" />
      </View>
    </Page>
  );
}

// ── TEMPLATE: PEARL ───────────────────────────────────────────────────────────
function PearlCertificate({ student, certificate, primaryColor, schoolName, logoUrl, tenant, schoolInitials }: TemplateProps) {
  const cls = getStudentClass(student, certificate);
  const bodyText = CERT_BODY[certificate.type]?.(student.name, schoolName, cls) || '';

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 50, backgroundColor: '#ffffff' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, backgroundColor: primaryColor }} fixed />

      <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 30 }}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 }}>
          <View>
            <Text style={{ fontSize: 42, fontFamily: 'Helvetica-Bold', color: primaryColor, opacity: 0.1 }}>OFFICIAL</Text>
            <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginTop: -30 }}>{CERT_TITLES[certificate.type]}</Text>
          </View>
          <Image src={logoUrl} style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: primaryColor + '08', padding: 4 }} />
        </View>

        <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Presented for excellence to</Text>
        <Text style={{ fontSize: 46, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginVertical: 10 }}>{student.name}</Text>

        <View style={{ maxWidth: 500 }}>
          <Text style={[shared.bodyText, { textAlign: 'left', fontSize: 11 }]}>{bodyText}</Text>
        </View>

        <View style={{ position: 'absolute', top: 50, right: 0 }}>
          <Text style={{ fontSize: 80, fontFamily: 'Helvetica-Bold', color: primaryColor, opacity: 0.03 }}>{schoolInitials}</Text>
        </View>

        <SignatureRow primaryColor={primaryColor} leftLabel="Academy Board" rightLabel="Dean of Studies" />
      </View>
    </Page>
  );
}

// ── Document wrapper (receives pre-converted base64 logo) ────────────────────
function CertificateDocument({ certificate, student, tenant, resolvedLogo }: Props & { resolvedLogo: string }) {
  const template = tenant?.branding?.certificateTemplate || 'classic';
  const primaryColor = tenant?.branding?.primaryColor
    ? themeTokens[tenant.branding.primaryColor as ThemeColor]?.colorPrimary
    : '#1e40af';
  const schoolName = tenant?.branding?.schoolName || tenant?.name || 'School Name';
  const schoolInitials = schoolName.split(' ').map((w: string) => w[0]).slice(0, 3).join('');

  const props = { student, certificate, primaryColor, schoolName, logoUrl: resolvedLogo, tenant, schoolInitials };

  return (
    <Document title={`${CERT_TITLES[certificate.type]} — ${student.name}`}>
      {template === 'classic' && <ClassicCertificate {...props} />}
      {template === 'elegant' && <ElegantCertificate {...props} />}
      {template === 'modern' && <ModernCertificate {...props} />}
      {template === 'royal' && <RoyalCertificate {...props} />}
      {template === 'pearl' && <PearlCertificate {...props} />}
    </Document>
  );
}

// ── Public export ──────────────────────────────────────────────────────────────
export default function CertificatePDF({ certificate, student, tenant }: Props) {
  const fileName = `${certificate.type}-certificate-${student.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

  const rawLogoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);
  const [resolvedLogo, setResolvedLogo] = useState<string>('');
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    imageUrlToBase64Png(rawLogoUrl)
      .then((res) => {
        setResolvedLogo(res);
        // Add a slight delay for better UX transition
        setTimeout(() => setGenerating(false), 800);
      })
      .catch(() => {
        setResolvedLogo(DEFAULT_LOGO);
        setGenerating(false);
      });
  }, [rawLogoUrl]);

  const doc = <CertificateDocument certificate={certificate} student={student} tenant={tenant} resolvedLogo={resolvedLogo || DEFAULT_LOGO} />;

  if (generating) {
    return (
      <div style={{
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 12,
        gap: 16
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        <div style={{ textAlign: 'center' }}>
          <AntText strong style={{ display: 'block', fontSize: 16 }}>Generating Certificate...</AntText>
          <AntText type="secondary">Preparing official academic document</AntText>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-preview-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .pdf-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          gap: 16px;
        }
        .pdf-preview-body {
          padding: 0 24px 24px;
        }
        .pdf-viewer-wrapper {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        @media (max-width: 640px) {
          .pdf-preview-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 16px;
          }
          .pdf-preview-body {
            padding: 0 12px 12px;
          }
          .pdf-viewer-frame {
            height: 500px !important;
          }
        }
      `}</style>

      <div className="pdf-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--ant-color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <SafetyCertificateOutlined style={{ color: '#fff' }} />
          </div>
          <AntText strong style={{ fontSize: 16 }}>Certificate Preview</AntText>
        </div>

        <PDFDownloadButton
          document={doc}
          fileName={fileName}
          buttonText="Download Official Certificate"
        />
      </div>

      <div className="pdf-preview-body">
        <div className="pdf-viewer-wrapper">
          <PDFViewer width="100%" height={720} className="pdf-viewer-frame">
            {doc}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
