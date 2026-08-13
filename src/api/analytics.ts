import type { ApiAnalytics } from "../types";
import { get } from "./request";

export function getAnalytics(signal?: AbortSignal): Promise<ApiAnalytics> {
  return get<ApiAnalytics>("/api/analytics", { signal, fallbackMessage: "分析数据加载失败" });
}
