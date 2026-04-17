import { requireCoupleContext } from "@/lib/auth";
import { getPetState } from "@/lib/data/dashboard";

export default async function PetPage() {
  const context = await requireCoupleContext();
  const petState = await getPetState(context.membership.couple_id);

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">像素宠物状态</h1>

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
          </>
        ) : (
          <p className="text-sm text-muted">宠物状态还未初始化。</p>
        )}
      </section>
    </div>
  );
}

