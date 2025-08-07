
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Password stored here for mock auth
  role: UserRole;
  name: string;
  phoneNumber?: string; // For SMS notifications
  studentId?: string; // For parents, links to their child
  teacherId?: string; // For teachers
  profileImageUrl?: string; // For teacher profile images
  signatureImageUrl?: string; // For teacher/admin signatures
  classSubjectAssignments?: { classId: string; subjectIds: string[] }[];
}

export type TeacherFormData = Omit<User, 'id' | 'role' | 'studentId' | 'profileImageUrl' | 'signatureImageUrl'> & { id?: string, password_param?: string, role?: UserRole };
export type UserProfileFormData = Partial<Pick<User, 'name' | 'password'>> & { profileImageFile?: File | null, signatureImageFile?: File | null };

export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female',
}

export interface Student {
  id:string;
  admissionNumber: string;
  name: string;
  classId: string;
  stream: string; // e.g., "A", "B", "North"
  parentUsername: string;
  profileImageUrl?: string; // For student images on reports
  gender: Gender;
  currentFeesBalance: number;
  nextTermFees: number;
  subjects?: string[]; // Array of subject IDs the student takes
}

export type StudentFormData = Omit<Student, 'id' | 'profileImageUrl'> & { id?: string, profileImageFile?: File | null };


export interface SchoolClass {
  id: string;
  name: string; // e.g., "Form 1", "Form 2"
}

export interface Subject {
  id: string;
  name: string;
  group?: number; // To categorize subjects (1=Compulsory, 2=Sciences, etc.)
}

export enum TermCalculationMode {
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  SIMPLE_AVERAGE = 'SIMPLE_AVERAGE',
}

export interface Term {
  id: string;
  name: string; // e.g., "Term 1", "Term 2"
  year: number;
  calculationMode: TermCalculationMode;
  closingDate?: string;
  openingDate?: string;
}

export interface ExamSession {
  id: string;
  termId: string;
  name: string; // e.g., "Midterm CAT", "End Term Exam"
  weight: number; // Percentage, e.g., 30 for 30%
}

export interface Mark {
  studentId: string;
  subjectId: string;
  examSessionId: string;
  score: number | null; // Null if not entered yet
}

export interface GradePoint {
  grade: string;
  points: number;
}

export interface SubjectExamScore extends GradePoint {
  examSessionId: string;
  examSessionName: string;
  score: number | null;
  remarks: string;
}

export interface SubjectTermResult {
  subjectId: string;
  subjectName: string;
  weightedScore: number | null;
  termGrade: string;
  termPoints: number;
  termRemarks: string;
  componentScores: SubjectExamScore[];
  teacherInitials?: string;
}

export interface StudentReport {
  student: Student;
  classInfo: SchoolClass;
  term: Term;
  subjectTermResults: SubjectTermResult[];
  totalWeightedMarks: number | null;
  maxTotalMarks: number; // The maximum possible marks for the student's level (e.g., 800 or 1100)
  meanWeightedScore: number | null; // Percentage based on weighted scores
  meanTermPoints: number | null;
  overallTermGrade: string | null;
  principalComment: string;
  classTeacherComment: string;
  rank?: number; // Overall rank in their specific class (e.g., Form 2 North)
  totalStudentsInClass?: number; // Total students in their specific class
  classTeacherName?: string;
  classTeacherSignatureUrl?: string;
  principalName?: string;
  principalSignatureUrl?: string;
  currentFeesBalance: number;
  nextTermFees: number;
  closingDate?: string;
  openingDate?: string;
}

export interface StudentPerformanceDatapoint {
  termId: string;
  termName: string;
  year: number;
  meanWeightedScore: number | null;
  meanTermPoints: number | null;
  overallTermGrade: string | null;
}

export interface ClassTermBroadsheetEntry {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  classId: string;
  stream: string;
  subjectScores: { [subjectId: string]: number | null }; // final weighted score for the term for that subject
  totalWeightedMarks: number | null;
  meanWeightedScore: number | null; // Percentage
  meanTermPoints: number | null;
  overallTermGrade: string | null;
  rank?: number;
}

export interface PerformanceChangeEntry {
  student: Student;
  currentReport: StudentReport;
  previousReport: StudentReport;
  meanPointsChange: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  students: Student[];
  subjects: Subject[];
  classes: SchoolClass[];
  terms: Term[];
  examSessions: ExamSession[];
  marks: Mark[];
  isLoading: boolean;
  error: string | null;
  schoolNameDisplay: string; // Application brand name (e.g., NexusLearn)
  actualSchoolName: string; // Actual school name (e.g., Thinu Secondary School)
  schoolAddress: string; // Add this line
  schoolNameDomain: string;
  currentTermId: string | null; // To store the globally selected term for viewing reports
  activeSubjectIds: string[]; // IDs of subjects offered by the school
  schoolBadgeUrl?: string | null; // URL for custom school badge image
  selectedComparisonTermId: string | null; // For MeritListPage state
}

export interface SubjectClassAnalysis {
    subjectId: string;
    subjectName: string;
    meanScore: number | null;
    gradeDistribution: { [grade: string]: number };
    rankedStudents: {
        studentId: string;
        studentName: string;
        admissionNumber: string;
        score: number | null;
        grade: string;
        rank: number;
    }[];
    studentCount: number;
}

export interface ClassTermAnalysis {
    classId: string;
    className: string;
    stream?: string | null;
    termId: string;
    termName: string;
    year: number;
    overallMeanPoints: number | null;
    overallMeanGrade: string;
    gradeDistribution: { [grade: string]: number };
    totalStudents: number;
    subjectAnalyses: SubjectClassAnalysis[];
}
