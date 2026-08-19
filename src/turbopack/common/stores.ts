/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {
    ChatPageStoreModule,
    ConversationStoreModule,
    FeatureStoreModule,
    FilesPageStoreModule,
    MediaStoreModule,
    ModesStoreModule,
    ResponseStoreModule,
    RoutingStoreModule,
    SessionStoreModule,
    SettingsDialogStoreModule,
    SettingsStoreModule,
    SubscriptionsStoreModule,
    TextToSpeechStoreModule,
} from "@grok-types/stores";

import { findByPropsLazy } from "../turbopack";

export const ChatPageStore: ChatPageStoreModule = findByPropsLazy("useChatPageStore");
export const ConversationStore: ConversationStoreModule = findByPropsLazy("useConversationStore", "createOptimisticConversation");
export const FeatureStore: FeatureStoreModule = findByPropsLazy("useFeatureStore");
export const FilesPageStore: FilesPageStoreModule = findByPropsLazy("useFilesPageStore", "useAssetsList");
export const MediaStore: MediaStoreModule = findByPropsLazy("useMediaStore", "useImagineModeStore");
export const ModesStore: ModesStoreModule = findByPropsLazy("useModesStore");
export const ResponseStore: ResponseStoreModule = findByPropsLazy("useResponseStore", "createOptimisticResponse");
export const RoutingStore: RoutingStoreModule = findByPropsLazy("useRoutingStore", "formatUrl");
export const SessionStore: SessionStoreModule = findByPropsLazy("useSession", "SessionStoreProvider");
export const SettingsDialogStore: SettingsDialogStoreModule = findByPropsLazy("useSettingsDialogStore");
export const SettingsStore: SettingsStoreModule = findByPropsLazy("useSettingsStore", "modelConfigOverrideSchema");
export const SubscriptionsStore: SubscriptionsStoreModule = findByPropsLazy("useSubscriptionsStore");
export const TextToSpeechStore: TextToSpeechStoreModule = findByPropsLazy("useTextToSpeechStore");
