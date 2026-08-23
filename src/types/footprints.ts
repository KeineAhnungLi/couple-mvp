export type FootprintMood =
  | "开心"
  | "平静"
  | "感动"
  | "有点累"
  | "满足"
  | "惊喜";

export interface FootprintPhoto {
  id: string;
  image_url: string;
  object_key: string;
  sort_order: number;
  taken_at: string | null;
}

export interface FootprintEntry {
  id: string;
  user_id: string;
  trip_id: string | null;
  captured_at: string;
  latitude: number | null;
  longitude: number | null;
  country: string;
  province: string | null;
  city: string | null;
  district: string | null;
  place_name: string | null;
  mood: string | null;
  note: string | null;
  tags: string[];
  is_special: boolean;
  created_at: string;
  photos: FootprintPhoto[];
}

export interface FootprintTrip {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  province: string | null;
  city: string | null;
  overall_mood: string | null;
  note: string | null;
}

export interface FootprintMonthSummary {
  cityCount: number;
  entryCount: number;
  topMood: string | null;
}

export interface FootprintYearSummary {
  cityCount: number;
  entryCount: number;
  photoCount: number;
  topMood: string | null;
}
