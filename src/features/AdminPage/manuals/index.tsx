import { FileTextOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Input, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { runManualAction, type ManualAction } from '../../../api/manuals';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import type { ApiKnowledgeBase, ApiManual, Notice } from '../../../types';
import { ManualTable } from './ManualTable';

interface ManualsViewProps {
  knowledgeBases: ApiKnowledgeBase[];
  manuals: ApiManual[];
  reload: () => Promise<void>;
  selectedKnowledgeBaseId: string;
  onSelectKnowledgeBase: (id: string) => void;
  onNotify: (notice: Notice) => void;
}

const MANUAL_ACTION_MESSAGES: Record<ManualAction, string> = {
  publish: '发布成功，这本手册现在可以被智能问答引用。',
  disable: '手册已停用。',
  delete: '手册已删除。',
  reprocess: '已重新开始处理手册。',
};

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'ready', label: '待发布' },
  { value: 'failed', label: '处理失败' },
  { value: 'disabled', label: '已停用' },
];

export function ManualsView({
  knowledgeBases,
  manuals,
  reload,
  selectedKnowledgeBaseId,
  onSelectKnowledgeBase,
  onNotify,
}: ManualsViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [deleting, setDeleting] = useState<ApiManual | null>(null);
  const [publishing, setPublishing] = useState<ApiManual | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (knowledgeBases.length && !knowledgeBases.some((item) => item.id === selectedKnowledgeBaseId)) {
      onSelectKnowledgeBase((knowledgeBases.find((item) => item.status === 'enabled') || knowledgeBases[0]).id);
    }
  }, [knowledgeBases, onSelectKnowledgeBase, selectedKnowledgeBaseId]);

  const current = knowledgeBases.find((item) => item.id === selectedKnowledgeBaseId)
    || knowledgeBases.find((item) => item.status === 'enabled')
    || knowledgeBases[0];
  const currentManuals = useMemo(
    () => current ? manuals.filter((item) => item.knowledge_base_id === current.id) : [],
    [current, manuals],
  );
  const visibleManuals = useMemo(() => currentManuals.filter((manual) => {
    const matchesKeyword = `${manual.name} ${manual.file_name}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesKeyword && (status === 'all' || manual.status === status) && (fileType === 'all' || manual.file_type === fileType);
  }), [currentManuals, fileType, search, status]);
  const fileTypes = [...new Set(currentManuals.map((manual) => manual.file_type))];
  const activeReplacementFor = (manual: ApiManual) => currentManuals.find((item) => (
    item.id !== manual.id && item.name === manual.name && item.status === 'published' && item.is_current
  ));

  async function runAction(manual: ApiManual, action: ManualAction) {
    setBusy(true);
    try {
      await runManualAction(manual.id, action);
      await reload();
      setDeleting(null);
      setPublishing(null);
      onNotify({ type: 'success', message: MANUAL_ACTION_MESSAGES[action] });
    } catch (reason) {
      onNotify({ type: 'error', message: reason instanceof Error ? reason.message : '手册操作失败' });
    } finally {
      setBusy(false);
    }
  }

  const publishTitle = publishing?.status === 'disabled'
    ? activeReplacementFor(publishing) ? '恢复这个历史版本？' : '重新启用这本手册？'
    : '发布到智能问答？';

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e3e8f2] bg-white px-5 py-4 shadow-[0_2px_8px_rgb(27_45_85_/_3%)]">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-lg font-bold text-[#356df3]">
          {current?.name.slice(0, 1) || '知'}
        </div>
        <div className="min-w-[160px]">
          <span className="block text-[11px] font-medium text-[#8b96aa]">当前知识库</span>
          <b className="mt-0.5 block text-[15px] text-[#26324a]">{current?.name || '尚无知识库'}</b>
        </div>
        <Select
          className="w-[230px] max-[620px]:w-full"
          value={current?.id}
          onChange={onSelectKnowledgeBase}
          options={knowledgeBases.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e3e8f2] bg-white shadow-[0_2px_8px_rgb(27_45_85_/_3%)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-[#356df3]" />
              <b className="text-[15px] text-[#26324a]">手册</b>
            </div>
            <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[12px] text-[#8a95a8]">
              <InfoCircleOutlined /> 上传后自动解析；处理完成后发布，AI 才能引用。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#edf0f5] bg-[#fbfcfe] px-5 py-3">
          <Input
            className="w-full max-w-[370px]"
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索手册名称或文件名"
          />
          <Select className="min-w-[132px]" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <Select
            className="min-w-[142px]"
            value={fileType}
            onChange={setFileType}
            options={[{ value: 'all', label: '全部文件类型' }, ...fileTypes.map((value) => ({ value, label: value.toUpperCase() }))]}
          />
        </div>
        <ManualTable
          manuals={visibleManuals}
          hasAny={currentManuals.length > 0}
          activeReplacementFor={activeReplacementFor}
          onAction={(manual, action) => void runAction(manual, action)}
          onPublish={setPublishing}
          onDelete={setDeleting}
        />
      </section>

      {deleting && <ConfirmDialog title="删除这本手册？" description={`“${deleting.name}”的原始文件、解析片段和检索索引都会被永久删除。`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void runAction(deleting, 'delete')} />}
      {publishing && <ConfirmDialog tone="primary" title={publishTitle} description={`确认操作“${publishing.name}”${publishing.version}？操作完成后问答引用状态会立即更新。`} confirmLabel="确认" busy={busy} onCancel={() => setPublishing(null)} onConfirm={() => void runAction(publishing, 'publish')} />}
    </div>
  );
}
