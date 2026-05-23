import { createClient } from '@supabase/supabase-js';
import { Registration, GradeSetting, ClassAssignment } from '../types';

// Read values from Vite environment variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://lrxvhkyvhxiqyfkmakbc.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = supabaseAnonKey && supabaseAnonKey !== "your-anon-public-key";

// Initialize the real Supabase client if credentials are provided
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock Data for offline fallback
const DEFAULT_GRADE_SETTINGS: GradeSetting[] = [
  { id: 1, grade: 10, students_per_class: 60 },
  { id: 2, grade: 11, students_per_class: 45 },
  { id: 3, grade: 12, students_per_class: 40 }
];

const DEFAULT_MOCK_REGISTRATIONS: Registration[] = [
  // Grade 10 Students
  { id: 1001, full_name: "Nahom Debebe", age: 16, sex: "Male", promoted_grade: 10, average: 94.2, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t1.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r1.jpg", payment_method: "CBE", status: "Approved", class_assignment: "10A" },
  { id: 1002, full_name: "Bethelhem Tekle", age: 15, sex: "Female", promoted_grade: 10, average: 93.8, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t2.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r2.jpg", payment_method: "TELEBIRR", status: "Approved", class_assignment: "10A" },
  { id: 1003, full_name: "Almaz Tesfaye", age: 16, sex: "Female", promoted_grade: 10, average: 91.5, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t3.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r3.jpg", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "10A" },
  { id: 1004, full_name: "Yohannes Kebede", age: 16, sex: "Male", promoted_grade: 10, average: 89.6, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t4.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r4.jpg", payment_method: "CBE", status: "Approved", class_assignment: "10A" },
  { id: 1005, full_name: "Selamawit Hailu", age: 15, sex: "Female", promoted_grade: 10, average: 88.4, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t5.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r5.jpg", payment_method: "CBE", status: "Approved", class_assignment: "10A" },
  { id: 1006, full_name: "Dawit Birhanu", age: 16, sex: "Male", promoted_grade: 10, average: 85.1, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t6.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r6.jpg", payment_method: "TELEBIRR", status: "Approved", class_assignment: "10A" },
  { id: 1007, full_name: "Tsion Girma", age: 15, sex: "Female", promoted_grade: 10, average: 84.8, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t7.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r7.jpg", payment_method: "SINQEE BANK", status: "Pending Review", class_assignment: null },
  { id: 1008, full_name: "Ephraim Solomon", age: 16, sex: "Male", promoted_grade: 10, average: 82.5, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t8.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r8.jpg", payment_method: "CBE", status: "Pending Review", class_assignment: null },
  { id: 1009, full_name: "Hana Dejene", age: 16, sex: "Female", promoted_grade: 10, average: 79.4, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t9.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r9.jpg", payment_method: "TELEBIRR", status: "Rejected", class_assignment: null, rejection_reason: "Payment receipt verification failed: Amount does not match the registration fee of 300 ETB." },
  { id: 1010, full_name: "Tariku Mengistu", age: 17, sex: "Male", promoted_grade: 10, average: 78.1, transcript_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000001/school-registration/transcripts/t10.png", receipt_url: "https://res.cloudinary.com/dgwspegi5/image/upload/v1700000002/school-registration/receipts/r10.jpg", payment_method: "CBE", status: "Approved", class_assignment: "10B" },
  { id: 1011, full_name: "Kalkidan Abebe", age: 15, sex: "Female", promoted_grade: 10, average: 76.5, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Approved", class_assignment: "10B" },
  { id: 1012, full_name: "Binyam Yoseph", age: 16, sex: "Male", promoted_grade: 10, average: 74.3, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "10B" },
  { id: 1013, full_name: "Meron Daniel", age: 15, sex: "Female", promoted_grade: 10, average: 72.8, transcript_url: "", receipt_url: "", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "10B" },
  
  // Grade 11 Students
  { id: 1101, full_name: "Michael Tadesse", age: 17, sex: "Male", promoted_grade: 11, average: 96.0, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11A" },
  { id: 1102, full_name: "Helen Assefa", age: 16, sex: "Female", promoted_grade: 11, average: 95.5, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11A" },
  { id: 1103, full_name: "Abdi Mohammed", age: 17, sex: "Male", promoted_grade: 11, average: 91.2, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Approved", class_assignment: "11A" },
  { id: 1104, full_name: "Kidist Getachew", age: 16, sex: "Female", promoted_grade: 11, average: 89.9, transcript_url: "", receipt_url: "", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "11A" },
  { id: 1105, full_name: "Solomon Chala", age: 17, sex: "Male", promoted_grade: 11, average: 88.0, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11A" },
  { id: 1106, full_name: "Sara Hailu", age: 16, sex: "Female", promoted_grade: 11, average: 87.5, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Pending Review", class_assignment: null },
  { id: 1107, full_name: "Fasil Demeke", age: 17, sex: "Male", promoted_grade: 11, average: 85.3, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Pending Review", class_assignment: null },
  { id: 1108, full_name: "Aida Zewdu", age: 17, sex: "Female", promoted_grade: 11, average: 83.2, transcript_url: "", receipt_url: "", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "11B" },
  { id: 1109, full_name: "Robel Teshome", age: 18, sex: "Male", promoted_grade: 11, average: 81.0, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11B" },
  { id: 1110, full_name: "Martha Belay", age: 16, sex: "Female", promoted_grade: 11, average: 79.8, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Approved", class_assignment: "11B" },
  { id: 1111, full_name: "Girma Wolde", age: 17, sex: "Male", promoted_grade: 11, average: 77.0, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11B" },
  { id: 1112, full_name: "Tigist Elias", age: 17, sex: "Female", promoted_grade: 11, average: 75.4, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "11B" },

  // Grade 12 Students
  { id: 1201, full_name: "Elias Belayneh", age: 18, sex: "Male", promoted_grade: 12, average: 97.4, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "12A" },
  { id: 1202, full_name: "Rahel Negash", age: 17, sex: "Female", promoted_grade: 12, average: 96.1, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Approved", class_assignment: "12A" },
  { id: 1203, full_name: "Kebede Alemu", age: 18, sex: "Male", promoted_grade: 12, average: 92.5, transcript_url: "", receipt_url: "", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "12A" },
  { id: 1204, full_name: "Eden Teshome", age: 17, sex: "Female", promoted_grade: 12, average: 91.0, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "12A" },
  { id: 1205, full_name: "Samuel Negussie", age: 18, sex: "Male", promoted_grade: 12, average: 89.2, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "12A" },
  { id: 1206, full_name: "Meseret Haile", age: 17, sex: "Female", promoted_grade: 12, average: 87.1, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Pending Review", class_assignment: null },
  { id: 1207, full_name: "Yared Abera", age: 19, sex: "Male", promoted_grade: 12, average: 84.6, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "12B" },
  { id: 1208, full_name: "Zenebech Mulu", age: 17, sex: "Female", promoted_grade: 12, average: 81.3, transcript_url: "", receipt_url: "", payment_method: "SINQEE BANK", status: "Approved", class_assignment: "12B" },
  { id: 1209, full_name: "Eskinder Mulugheta", age: 18, sex: "Male", promoted_grade: 12, average: 79.1, transcript_url: "", receipt_url: "", payment_method: "CBE", status: "Approved", class_assignment: "12B" },
  { id: 1210, full_name: "Frehiwot Lemma", age: 17, sex: "Female", promoted_grade: 12, average: 76.5, transcript_url: "", receipt_url: "", payment_method: "TELEBIRR", status: "Approved", class_assignment: "12B" }
];

// LocalStorage Helper functions
const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  getIsSupabaseActive: () => isSupabaseConfigured,

  // REGISTRATIONS API
  getRegistrations: async (): Promise<Registration[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Registration[];
      console.warn("Supabase fetch failed, falling back to local:", error);
    }
    return getLocalData<Registration[]>('css_registrations', DEFAULT_MOCK_REGISTRATIONS);
  },

  saveRegistration: async (student: Registration): Promise<Registration> => {
    const formatted = {
      ...student,
      created_at: student.created_at || new Date().toISOString(),
      status: student.status || 'Pending Review',
      class_assignment: student.class_assignment || null
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) return data as Registration;
      console.error("Supabase insert failed, using memory:", error);
    }

    // Local Storage version
    const local = getLocalData<Registration[]>('css_registrations', DEFAULT_MOCK_REGISTRATIONS);
    const newId = local.length > 0 ? Math.max(...local.map(r => Number(r.id) || 0)) + 1 : 1001;
    const finalStudent = { ...formatted, id: newId };
    local.unshift(finalStudent);
    setLocalData('css_registrations', local);
    return finalStudent;
  },

  updateRegistrationStatus: async (
    id: string | number, 
    status: 'Pending Review' | 'Approved' | 'Rejected', 
    rejectionReason: string | null = null
  ): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const updateData: Partial<Registration> = { status, rejection_reason: rejectionReason };
      // If reassigned to Pending/Rejected, clear class
      if (status !== 'Approved') {
        updateData.class_assignment = null;
      }
      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', id);
      if (!error) return true;
      console.error("Supabase status update failed:", error);
    }

    const local = getLocalData<Registration[]>('css_registrations', DEFAULT_MOCK_REGISTRATIONS);
    const index = local.findIndex(r => r.id === id || String(r.id) === String(id));
    if (index !== -1) {
      local[index].status = status;
      local[index].rejection_reason = rejectionReason;
      if (status !== 'Approved') {
        local[index].class_assignment = null;
      }
      setLocalData('css_registrations', local);
      return true;
    }
    return false;
  },

  deleteRegistration: async (id: string | number): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);
      if (!error) return true;
      console.error("Supabase delete failed:", error);
    }

    const local = getLocalData<Registration[]>('css_registrations', DEFAULT_MOCK_REGISTRATIONS);
    const filtered = local.filter(r => r.id !== id && String(r.id) !== String(id));
    setLocalData('css_registrations', filtered);
    return true;
  },

  // GRADE SETTINGS API
  getGradeSettings: async (): Promise<GradeSetting[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('grade_settings')
        .select('*')
        .order('grade', { ascending: true });
      if (!error && data && data.length > 0) return data as GradeSetting[];
      console.warn("Supabase grade_settings empty or failed, using local settings:", error);
    }
    return getLocalData<GradeSetting[]>('css_grade_settings', DEFAULT_GRADE_SETTINGS);
  },

  updateGradeSettings: async (settings: GradeSetting[]): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      // Upsert grade settings
      const { error } = await supabase
        .from('grade_settings')
        .upsert(settings, { onConflict: 'grade' });
      if (!error) return true;
      console.error("Supabase grade specs upsert failed:", error);
    }

    setLocalData('css_grade_settings', settings);
    return true;
  },

  // BULK SAVE CLASS ASSIGNMENTS
  saveClassAssignmentToDatabase: async (id: string | number, className: string | null): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('registrations')
        .update({ class_assignment: className })
        .eq('id', id);
      if (!error) return true;
    }
    
    // Fallback
    const local = getLocalData<Registration[]>('css_registrations', DEFAULT_MOCK_REGISTRATIONS);
    const idx = local.findIndex(r => r.id === id || String(r.id) === String(id));
    if (idx !== -1) {
      local[idx].class_assignment = className;
      setLocalData('css_registrations', local);
      return true;
    }
    return false;
  },

  // BULK WRITE CLASS MAPS TO THE 'classes' TABLE
  updateClassesSummary: async (classes: ClassAssignment[]): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      // Clear current classes summary
      await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Insert new summaries
      const { error } = await supabase
        .from('classes')
        .insert(classes);
      if (!error) return true;
    }

    setLocalData('css_classes_summary', classes);
    return true;
  },

  getClassesSummary: async (): Promise<ClassAssignment[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_name', { ascending: true });
      if (!error && data) return data as ClassAssignment[];
    }
    return getLocalData<ClassAssignment[]>('css_classes_summary', []);
  }
};
