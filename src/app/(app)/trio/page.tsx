import { TrioGame } from "@/components/trio-game";
import { requireCoupleContext } from "@/lib/auth";
import { createTrioIdentityToken } from "@/lib/server/trio-token";

export default async function TrioPage() {
  const context = await requireCoupleContext();
  const name =
    context.profile.display_name?.trim() ||
    context.profile.email.split("@")[0] ||
    "玩家";
  const token = createTrioIdentityToken({
    userId: context.userId,
    coupleId: context.membership.couple_id,
    name,
  });

  return <TrioGame identityToken={token} viewerName={name} />;
}
