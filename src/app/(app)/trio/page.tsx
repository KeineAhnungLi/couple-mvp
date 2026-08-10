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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          情侣双人 · 规则 Bot
        </p>
        <h1 className="mt-1 text-xl font-bold">Trio 卡牌游戏</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          你和另一半会自动进入同一个房间，并与一位遵守公开信息规则的 Bot 组成三人牌局。
        </p>
      </section>
      <TrioGame identityToken={token} viewerName={name} />
    </div>
  );
}
