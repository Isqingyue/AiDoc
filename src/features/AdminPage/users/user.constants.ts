import type { ApiUser } from "../../../types";

export const USER_ROLE_OPTIONS: Array<{ value: ApiUser["role"]; label: string }> = [
  { value: "user", label: "普通用户" },
  { value: "knowledge_admin", label: "知识库管理员" },
  { value: "system_admin", label: "系统管理员" },
];

export const USER_STATUS_OPTIONS = [
  { value: "active", label: "正常" },
  { value: "disabled", label: "停用" },
];

export function getUserRoleLabel(role: ApiUser["role"]): string {
  return USER_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}
