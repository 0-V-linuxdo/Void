import type { ZustandStore } from "../zustand";

import type { GrokResponse } from "./ResponseStore";

export type GatewayNodeStatus =
    | "skeleton"
    | "send-queued"
    | "send-sent"
    | "ack-pending"
    | "streaming"
    | "complete"
    | "stream-error"
    | "send-error"
    | "unloaded";

export interface GatewayNode {
    id: string;
    parentId: string | null;
    role: "user" | "assistant";
    status: GatewayNodeStatus;
    childIds: string[];
    createdAt: number;
    content?: GrokResponse & { conversationId: string };
}

export interface GatewayConversation {
    nodes: Record<string, GatewayNode>;
    rootChildIds: string[];
    defaultLeafId: string | null;
}

export interface MessageStoreState {
    conversations: Record<string, GatewayConversation>;
}

export interface MessageStoreModule {
    useMessageStore: ZustandStore<MessageStoreState>;
    nodeToResponse: (conversationId: string, node: GatewayNode) => GrokResponse | undefined;
}
