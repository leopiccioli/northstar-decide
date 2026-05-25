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
      country_stats_cache: {
        Row: {
          avg_value: number | null
          count: number
          country: string
          dimension: string
          period: string
          updated_at: string
        }
        Insert: {
          avg_value?: number | null
          count?: number
          country: string
          dimension: string
          period: string
          updated_at?: string
        }
        Update: {
          avg_value?: number | null
          count?: number
          country?: string
          dimension?: string
          period?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          link_url: string | null
          raw_payload: Json
          resend_email_id: string
          to_email: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          raw_payload: Json
          resend_email_id: string
          to_email?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          raw_payload?: Json
          resend_email_id?: string
          to_email?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      outbound_emails: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          provider_id: string | null
          record_id: string | null
          reminder_attempt: number
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          record_id?: string | null
          reminder_attempt?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          record_id?: string | null
          reminder_attempt?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_emails_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      records_3d: {
        Row: {
          comment: string | null
          comparison: Json | null
          context: string | null
          country: string | null
          country_raw: string | null
          created_at: string | null
          desarrollo: number
          dinero: number
          diversion: number
          email: string
          email_sent: boolean | null
          fbclid: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          option_name: string
          referrer: string | null
          reminder_date: string | null
          reminder_period: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          comment?: string | null
          comparison?: Json | null
          context?: string | null
          country?: string | null
          country_raw?: string | null
          created_at?: string | null
          desarrollo: number
          dinero: number
          diversion: number
          email: string
          email_sent?: boolean | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          option_name: string
          referrer?: string | null
          reminder_date?: string | null
          reminder_period?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          comment?: string | null
          comparison?: Json | null
          context?: string | null
          country?: string | null
          country_raw?: string | null
          created_at?: string | null
          desarrollo?: number
          dinero?: number
          diversion?: number
          email?: string
          email_sent?: boolean | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          option_name?: string
          referrer?: string | null
          reminder_date?: string | null
          reminder_period?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_pending_legacy_notifications: { Args: never; Returns: number }
      get_pending_legacy_notifications: {
        Args: { batch_limit?: number }
        Returns: {
          created_at: string
          desarrollo: number
          dinero: number
          diversion: number
          email: string
          record_count: number
        }[]
      }
      get_public_comments: {
        Args: never
        Returns: {
          comment: string
          created_at: string
          desarrollo: number
          dinero: number
          diversion: number
          id: string
        }[]
      }
      get_public_result: {
        Args: { result_id: string }
        Returns: {
          comment: string
          comparison: Json
          desarrollo: number
          dinero: number
          diversion: number
          option_name: string
        }[]
      }
      normalize_country: { Args: { input: string }; Returns: string }
      refresh_country_stats: { Args: never; Returns: undefined }
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
    Enums: {},
  },
} as const
