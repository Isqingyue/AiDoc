import type { ApiUser } from "../types";
import { get, post } from "./request";

export interface LoginPayload {
  username: string;
  password: string;
}

let currentUserRequest: Promise<ApiUser | null> | null = null;

export function login(payload: LoginPayload): Promise<ApiUser> {
  return post<ApiUser>("/api/auth/login", payload, { fallbackMessage: "登录失败" });
}

export function getCurrentUser(): Promise<ApiUser | null> {
  if (!currentUserRequest) {
    currentUserRequest = get<ApiUser>("/api/auth/me", {
      fallbackMessage: "登录状态检查失败",
      skipUnauthorizedHandler: true,
    })
      .catch(() => null)
      .finally(() => {
        currentUserRequest = null;
      });
  }

  return currentUserRequest;
}

export function logout(): Promise<void> {
  return post<void>("/api/auth/logout", undefined, { fallbackMessage: "退出登录失败" });
}
