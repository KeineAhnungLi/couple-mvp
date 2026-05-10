import { performPetAction } from "@/app/(app)/pet/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getPetInteractions, getPetState } from "@/lib/data/dashboard";

interface PetPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PetPage({ searchParams }: PetPageProps) {
  const context = await requireCoupleContext();
  const [petState, interactions, params] = await Promise.all([
    getPetState(context.membership.couple_id),
    getPetInteractions(context.membership.couple_id),
    searchParams,
  ]);

  const acted = typeof params.acted === "string" ? params.acted : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">像素宠物状态</h1>

        {acted ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">互动成功：{acted}</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        {petState ? (
          <>
            <div className="rounded-xl bg-brand-soft/60 p-4 text-center text-4xl">[PET]</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>等级：{petState.level}</p>
              <p>成长值：{petState.growth_points}</p>
              <p>心情：{petState.mood}</p>
              <p>健康：{petState.health}</p>
              <p>阶段：{petState.current_stage}</p>
              <p>
                更新：
                {new Date(petState.updated_at).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <form action={performPetAction}>
                <input type="hidden" name="actionType" value="feed" />
                <button type="submit" className="h-10 w-full rounded-xl border border-line text-sm font-semibold">
                  喂食
                </button>
              </form>
              <form action={performPetAction}>
                <input type="hidden" name="actionType" value="play" />
                <button type="submit" className="h-10 w-full rounded-xl border border-line text-sm font-semibold">
                  陪玩
                </button>
              </form>
              <form action={performPetAction}>
                <input type="hidden" name="actionType" value="heal" />
                <button type="submit" className="h-10 w-full rounded-xl border border-line text-sm font-semibold">
                  治疗
                </button>
              </form>
              <form action={performPetAction}>
                <input type="hidden" name="actionType" value="rest" />
                <button type="submit" className="h-10 w-full rounded-xl border border-line text-sm font-semibold">
                  休息
                </button>
              </form>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">宠物状态还未初始化。</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">最近互动</h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted">还没有互动记录。</p>
        ) : (
          <ul className="space-y-2">
            {interactions.map((item) => (
              <li key={item.id} className="rounded-xl bg-background px-3 py-2 text-xs">
                <p>
                  {item.action_type} · 成长 {item.growth_delta >= 0 ? "+" : ""}
                  {item.growth_delta} · 心情 {item.mood_delta >= 0 ? "+" : ""}
                  {item.mood_delta} · 健康 {item.health_delta >= 0 ? "+" : ""}
                  {item.health_delta}
                </p>
                <p className="mt-1 text-muted">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
