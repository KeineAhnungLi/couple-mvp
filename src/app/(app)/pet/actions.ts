"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { withTransaction } from "@/lib/server/db";

type PetActionType = "feed" | "play" | "heal" | "rest";

interface PetActionDelta {
  growth: number;
  mood: number;
  health: number;
}

interface PetStateRow {
  id: string;
  level: number;
  growth_points: number;
  mood: number;
  health: number;
}

const PET_ACTION_DELTAS: Record<PetActionType, PetActionDelta> = {
  feed: { growth: 8, mood: 5, health: 3 },
  play: { growth: 10, mood: 8, health: -2 },
  heal: { growth: 4, mood: 0, health: 12 },
  rest: { growth: 6, mood: 3, health: 6 },
};

const clampPercent = (value: number): number => {
  return Math.max(0, Math.min(100, value));
};

const stageByLevel = (level: number): string => {
  if (level <= 3) {
    return "egg";
  }
  if (level <= 6) {
    return "baby";
  }
  if (level <= 12) {
    return "teen";
  }
  return "adult";
};

const gainLevel = (level: number, growthPoints: number): { level: number; growthPoints: number } => {
  let nextLevel = level;
  let nextGrowth = growthPoints;

  while (nextGrowth >= nextLevel * 100) {
    nextGrowth -= nextLevel * 100;
    nextLevel += 1;
  }

  return {
    level: nextLevel,
    growthPoints: nextGrowth,
  };
};

const isPetActionType = (value: string): value is PetActionType => {
  return value === "feed" || value === "play" || value === "heal" || value === "rest";
};

const redirectWithError = (message: string): never => {
  redirect(`/pet?error=${encodeURIComponent(message)}`);
};

export const performPetAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const actionRaw = String(formData.get("actionType") ?? "").trim();

  if (!isPetActionType(actionRaw)) {
    return redirectWithError("未知的宠物互动动作");
  }

  const delta = PET_ACTION_DELTAS[actionRaw];

  try {
    await withTransaction(async (client) => {
      const stateResult = await client.query<PetStateRow>(
        `
        select id, level, growth_points, mood, health
        from pet_state
        where couple_id = $1
        for update
        `,
        [context.membership.couple_id],
      );

      const state = stateResult.rows[0];

      if (!state) {
        throw new Error("宠物状态不存在");
      }

      const growthGained = Math.max(0, state.growth_points + delta.growth);
      const leveled = gainLevel(state.level, growthGained);
      const nextMood = clampPercent(state.mood + delta.mood);
      const nextHealth = clampPercent(state.health + delta.health);

      await client.query(
        `
        update pet_state
        set level = $2,
            growth_points = $3,
            mood = $4,
            health = $5,
            current_stage = $6,
            last_interaction_date = current_date
        where couple_id = $1
        `,
        [
          context.membership.couple_id,
          leveled.level,
          leveled.growthPoints,
          nextMood,
          nextHealth,
          stageByLevel(leveled.level),
        ],
      );

      await client.query(
        `
        insert into pet_interactions (couple_id, user_id, action_type, growth_delta, mood_delta, health_delta)
        values ($1, $2, $3, $4, $5, $6)
        `,
        [
          context.membership.couple_id,
          context.userId,
          actionRaw,
          delta.growth,
          delta.mood,
          delta.health,
        ],
      );
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "宠物互动失败";

    return redirectWithError(message);
  }

  redirect(`/pet?acted=${encodeURIComponent(actionRaw)}`);
};

