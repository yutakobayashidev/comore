interface UserSocialLinks {
  websiteUrl: string | null;
  twitterUsername: string | null;
  blueskyAddress: string | null;
  activityPubAddress: string | null;
}

export interface UpdateUserSocialLinksParams extends UserSocialLinks {
  userId: number;
}

export interface User {
  id: number;
  githubId: number;
  email: string;
  handle: string;
  stripeId: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  blueskyAddress: string | null;
  activityPubAddress: string | null;
}
