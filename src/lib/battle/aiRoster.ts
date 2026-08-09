export type AiOpponent = {
  level: number;
  name: string;
  nameEn: string;
  title: string;
  emoji: string;
};

export const AI_ROSTER: AiOpponent[] = [
  { level: 1, name: "阿弟", nameEn: "Ah-Dī", title: "Kitchen Rookie", emoji: "🧑‍🍳" },
  { level: 2, name: "阿花", nameEn: "Ah-Hue", title: "Night Market Cook", emoji: "🥢" },
  { level: 3, name: "阿龍", nameEn: "Ah-Liông", title: "Line Chef", emoji: "🔪" },
  { level: 4, name: "阿明", nameEn: "Ah-Bîng", title: "Sous Chef", emoji: "🍳" },
  { level: 5, name: "阿義", nameEn: "Ah-Gī", title: "Head Chef", emoji: "👨‍🍳" },
  { level: 6, name: "阿嬤", nameEn: "Ah-Má", title: "Banquet Grandma", emoji: "👵" },
  { level: 7, name: "總鋪師", nameEn: "Tsóng-Phòo-Sai", title: "The Master Chef", emoji: "🏆" },
];

export function getAiOpponent(level: number): AiOpponent | null {
  return AI_ROSTER.find((o) => o.level === level) ?? null;
}
