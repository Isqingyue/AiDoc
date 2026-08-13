import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Select } from 'antd';
import { useMemo, useState } from 'react';
import { deleteKnowledgeBase, setKnowledgeBaseEnabled } from '../../../api/knowledgeBases';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import type { ApiKnowledgeBase, ApiManual, Notice } from '../../../types';
import { KnowledgeBaseCard } from './KnowledgeBaseCard';
import { KnowledgeBaseEditModal } from './KnowledgeBaseEditModal';

interface KnowledgeBaseViewProps {
  knowledgeBases: ApiKnowledgeBase[];
  manuals: ApiManual[];
  reload: () => Promise<void>;
  onManageManuals: (id: string) => void;
  onNotify: (notice: Notice) => void;
}

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'enabled', label: '已启用' },
  { value: 'disabled', label: '已停用' },
];

export function KnowledgeBaseView({ knowledgeBases, manuals, reload, onManageManuals, onNotify }: KnowledgeBaseViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<ApiKnowledgeBase | null>(null);
  const [deleting, setDeleting] = useState<ApiKnowledgeBase | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const visibleKnowledgeBases = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return knowledgeBases.filter((item) => {
      const matchesKeyword = `${item.name} ${item.code}`.toLowerCase().includes(keyword);
      return matchesKeyword && (status === 'all' || item.status === status);
    });
  }, [knowledgeBases, search, status]);

  async function toggle(item: ApiKnowledgeBase) {
    try {
      await setKnowledgeBaseEnabled(item.id, item.status !== 'enabled');
      await reload();
      onNotify({ type: 'success', message: `知识库已${item.status === 'enabled' ? '停用' : '启用'}。` });
    } catch (reason) {
      onNotify({ type: 'error', message: reason instanceof Error ? reason.message : '知识库状态更新失败' });
    }
  }

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteKnowledgeBase(deleting.id);
      await reload();
      setDeleting(null);
      onNotify({ type: 'success', message: '知识库已删除。' });
    } catch (reason) {
      onNotify({ type: 'error', message: reason instanceof Error ? reason.message : '删除知识库失败' });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#e4e8f0] bg-white p-2.5 max-[640px]:flex-wrap">
        <Input
          className="w-full max-w-[360px] max-[640px]:max-w-none"
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索知识库名称或编码"
        />
        <Select className="min-w-[140px]" value={status} onChange={setStatus} options={statusOptions} />
        <Button icon={<ReloadOutlined />} onClick={() => void reload()}>
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 max-[1250px]:grid-cols-2 max-[780px]:grid-cols-1">
        {visibleKnowledgeBases.map((item) => (
          <KnowledgeBaseCard
            key={item.id}
            item={item}
            manuals={manuals}
            onEdit={() => setEditing(item)}
            onToggle={() => void toggle(item)}
            onDelete={() => setDeleting(item)}
            onManage={() => onManageManuals(item.id)}
          />
        ))}
        {visibleKnowledgeBases.length === 0 && (
          <Empty className="col-span-full py-20" description="没有匹配的知识库" />
        )}
      </div>

      {editing && (
        <KnowledgeBaseEditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
            onNotify({ type: 'success', message: '知识库资料已保存。' });
          }}
          onError={(message) => onNotify({ type: "error", message })}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="删除这个知识库？"
          description={`“${deleting.name}”将被永久删除。只有没有手册和历史会话的空知识库才能删除。`}
          busy={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </>
  );
}
