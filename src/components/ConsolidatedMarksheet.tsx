import React from 'react';
import { Student, Exam, Mark, Subject, Tenant } from '@/types';

// Default elegant crest SVG in case logo is missing
const DEFAULT_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjRDRBRjM3IiBkPSJNNTAgNUMyNSA1IDUgMjUgNSA1MHMyMCA0NSA0NSA0NSA0NS0yMCA0NS00NVM3NSA1IDUwIDV6bTAgODVjLTIyLjEgMC00MC0xNy45LTQwLTQwczE3LjktNDAgNDAtNDAgNDAgMTcuOSA0MCA0MC0xNy45IDQwLTQwIDQweiIvPjxwYXRoIGZpbGw9IiNEMEFGMzciIGQ9Ik01MCAxNWMtMTkuMyAwLTM1IDE1LjctMzUgMzVzMTUuNyAzNSAzNSAzNSAzNS0xNS43IDM1LTM1LTE1LjctMzUtMzUtMzV6bTAgNjVjLTE2LjUgMC0zMC0xMy41LTMwLTMwczEzLjUtMzAgMzAtMzAgMzAgMTMuNSAzMCAzMC0xMy41IDMwLTMwIDMweiIvPjxwb2x5Z29uIGZpbGw9IiNEMEFGMzciIHBvaW50cz0iNTAgMjUgMzUgNDAgMzUgNjAgNTAgNzUgNjUgNjAgNjUgNDAiLz48Y2lyY2xlIGZpbGw9IiMwMDFGM0YiIGN4PSI1MCIgY3k9IjUwIiByPSIxMCIvPjwvc3ZnPg==';

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
  tenant?: Tenant | null;
}

export default function ConsolidatedMarksheet({ student, groupedMarks, tenant }: Props) {
  const schoolName = tenant?.branding?.schoolName || tenant?.name || 'INTERNATIONAL HIGHER SECONDARY SCHOOL';
  const logo = tenant?.branding?.logo || DEFAULT_LOGO;
  const cls = typeof student.classId === 'object' ? student.classId?.name : 'N/A';

  // Calculate some aggregate values for CGPA/Overall
  const totalObtained = groupedMarks.reduce((sum, g) => sum + g.obtained, 0);
  const totalMax = groupedMarks.reduce((sum, g) => sum + g.total, 0);
  const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  let overallGrade = 'F';
  if (overallPercentage >= 90) overallGrade = 'A+';
  else if (overallPercentage >= 80) overallGrade = 'A';
  else if (overallPercentage >= 70) overallGrade = 'B';
  else if (overallPercentage >= 60) overallGrade = 'C';
  else if (overallPercentage >= 50) overallGrade = 'D';

  const cgpa = (overallPercentage / 9.5).toFixed(1); // Standard approx
  const isPassed = overallPercentage >= 33;
  const remarks = isPassed ? (overallPercentage >= 75 ? 'Passed with distinction' : 'Passed') : 'Failed';

  return (
    <div 
      className="marksheet-paper"
      style={{
        backgroundColor: '#FCFBFA',
        backgroundImage: 'radial-gradient(#F3EFEB 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        fontFamily: '"Georgia", "Times New Roman", Times, serif',
        color: '#0A192F',
        padding: '60px',
        margin: '0 auto',
        maxWidth: '850px',
        border: '12px double #D4AF37', // Elegant gold double border
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px'
      }}
    >
      {/* Decorative Corners */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', height: '30px', borderTop: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37' }} />
      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderTop: '3px solid #D4AF37', borderRight: '3px solid #D4AF37' }} />
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '30px', height: '30px', borderBottom: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37' }} />
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '30px', height: '30px', borderBottom: '3px solid #D4AF37', borderRight: '3px solid #D4AF37' }} />

      {/* Watermark Logo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <img src={logo} alt="watermark" style={{ width: '400px', height: '400px', objectFit: 'contain' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <img src={logo} alt="School Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '16px' }} />
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          letterSpacing: '3px', 
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          color: '#0A192F',
        }}>
          Consolidated Marksheet
        </h1>
        <div style={{ width: '150px', height: '3px', backgroundColor: '#D4AF37', margin: '0 auto' }} />
        <div style={{ width: '80px', height: '1px', backgroundColor: '#D4AF37', margin: '4px auto 0' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', fontSize: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, auto) 1fr', gap: '10px' }}>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>Name of Student</span>
          <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '18px', color: '#0A192F', borderBottom: '1px dotted #ccc' }}>{student.name}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, auto) 1fr', gap: '10px' }}>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>Roll Number</span>
          <span style={{ fontWeight: '600', fontSize: '16px', color: '#0A192F', borderBottom: '1px dotted #ccc' }}>{student.rollNo || student.admissionNo}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, auto) 1fr', gap: '10px' }}>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>Course / Class Name</span>
          <span style={{ fontWeight: '600', fontSize: '16px', color: '#0A192F', borderBottom: '1px dotted #ccc' }}>{cls}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, auto) 1fr', gap: '10px' }}>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>Institution Name</span>
          <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '16px', color: '#0A192F', borderBottom: '1px dotted #ccc' }}>{schoolName}</span>
        </div>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          marginBottom: '16px', 
          color: '#D4AF37',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          ◆ Academic Record  ◆
        </h3>
        
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '15px',
          border: '2px solid #0A192F'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#0A192F', color: '#FFF' }}>
              <th style={{ border: '1px solid #0A192F', padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', width: '20%' }}>Semester</th>
              <th style={{ border: '1px solid #0A192F', padding: '14px 10px', textAlign: 'left', fontWeight: 'bold', letterSpacing: '1px', width: '50%' }}>Subject</th>
              <th style={{ border: '1px solid #0A192F', padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', width: '15%' }}>Marks</th>
              <th style={{ border: '1px solid #0A192F', padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', width: '15%' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {groupedMarks.length > 0 ? (
              groupedMarks.flatMap((group, gIdx) => {
                const examName = group.exam?.name || 'N/A';
                const semesterLabel = examName.replace(/Term\s*/i, '').replace(/Semester\s*/i, '').trim() || examName;
                
                return group.marks.map((mark, idx) => {
                  const subjectName = typeof mark.subjectId === 'object' ? mark.subjectId.name : 'Unknown';
                  const rowBg = gIdx % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
                  return (
                    <tr key={mark._id} style={{ backgroundColor: rowBg }}>
                      {idx === 0 && (
                        <td 
                          rowSpan={group.marks.length} 
                          style={{ 
                            border: '1px solid #D4AF37', 
                            borderRight: '2px solid #0A192F',
                            padding: '12px 8px', 
                            textAlign: 'center', 
                            verticalAlign: 'middle',
                            fontWeight: '600',
                            color: '#0A192F',
                            backgroundColor: '#F5F5F5'
                          }}
                        >
                          {semesterLabel}
                        </td>
                      )}
                      <td style={{ border: '1px solid #D4AF37', padding: '12px 16px', textAlign: 'left', color: '#333' }}>
                        {subjectName}
                      </td>
                      <td style={{ border: '1px solid #D4AF37', padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#0A192F' }}>
                        {mark.obtained}
                      </td>
                      <td style={{ border: '1px solid #D4AF37', padding: '12px 8px', textAlign: 'center', fontWeight: '700', color: ['A+', 'A', 'O'].includes(mark.grade) ? '#2E8B57' : '#0A192F' }}>
                        {mark.grade}
                      </td>
                    </tr>
                  );
                });
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #D4AF37', padding: '32px', textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                  No result records available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '30px', 
        fontSize: '18px',
        padding: '16px 24px',
        backgroundColor: '#FAF8F5',
        border: '1px solid #EBE3D5',
        borderRadius: '4px',
        position: 'relative', 
        zIndex: 1
      }}>
        <div>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px', marginRight: '16px' }}>Cumulative GPA</span>
          <span style={{ fontWeight: '700', fontSize: '24px', color: '#0A192F' }}>{cgpa}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'normal', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px', marginRight: '16px', display: 'block', marginBottom: '4px' }}>Final Assessment Remarks</span>
          <span style={{ fontWeight: '600', color: isPassed ? '#2E8B57' : '#B22222', fontStyle: 'italic' }}>{remarks}</span>
        </div>
      </div>

      {/* Signatures & Seal Box */}
      <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '130px', 
            height: '130px', 
            borderRadius: '50%', 
            border: '2px solid #D4AF37',
            outline: '1px solid #0A192F',
            outlineOffset: '4px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#FCFBFA',
            boxShadow: 'inset 0 0 10px rgba(212, 175, 55, 0.2)'
          }}>
            <svg viewBox="0 0 100 100" width="120" height="120">
              <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
              <text fontSize="10" fill="#0A192F" fontWeight="bold" letterSpacing="1.5">
                <textPath href="#circlePath" startOffset="5" textAnchor="start">
                  • OFFICIAL AUTHORITY • ACADEMICS
                </textPath>
              </text>
              <circle cx="50" cy="50" r="22" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 3" />
              <text x="50" y="54" fontSize="12" fill="#D4AF37" textAnchor="middle" fontWeight="bold" fontFamily="Times">SEAL</text>
            </svg>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Institutional Seal
          </h4>
        </div>

        <div style={{ textAlign: 'center', paddingRight: '20px' }}>
          <div style={{ 
            fontFamily: '"Brush Script MT", "Cedarville Cursive", cursive', 
            fontSize: '56px', 
            color: '#0A192F',
            lineHeight: '0.8',
            marginBottom: '4px',
            opacity: 0.9,
            transform: 'rotate(-5deg)'
          }}>
            Registrar
          </div>
          <div style={{ 
            borderTop: '2px solid #0A192F', 
            width: '240px', 
            paddingTop: '12px',
            fontSize: '15px',
            fontWeight: '600',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#555'
          }}>
            Registrar Signature
          </div>
        </div>
      </div>
    </div>
  );
}
