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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message_en: string
          message_hi: string | null
          message_mr: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message_en: string
          message_hi?: string | null
          message_mr?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message_en?: string
          message_hi?: string | null
          message_mr?: string | null
          type?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          avg_consultation_minutes: number | null
          counter_number: number
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          room_number: string | null
          specialty: string
          status: string | null
        }
        Insert: {
          avg_consultation_minutes?: number | null
          counter_number: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          room_number?: string | null
          specialty?: string
          status?: string | null
        }
        Update: {
          avg_consultation_minutes?: number | null
          counter_number?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          room_number?: string | null
          specialty?: string
          status?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          age: number | null
          arrived_at: string | null
          billing_done: boolean | null
          cancel_reason: string | null
          consultation_time: string | null
          created_at: string | null
          doctor_id: string | null
          email: string | null
          gender: string | null
          id: string
          notes: string | null
          patient_name: string
          phone_number: string | null
          priority: string | null
          reason_for_visit: string | null
          registered_by: string | null
          registration_time: string | null
          status: Database["public"]["Enums"]["patient_status"] | null
          token_number: number
          updated_at: string | null
          waiting_for_tests: boolean | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          arrived_at?: string | null
          billing_done?: boolean | null
          cancel_reason?: string | null
          consultation_time?: string | null
          created_at?: string | null
          doctor_id?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_name: string
          phone_number?: string | null
          priority?: string | null
          reason_for_visit?: string | null
          registered_by?: string | null
          registration_time?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          token_number: number
          updated_at?: string | null
          waiting_for_tests?: boolean | null
        }
        Update: {
          address?: string | null
          age?: number | null
          arrived_at?: string | null
          billing_done?: boolean | null
          cancel_reason?: string | null
          consultation_time?: string | null
          created_at?: string | null
          doctor_id?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_name?: string
          phone_number?: string | null
          priority?: string | null
          reason_for_visit?: string | null
          registered_by?: string | null
          registration_time?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          token_number?: number
          updated_at?: string | null
          waiting_for_tests?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_settings: {
        Row: {
          auto_progress: boolean | null
          created_at: string | null
          display_mode: string | null
          hospital_name: string | null
          id: string
        }
        Insert: {
          auto_progress?: boolean | null
          created_at?: string | null
          display_mode?: string | null
          hospital_name?: string | null
          id?: string
        }
        Update: {
          auto_progress?: boolean | null
          created_at?: string | null
          display_mode?: string | null
          hospital_name?: string | null
          id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      patient_status: "waiting" | "consulting" | "completed" | "missed"
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
      app_role: ["admin", "staff"],
      patient_status: ["waiting", "consulting", "completed", "missed"],
    },
  },
} as const
