export type CoupleStatus = "open" | "full" | "archived";
export type CoupleMemberRole = "owner" | "partner";
export type DiaryVisibility = "couple";

export interface UserProfile {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Couple {
  id: string;
  name: string;
  invite_code: string;
  status: CoupleStatus;
  created_by: string;
  created_at: string;
}

export interface CoupleMember {
  id: string;
  couple_id: string;
  user_id: string;
  role: CoupleMemberRole;
  joined_at: string;
}

export interface Photo {
  id: string;
  couple_id: string;
  uploaded_by: string;
  object_key: string;
  image_url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
}

export interface DiaryPrompt {
  id: number;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  couple_id: string;
  author_id: string;
  prompt_id: number | null;
  entry_date: string;
  content: string;
  visibility: DiaryVisibility;
  created_at: string;
}

export interface PetState {
  id: string;
  couple_id: string;
  level: number;
  growth_points: number;
  mood: number;
  health: number;
  last_interaction_date: string | null;
  current_stage: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface ViewerContext {
  userId: string;
  email: string;
  profile: SessionUser;
  membership: CoupleMember | null;
  couple: Couple | null;
}

export interface PhotoWithMeta extends Photo {
  uploader_name: string;
}

export interface DiaryEntryWithMeta extends DiaryEntry {
  author_name: string;
  prompt_text: string | null;
}
