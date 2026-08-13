import type { ApiKnowledgeBase } from "../types";
import { get, patch, post, remove } from "./request";

export interface CreateKnowledgeBasePayload { name: string; description?: string }
export interface UpdateKnowledgeBasePayload { name: string; description: string }

export function listKnowledgeBases(signal?: AbortSignal): Promise<ApiKnowledgeBase[]> {
  return get<ApiKnowledgeBase[]>("/api/knowledge-bases", { signal, fallbackMessage: "知识库加载失败" });
}

export function createKnowledgeBase(payload: CreateKnowledgeBasePayload): Promise<ApiKnowledgeBase> {
  return post<ApiKnowledgeBase>("/api/knowledge-bases", payload, { fallbackMessage: "创建知识库失败" });
}

export function updateKnowledgeBase(id: string, payload: UpdateKnowledgeBasePayload): Promise<ApiKnowledgeBase> {
  return patch<ApiKnowledgeBase>(`/api/knowledge-bases/${id}`, payload, { fallbackMessage: "知识库保存失败" });
}

export function setKnowledgeBaseEnabled(id: string, enabled: boolean): Promise<ApiKnowledgeBase> {
  return post<ApiKnowledgeBase>(`/api/knowledge-bases/${id}/${enabled ? "enable" : "disable"}`, undefined, { fallbackMessage: "知识库状态更新失败" });
}

export function deleteKnowledgeBase(id: string): Promise<void> {
  return remove(`/api/knowledge-bases/${id}`, { fallbackMessage: "删除知识库失败" });
}
