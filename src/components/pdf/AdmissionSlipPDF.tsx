'use client';

import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { Student, Tenant, ThemeColor } from '@/types';
import { themeTokens } from '@/lib/theme';

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

// Function to generate styles with dynamic primary color
const getStyles = (primaryColor: string) => StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#ffffff', padding: 0 },

  // Outer + inner border
  outerBorder: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 2.5, borderColor: primaryColor },
  innerBorder: { position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 0.8, borderColor: primaryColor },

  body: { padding: 32, paddingTop: 26 },

  // ── Letterhead ──
  letterhead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  logo: { width: 68, height: 68 },
  schoolBlock: { flex: 1 },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 17, color: primaryColor },
  schoolType: { fontSize: 8, color: '#374151', marginTop: 2, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  schoolAddr: { fontSize: 7.5, color: '#6b7280', marginTop: 2 },

  // ── Title bar ──
  titleBar: { backgroundColor: primaryColor, paddingVertical: 7, alignItems: 'center', marginBottom: 14 },
  titleText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  titleSub: { fontSize: 7.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // ── Slip meta row (serial + date) ──
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaBox: { borderWidth: 1, borderColor: primaryColor, paddingVertical: 5, paddingHorizontal: 10 },
  metaLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 2 },

  // ── Section heading ──
  sectionHead: { backgroundColor: primaryColor, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 0 },
  sectionHeadText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1 },

  // ── Info table ──
  infoTable: { borderWidth: 1, borderColor: primaryColor, marginBottom: 12 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },
  infoRowLast: { flexDirection: 'row' },
  labelCell: { width: 130, backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: primaryColor },
  valueCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  valueCellLast: { flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  labelText: { fontSize: 7.5, color: '#475569', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  valueText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },

  // ── Credentials box ──
  credBox: { borderWidth: 1.5, borderColor: primaryColor, backgroundColor: '#f8fafc', marginBottom: 14 },
  credHead: { backgroundColor: primaryColor, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  credHeadText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#ffffff', letterSpacing: 1, textTransform: 'uppercase' },
  credBody: { flexDirection: 'row' },
  credCell: { flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: primaryColor, alignItems: 'center' },
  credCellLast: { flex: 1, padding: 12, alignItems: 'center' },
  credLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  credVal: { fontSize: 13, fontFamily: 'Courier-Bold', color: '#166534', marginTop: 4 },
  credWarning: { borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingVertical: 5, paddingHorizontal: 10, alignItems: 'center' },
  credWarningText: { fontSize: 7.5, color: '#b45309', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  // ── Instructions ──
  instructionBox: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: 10, marginBottom: 14 },
  instructionHead: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: primaryColor, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  instructionItem: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  instructionDot: { fontSize: 7.5, color: primaryColor, fontFamily: 'Helvetica-Bold' },
  instructionText: { fontSize: 7.5, color: '#374151', flex: 1 },

  // ── Signatures ──
  sigSection: { marginTop: 10 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sigBlock: { alignItems: 'center', width: 140 },
  sigLine: { width: 140, height: 0.8, backgroundColor: primaryColor, marginBottom: 4 },
  sigLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: primaryColor },
  sigSub: { fontSize: 7, color: '#6b7280', marginTop: 1 },
  sealCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6, color: primaryColor, textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  // ── Footer ──
  footer: { borderTopWidth: 0.5, borderTopColor: '#94a3b8', paddingTop: 6, marginTop: 12, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#9ca3af', textAlign: 'center' },
});

interface Props {
  student: Student;
  tenant: Tenant | null;
  resolvedLogo?: string;
  credentials?: {
    username: string;
    tempPassword?: string;
  };
}

export default function AdmissionSlipPDF({ student, tenant, resolvedLogo, credentials }: Props) {
  const primaryColor = tenant?.branding?.primaryColor
    ? themeTokens[tenant.branding.primaryColor as ThemeColor]?.colorPrimary
    : '#1e3a5f';

  const s = getStyles(primaryColor);

  const cls = typeof student.classId === 'object' && student.classId !== null
    ? student.classId
    : null;

  const logoSrc = resolvedLogo || DEFAULT_LOGO;
  const schoolName = tenant?.branding?.schoolName || tenant?.name || 'Institution';
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const serialNo = `ADM-SLIP-${student.admissionNo || student._id || 'N/A'}`;

  // Resolve guardian display — prefer guardianName, fall back to fatherName
  const guardianName = student.parent?.guardianName || student.parent?.fatherName || '—';
  const guardianPhone = student.parent?.guardianPhone || '—';
  const guardianEmail = student.parent?.guardianEmail || '—';

  // Build full student address
  const fullAddress = [
    student.address?.street,
    student.address?.city,
    student.address?.state,
    student.address?.zip,
    student.address?.country
  ].filter(Boolean).join(', ');

  return (
    <Document title={`Admission Slip - ${student.name}`}>
      <Page size="A4" style={s.page}>
        {/* Borders */}
        <View style={s.outerBorder} />
        <View style={s.innerBorder} />

        <View style={s.body}>
          {/* Letterhead */}
          <View style={s.letterhead}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoSrc} style={s.logo} />
            <View style={s.schoolBlock}>
              <Text style={s.schoolName}>{schoolName}</Text>
              {/* <Text style={s.schoolType}>{tenant?.type || 'Educational Institution'}</Text> */}
              <Text style={s.schoolAddr}>
                {[tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean).join(', ')}
              </Text>
              <Text style={s.schoolAddr}>
                {tenant?.phone ? `Tel: ${tenant.phone}` : ''}{tenant?.phone && tenant?.email ? '  |  ' : ''}{tenant?.email ? `Email: ${tenant.email}` : ''}
              </Text>
              <Text style={s.schoolAddr}>
                {tenant?.schoolCode ? `Code: ${tenant.schoolCode}` : ''}
              </Text>
            </View>
          </View>

          {/* Title bar */}
          <View style={s.titleBar}>
            <Text style={s.titleText}>Admission Confirmation Slip</Text>
            <Text style={s.titleSub}>This document confirms enrolment in the institution</Text>
          </View>

          {/* Slip meta */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Slip No.</Text>
              <Text style={s.metaVal}>{serialNo}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Date of Issue</Text>
              <Text style={s.metaVal}>{issueDate}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Academic Year</Text>
              <Text style={s.metaVal}>2025 – 2026</Text>
            </View>
          </View>

          {/* Student Information */}
          <View style={s.sectionHead}>
            <Text style={s.sectionHeadText}>Student Information</Text>
          </View>
          <View style={s.infoTable}>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Full Name</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{student.name || '—'}</Text></View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Admission No.</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.admissionNo || '—'}</Text></View>
            </View>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Class</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{cls?.name || '—'}</Text></View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Section</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.sectionId || '—'}</Text></View>
            </View>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Roll Number</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{student.rollNo || '—'}</Text></View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Date of Birth</Text></View>
              <View style={s.valueCellLast}>
                <Text style={s.valueText}>
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'}
                </Text>
              </View>
            </View>
            <View style={s.infoRowLast}>
              <View style={s.labelCell}><Text style={s.labelText}>Gender</Text></View>
              <View style={s.valueCell}>
                <Text style={s.valueText}>{student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '—'}</Text>
              </View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Admission Date</Text></View>
              <View style={s.valueCellLast}>
                <Text style={s.valueText}>
                  {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : issueDate}
                </Text>
              </View>
            </View>
          </View>

          {/* Residential Address */}
          <View style={s.sectionHead}>
            <Text style={s.sectionHeadText}>Residential Address</Text>
          </View>
          <View style={s.infoTable}>
            <View style={s.infoRowLast}>
                <View style={[s.labelCell, { width: 100 }]}><Text style={s.labelText}>Address</Text></View>
                <View style={s.valueCellLast}><Text style={s.valueText}>{fullAddress || '—'}</Text></View>
            </View>
          </View>

          {/* Parent Information */}
          <View style={s.sectionHead}>
            <Text style={s.sectionHeadText}>Parent / Guardian Information</Text>
          </View>
          <View style={s.infoTable}>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Guardian Name</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{guardianName}</Text></View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Father&apos;s Name</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.parent?.fatherName || '—'}</Text></View>
            </View>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Phone Number</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{guardianPhone}</Text></View>
              <View style={[s.labelCell, { borderLeftWidth: 0.5, borderLeftColor: primaryColor }]}><Text style={s.labelText}>Mother&apos;s Name</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.parent?.motherName || '—'}</Text></View>
            </View>
            <View style={s.infoRowLast}>
              <View style={s.labelCell}><Text style={s.labelText}>Email Address</Text></View>
              <View style={[s.valueCellLast, { flex: 3 }]}><Text style={s.valueText}>{guardianEmail}</Text></View>
            </View>
          </View>

          {/* Login Credentials */}
          {credentials && (
            <View style={s.credBox}>
              <View style={s.credHead}>
                <Text style={s.credHeadText}>Student Portal Login Credentials</Text>
              </View>
              <View style={s.credBody}>
                <View style={s.credCell}>
                  <Text style={s.credLabel}>Username</Text>
                  <Text style={s.credVal}>{credentials.username}</Text>
                </View>
                {credentials.tempPassword && (
                  <View style={s.credCellLast}>
                    <Text style={s.credLabel}>Temporary Password</Text>
                    <Text style={s.credVal}>{credentials.tempPassword}</Text>
                  </View>
                )}
              </View>
              <View style={s.credWarning}>
                <Text style={s.credWarningText}>
                  Important: Change your password immediately after first login. Do not share these credentials with anyone.
                </Text>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={s.instructionBox}>
            <Text style={s.instructionHead}>Important Instructions</Text>
            {[
              'This slip must be presented at the time of document verification.',
              'Original documents (Birth Certificate, Transfer Certificate, etc.) must be submitted within 7 days.',
              'Fees must be paid as per the schedule communicated by the institution.',
              'This admission is provisional and subject to verification of all submitted documents.',
            ].map((item, i) => (
              <View key={i} style={s.instructionItem}>
                <Text style={s.instructionDot}>{i + 1}.</Text>
                <Text style={s.instructionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Signatures */}
          <View style={s.sigSection}>
            <View style={s.sigRow}>
              <View style={s.sigBlock}>
                <View style={s.sigLine} />
                <Text style={s.sigLabel}>Parent / Guardian</Text>
                <Text style={s.sigSub}>Signature &amp; Date</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={s.sealCircle}>
                  <Text style={s.sealText}>OFFICIAL{'\n'}SEAL</Text>
                </View>
              </View>
              <View style={s.sigBlock}>
                <View style={s.sigLine} />
                <Text style={s.sigLabel}>Principal / Registrar</Text>
                <Text style={s.sigSub}>Signature &amp; Stamp</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              This is a computer-generated document issued by {schoolName}. Any tampering renders it invalid.
            </Text>
            <Text style={[s.footerText, { marginTop: 2 }]}>
              Institution Code: {tenant?.schoolCode || 'N/A'}  |  {tenant?.email || ''}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
