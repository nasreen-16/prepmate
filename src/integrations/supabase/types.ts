export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      dsa_problems: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          is_demo: boolean
          notes: string
          platform: string
          revision_date: string | null
          status: string
          title: string
          topic: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          is_demo?: boolean
          notes?: string
          platform?: string
          revision_date?: string | null
          status?: string
          title: string
          topic?: string
          updated_at?: string
          url?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          is_demo?: boolean
          notes?: string
          platform?: string
          revision_date?: string | null
          status?: string
          title?: string
          topic?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_interviews: {
        Row: {
          created_at: string
          id: string
          interview_type: string
          overall_score: number | null
          questions: Json
          role: string
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_type: string
          overall_score?: number | null
          questions?: Json
          role?: string
          summary?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_type?: string
          overall_score?: number | null
          questions?: Json
          role?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_tasks: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          is_demo: boolean
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_demo?: boolean
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_demo?: boolean
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string
          branch: string
          college: string
          created_at: string
          full_name: string
          graduation_year: number | null
          id: string
          target_roles: string[]
          updated_at: string
        }
        Insert: {
          bio?: string
          branch?: string
          college?: string
          created_at?: string
          full_name?: string
          graduation_year?: number | null
          id: string
          target_roles?: string[]
          updated_at?: string
        }
        Update: {
          bio?: string
          branch?: string
          college?: string
          created_at?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          target_roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          correct_answers: number
          created_at: string
          details: Json
          duration_seconds: number
          id: string
          score: number
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers: number
          created_at?: string
          details?: Json
          duration_seconds?: number
          id?: string
          score: number
          topic: string
          total_questions: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          details?: Json
          duration_seconds?: number
          id?: string
          score?: number
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          analysis: Json
          created_at: string
          extracted_text: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          job_description: string
          user_id: string
        }
        Insert: {
          analysis?: Json
          created_at?: string
          extracted_text?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          job_description?: string
          user_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          extracted_text?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          job_description?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
