/** Tab identifiers for the Grok settings dialog. */
export type SettingsDialogTab =
	| "home"
	| "account"
	| "team"
	| "appearance"
	| "chat"
	| "personality"
	| "data"
	| "memory"
	| "billing"
	| "dev"
	| "dev-flags"
	| "behavior"
	| "build"
	| "connected-apps"
	| "grok-business-connected-apps"
	| (string & {});

/**
 * Color theme mode. Stored in `next-themes` and the user's cookies.
 *
 * `"system"` resolves to `"dark"` or `"light"` based on `prefers-color-scheme`.
 */
export type Theme = "light" | "dark" | "system" | (string & {});
