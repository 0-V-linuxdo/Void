/**
 * Third-party connector type from the protobuf `ConnectorType` enum.
 *
 * Used in workspace connector settings and the connected-apps panel.
 *
 * | Value | Connector          |
 * |-------|--------------------|
 * | `0`   | Unknown            |
 * | `1`   | Google Drive       |
 * | `2`   | Test (internal)    |
 * | `3`   | Notion             |
 * | `4`   | Slack              |
 * | `5`   | Gmail              |
 * | `6`   | MCP                |
 * | `7`   | SharePoint         |
 * | `8`   | Google Calendar    |
 * | `9`   | Outlook            |
 * | `10`  | Microsoft Teams    |
 * | `11`  | Outlook Calendar   |
 */
export type ConnectorType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Connector type name string used in analytics events.
 *
 * Returned by `getConnectorTypeName()`.
 */
export type ConnectorTypeName =
	| "unknown"
	| "google_drive"
	| "notion"
	| "slack"
	| "gmail"
	| "mcp"
	| "sharepoint"
	| "google_calendar"
	| "outlook"
	| "microsoft_teams"
	| "outlook_calendar"
	| (string & {});
