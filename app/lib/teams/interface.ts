import type { User } from "../users/interface";

export interface Team {
  id: string;
  name: string;
  slug: string;
  hasActiveSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: number;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedByUserId: number;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedByUserId: number | null;
  createdAt: Date;
}

export interface CreateTeamParams {
  name: string;
  slug: string;
  creatorUserId: number;
}

export interface CreateTeamInvitationParams {
  teamId: string;
  invitedByUserId: number;
  expiresInDays?: number;
}

export interface AcceptTeamInvitationParams {
  token: string;
  userId: number;
}

export interface RemoveTeamMemberParams {
  teamId: string;
  userId: number;
}

export interface TransferTeamOwnershipParams {
  teamId: string;
  fromUserId: number;
  toUserId: number;
}

export interface UserTeamInfo {
  team: Team;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface TeamMemberWithUser {
  member: TeamMember;
  user: User;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}