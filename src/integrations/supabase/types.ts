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
      application_info_request_items: {
        Row: {
          application_id: string
          created_at: string
          id: string
          item_key: string
          item_type: string
          request_id: string
          snapshot: Json
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          item_key: string
          item_type: string
          request_id: string
          snapshot?: Json
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          item_key?: string
          item_type?: string
          request_id?: string
          snapshot?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_info_request_items_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_info_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "application_info_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      application_info_requests: {
        Row: {
          application_id: string
          closed_at: string | null
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
          resubmitted_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          closed_at?: string | null
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
          resubmitted_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          closed_at?: string | null
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
          resubmitted_at?: string | null
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
          insurance_expiry_date: string | null
          insurance_policy_type: string | null
          insurance_provider: string | null
          insurance_status: string | null
          insurance_verification_state: string
          insurance_verified_at: string | null
          insurance_verified_by: string | null
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
          insurance_expiry_date?: string | null
          insurance_policy_type?: string | null
          insurance_provider?: string | null
          insurance_status?: string | null
          insurance_verification_state?: string
          insurance_verified_at?: string | null
          insurance_verified_by?: string | null
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
          insurance_expiry_date?: string | null
          insurance_policy_type?: string | null
          insurance_provider?: string | null
          insurance_status?: string | null
          insurance_verification_state?: string
          insurance_verified_at?: string | null
          insurance_verified_by?: string | null
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
          info_request_id: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          original_name: string | null
          path: string
          replaced_at: string | null
          replaced_by_document_id: string | null
          verification_state: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          info_request_id?: string | null
          is_active?: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          original_name?: string | null
          path: string
          replaced_at?: string | null
          replaced_by_document_id?: string | null
          verification_state?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          info_request_id?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          original_name?: string | null
          path?: string
          replaced_at?: string | null
          replaced_by_document_id?: string | null
          verification_state?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_documents_info_request_id_fkey"
            columns: ["info_request_id"]
            isOneToOne: false
            referencedRelation: "application_info_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_documents_replaced_by_document_id_fkey"
            columns: ["replaced_by_document_id"]
            isOneToOne: false
            referencedRelation: "contractor_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_gallery: {
        Row: {
          application_id: string
          created_at: string
          id: string
          is_public: boolean
          path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
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
      contractor_profiles: {
        Row: {
          application_id: string
          approval_date: string | null
          areas: string[]
          business_name: string | null
          created_at: string
          email: string | null
          email_public: boolean
          facebook: string | null
          featured_photo_id: string | null
          id: string
          insurance_expiry_date: string | null
          insurance_status: string | null
          logo_path: string | null
          main_area: string | null
          phone: string | null
          phone_public: boolean
          public_description: string | null
          qualifications: string | null
          services: string[]
          slug: string
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          application_id: string
          approval_date?: string | null
          areas?: string[]
          business_name?: string | null
          created_at?: string
          email?: string | null
          email_public?: boolean
          facebook?: string | null
          featured_photo_id?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_status?: string | null
          logo_path?: string | null
          main_area?: string | null
          phone?: string | null
          phone_public?: boolean
          public_description?: string | null
          qualifications?: string | null
          services?: string[]
          slug: string
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          application_id?: string
          approval_date?: string | null
          areas?: string[]
          business_name?: string | null
          created_at?: string
          email?: string | null
          email_public?: boolean
          facebook?: string | null
          featured_photo_id?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_status?: string | null
          logo_path?: string | null
          main_area?: string | null
          phone?: string | null
          phone_public?: boolean
          public_description?: string | null
          qualifications?: string | null
          services?: string[]
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_profiles_featured_photo_id_fkey"
            columns: ["featured_photo_id"]
            isOneToOne: false
            referencedRelation: "contractor_gallery"
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
      contractor_status_events: {
        Row: {
          action: string
          admin_id: string
          application_id: string
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
          profile_id: string | null
          public_message: string | null
          reason: string
          updated_at: string
        }
        Insert: {
          action: string
          admin_id: string
          application_id: string
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
          profile_id?: string | null
          public_message?: string | null
          reason: string
          updated_at?: string
        }
        Update: {
          action?: string
          admin_id?: string
          application_id?: string
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          profile_id?: string | null
          public_message?: string | null
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_status_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_status_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          application_id: string | null
          audience: string
          created_at: string
          dedupe_key: string | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          application_id?: string | null
          audience?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          read_at?: string | null
          recipient_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          application_id?: string | null
          audience?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_application_id_fkey"
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
      activate_contractor_profile: {
        Args: { _application_id: string }
        Returns: string
      }
      app_display_name: {
        Args: {
          _app: Database["public"]["Tables"]["contractor_applications"]["Row"]
        }
        Returns: string
      }
      generate_contractor_slug: { Args: { _name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          _action_url: string
          _application: string
          _dedupe?: string
          _message: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          _action_url: string
          _application: string
          _audience: string
          _dedupe?: string
          _message: string
          _recipient: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      restore_contractor: {
        Args: {
          _admin_note?: string
          _application_id: string
          _contractor_message?: string
          _reason: string
        }
        Returns: string
      }
      suspend_contractor: {
        Args: {
          _admin_note?: string
          _application_id: string
          _contractor_message: string
          _reason: string
        }
        Returns: string
      }
      sync_insurance_notifications: { Args: never; Returns: undefined }
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
