import { createClient } from '@supabase/supabase-js';
import { Registration, GradeSetting, ClassAssignment } from '../types';

// Read values from Vite environment variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://lrxvhkyvhxiqyfkmakbc.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = !!(
  supabaseAnonKey && 
  supabaseAnonKey !== "your-anon-public-key" && 
  supabaseAnonKey.trim() !== ""
);

// We use a dummy jwt formatted string to prevent Supabase SDK from throwing an exception during module load if the key is empty
const safeAnonKey = isSupabaseConfigured 
  ? supabaseAnonKey 
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholderKey";

// Initialize the real Supabase client safely
export const supabase = createClient(supabaseUrl, safeAnonKey);

const DEFAULT_GRADE_SETTINGS: GradeSetting[] = [
  { id: 'g10', grade: 10, students_per_class: 60 },
  { id: 'g11', grade: 11, students_per_class: 45 },
  { id: 'g12', grade: 12, students_per_class: 40 }
];

export const db = {
  getIsSupabaseActive: () => isSupabaseConfigured,

  // REGISTRATIONS API
  getRegistrations: async (): Promise<Registration[]> => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured yet. Returning empty registration list.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase registrations fetch failed:", error);
        return [];
      }
      return (data || []) as Registration[];
    } catch (err) {
      console.error("Failed to read registrations from Supabase:", err);
      return [];
    }
  },

  saveRegistration: async (student: Registration): Promise<Registration> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured. Please supply the environment variables.");
    }
    try {
      const { id, ...rest } = student;
      const insertData = typeof id === 'number' || !id ? rest : student;
      
      const formatted = {
        ...insertData,
        created_at: student.created_at || new Date().toISOString(),
        status: student.status || 'Pending Review',
        class_assignment: student.class_assignment || null
      };

      const { data, error } = await supabase
        .from('registrations')
        .insert([formatted])
        .select()
        .single();

      if (error) {
        console.error("Supabase registration insert failed:", error);
        throw error;
      }
      return data as Registration;
    } catch (err) {
      console.error("Failed to save registration to Supabase:", err);
      throw err;
    }
  },

  updateRegistrationStatus: async (
    id: string | number, 
    status: 'Pending Review' | 'Approved' | 'Rejected', 
    rejectionReason: string | null = null
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    try {
      const updateData: Partial<Registration> = { status, rejection_reason: rejectionReason };
      if (status !== 'Approved') {
        updateData.class_assignment = null;
      }
      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("Supabase registration status update failed:", error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Failed to update status on Supabase:", err);
      throw err;
    }
  },

  deleteRegistration: async (id: string | number): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Supabase registration deletion failed:", error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Failed to delete registration from Supabase:", err);
      throw err;
    }
  },

  // GRADE SETTINGS API
  getGradeSettings: async (): Promise<GradeSetting[]> => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured yet. Returning default school settings skeleton.");
      return DEFAULT_GRADE_SETTINGS;
    }
    try {
      const { data, error } = await supabase
        .from('grade_settings')
        .select('*')
        .order('grade', { ascending: true });

      if (error) {
        console.error("Supabase grade_settings fetch failed, using default fallback:", error);
        return DEFAULT_GRADE_SETTINGS;
      }
      if (!data || data.length === 0) {
        return DEFAULT_GRADE_SETTINGS;
      }
      return data as GradeSetting[];
    } catch (err) {
      console.error("Failed to fetch grade settings from Supabase, on fallback:", err);
      return DEFAULT_GRADE_SETTINGS;
    }
  },

  updateGradeSettings: async (settings: GradeSetting[]): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    try {
      const upsertValue = settings.map(s => {
        const { id, ...rest } = s;
        if (typeof id === 'number' || !id) {
          return rest;
        }
        return s;
      });

      const { error } = await supabase
        .from('grade_settings')
        .upsert(upsertValue, { onConflict: 'grade' });

      if (error) {
        console.error("Supabase grade settings upsert failed:", error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Failed to update grade settings in Supabase:", err);
      throw err;
    }
  },

  // BULK SAVE CLASS ASSIGNMENTS
  saveClassAssignmentToDatabase: async (id: string | number, className: string | null): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ class_assignment: className })
        .eq('id', id);

      if (error) {
        console.error("Supabase class assignment save failed:", error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Failed to update class assignment in Supabase:", err);
      throw err;
    }
  },

  // BULK WRITE CLASS MAPS TO THE 'classes' TABLE
  updateClassesSummary: async (classes: ClassAssignment[]): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      return true;
    }
    try {
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error("Supabase classes clean failed:", deleteError);
        throw deleteError;
      }
      
      if (classes.length === 0) return true;
      
      const targetClasses = classes.map(c => ({
        class_name: c.class_name,
        grade: c.grade,
        class_type: c.class_type,
        total_students: c.total_students
      }));

      const { error: insertError } = await supabase
        .from('classes')
        .insert(targetClasses);

      if (insertError) {
        console.error("Supabase classes summary insert failed:", insertError);
        throw insertError;
      }
      return true;
    } catch (err) {
      console.error("Failed to write classes summary on Supabase:", err);
      throw err;
    }
  },

  getClassesSummary: async (): Promise<ClassAssignment[]> => {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_name', { ascending: true });

      if (error) {
        console.error("Supabase classes summary fetch failed:", error);
        return [];
      }
      return (data || []) as ClassAssignment[];
    } catch (err) {
      console.error("Failed to get classes summary from Supabase:", err);
      return [];
    }
  }
};
