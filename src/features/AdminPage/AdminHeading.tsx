import { LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Breadcrumb, Button } from 'antd';
import type { ApiKnowledgeBase, ModalType, View } from '../../types';

interface AdminHeadingProps {
  view: Exclude<View, 'chat'>;
  title: string;
  selectedKnowledgeBase?: ApiKnowledgeBase;
  onBack: () => void;
  onOpenModal: (modal: ModalType) => void;
}

const descriptions = {
  knowledge: '统一管理业务知识与用户访问范围',
  manuals: '上传、处理并发布您的业务系统手册',
  analytics: '洞察问答质量，持续完善用户手册',
  users: '创建内部账号并管理角色与访问状态',
};

export function AdminHeading({
  view,
  title,
  selectedKnowledgeBase,
  onBack,
  onOpenModal,
}: AdminHeadingProps) {
  const modalType: ModalType = view === 'knowledge' ? 'kb' : view === 'users' ? 'user' : 'upload';
  const actionLabel = view === 'knowledge' ? '创建知识库' : view === 'users' ? '创建用户' : '上传手册';
  const uploadDisabled = view === 'manuals' && selectedKnowledgeBase?.status !== 'enabled';

  return (
    <header className="mb-7 flex items-start justify-between gap-4 max-[480px]:items-start">
      <div className="min-w-0">
        {view === 'manuals' && (
          <Breadcrumb
            className="mb-3"
            items={[
              {
                title: (
                  <Button className="!h-auto !p-0" type="link" icon={<LeftOutlined />} onClick={onBack}>
                    知识库
                  </Button>
                ),
              },
              { title: selectedKnowledgeBase?.name ?? '手册' },
            ]}
          />
        )}
        <h1 className="m-0 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-[#192236]">{title}</h1>
        <p className="mb-0 mt-2 text-[13px] leading-5 text-[#7f899c]">{descriptions[view]}</p>
      </div>

      {view !== 'analytics' && (
        <Button
          className="h-9 shrink-0 rounded-lg px-4 shadow-[0_2px_5px_rgb(53_109_243_/_20%)]"
          type="primary"
          icon={<PlusOutlined />}
          disabled={uploadDisabled}
          title={uploadDisabled ? '请先启用知识库' : undefined}
          onClick={() => onOpenModal(modalType)}
        >
          {actionLabel}
        </Button>
      )}
    </header>
  );
}
