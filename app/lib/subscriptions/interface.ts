export interface UserSubscription {
  id: number;
  subscriberId: number;
  targetUserId: number;
  createdAt: Date;
}

export interface TeamSubscription {
  id: number;
  subscriberId: number;
  targetTeamId: string;
  createdAt: Date;
}

export interface UserSubscriptionWithTarget extends UserSubscription {
  targetUser: {
    id: number;
    handle: string;
  };
}

export interface TeamSubscriptionWithTarget extends TeamSubscription {
  targetTeam: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SubscriptionsResponse {
  userSubscriptions: UserSubscriptionWithTarget[];
  teamSubscriptions: TeamSubscriptionWithTarget[];
}
