export interface Registration {
  id?: string | number;
  full_name: string;
  age: number;
  sex: 'Male' | 'Female';
  promoted_grade: 10 | 11 | 12;
  average: number;
  transcript_url: string;
  receipt_url: string;
  payment_method: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  class_assignment?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

export interface GradeSetting {
  id?: string | number;
  grade: 10 | 11 | 12;
  students_per_class: number;
}

export interface ClassAssignment {
  id?: string | number;
  grade: 10 | 11 | 12;
  class_name: string;
  class_type: 'Special' | 'Regular';
  total_students: number;
}

export interface GradeAnalytics {
  grade: 10 | 11 | 12;
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  rejectedStudents: number;
  maleCount: number;
  femaleCount: number;
  classesCount: number;
}

export interface AdminStats {
  totalStudents: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}
