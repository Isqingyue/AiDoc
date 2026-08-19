export type View = "chat" | "knowledge" | "manuals" | "analytics" | "users";

export type ModalType = "kb" | "upload" | "user";

export interface ConversationHistory {
  id: number;
  title: string;
  time: string;
  group: "今天" | "最近 7 天" | "更早";
}

export interface KnowledgeBase {
  name: string;
  code: string;
  docs: number;
  chunks: string;
  updated: string;
  color: "teal" | "blue" | "amber" | "purple";
  status: "已启用" | "已停用";
}

export interface Manual {
  name: string;
  file: string;
  version: string;
  size: string;
  status: "已发布" | "向量索引中" | "处理完成";
  progress: number;
  updated: string;
  pages: number;
}

export interface ApiKnowledgeBase {
  id: string;
  name: string;
  code: string;
  system_code: string;
  description: string;
  status: "draft" | "enabled" | "disabled";
  created_at: string;
}

export interface ApiCitation {
  id: string;
  manual_id: string;
  file_name: string;
  version: string;
  page: number | null;
  chapter: string;
  content: string;
  score: number;
  modality?: 'text' | 'image';
  image_id?: string | null;
  image_url?: string | null;
  caption?: string | null;
}

export interface ApiManual {
  id: string;
  knowledge_base_id: string;
  name: string;
  version: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: "uploading" | "parsing" | "chunking" | "ready" | "published" | "failed" | "disabled";
  progress: number;
  is_current: boolean;
  error_message: string;
  created_at: string;
}

export interface ApiConversation {
  id: string;
  knowledge_base_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ApiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ApiCitation[];
  model_name: string;
  created_at: string;
}

export interface ApiAnalytics {
  total_questions: number;
  total_conversations: number;
  answer_rate: number;
  satisfaction_rate: number;
  unmatched_count: number;
  negative_feedback_count: number;
  frequent_questions: Array<{ question: string; count: number }>;
  knowledge_usage: Array<{ name: string; count: number }>;
  daily_trend: Array<{ date: string; count: number }>;
}

export interface ApiUser {
  id: string;
  username: string;
  name: string;
  role: "user" | "knowledge_admin" | "system_admin";
  status: string;
  plain_password: string | null;
}

export interface Notice {
  type: "success" | "error";
  message: string;
}
