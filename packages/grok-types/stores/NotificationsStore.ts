import type { LoadingStatus } from "../common/LoadingStatus";
import type { NotificationStatus, NotificationType } from "../enums/notifications";
import type { ZustandStore } from "../zustand";

/**
 * A notification object from the Grok notifications API.
 * Contains the notification ID, content, and read status.
 */
export interface GrokNotification {
    /** Unique notification identifier. */
    notificationId: string;
    /** Notification display title. */
    title?: string;
    /** Notification body text. */
    body?: string;
    /** Read/unread status. */
    status?: NotificationStatus;
    /** Notification type/category. */
    type?: NotificationType;
    /** Creation timestamp as ISO string. */
    createTime?: string;
    /** Deep link URL for the notification action. */
    actionUrl?: string;
}

/** Result wrapper for a notification entry in the byId map. */
export interface NotificationEntry {
    /** The notification data, or undefined if errored. */
    data?: GrokNotification;
    /** Error object if the entry failed to load. */
    error?: Error;
}

/**
 * Zustand state for the in-app notifications system, supporting read tracking
 * and periodic polling. Notifications are loaded on app init when
 * the ENABLE_NOTIFICATIONS feature flag is on.
 */
export interface NotificationsStoreState {
    /** Whether the notifications system is enabled for this user. */
    enabled: boolean;
    /** Notification entries keyed by notification ID. */
    byId: Record<string, NotificationEntry>;
    /** Ordered list of notification IDs. */
    list: string[];
    /** Current loading status of the notification list. */
    listStatus: LoadingStatus;
    /** Pagination token for the next page, empty string if no more pages. */
    listNextPageToken: string;
    /** Whether the user has been exposed to the notifications feature. */
    userExposedToNotifications: boolean;
    /** Current team ID for team-scoped notifications. */
    currentTeamId: string | null;

    /** Fetch the first page of notifications from the API. */
    loadFirstPage: () => Promise<void>;
    /** Mark one or more notifications as read by ID. */
    markAsRead: (notificationIds: string[]) => Promise<void>;
    /** Remove a notification from the local store by ID. */
    removeNotification: (notificationId: string) => void;
}

/** Module exports for the Notifications store. */
export interface NotificationsStoreModule {
    /** Zustand store hook for notification state. */
    useNotificationsStore: ZustandStore<NotificationsStoreState>;
    /** React hook that initializes notification polling on mount. */
    useNotificationsStoreInit: () => void;
}
