import type { SessionTierId, XSubscriptionType } from "../enums/subscription";
import type { OrganizationType } from "../enums/user";

/**
 * Authenticated Grok user profile returned by the session API.
 *
 * Populated on login and refreshed via `SessionStore.refreshSession()`.
 * Fields prefixed with `x` relate to the linked X (Twitter) account.
 */
export interface GrokUser {
    /** Unique session identifier, rotated on each login. */
    sessionId: string;
    /** Persistent user UUID across sessions. */
    userId: string;
    /** Primary email address associated with the account. */
    email: string;
    /** User's given (first) name. */
    givenName: string;
    /** User's family (last) name. May be empty if not set. */
    familyName: string;
    /** Whether the email address has been verified. */
    emailConfirmed: boolean;
    /** Account creation timestamp as Unix epoch seconds. */
    createTime: number;
    /** URL to the user's profile avatar image. */
    profileImageUrl: string;

    /** Linked X (Twitter) user ID. Empty string if not linked. */
    xUserId: string;
    /** Linked X (Twitter) username (handle). Empty string if not linked. */
    xUsername: string;
    /**
     * X subscription type from the linked account.
     * `"PremiumPlus"` grants SuperGrok access even without a Grok subscription.
     */
    xSubscriptionType: XSubscriptionType;

    /**
     * Session tier ID (X-based tier, NOT Grok subscription tier).
     * For actual Grok subscription, use `useSubscriptions().bestSubscription`.
     */
    sessionTierId: SessionTierId;
    /** User's date of birth as Unix epoch seconds, or null if not provided. */
    birthDate: { seconds: number } | null;

    /** Enterprise organization ID, or null for individual users. */
    organizationId: string | null;
    /** Organization role enum string, or undefined if not in an org. */
    organizationRole?: string;
    /** RBAC role ID within the organization. */
    organizationRbacRoleId?: string;
    /** Organization type enum. 0 = unspecified/individual. */
    organizationType: OrganizationType;

    /** Raw profile image URL from the API (before any remapping). */
    profileImage?: string;
    /** User role string (e.g. admin). */
    role?: string;
    /** Version of the Terms of Service the user accepted. */
    tosAcceptedVersion?: string;
    /** Reason the account is blocked, if any. */
    blockedReason?: string;
    /** Access control list strings for feature gating. */
    aclStrings?: string[];
    /** Email domain (e.g. "gmail.com"). */
    emailDomain?: string;
    /** Internal database identifier. */
    grokDb?: string;
    /** Account deletion timestamp, if scheduled. */
    deleteTime?: string;
    /** Risk level enum value. */
    riskLevel?: number;
    /** Whether the user has opted into NSFW content. */
    allowNsfwContent?: boolean;
    /** Whether to always show NSFW content without confirmation. */
    alwaysShowNsfwContent?: boolean;
    /** Whether the user has a password set (vs OAuth-only). */
    hasPassword?: boolean;
    /** Whether the user is subscribed to marketing emails. */
    emailSubscribed?: boolean;
    /** Whether this account was migrated from X. */
    migratedFromX?: boolean;
    /** X migration status string, if applicable. */
    xMigrationStatus?: string;
    /** Google account email, if linked. */
    googleEmail?: string;
    /** Vercel avatar URL, if linked. */
    vercelAvatarUrl?: string;
    /** Vercel email, if linked. */
    vercelEmail?: string;
    /** Vercel user ID, if linked. */
    vercelId?: string;
    /** Vercel display name, if linked. */
    vercelName?: string;
    /** Vercel role, if linked. */
    vercelRole?: string;
    /** Whether the account is synced with WorkOS (enterprise SSO). */
    isWorkosSynced?: boolean;
}
