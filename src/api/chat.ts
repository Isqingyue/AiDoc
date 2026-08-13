import type { ApiCitation } from "../types";
import { post, streamJsonLines } from "./request";

export interface SendChatPayload {
  question: string;
  knowledge_base_id: string;
  conversation_id: string | null;
}

export type ChatStreamEvent =
  | {
    type: 'metadata';
    conversation_id: string;
    model: string;
    citations: ApiCitation[];
  }
  | { type: 'delta'; delta: string }
  | {
    type: 'done';
    conversation_id: string;
    message_id: string;
    model: string;
    citations: ApiCitation[];
    no_relevant_content: boolean;
  }
  | { type: 'error'; message: string };

export function streamChat(
  payload: SendChatPayload,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  return streamJsonLines<ChatStreamEvent>('/api/chat/stream', {
    method: 'POST',
    body: payload,
    signal,
    fallbackMessage: 'AI 暂时没有返回内容，请稍后重试。',
  });
}

export function submitMessageFeedback(messageId: string, rating: "up" | "down"): Promise<void> {
  return post<void>(`/api/messages/${messageId}/feedback`, { rating }, { fallbackMessage: "反馈提交失败" });
}
