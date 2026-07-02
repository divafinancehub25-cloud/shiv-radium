import type {
  DivaReferralStatus,
  DivaReferralEventType,
  DivaRewardType,
  DivaRewardStatus,
  DivaAnnouncementCategory,
  DivaAnnouncementStatus,
  DivaAchievementTrigger,
} from "@prisma/client";

export type { DivaReferralStatus, DivaRewardType, DivaRewardStatus, DivaAnnouncementCategory, DivaAnnouncementStatus, DivaAchievementTrigger };

export type ReferralStats = {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
  referralCode: string;
  referralLink: string;
};

export type ReferralRow = {
  id: string;
  referredName: string;
  referredEmail: string;
  status: DivaReferralStatus;
  createdAt: string;
  activatedAt: string | null;
  kycCompletedAt: string | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  email: string;
  totalReferrals: number;
  successfulReferrals: number;
  pointsEarned: number;
  badge: string;
};

export type RewardRow = {
  id: string;
  rewardType: DivaRewardType;
  rewardName: string;
  rewardValue: number;
  status: DivaRewardStatus;
  awardedAt: string;
};

export type RewardRuleRow = {
  id: string;
  ruleName: string;
  description: string | null;
  rewardType: DivaRewardType;
  rewardValue: number;
  triggerEvent: string;
  isActive: boolean;
  createdAt: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  category: DivaAnnouncementCategory;
  status: DivaAnnouncementStatus;
  isPinned: boolean;
  imageUrl: string | null;
  publishedAt: string | null;
  authorName: string | null;
  bookmarked?: boolean;
};

export type AchievementRow = {
  id: string;
  name: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  trigger: DivaAchievementTrigger;
  earned: boolean;
  earnedAt: string | null;
};

export type GrowthAnalytics = {
  weeklyReferrals: { week: string; count: number }[];
  conversionRate: number;
  topReferrers: LeaderboardEntry[];
  totalUsers: number;
  newUsersThisMonth: number;
  kycConversionRate: number;
};
