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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          admin_id: string
          application_id: string
          created_at: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          application_id: string
          created_at?: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          application_id?: string
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_info_requests: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          message: string
          requested_at: string
          requested_by: string
          requested_documents: string[]
          requested_sections: string[]
          responded_at: string | null
          response_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          message: string
          requested_at?: string
          requested_by: string
          requested_documents?: string[]
          requested_sections?: string[]
          responded_at?: string | null
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string
          requested_at?: string
          requested_by?: string
          requested_documents?: string[]
          requested_sections?: string[]
          responded_at?: string | null
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_info_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_review_checks: {
        Row: {
          application_id: string
          check_key: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          issue_note: string | null
          review_state: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          check_key: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          issue_note?: string | null
          review_state?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          check_key?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          issue_note?: string | null
          review_state?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_review_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_applications: {
        Row: {
          agreed_rules: boolean
          approved_at: string | null
          business_name: string | null
          company_registration_number: string | null
          confirmed_accurate: boolean
          contact_name: string | null
          contractor_decision_message: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          insurance_evidence_path: string | null
          insurance_status: string | null
          logo_path: string | null
          main_area: string | null
          phone: string | null
          qualifications: string | null
          references_text: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
          website: string | null
          working_hours: string | null
        }
        Insert: {
          agreed_rules?: boolean
          approved_at?: string | null
          business_name?: string | null
          company_registration_number?: string | null
          confirmed_accurate?: boolean
          contact_name?: string | null
          contractor_decision_message?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          insurance_evidence_path?: string | null
          insurance_status?: string | null
          logo_path?: string | null
          main_area?: string | null
          phone?: string | null
          qualifications?: string | null
          references_text?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
          website?: string | null
          working_hours?: string | null
        }
        Update: {
          agreed_rules?: boolean
          approved_at?: string | null
          business_name?: string | null
          company_registration_number?: string | null
          confirmed_accurate?: boolean
          contact_name?: string | null
          contractor_decision_message?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          insurance_evidence_path?: string | null
          insurance_status?: string | null
          logo_path?: string | null
          main_area?: string | null
          phone?: string | null
          qualifications?: string | null
          references_text?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
          website?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      contractor_areas: {
        Row: {
          application_id: string
          area: string
          id: string
        }
        Insert: {
          application_id: string
          area: string
          id?: string
        }
        Update: {
          application_id?: string
          area?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_areas_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_documents: {
        Row: {
          application_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          original_name: string | null
          path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["document_kind"]
          original_name?: string | null
          path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          original_name?: string | null
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_gallery: {
        Row: {
          application_id: string
          created_at: string
          id: string
          path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_gallery_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_services: {
        Row: {
          application_id: string
          id: string
          service: string
        }
        Insert: {
          application_id: string
          id?: string
          service: string
        }
        Update: {
          application_id?: string
          id?: string
          service?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_services_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
      app_role: "admin" | "contractor"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "approved"
        | "rejected"
        | "suspended"
      document_kind: "logo" | "insurance" | "qualification" | "other"
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
      app_role: ["admin", "contractor"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "more_info_required",
        "approved",
        "rejected",
        "suspended",
      ],
      document_kind: ["logo", "insurance", "qualification", "other"],
    },
  },
} as const
