/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  PDFViewer, Document, Page,
  Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined, FileTextOutlined } from '@ant-design/icons';
import { Student, Tenant, Mark, Exam, Subject, ThemeColor } from '@/types';
import { themeTokens } from '@/lib/theme';
import { getSafeLogoUrl } from '@/lib/utils';
import { imageUrlToBase64Png } from '@/lib/imageUtils';
import { PDFDownloadButton } from './PDFDownloadButton';

const { Text: AntText } = Typography;

interface GroupedMarks {
  exam: Exam;
  marks: Mark[];
  total: number;
  obtained: number;
  percentage: number;
  grade: string;
}

interface Props {
  student: Student;
  groupedMarks: GroupedMarks[];
  tenant: Tenant | null;
}

interface MarksheetComponentProps {
  student: Student;
  groupedMarks: GroupedMarks[];
  primaryColor: string;
  schoolName: string;
  logoUrl: string;
  tenant: Tenant | null;
}

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/2231/2231668.png';

// ── Grade helpers ──────────────────────────────────────────────────────────────
function getDivision(percentage: number): string {
  if (percentage >= 75) return 'Distinction';
  if (percentage >= 60) return 'First Division';
  if (percentage >= 45) return 'Second Division';
  if (percentage >= 33) return 'Pass';
  return 'Fail';
}

function calcGPA(percentage: number): string {
  if (percentage >= 90) return '4.0';
  if (percentage >= 80) return '3.7';
  if (percentage >= 75) return '3.3';
  if (percentage >= 70) return '3.0';
  if (percentage >= 65) return '2.7';
  if (percentage >= 60) return '2.3';
  if (percentage >= 55) return '2.0';
  if (percentage >= 50) return '1.7';
  if (percentage >= 45) return '1.3';
  if (percentage >= 33) return '1.0';
  return '0.0';
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 33) return 'E';
  return 'F';
}

// ── TEMPLATE 1: STANDARD — Classic University Marksheet ────────────────────────
// Double border frame, centre letterhead, structured table, signature lines
const s1 = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#ffffff', padding: 0 },

  // Double border frame
  outerBorder: { position: 'absolute', top: 12, left: 12, right: 12, bottom: 12, borderWidth: 2.5, borderColor: '#1e3a5f', borderStyle: 'solid' },
  innerBorder: { position: 'absolute', top: 18, left: 18, right: 18, bottom: 18, borderWidth: 0.8, borderColor: '#1e3a5f', borderStyle: 'solid' },

  body: { padding: 34, paddingTop: 30 },

  // Letterhead
  letterhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 },
  logoBox: { width: 68, height: 68 },
  schoolBlock: { alignItems: 'center' },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#1e3a5f', textAlign: 'center' },
  schoolSub: { fontSize: 8.5, color: '#374151', marginTop: 2, textAlign: 'center' },
  schoolAddr: { fontSize: 7.5, color: '#6b7280', marginTop: 1, textAlign: 'center' },

  // Document title
  titleBar: { backgroundColor: '#1e3a5f', paddingVertical: 6, paddingHorizontal: 20, marginTop: 12, marginBottom: 14, alignItems: 'center' },
  titleText: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#ffffff', letterSpacing: 2, textAlign: 'center' },

  // Student info table
  infoTable: { borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 14 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#9ca3af' },
  infoRowLast: { flexDirection: 'row' },
  infoCell: { flex: 1, paddingVertical: 5, paddingHorizontal: 8 },
  infoCellBorder: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#9ca3af' },
  infoLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 9, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 1 },

  // Marks table
  examName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1e3a5f', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  marksTable: { borderWidth: 1, borderColor: '#374151', marginBottom: 8 },
  thead: { flexDirection: 'row', backgroundColor: '#1e3a5f' },
  tbody: { flexDirection: 'row' },
  tbodyAlt: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  tfoot: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderTopWidth: 1, borderTopColor: '#374151' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  td: { fontSize: 8, color: '#1f2937', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#1f2937', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },

  colSno:     { width: 26, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colCode:    { width: 50, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colSubject: { flex: 3, borderRightWidth: 0.5, borderRightColor: '#d1d5db', textAlign: 'left' },
  colMax:     { width: 36, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colPass:    { width: 36, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colObt:     { width: 40, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colGrade:   { width: 32, borderRightWidth: 0.5, borderRightColor: '#d1d5db' },
  colResult:  { width: 36 },

  // Result summary
  resultBox: { marginTop: 6, borderWidth: 1, borderColor: '#1e3a5f', flexDirection: 'row', marginBottom: 20 },
  resultCell: { flex: 1, paddingVertical: 7, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#9ca3af', alignItems: 'center' },
  resultCellLast: { flex: 1, paddingVertical: 7, paddingHorizontal: 8, alignItems: 'center' },
  resultLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', marginTop: 2 },

  // Division declaration
  divisionBox: { borderWidth: 1, borderColor: '#1e3a5f', backgroundColor: '#f0f4f8', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 20, alignItems: 'center' },
  divisionText: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1e3a5f', textAlign: 'center' },

  // Signatures
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 },
  sigBlock: { alignItems: 'center', width: 130 },
  sigLine: { width: 130, height: 0.5, backgroundColor: '#374151', marginBottom: 4 },
  sigLabel: { fontSize: 7.5, color: '#374151', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigSub: { fontSize: 7, color: '#6b7280', textAlign: 'center', marginTop: 1 },

  // Seal
  sealCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6, color: '#1e3a5f', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: { borderTopWidth: 0.5, borderTopColor: '#9ca3af', paddingTop: 6, marginTop: 8, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#6b7280', textAlign: 'center' },
});

function StandardMarksheet({ student, groupedMarks, primaryColor, schoolName, logoUrl, tenant }: MarksheetComponentProps) {
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const totalObtained = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.obtained, 0);
  const totalMax = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.total, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const cgpa = calcGPA(overallPct);
  const division = getDivision(overallPct);
  const overallGrade = getLetterGrade(overallPct);
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="A4" style={s1.page}>
      {/* Double border */}
      <View style={s1.outerBorder} />
      <View style={s1.innerBorder} />

      <View style={s1.body}>
        {/* Letterhead */}
        <View style={s1.letterhead}>
          <Image src={logoUrl} style={s1.logoBox} />
          <View style={s1.schoolBlock}>
            <Text style={s1.schoolName}>{schoolName}</Text>
            <Text style={s1.schoolSub}>{tenant?.type?.toUpperCase() || 'EDUCATIONAL INSTITUTION'} | Est. 2000</Text>
            <Text style={s1.schoolAddr}>{[tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean).join(', ')}</Text>
            <Text style={s1.schoolAddr}>Phone: {tenant?.phone || '—'}  |  Email: {tenant?.email || '—'}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s1.titleBar}>
          <Text style={s1.titleText}>OFFICIAL STATEMENT OF MARKS</Text>
        </View>

        {/* Student info */}
        <View style={s1.infoTable}>
          <View style={s1.infoRow}>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Student Name</Text>
              <Text style={s1.infoVal}>{student.name}</Text>
            </View>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Father&apos;s Name</Text>
              <Text style={s1.infoVal}>{student.parent?.fatherName || '—'}</Text>
            </View>
            <View style={s1.infoCell}>
              <Text style={s1.infoLabel}>Date of Birth</Text>
              <Text style={s1.infoVal}>{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'}</Text>
            </View>
          </View>
          <View style={s1.infoRow}>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Enrollment / Admission No.</Text>
              <Text style={s1.infoVal}>{student.admissionNo}</Text>
            </View>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Roll Number</Text>
              <Text style={s1.infoVal}>{student.rollNo || '—'}</Text>
            </View>
            <View style={s1.infoCell}>
              <Text style={s1.infoLabel}>Class / Section</Text>
              <Text style={s1.infoVal}>{cls?.name || '—'} / {student.sectionId || '—'}</Text>
            </View>
          </View>
          <View style={s1.infoRowLast}>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Academic Year</Text>
              <Text style={s1.infoVal}>{groupedMarks[0]?.exam?.academicYear || '2025-2026'}</Text>
            </View>
            <View style={s1.infoCellBorder}>
              <Text style={s1.infoLabel}>Programme</Text>
              <Text style={s1.infoVal}>{tenant?.type === 'university' ? 'Bachelor of Science' : 'General Studies'}</Text>
            </View>
            <View style={s1.infoCell}>
              <Text style={s1.infoLabel}>Date of Issue</Text>
              <Text style={s1.infoVal}>{issueDate}</Text>
            </View>
          </View>
        </View>

        {/* Marks tables per exam */}
        {groupedMarks.map((group: GroupedMarks, ei: number) => {
          const pct = group.percentage;
          return (
            <View key={group.exam?._id} style={{ marginBottom: ei < groupedMarks.length - 1 ? 14 : 0 }}>
              <Text style={s1.examName}>{group.exam?.name}</Text>
              <View style={s1.marksTable}>
                {/* thead */}
                <View style={s1.thead}>
                  <Text style={[s1.th, s1.colSno]}>S.No</Text>
                  <Text style={[s1.th, s1.colCode]}>Code</Text>
                  <Text style={[s1.th, s1.colSubject, { paddingLeft: 6 }]}>Subject Name</Text>
                  <Text style={[s1.th, s1.colMax]}>Max</Text>
                  <Text style={[s1.th, s1.colPass]}>Min</Text>
                  <Text style={[s1.th, s1.colObt]}>Obt.</Text>
                  <Text style={[s1.th, s1.colGrade]}>Grade</Text>
                  <Text style={[s1.th, s1.colResult]}>Result</Text>
                </View>
                {/* tbody */}
                {group.marks.map((mark, idx) => {
                  const subject = mark.subjectId as Subject;
                  const passMarks = typeof subject === 'object' ? subject.passMarks : 33;
                  const passed = mark.obtained >= passMarks;
                  const subName = typeof subject === 'object' ? subject.name : '—';
                  const subCode = typeof subject === 'object' ? subject.code : '—';
                  const subPct = mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
                  const Row = idx % 2 === 0 ? s1.tbody : s1.tbodyAlt;
                  return (
                    <View key={mark._id} style={Row}>
                      <Text style={[s1.td, s1.colSno]}>{idx + 1}</Text>
                      <Text style={[s1.td, s1.colCode]}>{subCode}</Text>
                      <Text style={[s1.td, s1.colSubject, { textAlign: 'left', paddingLeft: 6 }]}>{subName}</Text>
                      <Text style={[s1.td, s1.colMax]}>{mark.total}</Text>
                      <Text style={[s1.td, s1.colPass]}>{passMarks}</Text>
                      <Text style={[s1.tdBold, s1.colObt, { color: passed ? '#166534' : '#991b1b' }]}>{mark.obtained}</Text>
                      <Text style={[s1.tdBold, s1.colGrade]}>{getLetterGrade(subPct)}</Text>
                      <Text style={[s1.tdBold, s1.colResult, { color: passed ? '#166534' : '#991b1b' }]}>{passed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                  );
                })}
                {/* tfoot */}
                <View style={s1.tfoot}>
                  <Text style={[s1.tdBold, s1.colSno]} />
                  <Text style={[s1.tdBold, s1.colCode]} />
                  <Text style={[s1.tdBold, s1.colSubject, { textAlign: 'left', paddingLeft: 6 }]}>Total</Text>
                  <Text style={[s1.tdBold, s1.colMax]}>{group.total}</Text>
                  <Text style={[s1.tdBold, s1.colPass]} />
                  <Text style={[s1.tdBold, s1.colObt, { color: '#1e3a5f' }]}>{group.obtained}</Text>
                  <Text style={[s1.tdBold, s1.colGrade]}>{overallGrade}</Text>
                  <Text style={[s1.tdBold, s1.colResult, { color: pct >= 33 ? '#166534' : '#991b1b' }]}>{pct >= 33 ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Result Summary Box */}
        <View style={s1.resultBox}>
          <View style={s1.resultCell}>
            <Text style={s1.resultLabel}>Total Marks</Text>
            <Text style={s1.resultVal}>{totalObtained} / {totalMax}</Text>
          </View>
          <View style={s1.resultCell}>
            <Text style={s1.resultLabel}>Percentage</Text>
            <Text style={s1.resultVal}>{overallPct}%</Text>
          </View>
          <View style={s1.resultCell}>
            <Text style={s1.resultLabel}>CGPA</Text>
            <Text style={s1.resultVal}>{cgpa}</Text>
          </View>
          <View style={s1.resultCell}>
            <Text style={s1.resultLabel}>Overall Grade</Text>
            <Text style={s1.resultVal}>{overallGrade}</Text>
          </View>
          <View style={s1.resultCellLast}>
            <Text style={s1.resultLabel}>Result</Text>
            <Text style={[s1.resultVal, { color: overallPct >= 33 ? '#166534' : '#991b1b' }]}>{overallPct >= 33 ? 'PASSED' : 'FAILED'}</Text>
          </View>
        </View>

        {/* Division Declaration */}
        <View style={s1.divisionBox}>
          <Text style={s1.divisionText}>
            This is to certify that the above-named student has {overallPct >= 33 ? 'PASSED' : 'FAILED'} the examination
            {overallPct >= 33 ? ` with ${division.toUpperCase()}` : ''}.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s1.sigRow}>
          <View style={s1.sigBlock}>
            <View style={s1.sigLine} />
            <Text style={s1.sigLabel}>Class Teacher</Text>
            <Text style={s1.sigSub}>Name &amp; Signature</Text>
          </View>
          <View style={s1.sigBlock}>
            <View style={[s1.sealCircle, { alignSelf: 'center' }]}>
              <Text style={s1.sealText}>OFFICIAL{'\n'}SEAL</Text>
            </View>
            <Text style={[s1.sigSub, { marginTop: 4 }]}>Stamp / Seal</Text>
          </View>
          <View style={s1.sigBlock}>
            <View style={s1.sigLine} />
            <Text style={s1.sigLabel}>Principal / Registrar</Text>
            <Text style={s1.sigSub}>Name &amp; Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s1.footer}>
          <Text style={s1.footerText}>
            This is an official document issued by {schoolName}. Any alteration or tampering renders this document invalid.
          </Text>
          <Text style={[s1.footerText, { marginTop: 2 }]}>
            For verification, contact the Examination Department | Reg. No.: {tenant?.schoolCode || 'N/A'}
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ── TEMPLATE 2: MODERN — University Transcript Style ──────────────────────────
// Clean white with navy accent sidebar, structured official layout
const s2 = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#ffffff' },
  sideBar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 8, backgroundColor: '#1d4ed8' },
  topStripe: { height: 4, backgroundColor: '#1d4ed8', marginBottom: 0 },

  header: { flexDirection: 'row', padding: 28, paddingBottom: 18, borderBottomWidth: 1.5, borderBottomColor: '#1d4ed8', marginLeft: 8 },
  logoWrap: { width: 64, height: 64, marginRight: 16 },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: '#1e3a5f' },
  schoolType: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  schoolAddr: { fontSize: 7.5, color: '#9ca3af', marginTop: 1 },

  docTitle: { marginLeft: 8, paddingHorizontal: 28, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  docTitleText: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1d4ed8', letterSpacing: 1.5, textTransform: 'uppercase' },
  docTitleSub: { fontSize: 8, color: '#6b7280', marginTop: 2 },

  body: { marginLeft: 8, padding: 28, paddingTop: 16 },

  // Info grid
  infoGrid: { flexDirection: 'row', gap: 0, marginBottom: 18, borderWidth: 1, borderColor: '#e5e7eb' },
  infoCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  infoColLast: { flex: 1, padding: 10 },
  infoLabel: { fontSize: 7, color: '#9ca3af', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 2 },

  // Section heading
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 14 },
  sectionBar: { width: 3, height: 14, backgroundColor: '#1d4ed8', marginRight: 8 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 1 },

  // Table
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  thead: { flexDirection: 'row', backgroundColor: '#1d4ed8' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  trAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  tfoot: { flexDirection: 'row', backgroundColor: '#eff6ff', borderTopWidth: 1, borderTopColor: '#bfdbfe' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.4, paddingVertical: 5, paddingHorizontal: 5, textAlign: 'center' },
  td: { fontSize: 8, color: '#374151', paddingVertical: 5, paddingHorizontal: 5, textAlign: 'center' },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#111827', paddingVertical: 5, paddingHorizontal: 5, textAlign: 'center' },

  cSno: { width: 24, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cCode: { width: 48, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cSub: { flex: 3, borderRightWidth: 0.5, borderRightColor: '#e5e7eb', textAlign: 'left' },
  cMax: { width: 32, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cPass: { width: 32, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cObt: { width: 38, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cGpa: { width: 32, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cGrade: { width: 30, borderRightWidth: 0.5, borderRightColor: '#e5e7eb' },
  cRes: { width: 34 },

  // Summary row
  summaryRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  summaryCard: { flex: 1, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', padding: 10, alignItems: 'center' },
  summaryLabel: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  summaryVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', marginTop: 3 },

  // Declaration
  decl: { marginTop: 14, padding: 10, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#f0f9ff' },
  declText: { fontSize: 8, color: '#1e3a5f', fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  // Sig
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  sigBlock: { alignItems: 'center', width: 130 },
  sigLine: { width: 130, height: 0.5, backgroundColor: '#374151', marginBottom: 4 },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
  sigSub: { fontSize: 7, color: '#9ca3af', marginTop: 1 },
  sealCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6, color: '#1d4ed8', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  footer: { borderTopWidth: 0.5, borderTopColor: '#d1d5db', paddingTop: 8, marginTop: 10, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#9ca3af', textAlign: 'center' },
});

function ModernMarksheet({ student, groupedMarks, primaryColor, schoolName, logoUrl, tenant }: any) {
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const totalObtained = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.obtained, 0);
  const totalMax = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.total, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const cgpa = calcGPA(overallPct);
  const division = getDivision(overallPct);
  const overallGrade = getLetterGrade(overallPct);
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="A4" style={s2.page}>
      <View style={s2.sideBar} />
      <View style={s2.topStripe} />

      {/* Header */}
      <View style={s2.header}>
        <Image src={logoUrl} style={s2.logoWrap} />
        <View style={{ flex: 1 }}>
          <Text style={s2.schoolName}>{schoolName}</Text>
          <Text style={s2.schoolType}>{tenant?.type?.toUpperCase() || 'EDUCATIONAL INSTITUTION'}</Text>
          <Text style={s2.schoolAddr}>{[tenant?.address, tenant?.city, tenant?.state].filter(Boolean).join(', ')}</Text>
          <Text style={s2.schoolAddr}>Code: {tenant?.schoolCode || '—'}  |  {tenant?.phone || '—'}  |  {tenant?.email || '—'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 8, color: '#9ca3af' }}>Issued: {issueDate}</Text>
        </View>
      </View>

      {/* Document Title */}
      <View style={s2.docTitle}>
        <Text style={s2.docTitleText}>Academic Transcript / Statement of Marks</Text>
        <Text style={s2.docTitleSub}>This is an official academic record. Reproduction without authorization is prohibited.</Text>
      </View>

      <View style={s2.body}>
        {/* Student info grid */}
        <View style={s2.infoGrid}>
          <View style={s2.infoCol}>
            <Text style={s2.infoLabel}>Student Name</Text>
            <Text style={s2.infoVal}>{student.name}</Text>
          </View>
          <View style={s2.infoCol}>
            <Text style={s2.infoLabel}>Father&apos;s Name</Text>
            <Text style={s2.infoVal}>{student.parent?.fatherName || '—'}</Text>
          </View>
          <View style={s2.infoColLast}>
            <Text style={s2.infoLabel}>Date of Birth</Text>
            <Text style={s2.infoVal}>{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'}</Text>
          </View>
        </View>
        <View style={[s2.infoGrid, { borderTopWidth: 0, marginTop: -18, marginBottom: 18 }]}>
          <View style={s2.infoCol}>
            <Text style={s2.infoLabel}>Enrollment No.</Text>
            <Text style={s2.infoVal}>{student.admissionNo}</Text>
          </View>
          <View style={s2.infoCol}>
            <Text style={s2.infoLabel}>Roll Number</Text>
            <Text style={s2.infoVal}>{student.rollNo || '—'}</Text>
          </View>
          <View style={s2.infoColLast}>
            <Text style={s2.infoLabel}>Class / Section</Text>
            <Text style={s2.infoVal}>{cls?.name || '—'} / {student.sectionId || '—'}</Text>
          </View>
        </View>

        {/* Marks Tables */}
        {groupedMarks.map((group: GroupedMarks, ei: number) => {
          const pct = group.percentage;
          return (
            <View key={group.exam?._id} style={{ marginBottom: ei < groupedMarks.length - 1 ? 16 : 0 }}>
              <View style={s2.sectionHead}>
                <View style={s2.sectionBar} />
                <Text style={s2.sectionTitle}>{group.exam?.name}  —  Academic Year: {group.exam?.academicYear}</Text>
              </View>
              <View style={s2.table}>
                <View style={s2.thead}>
                  <Text style={[s2.th, s2.cSno]}>No.</Text>
                  <Text style={[s2.th, s2.cCode]}>Code</Text>
                  <Text style={[s2.th, s2.cSub, { paddingLeft: 6 }]}>Subject</Text>
                  <Text style={[s2.th, s2.cMax]}>Max</Text>
                  <Text style={[s2.th, s2.cPass]}>Min</Text>
                  <Text style={[s2.th, s2.cObt]}>Obt.</Text>
                  <Text style={[s2.th, s2.cGpa]}>GPA</Text>
                  <Text style={[s2.th, s2.cGrade]}>Grade</Text>
                  <Text style={[s2.th, s2.cRes]}>Result</Text>
                </View>
                {group.marks.map((mark, idx) => {
                  const subject = mark.subjectId as Subject;
                  const passMarks = typeof subject === 'object' ? subject.passMarks : 33;
                  const passed = mark.obtained >= passMarks;
                  const subPct = mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
                  const Row = idx % 2 === 0 ? s2.tr : s2.trAlt;
                  return (
                    <View key={mark._id} style={Row}>
                      <Text style={[s2.td, s2.cSno]}>{idx + 1}</Text>
                      <Text style={[s2.td, s2.cCode]}>{typeof subject === 'object' ? subject.code : '—'}</Text>
                      <Text style={[s2.td, s2.cSub, { textAlign: 'left', paddingLeft: 6 }]}>{typeof subject === 'object' ? subject.name : '—'}</Text>
                      <Text style={[s2.td, s2.cMax]}>{mark.total}</Text>
                      <Text style={[s2.td, s2.cPass]}>{passMarks}</Text>
                      <Text style={[s2.tdBold, s2.cObt, { color: passed ? '#166534' : '#991b1b' }]}>{mark.obtained}</Text>
                      <Text style={[s2.td, s2.cGpa]}>{calcGPA(subPct)}</Text>
                      <Text style={[s2.tdBold, s2.cGrade]}>{getLetterGrade(subPct)}</Text>
                      <Text style={[s2.tdBold, s2.cRes, { color: passed ? '#166534' : '#991b1b' }]}>{passed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                  );
                })}
                <View style={s2.tfoot}>
                  <Text style={[s2.tdBold, s2.cSno]} />
                  <Text style={[s2.tdBold, s2.cCode]} />
                  <Text style={[s2.tdBold, s2.cSub, { textAlign: 'left', paddingLeft: 6 }]}>Aggregate</Text>
                  <Text style={[s2.tdBold, s2.cMax]}>{group.total}</Text>
                  <Text style={[s2.tdBold, s2.cPass]} />
                  <Text style={[s2.tdBold, s2.cObt, { color: '#1d4ed8' }]}>{group.obtained}</Text>
                  <Text style={[s2.tdBold, s2.cGpa]}>{calcGPA(pct)}</Text>
                  <Text style={[s2.tdBold, s2.cGrade]}>{getLetterGrade(pct)}</Text>
                  <Text style={[s2.tdBold, s2.cRes, { color: pct >= 33 ? '#166534' : '#991b1b' }]}>{pct >= 33 ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Summary Cards */}
        <View style={s2.summaryRow}>
          {[
            ['Total Marks', `${totalObtained} / ${totalMax}`],
            ['Percentage', `${overallPct}%`],
            ['CGPA', cgpa],
            ['Grade', overallGrade],
            ['Division', division],
          ].map(([l, v]) => (
            <View key={l} style={s2.summaryCard}>
              <Text style={s2.summaryLabel}>{l}</Text>
              <Text style={s2.summaryVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Declaration */}
        <View style={s2.decl}>
          <Text style={s2.declText}>
            RESULT: This candidate has {overallPct >= 33 ? `PASSED with ${division.toUpperCase()}` : 'FAILED'} the examination
            with an aggregate of {overallPct}% marks. CGPA: {cgpa}
          </Text>
        </View>

        {/* Signatures */}
        <View style={s2.sigRow}>
          <View style={s2.sigBlock}>
            <View style={s2.sigLine} />
            <Text style={s2.sigLabel}>Examination Controller</Text>
            <Text style={s2.sigSub}>Name &amp; Signature</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={s2.sealCircle}>
              <Text style={s2.sealText}>OFFICIAL{'\n'}SEAL</Text>
            </View>
            <Text style={[s2.sigSub, { marginTop: 3 }]}>Institution Stamp</Text>
          </View>
          <View style={s2.sigBlock}>
            <View style={s2.sigLine} />
            <Text style={s2.sigLabel}>Principal / Director</Text>
            <Text style={s2.sigSub}>Name &amp; Signature</Text>
          </View>
        </View>

        <View style={s2.footer}>
          <Text style={s2.footerText}>This document is computer generated and is valid without physical signature unless specifically required.</Text>
          <Text style={[s2.footerText, { marginTop: 1 }]}>Institution Registration: {tenant?.schoolCode || 'N/A'} | {tenant?.email || ''}</Text>
        </View>
      </View>
    </Page>
  );
}

// ── TEMPLATE 3: MINIMAL — Official Typed Statement Style ──────────────────────
// Formal government/university letter style — clean, text-heavy, maximum credibility
const s3 = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9.5, backgroundColor: '#ffffff', padding: 50, paddingTop: 36 },
  borderLine: { height: 3, backgroundColor: '#111827', marginBottom: 2 },
  thinLine: { height: 0.8, backgroundColor: '#111827', marginBottom: 20 },

  letterhead: { alignItems: 'center', marginBottom: 14 },
  logo: { width: 60, height: 60, marginBottom: 6 },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 17, color: '#111827', textAlign: 'center' },
  schoolSub: { fontSize: 8.5, color: '#374151', marginTop: 2, textAlign: 'center' },
  schoolAddr: { fontSize: 8, color: '#6b7280', marginTop: 1, textAlign: 'center' },

  docTitle: { textAlign: 'center', marginVertical: 12 },
  docTitleText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#111827', textDecoration: 'underline', letterSpacing: 1 },

  // Student details — typed letter style
  paraHead: { fontFamily: 'Helvetica-Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#374151', paddingBottom: 2 },
  detailRow: { flexDirection: 'row', marginBottom: 4 },
  detailDots: { flex: 1, color: '#9ca3af', fontSize: 9 },
  detailLabel: { width: 130, fontSize: 9, color: '#374151', fontFamily: 'Helvetica-Bold' },
  detailVal: { flex: 1, fontSize: 9, color: '#111827' },

  // Table — minimal border
  table: { marginVertical: 8 },
  thead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#111827', borderTopWidth: 1.5, borderTopColor: '#111827' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  trAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', backgroundColor: '#fafafa' },
  tfoot: { flexDirection: 'row', borderTopWidth: 1.5, borderTopColor: '#111827', borderBottomWidth: 1.5, borderBottomColor: '#111827' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#111827', paddingVertical: 4, paddingHorizontal: 4, textAlign: 'center' },
  td: { fontSize: 8.5, color: '#374151', paddingVertical: 4, paddingHorizontal: 4, textAlign: 'center' },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#111827', paddingVertical: 4, paddingHorizontal: 4, textAlign: 'center' },

  cSno: { width: 24 },
  cCode: { width: 50, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cSub: { flex: 3, textAlign: 'left', borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cMax: { width: 34, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cPass: { width: 34, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cObt: { width: 38, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cGrade: { width: 34, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },
  cResult: { width: 36, borderLeftWidth: 0.5, borderLeftColor: '#d1d5db' },

  // Result para
  resultPara: { marginTop: 10, marginBottom: 12 },
  resultText: { fontSize: 9, color: '#111827', lineHeight: 1.6 },
  resultBold: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#111827' },

  // Sigs
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBlock: { width: 130 },
  sigLine: { width: 130, height: 0.8, backgroundColor: '#374151', marginBottom: 4 },
  sigLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151' },
  sigSub: { fontSize: 7.5, color: '#6b7280', marginTop: 1 },
  sealCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6.5, color: '#374151', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  footer: { borderTopWidth: 0.8, borderTopColor: '#374151', paddingTop: 6, marginTop: 16 },
  footerText: { fontSize: 7.5, color: '#6b7280', textAlign: 'center' },
});

function MinimalMarksheet({ student, groupedMarks, primaryColor, schoolName, logoUrl, tenant }: any) {
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const totalObtained = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.obtained, 0);
  const totalMax = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.total, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const cgpa = calcGPA(overallPct);
  const division = getDivision(overallPct);
  const overallGrade = getLetterGrade(overallPct);
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="A4" style={s3.page}>
      {/* Letterhead */}
      <View style={s3.letterhead}>
        <Image src={logoUrl} style={s3.logo} />
        <Text style={s3.schoolName}>{schoolName}</Text>
        <Text style={s3.schoolSub}>{[tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean).join(', ')}</Text>
        <Text style={s3.schoolAddr}>Phone: {tenant?.phone || '—'}  |  Email: {tenant?.email || '—'}  |  Reg. No.: {tenant?.schoolCode || '—'}</Text>
      </View>
      <View style={s3.borderLine} />
      <View style={s3.thinLine} />

      <View style={s3.docTitle}>
        <Text style={s3.docTitleText}>OFFICIAL STATEMENT OF MARKS</Text>
      </View>

      {/* Student Details */}
      <Text style={s3.paraHead}>Student Information</Text>
      {[
        ['Name of Student', student.name],
        ["Father's Name", student.parent?.fatherName || '—'],
        ['Enrollment / Admission No.', student.admissionNo],
        ['Roll Number', student.rollNo || '—'],
        ['Class / Section', `${cls?.name || '—'} / ${student.sectionId || '—'}`],
        ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'],
        ['Academic Year', groupedMarks[0]?.exam?.academicYear || '2025-2026'],
        ['Date of Issue', issueDate],
      ].map(([label, val]) => (
        <View key={label} style={s3.detailRow}>
          <Text style={s3.detailLabel}>{label}</Text>
          <Text style={s3.detailDots}>: </Text>
          <Text style={s3.detailVal}>{val}</Text>
        </View>
      ))}

      {/* Marks Tables */}
      {groupedMarks.map((group: GroupedMarks) => {
        const pct = group.percentage;
        return (
          <View key={group.exam?._id}>
            <Text style={[s3.paraHead, { marginTop: 14 }]}>{group.exam?.name} — Marks Detail</Text>
            <View style={s3.table}>
              <View style={s3.thead}>
                <Text style={[s3.th, s3.cSno]}>S.No</Text>
                <Text style={[s3.th, s3.cCode]}>Code</Text>
                <Text style={[s3.th, s3.cSub, { paddingLeft: 6 }]}>Subject</Text>
                <Text style={[s3.th, s3.cMax]}>Max</Text>
                <Text style={[s3.th, s3.cPass]}>Pass</Text>
                <Text style={[s3.th, s3.cObt]}>Obt.</Text>
                <Text style={[s3.th, s3.cGrade]}>Grade</Text>
                <Text style={[s3.th, s3.cResult]}>Result</Text>
              </View>
              {group.marks.map((mark, idx) => {
                const subject = mark.subjectId as Subject;
                const passMarks = typeof subject === 'object' ? subject.passMarks : 33;
                const passed = mark.obtained >= passMarks;
                const subPct = mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
                const Row = idx % 2 === 0 ? s3.tr : s3.trAlt;
                return (
                  <View key={mark._id} style={Row}>
                    <Text style={[s3.td, s3.cSno]}>{idx + 1}</Text>
                    <Text style={[s3.td, s3.cCode]}>{typeof subject === 'object' ? subject.code : '—'}</Text>
                    <Text style={[s3.td, s3.cSub, { textAlign: 'left', paddingLeft: 6 }]}>{typeof subject === 'object' ? subject.name : '—'}</Text>
                    <Text style={[s3.td, s3.cMax]}>{mark.total}</Text>
                    <Text style={[s3.td, s3.cPass]}>{passMarks}</Text>
                    <Text style={[s3.tdBold, s3.cObt]}>{mark.obtained}</Text>
                    <Text style={[s3.tdBold, s3.cGrade]}>{getLetterGrade(subPct)}</Text>
                    <Text style={[s3.tdBold, s3.cResult, { color: passed ? '#166534' : '#991b1b' }]}>{passed ? 'PASS' : 'FAIL'}</Text>
                  </View>
                );
              })}
              <View style={s3.tfoot}>
                <Text style={[s3.tdBold, s3.cSno]} />
                <Text style={[s3.tdBold, s3.cCode]} />
                <Text style={[s3.tdBold, s3.cSub, { textAlign: 'left', paddingLeft: 6 }]}>Total</Text>
                <Text style={[s3.tdBold, s3.cMax]}>{group.total}</Text>
                <Text style={[s3.tdBold, s3.cPass]} />
                <Text style={[s3.tdBold, s3.cObt]}>{group.obtained}</Text>
                <Text style={[s3.tdBold, s3.cGrade]}>{getLetterGrade(pct)}</Text>
                <Text style={[s3.tdBold, s3.cResult, { color: pct >= 33 ? '#166534' : '#991b1b' }]}>{pct >= 33 ? 'PASS' : 'FAIL'}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Result paragraph */}
      <View style={s3.resultPara}>
        <Text style={s3.resultText}>
          <Text style={s3.resultBold}>Result Summary: </Text>
          The above-named student obtained <Text style={s3.resultBold}>{totalObtained}</Text> out of <Text style={s3.resultBold}>{totalMax}</Text> marks,
          securing <Text style={s3.resultBold}>{overallPct}%</Text> with a CGPA of <Text style={s3.resultBold}>{cgpa}</Text> and overall grade <Text style={s3.resultBold}>{overallGrade}</Text>.
          {'\n'}Result: <Text style={s3.resultBold}>{overallPct >= 33 ? `PASSED — ${division.toUpperCase()}` : 'FAILED'}</Text>
        </Text>
      </View>

      {/* Signatures */}
      <View style={s3.sigRow}>
        <View style={s3.sigBlock}>
          <View style={s3.sigLine} />
          <Text style={s3.sigLabel}>Class Teacher</Text>
          <Text style={s3.sigSub}>Name &amp; Signature</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={s3.sealCircle}>
            <Text style={s3.sealText}>OFFICIAL{'\n'}SEAL</Text>
          </View>
        </View>
        <View style={s3.sigBlock}>
          <View style={s3.sigLine} />
          <Text style={s3.sigLabel}>Principal / Registrar</Text>
          <Text style={s3.sigSub}>Name &amp; Signature</Text>
        </View>
      </View>

      <View style={s3.footer}>
        <Text style={s3.footerText}>
          This is a computer-generated document issued by {schoolName}. Any tampering renders this document invalid.
          {'\n'}For verification: {tenant?.email || ''} | Reg. No.: {tenant?.schoolCode || 'N/A'}
        </Text>
      </View>
    </Page>
  );
}

// ── TEMPLATE 4: ROYAL — Prestigious University / Gold & Navy ──────────────────
// Ornate gold header, rich navy, formal royal layout
const s4 = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#fefefe' },

  // Gold-navy header
  header: { backgroundColor: '#0a1628', padding: 0 },
  headerGoldTop: { height: 5, backgroundColor: '#c9a84c' },
  headerContent: { flexDirection: 'row', alignItems: 'center', padding: 22, paddingVertical: 16 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: '#c9a84c', backgroundColor: '#0a1628', marginRight: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: '#ffffff' },
  schoolMotto: { fontSize: 8, color: '#c9a84c', marginTop: 3, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  schoolAddr: { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },
  headerGoldBot: { height: 2, backgroundColor: '#c9a84c' },

  // Document badge
  docBadge: { backgroundColor: '#0a1628', marginHorizontal: 36, marginTop: -1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#c9a84c' },
  docBadgeText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#c9a84c', letterSpacing: 2.5, textTransform: 'uppercase' },
  docBadgeSub: { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },

  body: { padding: 36, paddingTop: 18 },

  // Student card — dark bordered
  studentCard: { borderWidth: 1.5, borderColor: '#c9a84c', backgroundColor: '#fafaf7', marginBottom: 16 },
  studentCardHead: { backgroundColor: '#0a1628', paddingVertical: 5, paddingHorizontal: 12 },
  studentCardHeadText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#c9a84c', letterSpacing: 1, textTransform: 'uppercase' },
  studentCardBody: { flexDirection: 'row', padding: 12, gap: 0 },
  infoCol: { flex: 1, paddingRight: 10, borderRightWidth: 0.5, borderRightColor: '#d1c7a3', marginRight: 10 },
  infoColLast: { flex: 1 },
  infoLabel: { fontSize: 7, color: '#92760a', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0a1628', marginTop: 2 },

  // Exam section
  examHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 12 },
  examGoldBar: { width: 4, height: 14, backgroundColor: '#c9a84c' },
  examTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0a1628', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Table
  table: { borderWidth: 1, borderColor: '#0a1628' },
  thead: { flexDirection: 'row', backgroundColor: '#0a1628' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1c7a3' },
  trAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1c7a3', backgroundColor: '#fdf8ee' },
  tfoot: { flexDirection: 'row', backgroundColor: '#0a1628', borderTopWidth: 1, borderTopColor: '#c9a84c' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  td: { fontSize: 8, color: '#374151', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#0a1628', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  tdFoot: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#c9a84c', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },

  cSno: { width: 24, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cCode: { width: 48, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cSub: { flex: 3, textAlign: 'left', borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cMax: { width: 32, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cPass: { width: 32, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cObt: { width: 38, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cGpa: { width: 30, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cGrade: { width: 30, borderRightWidth: 0.5, borderRightColor: '#1e3a5f' },
  cRes: { width: 34 },

  // Result ribbon
  ribbon: { flexDirection: 'row', marginTop: 14, borderWidth: 1.5, borderColor: '#c9a84c', backgroundColor: '#0a1628' },
  ribbonCell: { flex: 1, padding: 10, borderRightWidth: 0.5, borderRightColor: '#c9a84c', alignItems: 'center' },
  ribbonCellLast: { flex: 1, padding: 10, alignItems: 'center' },
  ribbonLabel: { fontSize: 7, color: '#94a3b8', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  ribbonVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#c9a84c', marginTop: 3 },

  // Declaration
  decl: { marginTop: 12, padding: 10, borderWidth: 1, borderColor: '#c9a84c', backgroundColor: '#fdf8ee' },
  declText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#0a1628', textAlign: 'center' },

  // Sigs
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBlock: { width: 130, alignItems: 'center' },
  sigLine: { width: 130, height: 1, backgroundColor: '#c9a84c', marginBottom: 4 },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#0a1628' },
  sigSub: { fontSize: 7, color: '#6b7280', marginTop: 1 },
  sealCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#c9a84c', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6, color: '#c9a84c', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  footer: { borderTopWidth: 1, borderTopColor: '#c9a84c', paddingTop: 8, marginTop: 10, alignItems: 'center', backgroundColor: '#fafaf7' },
  footerText: { fontSize: 7, color: '#6b7280', textAlign: 'center' },
});

function RoyalMarksheet({ student, groupedMarks, primaryColor, schoolName, logoUrl, tenant }: any) {
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const totalObtained = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.obtained, 0);
  const totalMax = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.total, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const cgpa = calcGPA(overallPct);
  const division = getDivision(overallPct);
  const overallGrade = getLetterGrade(overallPct);
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="A4" style={s4.page}>
      {/* Header */}
      <View style={s4.header}>
        <View style={s4.headerGoldTop} />
        <View style={s4.headerContent}>
          <View style={s4.logoCircle}>
            <Image src={logoUrl} style={{ width: 60, height: 60 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s4.schoolName}>{schoolName}</Text>
            <Text style={s4.schoolMotto}>{tenant?.type?.toUpperCase() || 'INSTITUTION'} OF EXCELLENCE</Text>
            <Text style={s4.schoolAddr}>{[tenant?.address, tenant?.city, tenant?.state].filter(Boolean).join(', ')}</Text>
            <Text style={s4.schoolAddr}>{tenant?.phone || ''}  |  {tenant?.email || ''}  |  Reg: {tenant?.schoolCode || '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: '#94a3b8' }}>Date: {issueDate}</Text>
          </View>
        </View>
        <View style={s4.headerGoldBot} />
      </View>

      {/* Doc badge */}
      <View style={s4.docBadge}>
        <Text style={s4.docBadgeText}>Statement of Marks</Text>
        <Text style={s4.docBadgeSub}>Official Academic Record — Confidential</Text>
      </View>

      <View style={s4.body}>
        {/* Student card */}
        <View style={s4.studentCard}>
          <View style={s4.studentCardHead}>
            <Text style={s4.studentCardHeadText}>Student Information</Text>
          </View>
          <View style={s4.studentCardBody}>
            <View style={s4.infoCol}>
              <Text style={s4.infoLabel}>Student Name</Text>
              <Text style={s4.infoVal}>{student.name}</Text>
              <Text style={[s4.infoLabel, { marginTop: 8 }]}>Father&apos;s Name</Text>
              <Text style={s4.infoVal}>{student.parent?.fatherName || '—'}</Text>
            </View>
            <View style={s4.infoCol}>
              <Text style={s4.infoLabel}>Enrollment No.</Text>
              <Text style={s4.infoVal}>{student.admissionNo}</Text>
              <Text style={[s4.infoLabel, { marginTop: 8 }]}>Roll Number</Text>
              <Text style={s4.infoVal}>{student.rollNo || '—'}</Text>
            </View>
            <View style={s4.infoColLast}>
              <Text style={s4.infoLabel}>Class / Section</Text>
              <Text style={s4.infoVal}>{cls?.name || '—'} / {student.sectionId || '—'}</Text>
              <Text style={[s4.infoLabel, { marginTop: 8 }]}>Academic Year</Text>
              <Text style={s4.infoVal}>{groupedMarks[0]?.exam?.academicYear || '2025-2026'}</Text>
            </View>
          </View>
        </View>

        {/* Marks Tables */}
        {groupedMarks.map((group: GroupedMarks, ei: number) => {
          const pct = group.percentage;
          return (
            <View key={group.exam?._id} style={{ marginBottom: ei < groupedMarks.length - 1 ? 14 : 0 }}>
              <View style={s4.examHead}>
                <View style={s4.examGoldBar} />
                <Text style={s4.examTitle}>{group.exam?.name}</Text>
                <Text style={{ fontSize: 8, color: '#6b7280', marginLeft: 8 }}>{group.exam?.academicYear}</Text>
              </View>
              <View style={s4.table}>
                <View style={s4.thead}>
                  <Text style={[s4.th, s4.cSno]}>S.No</Text>
                  <Text style={[s4.th, s4.cCode]}>Code</Text>
                  <Text style={[s4.th, s4.cSub, { paddingLeft: 6 }]}>Subject</Text>
                  <Text style={[s4.th, s4.cMax]}>Max</Text>
                  <Text style={[s4.th, s4.cPass]}>Min</Text>
                  <Text style={[s4.th, s4.cObt]}>Obt.</Text>
                  <Text style={[s4.th, s4.cGpa]}>GPA</Text>
                  <Text style={[s4.th, s4.cGrade]}>Grade</Text>
                  <Text style={[s4.th, s4.cRes]}>Result</Text>
                </View>
                {group.marks.map((mark, idx) => {
                  const subject = mark.subjectId as Subject;
                  const passMarks = typeof subject === 'object' ? subject.passMarks : 33;
                  const passed = mark.obtained >= passMarks;
                  const subPct = mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
                  const Row = idx % 2 === 0 ? s4.tr : s4.trAlt;
                  return (
                    <View key={mark._id} style={Row}>
                      <Text style={[s4.td, s4.cSno]}>{idx + 1}</Text>
                      <Text style={[s4.td, s4.cCode]}>{typeof subject === 'object' ? subject.code : '—'}</Text>
                      <Text style={[s4.td, s4.cSub, { textAlign: 'left', paddingLeft: 6 }]}>{typeof subject === 'object' ? subject.name : '—'}</Text>
                      <Text style={[s4.td, s4.cMax]}>{mark.total}</Text>
                      <Text style={[s4.td, s4.cPass]}>{passMarks}</Text>
                      <Text style={[s4.tdBold, s4.cObt, { color: passed ? '#166534' : '#991b1b' }]}>{mark.obtained}</Text>
                      <Text style={[s4.td, s4.cGpa]}>{calcGPA(subPct)}</Text>
                      <Text style={[s4.tdBold, s4.cGrade]}>{getLetterGrade(subPct)}</Text>
                      <Text style={[s4.tdBold, s4.cRes, { color: passed ? '#166534' : '#991b1b' }]}>{passed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                  );
                })}
                <View style={s4.tfoot}>
                  <Text style={[s4.tdFoot, s4.cSno]} />
                  <Text style={[s4.tdFoot, s4.cCode]} />
                  <Text style={[s4.tdFoot, s4.cSub, { textAlign: 'left', paddingLeft: 6 }]}>Grand Total</Text>
                  <Text style={[s4.tdFoot, s4.cMax]}>{group.total}</Text>
                  <Text style={[s4.tdFoot, s4.cPass]} />
                  <Text style={[s4.tdFoot, s4.cObt]}>{group.obtained}</Text>
                  <Text style={[s4.tdFoot, s4.cGpa]}>{calcGPA(pct)}</Text>
                  <Text style={[s4.tdFoot, s4.cGrade]}>{getLetterGrade(pct)}</Text>
                  <Text style={[s4.tdFoot, s4.cRes, { color: pct >= 33 ? '#86efac' : '#fca5a5' }]}>{pct >= 33 ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Result Ribbon */}
        <View style={s4.ribbon}>
          {[
            ['Total', `${totalObtained}/${totalMax}`],
            ['Percentage', `${overallPct}%`],
            ['CGPA', cgpa],
            ['Grade', overallGrade],
          ].map(([l, v]) => (
            <View key={l} style={s4.ribbonCell}>
              <Text style={s4.ribbonLabel}>{l}</Text>
              <Text style={s4.ribbonVal}>{v}</Text>
            </View>
          ))}
          <View style={s4.ribbonCellLast}>
            <Text style={s4.ribbonLabel}>Division</Text>
            <Text style={[s4.ribbonVal, { fontSize: 9 }]}>{division}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={s4.decl}>
          <Text style={s4.declText}>
            This is to certify that {student.name} has {overallPct >= 33 ? `PASSED with ${division.toUpperCase()}` : 'FAILED'} securing {overallPct}% marks.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s4.sigRow}>
          <View style={s4.sigBlock}>
            <View style={s4.sigLine} />
            <Text style={s4.sigLabel}>Examination Controller</Text>
            <Text style={s4.sigSub}>Name &amp; Signature</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={s4.sealCircle}>
              <Text style={s4.sealText}>OFFICIAL{'\n'}SEAL</Text>
            </View>
            <Text style={[s4.sigSub, { marginTop: 4 }]}>Royal Stamp</Text>
          </View>
          <View style={s4.sigBlock}>
            <View style={s4.sigLine} />
            <Text style={s4.sigLabel}>Vice Chancellor / Principal</Text>
            <Text style={s4.sigSub}>Name &amp; Signature</Text>
          </View>
        </View>

        <View style={s4.footer}>
          <Text style={s4.footerText}>This official document is issued by {schoolName}. Tampering or forgery is a criminal offence.</Text>
          <Text style={[s4.footerText, { marginTop: 2 }]}>For verification: {tenant?.email || '—'} | Institution Code: {tenant?.schoolCode || 'N/A'}</Text>
        </View>
      </View>
    </Page>
  );
}

// ── TEMPLATE 5: PEARL — Government Gazette / Formal Affidavit Style ────────────
// Dark green institutional, formal certificate-quality layout
const s5 = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, backgroundColor: '#ffffff', padding: 0 },

  // Triple border
  border1: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 3, borderColor: '#14532d' },
  border2: { position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 0.8, borderColor: '#14532d' },
  border3: { position: 'absolute', top: 18, left: 18, right: 18, bottom: 18, borderWidth: 0.3, borderColor: '#14532d' },

  body: { padding: 38, paddingTop: 28 },

  // Header
  header: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 66, height: 66, marginBottom: 6 },
  schoolName: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#14532d', textAlign: 'center' },
  schoolSub: { fontSize: 8.5, color: '#166534', marginTop: 2, textAlign: 'center', fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  schoolAddr: { fontSize: 7.5, color: '#6b7280', marginTop: 2, textAlign: 'center' },

  // Dividers
  greenLine: { height: 2.5, backgroundColor: '#14532d', marginVertical: 8 },
  thinGreenLine: { height: 0.5, backgroundColor: '#14532d', marginVertical: 6 },

  // Title
  titleBlock: { alignItems: 'center', marginVertical: 8 },
  titleText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#14532d', letterSpacing: 2, textTransform: 'uppercase' },
  titleSub: { fontSize: 8, color: '#6b7280', marginTop: 2 },

  // Info table — formal two-column
  infoTable: { borderWidth: 1, borderColor: '#14532d', marginBottom: 14 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#bbf7d0' },
  infoRowLast: { flexDirection: 'row' },
  infoLabelCell: { width: 130, backgroundColor: '#f0fdf4', paddingVertical: 5, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#14532d' },
  infoValCell: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#14532d' },
  infoValCellLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 8 },
  infoLabelText: { fontSize: 7.5, color: '#15803d', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  infoValText: { fontSize: 9, color: '#111827', fontFamily: 'Helvetica-Bold' },

  // Table
  table: { borderWidth: 1, borderColor: '#14532d', marginBottom: 10 },
  thead: { flexDirection: 'row', backgroundColor: '#14532d' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#bbf7d0' },
  trAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  tfoot: { flexDirection: 'row', backgroundColor: '#166534', borderTopWidth: 1, borderTopColor: '#14532d' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4 },
  td: { fontSize: 8, color: '#374151', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  tdBold: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#111827', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },
  tdFoot: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 4, textAlign: 'center' },

  cSno: { width: 24, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cCode: { width: 46, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cSub: { flex: 3, textAlign: 'left', borderRightWidth: 0.5, borderRightColor: '#166534' },
  cMax: { width: 32, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cPass: { width: 32, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cObt: { width: 36, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cGpa: { width: 30, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cGrade: { width: 30, borderRightWidth: 0.5, borderRightColor: '#166534' },
  cRes: { width: 34 },

  // Summary
  summaryBox: { borderWidth: 1.5, borderColor: '#14532d', flexDirection: 'row', backgroundColor: '#f0fdf4', marginBottom: 10 },
  summaryCell: { flex: 1, padding: 8, borderRightWidth: 0.5, borderRightColor: '#14532d', alignItems: 'center' },
  summaryCellLast: { flex: 1, padding: 8, alignItems: 'center' },
  summaryLabel: { fontSize: 7, color: '#166534', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  summaryVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#14532d', marginTop: 2 },

  // Certificate text
  certText: { fontSize: 9, color: '#14532d', textAlign: 'center', fontFamily: 'Helvetica-Bold', marginBottom: 14, lineHeight: 1.5 },

  // Sigs
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sigBlock: { alignItems: 'center', width: 130 },
  sigLine: { width: 130, height: 1.5, backgroundColor: '#14532d', marginBottom: 4 },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#14532d' },
  sigSub: { fontSize: 7, color: '#6b7280', marginTop: 1 },
  sealCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#14532d', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  sealText: { fontSize: 6, color: '#14532d', textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  footer: { borderTopWidth: 1.5, borderTopColor: '#14532d', paddingTop: 6, marginTop: 8, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#6b7280', textAlign: 'center' },
});

function PearlMarksheet({ student, groupedMarks, primaryColor, schoolName, logoUrl, tenant }: any) {
  const cls = typeof student.classId === 'object' ? student.classId : null;
  const totalObtained = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.obtained, 0);
  const totalMax = groupedMarks.reduce((s: number, g: GroupedMarks) => s + g.total, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const cgpa = calcGPA(overallPct);
  const division = getDivision(overallPct);
  const overallGrade = getLetterGrade(overallPct);
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="A4" style={s5.page}>
      {/* Triple border */}
      <View style={s5.border1} />
      <View style={s5.border2} />
      <View style={s5.border3} />

      <View style={s5.body}>
        {/* Header */}
        <View style={s5.header}>
          <Image src={logoUrl} style={s5.logo} />
          <Text style={s5.schoolName}>{schoolName}</Text>
          <Text style={s5.schoolSub}>{tenant?.type?.toUpperCase() || 'EDUCATIONAL INSTITUTION'}</Text>
          <Text style={s5.schoolAddr}>{[tenant?.address, tenant?.city, tenant?.state, tenant?.country].filter(Boolean).join(', ')}</Text>
          <Text style={s5.schoolAddr}>{tenant?.phone || ''}  |  {tenant?.email || ''}  |  Code: {tenant?.schoolCode || '—'}</Text>
        </View>

        <View style={s5.greenLine} />

        {/* Title */}
        <View style={s5.titleBlock}>
          <Text style={s5.titleText}>Statement of Marks</Text>
          <Text style={s5.titleSub}>Issued: {issueDate} — This document is issued under the authority of the institution</Text>
        </View>

        <View style={s5.thinGreenLine} />

        {/* Student Info */}
        <View style={s5.infoTable}>
          <View style={s5.infoRow}>
            <View style={[s5.infoLabelCell, { width: 120 }]}><Text style={s5.infoLabelText}>Student Name</Text></View>
            <View style={s5.infoValCell}><Text style={s5.infoValText}>{student.name}</Text></View>
            <View style={[s5.infoLabelCell, { width: 110, borderLeftWidth: 0.5, borderLeftColor: '#14532d' }]}><Text style={s5.infoLabelText}>Father&apos;s Name</Text></View>
            <View style={s5.infoValCellLast}><Text style={s5.infoValText}>{student.parent?.fatherName || '—'}</Text></View>
          </View>
          <View style={s5.infoRow}>
            <View style={[s5.infoLabelCell, { width: 120 }]}><Text style={s5.infoLabelText}>Enrollment No.</Text></View>
            <View style={s5.infoValCell}><Text style={s5.infoValText}>{student.admissionNo}</Text></View>
            <View style={[s5.infoLabelCell, { width: 110, borderLeftWidth: 0.5, borderLeftColor: '#14532d' }]}><Text style={s5.infoLabelText}>Roll Number</Text></View>
            <View style={s5.infoValCellLast}><Text style={s5.infoValText}>{student.rollNo || '—'}</Text></View>
          </View>
          <View style={s5.infoRowLast}>
            <View style={[s5.infoLabelCell, { width: 120 }]}><Text style={s5.infoLabelText}>Class / Section</Text></View>
            <View style={s5.infoValCell}><Text style={s5.infoValText}>{cls?.name || '—'} / {student.sectionId || '—'}</Text></View>
            <View style={[s5.infoLabelCell, { width: 110, borderLeftWidth: 0.5, borderLeftColor: '#14532d' }]}><Text style={s5.infoLabelText}>Academic Year</Text></View>
            <View style={s5.infoValCellLast}><Text style={s5.infoValText}>{groupedMarks[0]?.exam?.academicYear || '2025-2026'}</Text></View>
          </View>
        </View>

        {/* Marks Tables */}
        {groupedMarks.map((group: GroupedMarks, ei: number) => {
          const pct = group.percentage;
          return (
            <View key={group.exam?._id} style={{ marginBottom: ei < groupedMarks.length - 1 ? 12 : 0 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#14532d', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {group.exam?.name}  |  Academic Year: {group.exam?.academicYear}
              </Text>
              <View style={s5.table}>
                <View style={s5.thead}>
                  <Text style={[s5.th, s5.cSno]}>S.No</Text>
                  <Text style={[s5.th, s5.cCode]}>Code</Text>
                  <Text style={[s5.th, s5.cSub, { paddingLeft: 6 }]}>Subject</Text>
                  <Text style={[s5.th, s5.cMax]}>Max</Text>
                  <Text style={[s5.th, s5.cPass]}>Min</Text>
                  <Text style={[s5.th, s5.cObt]}>Obt.</Text>
                  <Text style={[s5.th, s5.cGpa]}>GPA</Text>
                  <Text style={[s5.th, s5.cGrade]}>Grade</Text>
                  <Text style={[s5.th, s5.cRes]}>Result</Text>
                </View>
                {group.marks.map((mark, idx) => {
                  const subject = mark.subjectId as Subject;
                  const passMarks = typeof subject === 'object' ? subject.passMarks : 33;
                  const passed = mark.obtained >= passMarks;
                  const subPct = mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
                  const Row = idx % 2 === 0 ? s5.tr : s5.trAlt;
                  return (
                    <View key={mark._id} style={Row}>
                      <Text style={[s5.td, s5.cSno]}>{idx + 1}</Text>
                      <Text style={[s5.td, s5.cCode]}>{typeof subject === 'object' ? subject.code : '—'}</Text>
                      <Text style={[s5.td, s5.cSub, { textAlign: 'left', paddingLeft: 6 }]}>{typeof subject === 'object' ? subject.name : '—'}</Text>
                      <Text style={[s5.td, s5.cMax]}>{mark.total}</Text>
                      <Text style={[s5.td, s5.cPass]}>{passMarks}</Text>
                      <Text style={[s5.tdBold, s5.cObt, { color: passed ? '#166534' : '#991b1b' }]}>{mark.obtained}</Text>
                      <Text style={[s5.td, s5.cGpa]}>{calcGPA(subPct)}</Text>
                      <Text style={[s5.tdBold, s5.cGrade]}>{getLetterGrade(subPct)}</Text>
                      <Text style={[s5.tdBold, s5.cRes, { color: passed ? '#166534' : '#991b1b' }]}>{passed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                  );
                })}
                <View style={s5.tfoot}>
                  <Text style={[s5.tdFoot, s5.cSno]} />
                  <Text style={[s5.tdFoot, s5.cCode]} />
                  <Text style={[s5.tdFoot, s5.cSub, { textAlign: 'left', paddingLeft: 6 }]}>Grand Total</Text>
                  <Text style={[s5.tdFoot, s5.cMax]}>{group.total}</Text>
                  <Text style={[s5.tdFoot, s5.cPass]} />
                  <Text style={[s5.tdFoot, s5.cObt]}>{group.obtained}</Text>
                  <Text style={[s5.tdFoot, s5.cGpa]}>{calcGPA(pct)}</Text>
                  <Text style={[s5.tdFoot, s5.cGrade]}>{getLetterGrade(pct)}</Text>
                  <Text style={[s5.tdFoot, s5.cRes]}>{pct >= 33 ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={[s5.summaryBox, { marginTop: 10 }]}>
          {[
            ['Total Marks', `${totalObtained} / ${totalMax}`],
            ['Percentage', `${overallPct}%`],
            ['CGPA', cgpa],
            ['Grade', overallGrade],
          ].map(([l, v]) => (
            <View key={l} style={s5.summaryCell}>
              <Text style={s5.summaryLabel}>{l}</Text>
              <Text style={s5.summaryVal}>{v}</Text>
            </View>
          ))}
          <View style={s5.summaryCellLast}>
            <Text style={s5.summaryLabel}>Result</Text>
            <Text style={[s5.summaryVal, { fontSize: 9, color: overallPct >= 33 ? '#14532d' : '#991b1b' }]}>{division}</Text>
          </View>
        </View>

        {/* Certificate declaration */}
        <Text style={s5.certText}>
          Certified that {student.name}, S/o {student.parent?.fatherName || '—'}, Enrollment No. {student.admissionNo},{'\n'}
          has {overallPct >= 33 ? `successfully PASSED with ${division.toUpperCase()}` : 'FAILED'} securing {overallPct}% marks, CGPA {cgpa}.
        </Text>

        {/* Signatures */}
        <View style={s5.sigRow}>
          <View style={s5.sigBlock}>
            <View style={s5.sigLine} />
            <Text style={s5.sigLabel}>Class Teacher</Text>
            <Text style={s5.sigSub}>Name &amp; Signature</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={s5.sealCircle}>
              <Text style={s5.sealText}>OFFICIAL{'\n'}SEAL</Text>
            </View>
            <Text style={[s5.sigSub, { marginTop: 4 }]}>Institution Stamp</Text>
          </View>
          <View style={s5.sigBlock}>
            <View style={s5.sigLine} />
            <Text style={s5.sigLabel}>Principal / Registrar</Text>
            <Text style={s5.sigSub}>Name &amp; Signature</Text>
          </View>
        </View>

        <View style={s5.footer}>
          <Text style={s5.footerText}>
            This document is issued under the authority of {schoolName}. Any alteration is a punishable offence.
          </Text>
          <Text style={[s5.footerText, { marginTop: 2 }]}>
            For verification contact: {tenant?.email || '—'}  |  Institution Code: {tenant?.schoolCode || 'N/A'}
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ── Document wrapper ─────────────────────────────────────────────────────────
function MarksheetDocument({ student, groupedMarks, tenant, resolvedLogo }: Props & { resolvedLogo: string }) {
  const template = tenant?.branding?.marksheetTemplate || 'standard';
  const primaryColor = tenant?.branding?.primaryColor
    ? themeTokens[tenant.branding.primaryColor as ThemeColor]?.colorPrimary
    : '#1e40af';
  const schoolName = tenant?.branding?.schoolName || tenant?.name || 'School Name';

  const props = { student, groupedMarks, primaryColor, schoolName, logoUrl: resolvedLogo, tenant };

  return (
    <Document>
      {template === 'standard' && <StandardMarksheet {...props} />}
      {template === 'modern' && <ModernMarksheet {...props} />}
      {template === 'minimal' && <MinimalMarksheet {...props} />}
      {template === 'royal' && <RoyalMarksheet {...props} />}
      {template === 'pearl' && <PearlMarksheet {...props} />}
    </Document>
  );
}

// ── Public export ──────────────────────────────────────────────────────────────
export default function MarksheetPDF({ student, groupedMarks, tenant }: Props) {
  const fileName = `marksheet-${student.name.toLowerCase().replace(/\s+/g, '-')}-${student.admissionNo}.pdf`;

  const rawLogoUrl = getSafeLogoUrl(tenant?.branding?.logo, DEFAULT_LOGO);
  const [resolvedLogo, setResolvedLogo] = useState<string>('');
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    imageUrlToBase64Png(rawLogoUrl)
      .then((res) => {
        setResolvedLogo(res);
        setTimeout(() => setGenerating(false), 600);
      })
      .catch(() => {
        setResolvedLogo(DEFAULT_LOGO);
        setGenerating(false);
      });
  }, [rawLogoUrl]);

  const doc = <MarksheetDocument student={student} groupedMarks={groupedMarks} tenant={tenant} resolvedLogo={resolvedLogo || DEFAULT_LOGO} />;

  if (generating) {
    return (
      <div style={{
        height: 480,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#fff', borderRadius: 12, gap: 16,
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        <div style={{ textAlign: 'center' }}>
          <AntText strong style={{ display: 'block', fontSize: 16 }}>Preparing Official Marksheet...</AntText>
          <AntText type="secondary">Calculating scores and formatting document</AntText>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .ms-header { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; background:#f8fafc; border-bottom:1px solid #f1f5f9; gap:16px; }
        .ms-body { padding:0 24px 24px; }
        .ms-viewer { border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.1); }
        @media (max-width:640px) { .ms-header{flex-direction:column;align-items:flex-start;padding:16px} .ms-body{padding:0 12px 12px} }
      `}</style>

      <div className="ms-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ant-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: '#fff' }} />
          </div>
          <AntText strong style={{ fontSize: 16 }}>Official Marksheet</AntText>
        </div>
        <PDFDownloadButton document={doc} fileName={fileName} buttonText="Download PDF" />
      </div>

      <div className="ms-body">
        <div className="ms-viewer">
          <PDFViewer width="100%" height={760}>
            {doc}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
