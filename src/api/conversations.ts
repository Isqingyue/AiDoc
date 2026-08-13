import type { ApiConversation, ApiMessage } from "../types";
import { get, remove } from "./request";

export function listConversations(): Promise<ApiConversation[]> {
  return get<ApiConversation[]>("/api/conversations", { fallbackMessage: "会话列表加载失败" });
}

export function listConversationMessages(conversationId: string): Promise<ApiMessage[]> {
  return get<ApiMessage[]>(`/api/conversations/${conversationId}/messages`, { fallbackMessage: "会话加载失败" });
}

export function deleteConversation(conversationId: string): Promise<void> {
  return remove(`/api/conversations/${conversationId}`, { fallbackMessage: "删除会话失败" });
}
