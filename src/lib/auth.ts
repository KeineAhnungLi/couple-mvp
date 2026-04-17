import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Couple,
  CoupleMember,
  UserProfile,
  ViewerContext,
} from "@/types/domain";

export const getViewerContext = async (): Promise<ViewerContext | null> => {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("couple_members")
    .select("id, couple_id, user_id, role, joined_at")
    .eq("user_id", user.id)
    .maybeSingle();

  let couple: Couple | null = null;

  if (membership) {
    const { data: coupleData } = await supabase
      .from("couples")
      .select("id, name, invite_code, status, created_by, created_at")
      .eq("id", membership.couple_id)
      .maybeSingle();

    couple = coupleData;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as UserProfile | null) ?? null,
    membership: (membership as CoupleMember | null) ?? null,
    couple,
  };
};

export const requireAuth = async (): Promise<ViewerContext> => {
  const context = await getViewerContext();
  if (!context) {
    redirect("/login");
  }

  return context;
};

export const requireCoupleContext = async (): Promise<
  ViewerContext & { membership: CoupleMember; couple: Couple }
> => {
  const context = await requireAuth();

  if (!context.membership || !context.couple) {
    redirect("/onboarding");
  }

  return {
    ...context,
    membership: context.membership,
    couple: context.couple,
  };
};

