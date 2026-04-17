import { redirect } from "next/navigation";
import { dbQueryOne } from "@/lib/server/db";
import { getCurrentSession } from "@/lib/server/session";
import type { Couple, CoupleMember, ViewerContext } from "@/types/domain";

interface MembershipRow {
  id: string;
  couple_id: string;
  user_id: string;
  role: "owner" | "partner";
  joined_at: string;
}

interface CoupleRow {
  id: string;
  name: string;
  invite_code: string;
  status: "open" | "full" | "archived";
  created_by: string;
  created_at: string;
}

export const getCurrentUser = async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
};

export const getViewerContext = async (): Promise<ViewerContext | null> => {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const membership = await dbQueryOne<MembershipRow>(
    `
    select id, couple_id, user_id, role, joined_at
    from couple_members
    where user_id = $1
    `,
    [session.userId],
  );

  let couple: CoupleRow | null = null;

  if (membership) {
    couple = await dbQueryOne<CoupleRow>(
      `
      select id, name, invite_code, status, created_by, created_at
      from couples
      where id = $1
      `,
      [membership.couple_id],
    );
  }

  return {
    userId: session.userId,
    email: session.user.email,
    profile: session.user,
    membership: (membership as CoupleMember | null) ?? null,
    couple: (couple as Couple | null) ?? null,
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

export const requireCoupleMember = async (coupleId: string): Promise<void> => {
  const context = await requireAuth();

  if (!context.membership || context.membership.couple_id !== coupleId) {
    redirect("/onboarding");
  }
};
