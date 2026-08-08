import { createAdminClient } from "@/utils/supabase/admin";

export type CardRole = "ATTACKER" | "SUPPORT" | "ENERGY";

export type EffectType = "DRAW" | "HEAL" | "ADD_ENERGY" | "BOOST_DAMAGE";

export type Ability = {
  name: string;
  description: string;
  damage?: number;
  energyCost?: number;
  effectType?: EffectType;
  magnitude?: number;
};

export type Card = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  version: number;
  role: CardRole;
  hp: number;
  energyAmount: number;
  cardType: string;
  abilities: Ability[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CardEditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CardEditRequest = {
  id: string;
  cardId: string | null;
  baseVersion: number | null;
  proposedBy: string;
  title: string;
  body: string;
  imageUrls: string[];
  role: CardRole;
  hp: number;
  energyAmount: number;
  cardType: string;
  abilities: Ability[];
  status: CardEditRequestStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type CardRow = {
  id: string;
  title: string;
  body: string;
  image_urls: string[];
  version: number;
  role: CardRole;
  hp: number;
  energy_amount: number;
  card_type: string;
  abilities: Ability[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type CardEditRequestRow = {
  id: string;
  card_id: string | null;
  base_version: number | null;
  proposed_by: string;
  title: string;
  body: string;
  image_urls: string[];
  role: CardRole;
  hp: number;
  energy_amount: number;
  card_type: string;
  abilities: Ability[];
  status: CardEditRequestStatus;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    version: row.version,
    role: row.role,
    hp: row.hp,
    energyAmount: row.energy_amount,
    cardType: row.card_type,
    abilities: row.abilities,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCardEditRequest(row: CardEditRequestRow): CardEditRequest {
  return {
    id: row.id,
    cardId: row.card_id,
    baseVersion: row.base_version,
    proposedBy: row.proposed_by,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    role: row.role,
    hp: row.hp,
    energyAmount: row.energy_amount,
    cardType: row.card_type,
    abilities: row.abilities,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function getAllCards(): Promise<Card[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("cards")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) return [];
  return (data as CardRow[]).map(mapCard);
}

export async function getPendingCardEditRequests(): Promise<CardEditRequest[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("card_edit_requests")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as CardEditRequestRow[]).map(mapCardEditRequest);
}

export async function getMyPendingProposals(
  userId: string
): Promise<CardEditRequest[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("card_edit_requests")
    .select("*")
    .eq("proposed_by", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as CardEditRequestRow[]).map(mapCardEditRequest);
}

export type BattleCard = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  role: CardRole;
  cardType: string;
  maxHp: number;
  currentHp: number;
  energyAmount: number;
  abilities: Ability[];
  attachedEnergy: number;
};

export function toBattleCard(card: Card): BattleCard {
  return {
    id: card.id,
    title: card.title,
    body: card.body,
    imageUrls: card.imageUrls,
    role: card.role,
    cardType: card.cardType,
    maxHp: card.hp,
    currentHp: card.hp,
    energyAmount: card.energyAmount,
    abilities: card.abilities,
    attachedEnergy: 0,
  };
}

export function describeEffect(ability: Ability): string {
  switch (ability.effectType) {
    case "DRAW":
      return `Draw ${ability.magnitude} card${ability.magnitude === 1 ? "" : "s"}.`;
    case "HEAL":
      return `Heal ${ability.magnitude} HP on your active card.`;
    case "ADD_ENERGY":
      return `Attach ${ability.magnitude} bonus energy to your active card.`;
    case "BOOST_DAMAGE":
      return `Your next attack this turn deals +${ability.magnitude} damage.`;
    default:
      return ability.description;
  }
}

export async function getBattleReadyCards(): Promise<Card[]> {
  return getAllCards();
}
