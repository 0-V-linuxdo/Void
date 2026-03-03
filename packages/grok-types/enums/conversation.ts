/** Conversation mode controlling the type of interaction. */
export type ConversationMode = "chat" | "deep_search" | (string & {});

/** Conversation lifecycle state. */
export type ConversationState = "open" | "closed" | (string & {});

/** Response sender identifying who authored a message. */
export type ResponseSender = "human" | "assistant" | (string & {});

/**
 * Response streaming/lifecycle state.
 *
 * | State           | Description                                    |
 * |-----------------|------------------------------------------------|
 * | `"optimistic"`  | Client-side placeholder before server confirms |
 * | `"streaming"`   | Actively receiving chunks from the server      |
 * | `"reconnecting"`| Lost connection, attempting to resume           |
 * | `"closed"`      | Finished normally                              |
 * | `"error"`       | Terminated due to an error                     |
 */
export type ResponseState =
	| "optimistic"
	| "streaming"
	| "reconnecting"
	| "closed"
	| "error"
	| (string & {});
