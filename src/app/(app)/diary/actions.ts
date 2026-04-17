"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const createDiaryEntryAction = async (formData: FormData) => {
  const context = await requireCoupleContext();

  const content = String(formData.get("content") ?? "").trim();
  const promptIdRaw = String(formData.get("promptId") ?? "").trim();
  const promptId = promptIdRaw ? Number(promptIdRaw) : null;

  if (!content) {
    redirect("/diary?error=内容不能为空");
  }

  const entryDate = new Date().toISOString().slice(0, 10);

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("diary_entries").insert({
    couple_id: context.membership.couple_id,
    author_id: context.userId,
    prompt_id: Number.isFinite(promptId) ? promptId : null,
    entry_date: entryDate,
    content,
    visibility: "couple",
  });

  if (error) {
    redirect(`/diary?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/diary?saved=1");
};

