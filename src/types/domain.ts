import type { Database } from "@/types/database";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type Couple = Database["public"]["Tables"]["couples"]["Row"];
export type CoupleMember = Database["public"]["Tables"]["couple_members"]["Row"];
export type Photo = Database["public"]["Tables"]["photos"]["Row"];
export type DiaryPrompt = Database["public"]["Tables"]["diary_prompts"]["Row"];
export type DiaryEntry = Database["public"]["Tables"]["diary_entries"]["Row"];
export type PetState = Database["public"]["Tables"]["pet_state"]["Row"];

export interface ViewerContext {
  userId: string;
  email: string | null;
  profile: UserProfile | null;
  membership: CoupleMember | null;
  couple: Couple | null;
}

export interface PhotoWithMeta extends Photo {
  uploader_name: string;
  signed_url: string | null;
}

export interface DiaryEntryWithMeta extends DiaryEntry {
  author_name: string;
  prompt_text: string | null;
}

