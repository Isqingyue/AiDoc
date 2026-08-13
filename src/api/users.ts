import type { ApiKnowledgeBase, ApiUser } from "../types";
import { get, patch, post, put, remove } from "./request";

export interface CreateUserPayload {
  name: string;
  username: string;
  password: string;
  role: ApiUser["role"];
  knowledgeBaseIds?: string[];
}

export interface UpdateUserPayload {
  name: string;
  role: ApiUser["role"];
  status: string;
  password?: string;
}

export function listUsers(signal?: AbortSignal): Promise<ApiUser[]> {
  return get<ApiUser[]>("/api/users", { signal, fallbackMessage: "用户加载失败" });
}

export async function createUser(payload: CreateUserPayload): Promise<ApiUser> {
  const user = await post<ApiUser>("/api/users", {
    name: payload.name,
    username: payload.username,
    password: payload.password,
    role: payload.role,
  }, { fallbackMessage: "创建用户失败" });

  if (payload.role === "user") {
    await setUserKnowledgeBases(user.id, payload.knowledgeBaseIds ?? []);
  }
  return user;
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<ApiUser> {
  return patch<ApiUser>(`/api/users/${id}`, payload, { fallbackMessage: "用户资料保存失败" });
}

export function deleteUser(id: string): Promise<void> {
  return remove(`/api/users/${id}`, { fallbackMessage: "删除用户失败" });
}

export function getUserKnowledgeBases(id: string): Promise<ApiKnowledgeBase[]> {
  return get<ApiKnowledgeBase[]>(`/api/users/${id}/knowledge-bases`, { fallbackMessage: "用户知识库权限加载失败" });
}

export function setUserKnowledgeBases(id: string, knowledgeBaseIds: string[]): Promise<{ knowledge_base_ids: string[] }> {
  return put<{ knowledge_base_ids: string[] }>(`/api/users/${id}/knowledge-bases`, { knowledge_base_ids: knowledgeBaseIds }, { fallbackMessage: "知识库权限保存失败" });
}
