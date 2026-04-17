// ── Tenant / Branding ─────────────────────────────────────────────────────────
export type ThemeColor = 'green' | 'blue' | 'pink' | 'purple' | 'orange' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate' | 'crimson';

export interface Branding {
  primaryColor: ThemeColor;
  logo: string;
  favicon: string;
  schoolName: string;
  marksheetTemplate: 'standard' | 'modern' | 'minimal' | 'royal' | 'pearl';
  certificateTemplate: 'classic' | 'elegant' | 'modern' | 'royal' | 'pearl';
}

export interface Tenant {
  _id: string;
  name: string;
  type: 'school' | 'college' | 'university' | 'institute';
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  schoolCode: string;
  status: 'active' | 'inactive' | 'pending';
  branding: Branding;
  subscription: { plan: string; expiresAt: string };
  createdAt: string;
  updatedAt: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'saas_admin' | 'management' | 'teacher' | 'student';

export interface User {
  _id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

// ── Student ───────────────────────────────────────────────────────────────────
export interface Student {
  _id: string;
  tenantId: string;
  userId?: string;
  admissionNo: string;
  rollNo: string;
  classId?: { _id: string; name: string; sections: { name: string }[] } | string;
  sectionId: string;
  name: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  photo?: string;
  govtId?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  parent: {
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelation?: string;
  };
  previousSchool?: string;
  admissionDate?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  createdAt: string;
}

// ── Teacher ───────────────────────────────────────────────────────────────────
export interface Teacher {
  _id: string;
  tenantId: string;
  userId?: string;
  employeeId: string;
  name: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  email: string;
  photo?: string;
  govtId?: string;
  panCard?: string;
  salary?: number;
  qualification?: string;
  specialization?: string;
  experience?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  joinDate?: string;
  designation?: string;
  subjectIds?: Array<{ _id: string; name: string; code: string }>;
  classIds?: Array<{ _id: string; name: string }>;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ── Class & Subject ───────────────────────────────────────────────────────────
export interface ClassSection {
  name: string;
  teacherId?: string;
}

export interface Class {
  _id: string;
  tenantId: string;
  name: string;
  sections: ClassSection[];
  academicYear: string;
  createdAt: string;
}

export interface Subject {
  _id: string;
  tenantId: string;
  classId: string | Class;
  name: string;
  code: string;
  teacherId?: string | Teacher;
  fullMarks: number;
  passMarks: number;
  createdAt: string;
}

// ── Routine ───────────────────────────────────────────────────────────────────
export interface Period {
  startTime: string;
  endTime: string;
  subjectId?: string | Subject;
  teacherId?: string | Teacher;
  room?: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: Period[];
}

export interface Routine {
  _id: string;
  tenantId: string;
  classId: string | Class;
  sectionId: string;
  academicYear: string;
  schedule: DaySchedule[];
}

// ── Attendance ────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day';

export interface AttendanceRecord {
  studentId: string | Student;
  status: AttendanceStatus;
  note?: string;
}

export interface Attendance {
  _id: string;
  tenantId: string;
  classId: string;
  sectionId: string;
  date: string;
  records: AttendanceRecord[];
  takenBy?: string;
  createdAt: string;
}

// ── Exam & Marks ──────────────────────────────────────────────────────────────
export interface Exam {
  _id: string;
  tenantId: string;
  classId: string | Class;
  name: string;
  type: 'unit' | 'mid' | 'final' | 'practical' | 'assignment';
  academicYear: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Mark {
  _id: string;
  tenantId: string;
  examId: string | Exam;
  studentId: string | Student;
  subjectId: string | Subject;
  obtained: number;
  total: number;
  grade: string;
  remarks?: string;
  enteredBy?: string;
  createdAt: string;
}

// ── Fee Structure ─────────────────────────────────────────────────────────────
export interface FeeStructure {
  _id: string;
  tenantId: string;
  classId: { _id: string; name: string } | string;
  academicYear: string;
  monthlyFee: number;
  admissionFee: number;
  examFee: number;
  lateFinePerDay: number;
  dueDay: number;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ── Finance ───────────────────────────────────────────────────────────────────
export interface FeeSlip {
  _id: string;
  tenantId: string;
  studentId: string | Student;
  classId: string | Class;
  month: number;
  year: number;
  dueDate: string;
  amount: number;
  discount: number;
  fine: number;
  netAmount: number;
  paidAmount: number;
  paymentDate?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  _id: string;
  tenantId: string;
  teacherId: string | Teacher;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: string;
  status: 'pending' | 'paid';
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ── Certificate ───────────────────────────────────────────────────────────────
export type CertificateType = 'transfer' | 'bonafide' | 'character' | 'completion' | 'merit';

export interface Certificate {
  _id: string;
  tenantId: string;
  studentId: string | Student;
  type: CertificateType;
  content: Record<string, unknown>;
  issuedDate: string;
  issuedBy?: string | User;
  serialNo: string;
  status: 'issued' | 'revoked';
  createdAt: string;
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  counts: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
  };
  attendance: {
    todayPercentage: number;
    trend: Array<{ date: string; percentage: number }>;
  };
  upcomingExams: Exam[];
}
