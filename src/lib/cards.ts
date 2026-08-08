import { createAdminClient } from "@/utils/supabase/admin";

export type Ability = {
  name: string;
  description: string;
};

export type Card = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  version: number;
  attack: number;
  hp: number;
  cost: number;
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
  attack: number;
  hp: number;
  cost: number;
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
  attack: number;
  hp: number;
  cost: number;
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
  attack: number;
  hp: number;
  cost: number;
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
    attack: row.attack,
    hp: row.hp,
    cost: row.cost,
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
    attack: row.attack,
    hp: row.hp,
    cost: row.cost,
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
  attack: number;
  maxHp: number;
  currentHp: number;
  cost: number;
  cardType: string;
  abilities: Ability[];
};

export function toBattleCard(card: Card): BattleCard {
  return {
    id: card.id,
    title: card.title,
    body: card.body,
    imageUrls: card.imageUrls,
    attack: card.attack,
    maxHp: card.hp,
    currentHp: card.hp,
    cost: card.cost,
    cardType: card.cardType,
    abilities: card.abilities,
  };
}

export async function getBattleReadyCards(): Promise<Card[]> {
  return getAllCards();
}
