export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "student" | "teacher";
          class_code: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          role: "student" | "teacher";
          class_code?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: "student" | "teacher";
          class_code?: string | null;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string | number;
          user_id: string;
          subject: string;
          topic: string;
          duration_minutes: number;
          question_count: number;
          created_at: string;
        };
        Insert: {
          id?: string | number;
          user_id: string;
          subject: string;
          topic: string;
          duration_minutes: number;
          question_count: number;
          created_at?: string;
        };
        Update: {
          id?: string | number;
          user_id?: string;
          subject?: string;
          topic?: string;
          duration_minutes?: number;
          question_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string | number;
          teacher_id: string;
          student_id: string | null;
          class_code: string;
          subject: string;
          topic: string;
          target_question_count: number;
          due_date: string;
          is_completed: boolean;
        };
        Insert: {
          id?: string | number;
          teacher_id: string;
          student_id?: string | null;
          class_code: string;
          subject: string;
          topic: string;
          target_question_count: number;
          due_date: string;
          is_completed?: boolean;
        };
        Update: {
          id?: string | number;
          teacher_id?: string;
          student_id?: string | null;
          class_code?: string;
          subject?: string;
          topic?: string;
          target_question_count?: number;
          due_date?: string;
          is_completed?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
