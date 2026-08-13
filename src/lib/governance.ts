import { createAdminClient } from "@/utils/supabase/admin";

export type RoleVoteDirection = "PROMOTE" | "DEMOTE" | "PROMOTE_MEMBER";

export type OpenRoleVote = {
  id: string;
  targetUserId: string;
  direction: RoleVoteDirection;
  requiredCount: number;
  initiatedBy: string;
  yesVoterIds: string[];
  noVoterIds: string[];
  netScore: number;
  createdAt: string;
};

type RoleVoteRow = {
  id: string;
  target_user_id: string;
  direction: RoleVoteDirection;
  required_count: number;
  initiated_by: string;
  created_at: string;
};

type RoleVoteBallotRow = {
  vote_id: string;
  admin_id: string;
  value: number;
};

export async function getOpenRoleVotes(): Promise<OpenRoleVote[]> {
  const adminClient = createAdminClient();
  const { data: votes, error: votesError } = await adminClient
    .from("role_votes")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", { ascending: true });

  if (votesError || !votes || votes.length === 0) return [];

  const voteRows = votes as RoleVoteRow[];
  const { data: ballots, error: ballotsError } = await adminClient
    .from("role_vote_ballots")
    .select("vote_id, admin_id, value")
    .in(
      "vote_id",
      voteRows.map((v) => v.id)
    );

  const yesByVote = new Map<string, string[]>();
  const noByVote = new Map<string, string[]>();
  if (!ballotsError && ballots) {
    for (const ballot of ballots as RoleVoteBallotRow[]) {
      const target = ballot.value < 0 ? noByVote : yesByVote;
      const list = target.get(ballot.vote_id) ?? [];
      list.push(ballot.admin_id);
      target.set(ballot.vote_id, list);
    }
  }

  return voteRows.map((v) => {
    const yesVoterIds = yesByVote.get(v.id) ?? [];
    const noVoterIds = noByVote.get(v.id) ?? [];
    return {
      id: v.id,
      targetUserId: v.target_user_id,
      direction: v.direction,
      requiredCount: v.required_count,
      initiatedBy: v.initiated_by,
      yesVoterIds,
      noVoterIds,
      netScore: yesVoterIds.length - noVoterIds.length,
      createdAt: v.created_at,
    };
  });
}
