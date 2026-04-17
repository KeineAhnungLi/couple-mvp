"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const generateInviteCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

export const createCoupleAction = async (formData: FormData) => {
  const context = await requireAuth();

  if (context.membership) {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/onboarding?error=请输入空间名称");
  }

  const supabase = await createServerSupabaseClient();
  let insertErrorMessage = "创建空间失败";
  let createdCoupleId: string | null = null;
  let inviteCode = "";

  for (let i = 0; i < 4; i += 1) {
    inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from("couples")
      .insert({
        name,
        invite_code: inviteCode,
        created_by: context.userId,
        status: "open",
      })
      .select("id")
      .single();

    if (!error) {
      createdCoupleId = data.id;
      break;
    }

    insertErrorMessage = error.message;
  }

  if (!createdCoupleId) {
    redirect(`/onboarding?error=${encodeURIComponent(insertErrorMessage)}`);
  }

  const { error: memberError } = await supabase.from("couple_members").insert({
    couple_id: createdCoupleId,
    user_id: context.userId,
    role: "owner",
  });

  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`);
  }

  redirect(`/onboarding?invite=${inviteCode}`);
};

const internalJoinByCode = async (inviteCode: string) => {
  const context = await requireAuth();

  if (context.membership) {
    redirect("/");
  }

  if (!inviteCode) {
    redirect("/onboarding?error=邀请码不能为空");
  }

  const supabase = await createServerSupabaseClient();

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("id, status")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (coupleError || !couple) {
    redirect("/onboarding?error=邀请码不存在");
  }

  if (couple.status !== "open") {
    redirect("/onboarding?error=该空间已满员或不可加入");
  }

  const { count } = await supabase
    .from("couple_members")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", couple.id);

  if ((count ?? 0) >= 2) {
    await supabase
      .from("couples")
      .update({ status: "full" })
      .eq("id", couple.id);

    redirect("/onboarding?error=该空间已满员");
  }

  const { error: joinError } = await supabase.from("couple_members").insert({
    couple_id: couple.id,
    user_id: context.userId,
    role: "partner",
  });

  if (joinError) {
    redirect(`/onboarding?error=${encodeURIComponent(joinError.message)}`);
  }

  await supabase.from("couples").update({ status: "full" }).eq("id", couple.id);

  redirect("/");
};

export const joinCoupleAction = async (formData: FormData) => {
  const code = String(formData.get("inviteCode") ?? "")
    .trim()
    .toUpperCase();

  await internalJoinByCode(code);
};

export const joinCoupleByCodeAction = async (inviteCode: string) => {
  await internalJoinByCode(inviteCode.trim().toUpperCase());
};

