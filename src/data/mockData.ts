import type { ConversationHistory, KnowledgeBase, Manual } from "../types";

export const histories: ConversationHistory[] = [
  { id: 1, title: "如何撤回采购订单？", time: "10:32", group: "今天" },
  { id: 2, title: "供应商信息如何修改", time: "09:18", group: "今天" },
  { id: 3, title: "月末结账操作流程", time: "昨天", group: "最近 7 天" },
  { id: 4, title: "库存盘点差异处理", time: "周五", group: "最近 7 天" },
  { id: 5, title: "新增员工并分配权限", time: "8月2日", group: "更早" },
];

export const suggestions = [
  "如何创建新的采购申请？",
  "采购订单审批后还能修改吗？",
  "如何导出本月采购明细？",
];

export const knowledgeBases: KnowledgeBase[] = [
  { name: "ERP 业务系统", code: "ERP_CORE", docs: 12, chunks: "3,286", updated: "10 分钟前", color: "teal", status: "已启用" },
  { name: "人力资源系统", code: "HR_PORTAL", docs: 8, chunks: "1,942", updated: "昨天 16:40", color: "blue", status: "已启用" },
  { name: "财务报销平台", code: "FIN_EXPENSE", docs: 6, chunks: "1,150", updated: "8月6日", color: "amber", status: "已启用" },
  { name: "客户服务平台", code: "CRM_SERVICE", docs: 3, chunks: "486", updated: "8月1日", color: "purple", status: "已停用" },
];

export const manuals: Manual[] = [
  { name: "ERP采购管理用户手册", file: "ERP采购管理用户手册V2.3.pdf", version: "V2.3", size: "18.6 MB", status: "已发布", progress: 100, updated: "今天 09:42", pages: 126 },
  { name: "ERP库存管理操作指南", file: "库存管理操作指南V1.8.docx", version: "V1.8", size: "9.2 MB", status: "已发布", progress: 100, updated: "昨天 17:20", pages: 84 },
  { name: "ERP财务模块使用说明", file: "财务模块使用说明V3.0.pdf", version: "V3.0", size: "26.4 MB", status: "向量索引中", progress: 72, updated: "2 分钟前", pages: 208 },
  { name: "常见问题与处理办法", file: "ERP常见问题.md", version: "V1.4", size: "368 KB", status: "处理完成", progress: 100, updated: "8月8日", pages: 32 },
];
