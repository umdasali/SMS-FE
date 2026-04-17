'use client';

import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { Student, Teacher, Tenant, FeeSlip, Payslip } from '@/types';
import { themeTokens } from '@/lib/theme';
import { getSafeLogoUrl, formatDate } from '@/lib/utils';

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#334155' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#f1f5f9', paddingBottom: 20 },
  schoolInfo: { gap: 4 },
  schoolName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  schoolAddress: { fontSize: 8, color: '#64748b' },
  logo: { width: 50, height: 50, borderRadius: 8 },
  
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: '#0f172a', textTransform: 'uppercase' },
  docSub: { fontSize: 9, textAlign: 'right', color: '#64748b', marginTop: 4 },

  infoGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  infoCol: { flex: 1, gap: 6 },
  infoRow: { flexDirection: 'row' },
  label: { width: 80, fontSize: 8, color: '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  value: { flex: 1, color: '#0f172a', fontFamily: 'Helvetica-Bold' },

  table: { marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  trow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  th: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  td: { flex: 1, fontSize: 9, color: '#1e293b' },
  tdBold: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  tdAmt: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },
  thAmt: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' },

  summary: { marginTop: 20, alignSelf: 'flex-end', width: 200, gap: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumLabel: { fontSize: 9, color: '#64748b' },
  sumVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 4 },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  totalVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#10b981' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 10 },
  statusText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  footer: { marginTop: 60, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
  sigBox: { alignItems: 'center', width: 150 },
  sigLine: { width: 150, borderBottomWidth: 1, borderBottomColor: '#0f172a', marginBottom: 8 },
  sigText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#64748b' },
});

const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ── Fee Slip PDF Component ───────────────────────────────────────────────────
export function FeeSlipPDF({ student, slip, tenant }: { student: Student, slip: FeeSlip, tenant: Tenant | null }) {
  const primaryColor = tenant?.branding?.primaryColor 
    ? (themeTokens as any)[tenant.branding.primaryColor]?.colorPrimary 
    : '#1e40af';
  const logoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);
  const cls = typeof student.classId === 'object' ? student.classId : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.schoolInfo}>
            <Text style={[styles.schoolName, { color: primaryColor }]}>{tenant?.branding?.schoolName || tenant?.name}</Text>
            <Text style={styles.schoolAddress}>{tenant?.address}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Student Fee Slip</Text>
            <Text style={styles.docSub}>{monthNames[slip.month]} {slip.year}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.label}>Student</Text><Text style={styles.value}>{student.name}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Adm No</Text><Text style={styles.value}>{student.admissionNo}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Class</Text><Text style={styles.value}>{cls?.name} - {student.sectionId}</Text></View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.label}>Slip No</Text><Text style={styles.value}>FEE-{slip._id.slice(-6).toUpperCase()}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Due Date</Text><Text style={styles.value}>{formatDate(slip.dueDate)}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Date</Text><Text style={styles.value}>{formatDate(new Date().toISOString())}</Text></View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, { flex: 3 }]}>Description</Text>
            <Text style={styles.thAmt}>Amount</Text>
          </View>
          <View style={styles.trow}>
            <Text style={[styles.td, { flex: 3 }]}>Monthly Tuition Fee - {monthNames[slip.month]} {slip.year}</Text>
            <Text style={styles.tdAmt}>{slip.amount.toFixed(2)}</Text>
          </View>
          {slip.discount > 0 && (
            <View style={styles.trow}>
              <Text style={[styles.td, { flex: 3, color: '#10b981' }]}>Discount</Text>
              <Text style={[styles.tdAmt, { color: '#10b981' }]}>- {slip.discount.toFixed(2)}</Text>
            </View>
          )}
          {slip.fine > 0 && (
            <View style={styles.trow}>
              <Text style={[styles.td, { flex: 3, color: '#ef4444' }]}>Late Fine / Others</Text>
              <Text style={[styles.tdAmt, { color: '#ef4444' }]}>+ {slip.fine.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={[styles.totalVal, { color: primaryColor }]}>INR {slip.netAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: slip.status === 'paid' ? '#f0fdf4' : '#fff7ed' }]}>
          <Text style={[styles.statusText, { color: slip.status === 'paid' ? '#16a34a' : '#c2410c' }]}>Status: {slip.status.replace('_', ' ')}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Parent's Signature</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Accountant / Seal</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── Payslip PDF Component ─────────────────────────────────────────────────────
export function PayslipPDF({ teacher, slip, tenant }: { teacher: Teacher, slip: Payslip, tenant: Tenant | null }) {
  const primaryColor = tenant?.branding?.primaryColor 
    ? (themeTokens as any)[tenant.branding.primaryColor]?.colorPrimary 
    : '#1e40af';
  const logoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.schoolName, { color: primaryColor }]}>{tenant?.branding?.schoolName || tenant?.name}</Text>
            <Text style={styles.schoolAddress}>{tenant?.address}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Salary Payslip</Text>
            <Text style={styles.docSub}>{monthNames[slip.month]} {slip.year}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.label}>Employee</Text><Text style={styles.value}>{teacher.name}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Emp ID</Text><Text style={styles.value}>{teacher.employeeId}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Designation</Text><Text style={styles.value}>{teacher.designation}</Text></View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.label}>Payslip No</Text><Text style={styles.value}>PAY-{slip._id.slice(-6).toUpperCase()}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Pay Date</Text><Text style={styles.value}>{slip.paymentDate ? formatDate(slip.paymentDate) : 'Pending'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Status</Text><Text style={styles.value}>{slip.status.toUpperCase()}</Text></View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 20 }}>
          <View style={[styles.table, { flex: 1 }]}>
            <View style={styles.thead}><Text style={styles.th}>Earnings</Text><Text style={styles.thAmt}>Amount</Text></View>
            <View style={styles.trow}><Text style={styles.td}>Base Salary</Text><Text style={styles.tdAmt}>{slip.baseSalary.toFixed(2)}</Text></View>
            <View style={styles.trow}><Text style={styles.td}>Allowances</Text><Text style={styles.tdAmt}>{slip.allowances.toFixed(2)}</Text></View>
            <View style={{ flex: 1 }} />
            <View style={[styles.trow, { borderBottomWidth: 0, backgroundColor: '#f8fafc' }]}><Text style={styles.tdBold}>Gross Earnings</Text><Text style={styles.tdAmt}>{(slip.baseSalary + slip.allowances).toFixed(2)}</Text></View>
          </View>
          <View style={[styles.table, { flex: 1 }]}>
            <View style={styles.thead}><Text style={styles.th}>Deductions</Text><Text style={styles.thAmt}>Amount</Text></View>
            <View style={styles.trow}><Text style={styles.td}>Total Deductions</Text><Text style={styles.tdAmt}>{slip.deductions.toFixed(2)}</Text></View>
            <View style={{ flex: 1 }} />
            <View style={[styles.trow, { borderBottomWidth: 0, backgroundColor: '#fff1f2' }]}><Text style={[styles.tdBold, { color: '#e11d48' }]}>Total Deductions</Text><Text style={[styles.tdAmt, { color: '#e11d48' }]}>{slip.deductions.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={[styles.totalRow, { borderTopWidth: 2, borderTopColor: primaryColor }]}>
            <Text style={styles.totalLabel}>Net Salary</Text>
            <Text style={[styles.totalVal, { color: primaryColor, fontSize: 16 }]}>INR {slip.netSalary.toFixed(2)}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
            In words: {slip.netSalary.toFixed(0)} Rupees Only
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Employee Signature</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={[styles.sigLine, { borderBottomColor: primaryColor }]} />
            <Text style={[styles.sigText, { color: primaryColor }]}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
