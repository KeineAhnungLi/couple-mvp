"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const signOutAction = async () => {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
};

