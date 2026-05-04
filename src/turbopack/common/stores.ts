/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {
    AssetStoreModule,
    ChatPageStoreModule,
    CodePageStoreModule,
    CommandMenuStoreModule,
    ConversationStoreModule,
    DictationStoreModule,
    FeatureStoreModule,
    FilesPageStoreModule,
    FileStoreModule,
    ImageEditorStoreModule,
    ImagineModelOverrideStoreModule,
    MediaStoreModule,
    MentionMenuStoreModule,
    ModesStoreModule,
    NotificationsStoreModule,
    PersonalityStoreModule,
    ReportStoreModule,
    ResponseStoreModule,
    RoutingStoreModule,
    ScrollStoreModule,
    SessionStoreModule,
    SettingsDialogStoreModule,
    SettingsStoreModule,
    ShareStoreModule,
    ShopStoreModule,
    SkillsStoreModule,
    SubscriptionsStoreModule,
    SuggestionStoreModule,
    TabsManagerStoreModule,
    TasksStoreModule,
    TextToSpeechStoreModule,
    TourGuideStoreModule,
    UpsellStoreModule,
    WorkspaceConnectorsStoreModule,
    WorkspaceStoreModule,
} from "@grok-types/stores";

import { findByPropsLazy } from "../turbopack";

export const AssetStore: AssetStoreModule = findByPropsLazy("useAssetStore");
export const ChatPageStore: ChatPageStoreModule = findByPropsLazy("useChatPageStore", "getLatestThreadMessageId");
export const CodePageStore: CodePageStoreModule = findByPropsLazy("useCodePageStore");
export const CommandMenuStore: CommandMenuStoreModule = findByPropsLazy("useCommandMenuStore", "createSelection");
export const ConversationStore: ConversationStoreModule = findByPropsLazy("useConversationStore", "createOptimisticConversation");
export const DictationStore: DictationStoreModule = findByPropsLazy("useDictationStore");
export const FeatureStore: FeatureStoreModule = findByPropsLazy("useFeatureStore");
export const FilesPageStore: FilesPageStoreModule = findByPropsLazy("useFilesPageStore", "useAssetsList");
export const FileStore: FileStoreModule = findByPropsLazy("useFileStore");
export const ImageEditorStore: ImageEditorStoreModule = findByPropsLazy("useImageEditorStore");
export const ImagineModelOverrideStore: ImagineModelOverrideStoreModule = findByPropsLazy("useImagineModelOverrideStore");
export const MediaStore: MediaStoreModule = findByPropsLazy("useMediaStore", "useImagineModeStore");
export const MentionMenuStore: MentionMenuStoreModule = findByPropsLazy("useMentionMenuStore");
export const ModesStore: ModesStoreModule = findByPropsLazy("useModesStore");
export const NotificationsStore: NotificationsStoreModule = findByPropsLazy("useNotificationsStore", "useNotificationsStoreInit");
export const PersonalityStore: PersonalityStoreModule = findByPropsLazy("usePersonalityStore", "DEFAULT_CUSTOM_PERSONALITY");
export const ReportStore: ReportStoreModule = findByPropsLazy("useReportStore");
export const ResponseStore: ResponseStoreModule = findByPropsLazy("useResponseStore", "createOptimisticResponse");
export const RoutingStore: RoutingStoreModule = findByPropsLazy("useRoutingStore", "formatUrl");
export const ScrollStore: ScrollStoreModule = findByPropsLazy("useScrollStore");
export const SessionStore: SessionStoreModule = findByPropsLazy("useSession", "SessionStoreProvider");
export const SettingsDialogStore: SettingsDialogStoreModule = findByPropsLazy("useSettingsDialogStore");
export const SettingsStore: SettingsStoreModule = findByPropsLazy("useSettingsStore", "hasModelConfigOverride");
export const ShareStore: ShareStoreModule = findByPropsLazy("useShareStore");
export const ShopStore: ShopStoreModule = findByPropsLazy("useShopStore");
export const SkillsStore: SkillsStoreModule = findByPropsLazy("useSkillsStore");
export const SubscriptionsStore: SubscriptionsStoreModule = findByPropsLazy("useSubscriptionsStore");
export const SuggestionStore: SuggestionStoreModule = findByPropsLazy("useSuggestionStore", "useSuggestionStoreInit");
export const TabsManagerStore: TabsManagerStoreModule = findByPropsLazy("useTabsManagerStore");
export const TasksStore: TasksStoreModule = findByPropsLazy("useTasksStore");
export const TextToSpeechStore: TextToSpeechStoreModule = findByPropsLazy("useTextToSpeechStore");
export const TourGuideStore: TourGuideStoreModule = findByPropsLazy("useTourGuideStore", "useTourGuideTooltip");
export const UpsellStore: UpsellStoreModule = findByPropsLazy("useUpsellStore", "useShouldShowUpgradeButton");
export const WorkspaceConnectorsStore: WorkspaceConnectorsStoreModule = findByPropsLazy("useWorkspaceConnectorsStore", "useWorkspaceActiveConnectorIds");
export const WorkspaceStore: WorkspaceStoreModule = findByPropsLazy("useWorkspaceStore", "useWorkspacesList");
