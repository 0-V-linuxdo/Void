/** Read/unread status of a notification from the API. */
export type NotificationStatus =
    | "NOTIFICATION_STATUS_UNREAD"
    | "NOTIFICATION_STATUS_READ"
    | (string & {});

/** Notification type/category identifiers. */
export type NotificationType =
    | "share_request"
    | "conversation_access_request"
    | (string & {});

/** Conversation access request status. */
export type ConversationAccessRequestStatus =
    | "CONVERSATION_ACCESS_REQUEST_STATUS_UNSPECIFIED"
    | "CONVERSATION_ACCESS_REQUEST_STATUS_PENDING"
    | "CONVERSATION_ACCESS_REQUEST_STATUS_APPROVED"
    | "CONVERSATION_ACCESS_REQUEST_STATUS_DENIED"
    | (string & {});
