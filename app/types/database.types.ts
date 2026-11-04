// Tipos do schema público do Supabase.
// Mantidos manualmente para garantir tipagem forte nos services e actions.
// Ao alterar a migration, atualize também estas definições.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          personal_id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          personal_id: string;
          name: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          personal_id?: string;
          name?: string;
          phone?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'students_personal_id_fkey';
            columns: ['personal_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      student_anamneses: {
        Row: {
          id: string;
          student_id: string;
          primary_goal: string;
          experience_level: string;
          joint_pains: Json;
          medical_conditions: Json;
          weekly_frequency: number;
          additional_notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          primary_goal: string;
          experience_level: string;
          joint_pains?: Json;
          medical_conditions?: Json;
          weekly_frequency?: number;
          additional_notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          primary_goal?: string;
          experience_level?: string;
          joint_pains?: Json;
          medical_conditions?: Json;
          weekly_frequency?: number;
          additional_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_anamneses_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: true;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_gif_overrides: {
        Row: {
          id: string;
          personal_id: string;
          external_exercise_id: string;
          exercise_name: string;
          gif_url: string;
          storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          personal_id: string;
          external_exercise_id: string;
          exercise_name: string;
          gif_url: string;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          personal_id?: string;
          external_exercise_id?: string;
          exercise_name?: string;
          gif_url?: string;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_gif_overrides_personal_id_fkey';
            columns: ['personal_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_plans: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          access_token: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          access_token?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          access_token?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_plans_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_items: {
        Row: {
          id: string;
          workout_plan_id: string;
          session_label: string;
          external_exercise_id: string;
          exercise_name: string;
          gif_url: string;
          target_muscle: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          notes: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          workout_plan_id: string;
          session_label: string;
          external_exercise_id: string;
          exercise_name: string;
          gif_url: string;
          target_muscle: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          notes?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          workout_plan_id?: string;
          session_label?: string;
          external_exercise_id?: string;
          exercise_name?: string;
          gif_url?: string;
          target_muscle?: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          notes?: string | null;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_items_workout_plan_id_fkey';
            columns: ['workout_plan_id'];
            isOneToOne: false;
            referencedRelation: 'workout_plans';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_workout_access_token: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_public_workout_plan: {
        Args: {
          p_workout_plan_id: string;
        };
        Returns: boolean;
      };
      duplicate_workout_plan: {
        Args: {
          p_original_plan_id: string;
          p_target_student_id: string;
          p_new_title: string;
          p_new_access_token?: string | null;
        };
        Returns: string;
      };
      get_public_workout_plan: {
        Args: {
          p_access_token: string;
        };
        Returns: Json | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type StudentAnamnesis =
  Database['public']['Tables']['student_anamneses']['Row'];
export type StudentAnamnesisInsert =
  Database['public']['Tables']['student_anamneses']['Insert'];
export type StudentAnamnesisUpdate =
  Database['public']['Tables']['student_anamneses']['Update'];

export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row'];
export type WorkoutPlanInsert =
  Database['public']['Tables']['workout_plans']['Insert'];
export type WorkoutPlanUpdate =
  Database['public']['Tables']['workout_plans']['Update'];

export type WorkoutItem = Database['public']['Tables']['workout_items']['Row'];
export type WorkoutItemInsert =
  Database['public']['Tables']['workout_items']['Insert'];
export type WorkoutItemUpdate =
  Database['public']['Tables']['workout_items']['Update'];

export type WorkoutPlanWithItems = WorkoutPlan & {
  workout_items: WorkoutItem[];
};

export type StudentWithAnamnesis = Student & {
  student_anamneses: StudentAnamnesis | null;
};

export type ExerciseGifOverrideRow =
  Database['public']['Tables']['exercise_gif_overrides']['Row'];

export type PublicWorkoutPlan = Omit<WorkoutPlan, 'access_token'> & {
  items: WorkoutItem[];
};
