"use server";

import { redirect } from "next/navigation";
import { destroyCurrentSession } from "@/lib/server/session";

export const signOutAction = async () => {
  await destroyCurrentSession();
  redirect("/login");
};
