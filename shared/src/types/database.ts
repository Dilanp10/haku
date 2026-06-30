/**
 * Tipos de la base de datos de Supabase. Manualmente sincronizados con
 * `supabase/migrations/*.sql`. Regenerar con:
 *   supabase gen types typescript --local > shared/src/types/database.ts
 * cuando el esquema cambie en un entorno con Supabase corriendo.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type UserRole = "visitor" | "editor" | "admin";
type ContentStatusEnum = "draft" | "published" | "archived";
type PriceRangeEnum = "$" | "$$" | "$$$";
type EventStatusEnum = "pending" | "published" | "rejected";
type EventSourceType = "html" | "ical" | "api";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: { id: string; slug: string; name: string; icon: string | null };
        Insert: { id?: string; slug: string; name: string; icon?: string | null };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      food_types: {
        Row: { id: string; slug: string; name: string };
        Insert: { id?: string; slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["food_types"]["Insert"]>;
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          category_id: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          website: string | null;
          instagram: string | null;
          price_range: PriceRangeEnum | null;
          cover_image_url: string | null;
          status: ContentStatusEnum;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          category_id: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          website?: string | null;
          instagram?: string | null;
          price_range?: PriceRangeEnum | null;
          cover_image_url?: string | null;
          status?: ContentStatusEnum;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["venues"]["Insert"]>;
        Relationships: [];
      };
      venue_food_types: {
        Row: { venue_id: string; food_type_id: string };
        Insert: { venue_id: string; food_type_id: string };
        Update: Partial<Database["public"]["Tables"]["venue_food_types"]["Insert"]>;
        Relationships: [];
      };
      venue_saves: {
        Row: { user_id: string; venue_id: string; created_at: string };
        Insert: { user_id: string; venue_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["venue_saves"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "venue_saves_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_hours: {
        Row: {
          id: string;
          venue_id: string;
          day_of_week: number;
          opens_at: string;
          closes_at: string;
          closed: boolean;
        };
        Insert: {
          id?: string;
          venue_id: string;
          day_of_week: number;
          opens_at: string;
          closes_at: string;
          closed?: boolean;
        };
        Update: { opens_at?: string; closes_at?: string; closed?: boolean };
        Relationships: [
          {
            foreignKeyName: "venue_hours_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_ratings: {
        Row: {
          user_id: string;
          venue_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          venue_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: { user_id?: string; venue_id?: string; rating?: number; updated_at?: string };
        Relationships: [
          {
            foreignKeyName: "venue_ratings_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      event_sources: {
        Row: {
          id: string;
          key: string;
          name: string;
          url: string;
          type: EventSourceType;
          config: Json;
          active: boolean;
          last_run_at: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          url: string;
          type?: EventSourceType;
          config?: Json;
          active?: boolean;
          last_run_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["event_sources"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          source_key: string;
          external_id: string | null;
          slug: string;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string | null;
          venue_name: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          url: string | null;
          image_url: string | null;
          category: string | null;
          status: EventStatusEnum;
          dedupe_hash: string;
          raw: Json | null;
          ingested_at: string;
        };
        Insert: {
          id?: string;
          source_key: string;
          external_id?: string | null;
          slug: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          venue_name?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          url?: string | null;
          image_url?: string | null;
          category?: string | null;
          status?: EventStatusEnum;
          dedupe_hash: string;
          raw?: Json | null;
          ingested_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      venue_rating_stats: {
        Row: { venue_id: string; average_rating: number | null; rating_count: number };
        Relationships: [];
      };
    };
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatusEnum;
      price_range: PriceRangeEnum;
      event_status: EventStatusEnum;
      event_source_type: EventSourceType;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
