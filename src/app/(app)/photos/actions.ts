"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const uploadPhotoAction = async (formData: FormData) => {
  const context = await requireCoupleContext();

  const photo = formData.get("photo");
  const caption = String(formData.get("caption") ?? "").trim();

  if (!(photo instanceof File) || photo.size === 0) {
    redirect("/photos?error=请选择照片");
  }

  const extension = photo.name.split(".").pop() ?? "jpg";
  const objectPath = `${context.membership.couple_id}/${context.userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const supabase = await createServerSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from("couple-photos")
    .upload(objectPath, photo, {
      upsert: false,
      contentType: photo.type || "image/jpeg",
    });

  if (uploadError) {
    redirect(`/photos?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: insertError } = await supabase.from("photos").insert({
    couple_id: context.membership.couple_id,
    uploaded_by: context.userId,
    image_url: objectPath,
    caption: caption || null,
    taken_at: new Date().toISOString(),
  });

  if (insertError) {
    redirect(`/photos?error=${encodeURIComponent(insertError.message)}`);
  }

  redirect("/photos?uploaded=1");
};

