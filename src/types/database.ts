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
      users: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          status: "open" | "full" | "archived";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          status?: "open" | "full" | "archived";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          status?: "open" | "full" | "archived";
          created_by?: string;
          created_at?: string;
        };
      };
      couple_members: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          role: "owner" | "partner";
          joined_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          role?: "owner" | "partner";
          joined_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string;
          role?: "owner" | "partner";
          joined_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          couple_id: string;
          uploaded_by: string;
          image_url: string;
          caption: string | null;
          taken_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          uploaded_by: string;
          image_url: string;
          caption?: string | null;
          taken_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          uploaded_by?: string;
          image_url?: string;
          caption?: string | null;
          taken_at?: string | null;
          created_at?: string;
        };
      };
      diary_prompts: {
        Row: {
          id: number;
          prompt_text: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          prompt_text: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          prompt_text?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      diary_entries: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          prompt_id: number | null;
          entry_date: string;
          content: string;
          visibility: "couple";
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          prompt_id?: number | null;
          entry_date: string;
          content: string;
          visibility?: "couple";
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          prompt_id?: number | null;
          entry_date?: string;
          content?: string;
          visibility?: "couple";
          created_at?: string;
        };
      };
      pet_state: {
        Row: {
          id: string;
          couple_id: string;
          level: number;
          growth_points: number;
          mood: number;
          health: number;
          last_interaction_date: string | null;
          current_stage: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          level?: number;
          growth_points?: number;
          mood?: number;
          health?: number;
          last_interaction_date?: string | null;
          current_stage?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          level?: number;
          growth_points?: number;
          mood?: number;
          health?: number;
          last_interaction_date?: string | null;
          current_stage?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      is_couple_member: {
        Args: {
          target_couple_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      couple_status: "open" | "full" | "archived";
      couple_member_role: "owner" | "partner";
      diary_visibility: "couple";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

