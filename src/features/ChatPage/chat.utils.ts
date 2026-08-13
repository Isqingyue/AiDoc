import type { ApiKnowledgeBase } from '../../types';

export const CONVERSATION_GROUPS = ['今天', '最近 7 天', '更早'] as const;
export type ConversationGroup = (typeof CONVERSATION_GROUPS)[number];

export function getConversationGroup(updatedAt: string): ConversationGroup {
  const updated = new Date(updatedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (updated >= today) return '今天';

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return updated >= sevenDaysAgo ? '最近 7 天' : '更早';
}

export function getKnowledgeBaseSuggestions(knowledgeBase?: ApiKnowledgeBase): string[] {
  const identity = `${knowledgeBase?.name || ''} ${knowledgeBase?.code || ''} ${knowledgeBase?.system_code || ''}`.toLowerCase();

  if (identity.includes('生态底图') || identity.includes('scm_stdt')) {
    return [
      '生态底图系统的运行环境和安装要求是什么？',
      '系统安装完成后，首次使用需要配置哪些内容？',
      '管理员和设计者分别有哪些权限？',
    ];
  }

  if (identity.includes('erp')) {
    return [
      '如何创建并提交采购申请？',
      '采购订单审批后如何撤回或修改？',
      '如何查询并导出采购订单明细？',
    ];
  }

  const name = knowledgeBase?.name || '当前系统';
  return [
    `${name}的主要功能和适用范围是什么？`,
    `${name}有哪些常用操作流程？`,
    `${name}出现常见问题时如何排查？`,
  ];
}
