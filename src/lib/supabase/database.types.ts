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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      excursions: {
        Row: {
          allow_seat_selection: boolean
          boarding_locations: Json | null
          created_at: string
          departure_date: string
          highlight_text: string | null
          id: string
          price_per_seat: number
          return_date: string | null
          status: Database["public"]["Enums"]["excursion_status"]
          tour_package_id: string | null
          updated_at: string
          vehicle_layout_id: string | null
        }
        Insert: {
          allow_seat_selection?: boolean
          boarding_locations?: Json | null
          created_at?: string
          departure_date: string
          highlight_text?: string | null
          id?: string
          price_per_seat: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["excursion_status"]
          tour_package_id?: string | null
          updated_at?: string
          vehicle_layout_id?: string | null
        }
        Update: {
          allow_seat_selection?: boolean
          boarding_locations?: Json | null
          created_at?: string
          departure_date?: string
          highlight_text?: string | null
          id?: string
          price_per_seat?: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["excursion_status"]
          tour_package_id?: string | null
          updated_at?: string
          vehicle_layout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "excursions_tour_package_id_fkey"
            columns: ["tour_package_id"]
            isOneToOne: false
            referencedRelation: "tour_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excursions_vehicle_layout_id_fkey"
            columns: ["vehicle_layout_id"]
            isOneToOne: false
            referencedRelation: "vehicle_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          bank_account: string | null
          bank_account_holder: string | null
          bank_agency: string | null
          bank_cpf: string | null
          bank_name: string | null
          bank_transfer_instructions: string | null
          cancellation_policy_text: string | null
          company_name: string
          enable_email_marketing_sync: boolean
          enable_whatsapp_notifications: boolean
          hold_ttl_hours: number
          id: number
          logo_url: string | null
          pix_copy_paste: string | null
          pix_instructions: string | null
          pix_key: string | null
          pix_key_type: string | null
          pix_qr_code_url: string | null
          social_links: Json | null
          updated_at: string
          whatsapp_support_numbers: Json | null
        }
        Insert: {
          bank_account?: string | null
          bank_account_holder?: string | null
          bank_agency?: string | null
          bank_cpf?: string | null
          bank_name?: string | null
          bank_transfer_instructions?: string | null
          cancellation_policy_text?: string | null
          company_name?: string
          enable_email_marketing_sync?: boolean
          enable_whatsapp_notifications?: boolean
          hold_ttl_hours?: number
          id?: number
          logo_url?: string | null
          pix_copy_paste?: string | null
          pix_instructions?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_code_url?: string | null
          social_links?: Json | null
          updated_at?: string
          whatsapp_support_numbers?: Json | null
        }
        Update: {
          bank_account?: string | null
          bank_account_holder?: string | null
          bank_agency?: string | null
          bank_cpf?: string | null
          bank_name?: string | null
          bank_transfer_instructions?: string | null
          cancellation_policy_text?: string | null
          company_name?: string
          enable_email_marketing_sync?: boolean
          enable_whatsapp_notifications?: boolean
          hold_ttl_hours?: number
          id?: number
          logo_url?: string | null
          pix_copy_paste?: string | null
          pix_instructions?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_code_url?: string | null
          social_links?: Json | null
          updated_at?: string
          whatsapp_support_numbers?: Json | null
        }
        Relationships: []
      }
      passenger_tickets: {
        Row: {
          boarding_location_id: string | null
          check_in_status: boolean
          checked_in_at: string | null
          cpf: string
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          excursion_id: string
          full_name: string
          id: string
          orgao_emissor: string | null
          qr_code_token: string
          reservation_id: string
          rg: string | null
          seat_code: string
        }
        Insert: {
          boarding_location_id?: string | null
          check_in_status?: boolean
          checked_in_at?: string | null
          cpf: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          excursion_id: string
          full_name: string
          id?: string
          orgao_emissor?: string | null
          qr_code_token?: string
          reservation_id: string
          rg?: string | null
          seat_code: string
        }
        Update: {
          boarding_location_id?: string | null
          check_in_status?: boolean
          checked_in_at?: string | null
          cpf?: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          excursion_id?: string
          full_name?: string
          id?: string
          orgao_emissor?: string | null
          qr_code_token?: string
          reservation_id?: string
          rg?: string | null
          seat_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "passenger_tickets_excursion_id_fkey"
            columns: ["excursion_id"]
            isOneToOne: false
            referencedRelation: "excursions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_tickets_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_marketing: boolean
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email_confirmed_at: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          accepts_marketing?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email_confirmed_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          accepts_marketing?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email_confirmed_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          commission_percentage: number
          created_at: string
          id: string
          is_active: boolean
          profile_id: string
          referral_code: string
          total_earnings: number
        }
        Insert: {
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id: string
          referral_code: string
          total_earnings?: number
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          referral_code?: string
          total_earnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "promoters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          discount_applied: number
          excursion_id: string
          expires_at: string
          gateway_provider: string
          id: string
          notes: string | null
          payment_proof_url: string | null
          promoter_id: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_applied?: number
          excursion_id: string
          expires_at?: string
          gateway_provider?: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          promoter_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_applied?: number
          excursion_id?: string
          expires_at?: string
          gateway_provider?: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          promoter_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_excursion_id_fkey"
            columns: ["excursion_id"]
            isOneToOne: false
            referencedRelation: "excursions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_passengers: {
        Row: {
          birth_date: string | null
          cpf: string
          created_at: string
          full_name: string
          id: string
          orgao_emissor: string | null
          owner_id: string
          rg: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf: string
          created_at?: string
          full_name: string
          id?: string
          orgao_emissor?: string | null
          owner_id: string
          rg?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string
          created_at?: string
          full_name?: string
          id?: string
          orgao_emissor?: string | null
          owner_id?: string
          rg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_passengers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_packages: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          includes: Json | null
          is_active: boolean
          short_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          is_active?: boolean
          short_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          is_active?: boolean
          short_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_layouts: {
        Row: {
          amenities: Json | null
          capacity: number
          created_at: string
          grid_matrix: Json
          id: string
          name: string
        }
        Insert: {
          amenities?: Json | null
          capacity: number
          created_at?: string
          grid_matrix: Json
          id?: string
          name: string
        }
        Update: {
          amenities?: Json | null
          capacity?: number
          created_at?: string
          grid_matrix?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          excursion_id: string
          id: string
          notified: boolean
          requested_seats: number
          user_id: string
        }
        Insert: {
          created_at?: string
          excursion_id: string
          id?: string
          notified?: boolean
          requested_seats?: number
          user_id: string
        }
        Update: {
          created_at?: string
          excursion_id?: string
          id?: string
          notified?: boolean
          requested_seats?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_excursion_id_fkey"
            columns: ["excursion_id"]
            isOneToOne: false
            referencedRelation: "excursions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      driver_manifest_view: {
        Row: {
          boarding_location_id: string | null
          check_in_status: boolean | null
          checked_in_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          excursion_id: string | null
          full_name: string | null
          masked_cpf: string | null
          payment_status:
            | Database["public"]["Enums"]["reservation_status"]
            | null
          qr_code_token: string | null
          seat_code: string | null
          ticket_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_tickets_excursion_id_fkey"
            columns: ["excursion_id"]
            isOneToOne: false
            referencedRelation: "excursions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      expire_pending_reservations: { Args: never; Returns: undefined }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      excursion_status:
        | "DRAFT"
        | "PUBLISHED"
        | "SOLD_OUT"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
      reservation_status:
        | "PENDING_PIX"
        | "AWAITING_MANUAL_CHECK"
        | "APPROVED"
        | "REFUNDED"
        | "CANCELLED"
        | "EXPIRED"
      user_role: "ADMIN" | "AGENT" | "PROMOTER" | "DRIVER" | "CLIENT"
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
      excursion_status: [
        "DRAFT",
        "PUBLISHED",
        "SOLD_OUT",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ],
      reservation_status: [
        "PENDING_PIX",
        "AWAITING_MANUAL_CHECK",
        "APPROVED",
        "REFUNDED",
        "CANCELLED",
        "EXPIRED",
      ],
      user_role: ["ADMIN", "AGENT", "PROMOTER", "DRIVER", "CLIENT"],
    },
  },
} as const
