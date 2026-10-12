export type UserRole = 'admin' | 'supervisor' | 'kadis';

export type SupervisorLevel = 'Ahli Muda' | 'Ahli Madya' | 'Ahli Utama';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  nip?: string;
  pangkatGolongan?: string;
  jabatanLevel?: SupervisorLevel;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  status: 'Negeri' | 'Swasta';
  educationLevel: 'SMP';
  address: string;
  subdistrict: string; // Kecamatan di Garut (e.g. Tarogong Kidul, Garut Kota, etc.)
  principalName: string;
  phone: string;
  email: string;
  supervisorId: string; // Pengawas penanggung jawab (User ID)
  supervisorName?: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type SupervisionCategory =
  | 'Pengawasan Akademik'
  | 'Pengawasan Manajerial'
  | 'Pemantauan'
  | 'Penilaian'
  | 'Pembinaan'
  | 'Penguatan Pendidikan Karakter'
  | 'Analisis Mutu Satuan Pendidikan'
  | 'Pengendalian dan Pengembangan Mutu Pendidikan'
  | 'Kegiatan Strategis dan Inovasi Sistem Pengawasan'
  | 'Lainnya';

export interface SupervisionPlan {
  id: string;
  planCode: string; // e.g. RKP-2026-001
  supervisorId: string;
  supervisorName: string;
  schoolId: string;
  schoolName: string;
  academicYear: string; // e.g. 2025/2026
  semester: 'Ganjil' | 'Genap';
  category: SupervisionCategory[];
  supervisionField: 'Akademik' | 'Manajerial' | 'Akademik & Manajerial';
  objective: string;
  targetIndicator: string;
  plannedDate: string; // YYYY-MM-DD
  method: string;
  instruments: string;
  expectedOutput: string;
  notes?: string;
  status: 'Direncanakan' | 'Terlaksana' | 'Dibatalkan';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityStatus = 'Draf' | 'Diajukan' | 'Diperiksa' | 'Perlu Perbaikan' | 'Selesai';

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type or file extension
  size: number;
  dataUrl: string; // Data URL or base64
  uploadedAt: string;
}

export interface VerificationNote {
  id: string;
  verifierId: string;
  verifierName: string;
  role: UserRole;
  status: ActivityStatus;
  comment: string;
  createdAt: string;
}

export interface SupervisionActivity {
  id: string;
  activityNumber: string; // e.g. PS-SMP-2026-001
  supervisorId: string;
  supervisorName: string;
  schoolId: string;
  schoolName: string;
  activityDate: string; // YYYY-MM-DD
  activityTime?: string; // e.g. 08:00 - 12:30 WIB
  locationMode: 'Luring (Tatap Muka di Sekolah)' | 'Daring (Virtual/Zoom)' | 'Kombinasi (Hybrid)';
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  categories: SupervisionCategory[];
  planId?: string; // Rujukan rencana jika ada
  
  // Rincian Pelaksanaan
  objective: string;
  background: string;
  activityDescription: string;
  observedAspects: string;
  methodsAndInstruments: string;
  involvedParties: string;
  supervisionResults: string;
  keyFindings: string;
  goodPractices: string;
  challengesProblems: string;
  resultAnalysis: string;
  recommendations: string;
  followUpPlan: string;
  followUpPersonInCharge: string;
  followUpTargetDate: string;
  additionalNotes?: string;
  
  // Lampiran & Status
  attachments: Attachment[];
  status: ActivityStatus;
  verificationNotes: VerificationNote[];
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpStatus =
  | 'Belum Dimulai'
  | 'Sedang Berjalan'
  | 'Selesai'
  | 'Terlambat'
  | 'Perlu Evaluasi Kembali';

export interface FollowUpItem {
  id: string;
  activityId: string;
  activityNumber: string;
  schoolId: string;
  schoolName: string;
  supervisorId: string;
  supervisorName: string;
  findingDescription: string;
  recommendation: string;
  actionPlan: string;
  personInCharge: string; // Nama kepsek / guru / wakasek
  targetDate: string;
  status: FollowUpStatus;
  completionProofNote?: string;
  completedDate?: string;
  progressNotes: {
    id: string;
    note: string;
    authorName: string;
    createdAt: string;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string; // ISO WIB
}

export interface AppRegulation {
  id: string;
  title: string;
  number: string;
  year: number;
  about: string;
  description: string;
  linkUrl?: string;
  isActive: boolean;
  notes?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}
