import type { ApiUser } from "../types";
import { get, post } from "./request";

export interface LoginPayload {
  username: string;
  password: string;
}

export function login(payload: LoginPayload): Promise<ApiUser> {
  return post<ApiUser>("/api/auth/login", payload, { fallbackMessage: "登录失败" });
}

export async function getCurrentUser(): Promise<ApiUser | null> {
  try {
    return await get<ApiUser>("/api/auth/me", { fallbackMessage: "登录状态检查失败" });
  } catch {
    return null;
  }
}

export function logout(): Promise<void> {
  return post<void>("/api/auth/logout", undefined, { fallbackMessage: "退出登录失败" });
}
