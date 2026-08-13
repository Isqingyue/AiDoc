import type { ApiManual } from "../types";
import { get, post, remove } from "./request";

export type ManualAction = "publish" | "disable" | "delete" | "reprocess";
export interface UploadManualPayload { knowledgeBaseId: string; name: string; version: string; file: File }

export function listManuals(signal?: AbortSignal): Promise<ApiManual[]> {
  return get<ApiManual[]>("/api/manuals", { signal, fallbackMessage: "手册加载失败" });
}

export function uploadManual(payload: UploadManualPayload): Promise<ApiManual> {
  const body = new FormData();
  body.append("knowledge_base_id", payload.knowledgeBaseId);
  body.append("name", payload.name);
  body.append("version", payload.version);
  body.append("file", payload.file);
  return post<ApiManual>("/api/manuals", body, { fallbackMessage: "手册上传失败" });
}

export function runManualAction(id: string, action: ManualAction): Promise<void> {
  return action === "delete"
    ? remove(`/api/manuals/${id}`, { fallbackMessage: "手册删除失败" })
    : post<void>(`/api/manuals/${id}/${action}`, undefined, { fallbackMessage: "手册操作失败" });
}
