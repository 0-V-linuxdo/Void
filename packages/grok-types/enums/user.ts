/**
 * Organization type from the protobuf `OrganizationType` enum.
 *
 * | Value | Name               |
 * |-------|--------------------|
 * | `0`   | Unspecified        |
 * | `1`   | Enterprise         |
 * | `2`   | Enterprise Vault   |
 * | `3`   | Education          |
 * | `4`   | Government         |
 */
export type OrganizationType = 0 | 1 | 2 | 3 | 4;

/**
 * Sign-in method from the protobuf `SignInMethod` enum.
 *
 * | Value | Method         |
 * |-------|----------------|
 * | `0`   | Unspecified    |
 * | `1`   | Email/Password |
 * | `2`   | Google OAuth2  |
 * | `3`   | X OAuth2       |
 * | `4`   | Apple OAuth2   |
 * | `5`   | SSO            |
 */
export type SignInMethod = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Team member role from the protobuf `TeamMemberRole` enum.
 *
 * | Value | Role        |
 * |-------|-------------|
 * | `0`   | Unspecified |
 * | `1`   | Member      |
 * | `2`   | Admin       |
 */
export type TeamMemberRole = 0 | 1 | 2;

/**
 * Computed user segment derived from team/organization membership.
 *
 * | Segment        | Condition                                |
 * |----------------|------------------------------------------|
 * | `"enterprise"` | Has both `teamId` and `organizationId`   |
 * | `"business"`   | Has `teamId` only                        |
 * | `"consumer"`   | Has neither                              |
 */
export type UserSegment = "enterprise" | "business" | "consumer" | (string & {});

/**
 * Content moderation severity level from the protobuf enum.
 *
 * | Value | Severity    |
 * |-------|-------------|
 * | `0`   | Unspecified |
 * | `1`   | Low         |
 * | `2`   | Medium      |
 * | `3`   | High        |
 * | `4`   | Extreme     |
 */
export type ModerationSeverity = 0 | 1 | 2 | 3 | 4;
