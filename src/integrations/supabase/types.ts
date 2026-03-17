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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      district_admin_credentials: {
        Row: {
          admin_full_name: string
          admin_login: string
          created_at: string
          district: string
          id: string
          initial_password: string
          region: string
        }
        Insert: {
          admin_full_name: string
          admin_login: string
          created_at?: string
          district: string
          id?: string
          initial_password: string
          region: string
        }
        Update: {
          admin_full_name?: string
          admin_login?: string
          created_at?: string
          district?: string
          id?: string
          initial_password?: string
          region?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          full_name: string
          id: string
          password_changed: boolean
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          password_changed?: boolean
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          password_changed?: boolean
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admin_credentials: {
        Row: {
          admin_login: string
          created_at: string
          id: string
          initial_password: string
          school_id: string
        }
        Insert: {
          admin_login: string
          created_at?: string
          id?: string
          initial_password: string
          school_id: string
        }
        Update: {
          admin_login?: string
          created_at?: string
          id?: string
          initial_password?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admin_credentials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          admin_full_name: string
          admin_login: string
          created_at: string
          district: string
          id: string
          is_active: boolean
          region: string
          school_code: string
          school_name: string
          show_results: boolean
          updated_at: string
        }
        Insert: {
          admin_full_name: string
          admin_login: string
          created_at?: string
          district: string
          id?: string
          is_active?: boolean
          region: string
          school_code: string
          school_name: string
          show_results?: boolean
          updated_at?: string
        }
        Update: {
          admin_full_name?: string
          admin_login?: string
          created_at?: string
          district?: string
          id?: string
          is_active?: boolean
          region?: string
          school_code?: string
          school_name?: string
          show_results?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          certificate_score: string | null
          certificate_type:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          created_at: string
          full_name: string
          has_language_certificate: boolean
          id: string
          phone_number: string
          school_id: string
          subject1: string
          subject2: string
          test_language: Database["public"]["Enums"]["test_language"]
          updated_at: string
        }
        Insert: {
          certificate_score?: string | null
          certificate_type?:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          created_at?: string
          full_name: string
          has_language_certificate?: boolean
          id?: string
          phone_number: string
          school_id: string
          subject1: string
          subject2: string
          test_language?: Database["public"]["Enums"]["test_language"]
          updated_at?: string
        }
        Update: {
          certificate_score?: string | null
          certificate_type?:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          created_at?: string
          full_name?: string
          has_language_certificate?: boolean
          id?: string
          phone_number?: string
          school_id?: string
          subject1?: string
          subject2?: string
          test_language?: Database["public"]["Enums"]["test_language"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          max_score: number
          score_matematika: number
          score_ona_tili: number
          score_subject1: number
          score_subject2: number
          score_tarix: number
          student_id: string
          subject1: string
          subject2: string
          test_date: string
          test_language: Database["public"]["Enums"]["test_language"]
          total_score: number
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          max_score?: number
          score_matematika?: number
          score_ona_tili?: number
          score_subject1?: number
          score_subject2?: number
          score_tarix?: number
          student_id: string
          subject1: string
          subject2: string
          test_date?: string
          test_language: Database["public"]["Enums"]["test_language"]
          total_score?: number
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          max_score?: number
          score_matematika?: number
          score_ona_tili?: number
          score_subject1?: number
          score_subject2?: number
          score_tarix?: number
          student_id?: string
          subject1?: string
          subject2?: string
          test_date?: string
          test_language?: Database["public"]["Enums"]["test_language"]
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_district: { Args: { _user_id: string }; Returns: string }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "school_admin" | "district_admin"
      certificate_type: "IELTS" | "CEFR" | "Duolingo" | "TOEFL" | "Other"
      test_language: "uzbek" | "russian" | "english"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "district_admin"],
      certificate_type: ["IELTS", "CEFR", "Duolingo", "TOEFL", "Other"],
      test_language: ["uzbek", "russian", "english"],
    },
  },
} as const
