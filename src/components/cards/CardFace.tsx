import type { Card, BattleCard } from "@/lib/cards";

type FaceCard = Card | BattleCard;

function getHp(card: FaceCard): { current: number; max: number } {
  if ("currentHp" in card) {
    return { current: card.currentHp, max: card.maxHp };
  }
  return { current: card.hp, max: card.hp };
}

export function CardFace({
  card,
  size = "full",
}: {
  card: FaceCard;
  size?: "full" | "compact";
}) {
  const { current, max } = getHp(card);
  const image = card.imageUrls[0];

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
        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-300">
          {card.cost}⚡
        </span>
        {card.cardType && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-stone-200">
            {card.cardType}
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-xs font-bold text-white">
            ⚔ {card.attack}
          </span>
          <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-bold text-white">
            ♥ {current}/{max}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-white">{card.title}</h3>

        {size === "full" && (
          <div className="mt-2 border-t border-white/10 pt-2">
            {card.abilities.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {card.abilities.map((ability, i) => (
                  <li key={i} className="text-xs text-stone-300">
                    <span className="font-semibold text-amber-300">
                      {ability.name}
                    </span>
                    {ability.description && (
                      <span className="text-stone-400">
                        {" "}
                        — {ability.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
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
