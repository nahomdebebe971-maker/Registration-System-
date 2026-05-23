import { createClient } from '@supabase/supabase-js';
import { Registration, GradeSetting, ClassAssignment } from '../types';

// Read values from Vite environment variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://lrxvhkyvhxiqyfkmakbc.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = !!(supabaseAnonKey && supabaseAnonKey !== "your-anon-public-key" && supabaseAnonKey !== "");

// Initialize the real Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  getIsSupabaseActive: () => isSupabaseConfigured,

  // REGISTRATIONS API
  getRegistrations: async (): Promise<Registration[]> => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase registrations fetch failed:", error);
      throw error;
    }
    return (data || []) as Registration[];
  },

  saveRegistration: async (student: Registration): Promise<Registration> => {
    const { id, ...rest } = student;
    // Omit local numerical or empty IDs so Supabase can generate authentic UUIDs
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
      console.error("Supabase registration save failed:", error);
      throw error;
    }
    return data as Registration;
  },

  updateRegistrationStatus: async (
    id: string | number, 
    status: 'Pending Review' | 'Approved' | 'Rejected', 
    rejectionReason: string | null = null
  ): Promise<boolean> => {
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
  },

  deleteRegistration: async (id: string | number): Promise<boolean> => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase registration deletion failed:", error);
      throw error;
    }
    return true;
  },

  // GRADE SETTINGS API
  getGradeSettings: async (): Promise<GradeSetting[]> => {
    const { data, error } = await supabase
      .from('grade_settings')
      .select('*')
      .order('grade', { ascending: true });

    if (error) {
      console.error("Supabase grade_settings fetch failed:", error);
      throw error;
    }
    return (data || []) as GradeSetting[];
  },

  updateGradeSettings: async (settings: GradeSetting[]): Promise<boolean> => {
    // Cleanup settings with local IDs to allow clean upsert
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
  },

  // BULK SAVE CLASS ASSIGNMENTS
  saveClassAssignmentToDatabase: async (id: string | number, className: string | null): Promise<boolean> => {
    const { error } = await supabase
      .from('registrations')
      .update({ class_assignment: className })
      .eq('id', id);

    if (error) {
      console.error("Supabase class assignment save failed:", error);
      throw error;
    }
    return true;
  },

  // BULK WRITE CLASS MAPS TO THE 'classes' TABLE
  updateClassesSummary: async (classes: ClassAssignment[]): Promise<boolean> => {
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
  },

  getClassesSummary: async (): Promise<ClassAssignment[]> => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('class_name', { ascending: true });

    if (error) {
      console.error("Supabase classes summary fetch failed:", error);
      throw error;
    }
    return (data || []) as ClassAssignment[];
  }
};
