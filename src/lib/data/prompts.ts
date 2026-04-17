import { dbQuery } from "@/lib/server/db";

const FALLBACK_PROMPTS = [
  "今天最让你开心的一件小事是什么？",
  "如果给今天取一个电影名，你会叫它什么？",
  "今天你最想对我说的一句话是什么？",
  "我们下次约会最想尝试什么？",
  "今天你最感谢我的一件事是什么？",
];

export interface TodayPrompt {
  id: number | null;
  promptText: string;
}

interface PromptRow {
  id: number;
  prompt_text: string;
}

export const getTodayPrompt = async (): Promise<TodayPrompt> => {
  const prompts = await dbQuery<PromptRow>(
    `
    select id, prompt_text
    from diary_prompts
    where is_active = true
    order by id asc
    `,
  );

  const source = prompts.length > 0 ? prompts.map((item) => item.prompt_text) : FALLBACK_PROMPTS;
  const index = new Date().getDate() % source.length;

  if (prompts.length > 0) {
    return {
      id: prompts[index].id,
      promptText: prompts[index].prompt_text,
    };
  }

  return {
    id: null,
    promptText: source[index],
  };
};
