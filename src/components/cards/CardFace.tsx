import type { Card, BattleCard } from "@/lib/cards";
import { describeEffect } from "@/lib/cards";

type FaceCard = Card | BattleCard;
type FaceTheme = "dark" | "light";

function getHp(card: FaceCard): { current: number; max: number } {
  if ("currentHp" in card) {
    return { current: card.currentHp, max: card.maxHp };
  }
  return { current: card.hp, max: card.hp };
}

function getAttachedEnergy(card: FaceCard): number | null {
  return "attachedEnergy" in card ? card.attachedEnergy : null;
}

const THEME = {
  dark: {
    outer: "border-white/10 bg-white/5",
    placeholder: "bg-black/30",
    title: "text-white",
    divider: "border-white/10",
    abilityName: "text-amber-300",
    abilityMeta: "text-stone-400",
    abilityDesc: "text-stone-500",
    body: "text-stone-400",
  },
  light: {
    outer: "border-amber-200 bg-white shadow-sm",
    placeholder: "bg-amber-100",
    title: "text-stone-900",
    divider: "border-amber-200",
    abilityName: "text-amber-700",
    abilityMeta: "text-stone-600",
    abilityDesc: "text-stone-500",
    body: "text-stone-600",
  },
} as const;

export function CardFace({
  card,
  size = "full",
  theme = "dark",
}: {
  card: FaceCard;
  size?: "full" | "compact";
  theme?: FaceTheme;
}) {
  const image = card.imageUrls[0];
  const attachedEnergy = getAttachedEnergy(card);
  const t = THEME[theme];

  return (
    <div className={`overflow-hidden rounded-xl border ${t.outer}`}>
      <div className="relative">
        {image ? (
          <img src={image} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div
            className={`flex h-32 w-full items-center justify-center text-3xl ${t.placeholder}`}
          >
            🥟
          </div>
        )}

        {card.cardType && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-stone-200">
            {card.cardType}
          </span>
        )}

        {card.role === "ENERGY" && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-600/90 px-2 py-0.5 text-xs font-bold text-white">
            +{card.energyAmount}⚡
          </span>
        )}

        {card.role === "ATTACKER" &&
          (() => {
            const { current, max } = getHp(card);
            return (
              <div className="absolute bottom-2 left-2 flex gap-1">
                <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-bold text-white">
                  ♥ {current}/{max}
                </span>
                {attachedEnergy !== null && attachedEnergy > 0 && (
                  <span className="rounded-full bg-amber-600/90 px-2 py-0.5 text-xs font-bold text-white">
                    ⚡ {attachedEnergy}
                  </span>
                )}
              </div>
            );
          })()}
      </div>

      <div className="p-3">
        <h3 className={`text-sm font-semibold ${t.title}`}>{card.title}</h3>

        {size === "full" && (
          <div className={`mt-2 border-t pt-2 ${t.divider}`}>
            {card.role === "ATTACKER" && card.abilities.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {card.abilities.map((ability, i) => (
                  <li key={i} className="text-xs">
                    <span className={`font-semibold ${t.abilityName}`}>
                      ⚔ {ability.name}
                    </span>{" "}
                    <span className={t.abilityMeta}>
                      ({ability.energyCost ?? 0}⚡): {ability.damage ?? 0} dmg
                    </span>
                    {ability.description && (
                      <span className={`block ${t.abilityDesc}`}>
                        {ability.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {card.role === "SUPPORT" && card.abilities.length > 0 && (
              <div className="mb-2 text-xs">
                <span className={`font-semibold ${t.abilityName}`}>
                  🎴 {card.abilities[0].name}
                </span>
                <p className={t.abilityMeta}>
                  {describeEffect(card.abilities[0])}
                </p>
              </div>
            )}

            {card.body && <p className={`text-xs ${t.body}`}>{card.body}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
