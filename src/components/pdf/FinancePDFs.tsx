'use client';

import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { Student, Teacher, Tenant, FeeSlip, Payslip, ThemeColor } from '@/types';
import { themeTokens } from '@/lib/theme';
import { getSafeLogoUrl, formatDate } from '@/lib/utils';

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getPrimaryColor(tenant: Tenant | null): string {
  const key = tenant?.branding?.primaryColor as ThemeColor | undefined;
  return key ? themeTokens[key].colorPrimary : '#1e40af';
}

const getStyles = (c: string) => StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#ffffff', padding: 0 },

  outerBorder: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 2.5, borderColor: c },
  innerBorder: { position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 0.8, borderColor: c },

  body: { padding: 32, paddingTop: 26 },

  letterhead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  logo: { width: 64, height: 64 },
  schoolBlock: { flex: 1 },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: c },
  schoolMeta: { fontSize: 7.5, color: '#374151', marginTop: 2, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  schoolAddr: { fontSize: 7.5, color: '#6b7280', marginTop: 2 },

  titleBar: { backgroundColor: c, paddingVertical: 7, alignItems: 'center', marginBottom: 14 },
  titleText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase' },
  titleSub: { fontSize: 7.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaBox: { borderWidth: 1, borderColor: c, paddingVertical: 5, paddingHorizontal: 10 },
  metaLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 2 },

  sectionHead: { backgroundColor: c, paddingVertical: 4, paddingHorizontal: 10 },
  sectionHeadText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1 },

  infoTable: { borderWidth: 1, borderColor: c, marginBottom: 16 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },
  infoRowLast: { flexDirection: 'row' },
  labelCell: { width: 120, backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: c },
  valueCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  valueCellLast: { flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  labelText: { fontSize: 7.5, color: '#475569', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  valueText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },

  // Fee table
  feeTable: { borderWidth: 1, borderColor: c, marginBottom: 16 },
  thead: { flexDirection: 'row', backgroundColor: c, paddingVertical: 7, paddingHorizontal: 10 },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 },
  thAmt: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
  trow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  td: { fontSize: 9, color: '#374151' },
  tdAmt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' },
  trowAlt: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', backgroundColor: '#f8fafc' },

  // Summary
  summaryBox: { alignSelf: 'flex-end', width: 220, marginBottom: 16 },
  totalBar: { backgroundColor: c, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 12 },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalVal: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#ffffff' },

  // Status badge
  badgeRow: { marginBottom: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Payslip columns
  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colTable: { flex: 1, borderWidth: 1, borderColor: c },
  colTfoot: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: c },
  colTfootLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#111827' },
  colTfootVal: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#111827', textAlign: 'right' },

  netBox: { alignSelf: 'flex-end', width: 240, borderWidth: 2, borderColor: c, marginBottom: 16 },
  netHead: { backgroundColor: c, paddingVertical: 7, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netHeadLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 },
  netHeadVal: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#ffffff' },
  netWords: { paddingVertical: 5, paddingHorizontal: 12, backgroundColor: '#f8fafc' },
  netWordsText: { fontSize: 7.5, color: '#6b7280', fontStyle: 'italic' },

  // Footer / signatures
  footer: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBox: { alignItems: 'center', width: 150 },
  sigLine: { width: 150, borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 6 },
  sigText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },

  footNote: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 8 },
  footNoteText: { fontSize: 7, color: '#9ca3af', textAlign: 'center' },
});

// ── Fee Slip PDF ─────────────────────────────────────────────────────────────

export function FeeSlipPDF({ student, slip, tenant }: { student: Student; slip: FeeSlip; tenant: Tenant | null }) {
  const primaryColor = getPrimaryColor(tenant);
  const s = getStyles(primaryColor);
  const logoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const isPaid = slip.status === 'paid';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.outerBorder} />
        <View style={s.innerBorder} />
        <View style={s.body}>

          {/* Letterhead */}
          <View style={s.letterhead}>
            <Image src={logoUrl} style={s.logo} />
            <View style={s.schoolBlock}>
              <Text style={s.schoolName}>{tenant?.branding?.schoolName || tenant?.name}</Text>
              <Text style={s.schoolMeta}>{tenant?.type}</Text>
              <Text style={s.schoolAddr}>{tenant?.address}{tenant?.city ? `, ${tenant.city}` : ''}</Text>
            </View>
          </View>

          {/* Title bar */}
          <View style={s.titleBar}>
            <Text style={s.titleText}>Student Fee Slip</Text>
            <Text style={s.titleSub}>{MONTH_NAMES[slip.month]} {slip.year}</Text>
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Slip No</Text>
              <Text style={s.metaVal}>FEE-{slip._id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Issue Date</Text>
              <Text style={s.metaVal}>{formatDate(new Date().toISOString())}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Due Date</Text>
              <Text style={s.metaVal}>{formatDate(slip.dueDate)}</Text>
            </View>
          </View>

          {/* Student info */}
          <View style={s.sectionHead}><Text style={s.sectionHeadText}>Student Details</Text></View>
          <View style={s.infoTable}>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Student Name</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{student.name}</Text></View>
              <View style={s.labelCell}><Text style={s.labelText}>Admission No</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.admissionNo}</Text></View>
            </View>
            <View style={s.infoRowLast}>
              <View style={s.labelCell}><Text style={s.labelText}>Class / Section</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{cls?.name ?? '—'} — {student.sectionId}</Text></View>
              <View style={s.labelCell}><Text style={s.labelText}>Roll No</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{student.rollNo || '—'}</Text></View>
            </View>
          </View>

          {/* Fee breakdown */}
          <View style={s.sectionHead}><Text style={s.sectionHeadText}>Fee Particulars</Text></View>
          <View style={s.feeTable}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 3 }]}>Description</Text>
              <Text style={s.thAmt}>Amount (INR)</Text>
            </View>
            <View style={s.trow}>
              <Text style={[s.td, { flex: 3 }]}>Tuition Fee — {MONTH_NAMES[slip.month]} {slip.year}</Text>
              <Text style={s.tdAmt}>{slip.amount.toFixed(2)}</Text>
            </View>
            {slip.discount > 0 && (
              <View style={[s.trowAlt]}>
                <Text style={[s.td, { flex: 3, color: '#16a34a' }]}>Scholarship / Discount</Text>
                <Text style={[s.tdAmt, { color: '#16a34a' }]}>− {slip.discount.toFixed(2)}</Text>
              </View>
            )}
            {slip.fine > 0 && (
              <View style={s.trow}>
                <Text style={[s.td, { flex: 3, color: '#dc2626' }]}>Late Fine / Penalty</Text>
                <Text style={[s.tdAmt, { color: '#dc2626' }]}>+ {slip.fine.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Total */}
          <View style={s.summaryBox}>
            <View style={s.totalBar}>
              <Text style={s.totalLabel}>Net Payable</Text>
              <Text style={s.totalVal}>INR {slip.netAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: isPaid ? '#f0fdf4' : '#fff7ed', borderWidth: 1, borderColor: isPaid ? '#16a34a' : '#c2410c' }]}>
              <Text style={[s.badgeText, { color: isPaid ? '#16a34a' : '#c2410c' }]}>
                {isPaid ? 'PAID' : slip.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={s.footer}>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigText}>Parent&apos;s Signature</Text>
            </View>
            <View style={s.sigBox}>
              <View style={[s.sigLine, { borderBottomColor: primaryColor }]} />
              <Text style={[s.sigText, { color: primaryColor }]}>Accountant / Seal</Text>
            </View>
          </View>

          <View style={s.footNote}>
            <Text style={s.footNoteText}>
              This is a system-generated document. Please retain for your records. — {tenant?.branding?.schoolName || tenant?.name}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}

// ── Payslip PDF ───────────────────────────────────────────────────────────────

export function PayslipPDF({ teacher, slip, tenant }: { teacher: Teacher; slip: Payslip; tenant: Tenant | null }) {
  const primaryColor = getPrimaryColor(tenant);
  const s = getStyles(primaryColor);
  const logoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);
  const grossEarnings = slip.baseSalary + slip.allowances;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.outerBorder} />
        <View style={s.innerBorder} />
        <View style={s.body}>

          {/* Letterhead */}
          <View style={s.letterhead}>
            <Image src={logoUrl} style={s.logo} />
            <View style={s.schoolBlock}>
              <Text style={s.schoolName}>{tenant?.branding?.schoolName || tenant?.name}</Text>
              <Text style={s.schoolMeta}>{tenant?.type}</Text>
              <Text style={s.schoolAddr}>{tenant?.address}{tenant?.city ? `, ${tenant.city}` : ''}</Text>
            </View>
          </View>

          {/* Title bar */}
          <View style={s.titleBar}>
            <Text style={s.titleText}>Salary Payslip</Text>
            <Text style={s.titleSub}>{MONTH_NAMES[slip.month]} {slip.year}</Text>
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Payslip No</Text>
              <Text style={s.metaVal}>PAY-{slip._id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Pay Date</Text>
              <Text style={s.metaVal}>{slip.paymentDate ? formatDate(slip.paymentDate) : 'Pending'}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Status</Text>
              <Text style={s.metaVal}>{slip.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* Employee info */}
          <View style={s.sectionHead}><Text style={s.sectionHeadText}>Employee Details</Text></View>
          <View style={s.infoTable}>
            <View style={s.infoRow}>
              <View style={s.labelCell}><Text style={s.labelText}>Employee Name</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{teacher.name}</Text></View>
              <View style={s.labelCell}><Text style={s.labelText}>Employee ID</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{teacher.employeeId}</Text></View>
            </View>
            <View style={s.infoRowLast}>
              <View style={s.labelCell}><Text style={s.labelText}>Designation</Text></View>
              <View style={s.valueCell}><Text style={s.valueText}>{teacher.designation || '—'}</Text></View>
              <View style={s.labelCell}><Text style={s.labelText}>Department</Text></View>
              <View style={s.valueCellLast}><Text style={s.valueText}>{teacher.qualification || '—'}</Text></View>
            </View>
          </View>

          {/* Earnings & Deductions side by side */}
          <View style={s.twoCol}>
            <View style={s.colTable}>
              <View style={s.thead}><Text style={[s.th, { flex: 1 }]}>Earnings</Text><Text style={s.thAmt}>INR</Text></View>
              <View style={s.trow}>
                <Text style={[s.td, { flex: 1 }]}>Base Salary</Text>
                <Text style={s.tdAmt}>{slip.baseSalary.toFixed(2)}</Text>
              </View>
              <View style={s.trowAlt}>
                <Text style={[s.td, { flex: 1 }]}>Allowances</Text>
                <Text style={s.tdAmt}>{slip.allowances.toFixed(2)}</Text>
              </View>
              <View style={[s.colTfoot, { backgroundColor: '#f1f5f9' }]}>
                <Text style={[s.colTfootLabel, { flex: 1 }]}>Gross Earnings</Text>
                <Text style={s.colTfootVal}>{grossEarnings.toFixed(2)}</Text>
              </View>
            </View>

            <View style={s.colTable}>
              <View style={[s.thead, { backgroundColor: '#dc2626' }]}><Text style={[s.th, { flex: 1 }]}>Deductions</Text><Text style={s.thAmt}>INR</Text></View>
              <View style={s.trow}>
                <Text style={[s.td, { flex: 1 }]}>Total Deductions</Text>
                <Text style={[s.tdAmt, { color: '#dc2626' }]}>{slip.deductions.toFixed(2)}</Text>
              </View>
              <View style={[s.colTfoot, { backgroundColor: '#fff1f2', flex: 1 }]}>
                <Text style={[s.colTfootLabel, { flex: 1, color: '#dc2626' }]}>Net Deductions</Text>
                <Text style={[s.colTfootVal, { color: '#dc2626' }]}>{slip.deductions.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Net Salary */}
          <View style={s.netBox}>
            <View style={s.netHead}>
              <Text style={s.netHeadLabel}>Net Salary</Text>
              <Text style={s.netHeadVal}>INR {slip.netSalary.toFixed(2)}</Text>
            </View>
            <View style={s.netWords}>
              <Text style={s.netWordsText}>
                In Words: {Math.round(slip.netSalary).toLocaleString('en-IN')} Rupees Only
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={s.footer}>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigText}>Employee Signature</Text>
            </View>
            <View style={s.sigBox}>
              <View style={[s.sigLine, { borderBottomColor: primaryColor }]} />
              <Text style={[s.sigText, { color: primaryColor }]}>Authorized Signatory</Text>
            </View>
          </View>

          <View style={s.footNote}>
            <Text style={s.footNoteText}>
              This is a system-generated payslip. For queries contact the HR / Accounts department. — {tenant?.branding?.schoolName || tenant?.name}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}
