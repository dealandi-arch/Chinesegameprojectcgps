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
  const compact = size === "compact";

  // Compact cards (bench/hand thumbnails) get a much shorter image than
  // full cards -- the image height used to be fixed at h-32 regardless of
  // size, which meant it got clipped/covered inside the narrow w-16/w-20
  // slots used for compact cards. Badges shrink to match so they don't
  // cover most of a small image.
  const imageHeight = compact ? "h-16" : "h-32";
  const badgeText = compact
    ? "px-1 py-px text-[9px]"
    : "px-2 py-0.5 text-xs";

  return (
    <div className={`overflow-hidden rounded-xl border ${t.outer}`}>
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt=""
            className={`w-full object-cover ${imageHeight}`}
          />
        ) : (
          <div
            className={`flex w-full items-center justify-center text-3xl ${imageHeight} ${t.placeholder}`}
          >
            🥟
          </div>
        )}

        {card.cardType && (
          <span
            className={`absolute right-1 top-1 max-w-[70%] truncate rounded-full bg-black/70 font-semibold text-stone-200 ${badgeText}`}
          >
            {card.cardType}
          </span>
        )}

        {card.role === "ENERGY" && (
          <span
            className={`absolute left-1 top-1 rounded-full bg-amber-600/90 font-bold text-white ${badgeText}`}
          >
            +{card.energyAmount}⚡
          </span>
        )}

        {card.role === "ATTACKER" &&
          (() => {
            const { current, max } = getHp(card);
            return (
              <div className="absolute bottom-1 left-1 flex gap-1">
                <span
                  className={`rounded-full bg-emerald-600/90 font-bold text-white ${badgeText}`}
                >
                  ♥ {current}/{max}
                </span>
                {!compact && attachedEnergy !== null && attachedEnergy > 0 && (
                  <span
                    className={`rounded-full bg-amber-600/90 font-bold text-white ${badgeText}`}
                  >
                    ⚡ {attachedEnergy}
                  </span>
                )}
              </div>
            );
          })()}
      </div>

      <div className={compact ? "p-1.5" : "p-3"}>
        <h3
          className={`truncate font-semibold ${compact ? "text-[11px]" : "text-sm"} ${t.title}`}
        >
          {card.title}
        </h3>

        {!compact && (
          <div className={`mt-2 border-t pt-2 ${t.divider}`}>
            {card.role === "ATTACKER" && card.abilities.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {card.abilities.map((ability, i) => (
                  <li key={i} className="text-xs text-stone-300">
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
