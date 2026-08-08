import type { Card, BattleCard } from "@/lib/cards";
import { describeEffect } from "@/lib/cards";

type FaceCard = Card | BattleCard;

function getHp(card: FaceCard): { current: number; max: number } {
  if ("currentHp" in card) {
    return { current: card.currentHp, max: card.maxHp };
  }
  return { current: card.hp, max: card.hp };
}

function getAttachedEnergy(card: FaceCard): number | null {
  return "attachedEnergy" in card ? card.attachedEnergy : null;
}

export function CardFace({
  card,
  size = "full",
}: {
  card: FaceCard;
  size?: "full" | "compact";
}) {
  const image = card.imageUrls[0];
  const attachedEnergy = getAttachedEnergy(card);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="relative">
        {image ? (
          <img src={image} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-black/30 text-3xl">
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
        <h3 className="text-sm font-semibold text-white">{card.title}</h3>

        {size === "full" && (
          <div className="mt-2 border-t border-white/10 pt-2">
            {card.role === "ATTACKER" && card.abilities.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {card.abilities.map((ability, i) => (
                  <li key={i} className="text-xs text-stone-300">
                    <span className="font-semibold text-amber-300">
                      ⚔ {ability.name}
                    </span>{" "}
                    <span className="text-stone-400">
                      ({ability.energyCost ?? 0}⚡): {ability.damage ?? 0} dmg
                    </span>
                    {ability.description && (
                      <span className="block text-stone-500">
                        {ability.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {card.role === "SUPPORT" && card.abilities.length > 0 && (
              <div className="mb-2 text-xs text-stone-300">
                <span className="font-semibold text-amber-300">
                  🎴 {card.abilities[0].name}
                </span>
                <p className="text-stone-400">
                  {describeEffect(card.abilities[0])}
                </p>
              </div>
            )}

            {card.body && (
              <p className="text-xs text-stone-400">{card.body}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
