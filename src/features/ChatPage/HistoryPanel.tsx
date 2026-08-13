import { Button } from 'antd';
import {
  ChatCircleDots,
  Plus,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import type { ApiConversation } from '../../types';
import { CONVERSATION_GROUPS, getConversationGroup } from './chat.utils';

interface HistoryPanelProps {
  conversations: ApiConversation[];
  activeConversationId: string | number;
  mobileOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (conversation: ApiConversation) => void;
  onDelete: (conversation: ApiConversation) => void;
}

export function HistoryPanel({
  conversations,
  activeConversationId,
  mobileOpen,
  onClose,
  onNewChat,
  onSelect,
  onDelete,
}: HistoryPanelProps) {
  return (
    <aside className={`history-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="mobile-panel-head">
        <b>会话记录</b>
        <button type="button" onClick={onClose} aria-label="关闭会话列表">
          <X />
        </button>
      </div>
      <Button className="new-chat" type="primary" ghost icon={<Plus />} onClick={onNewChat}>
        新建会话
      </Button>
      <div className="history-list">
        {CONVERSATION_GROUPS.map((group) => (
          <div key={group}>
            <p className="group-label">{group}</p>
            {conversations
              .filter((item) => getConversationGroup(item.updated_at) === group)
              .map((conversation) => (
                <div
                  className={`history-item ${activeConversationId === conversation.id ? 'selected' : ''}`}
                  key={conversation.id}
                >
                  <button
                    className="history-select"
                    type="button"
                    onClick={() => onSelect(conversation)}
                  >
                    <span className="chat-bubble"><ChatCircleDots /></span>
                    <span>
                      {conversation.title}
                      <small>
                        {new Date(conversation.updated_at).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </span>
                  </button>
                  <button
                    className="history-delete"
                    type="button"
                    aria-label={`删除会话 ${conversation.title}`}
                    onClick={() => onDelete(conversation)}
                  >
                    <X />
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="secure-note">
        <span><ShieldCheck /></span>
        <p><b>数据安全保护</b><small>全部资料与会话仅在企业内网处理</small></p>
      </div>
    </aside>
  );
}
