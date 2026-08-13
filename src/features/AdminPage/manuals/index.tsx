import { CheckOutlined, LoadingOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Input, Select, Steps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { runManualAction, type ManualAction } from "../../../api/manuals";
import type { ApiKnowledgeBase, ApiManual, Notice } from "../../../types";
import { getStatusLabel } from "../status";
import { ManualTable } from "./ManualTable";

interface ManualsViewProps {
  knowledgeBases: ApiKnowledgeBase[];
  manuals: ApiManual[];
  reload: () => Promise<void>;
  selectedKnowledgeBaseId: string;
  onSelectKnowledgeBase: (id: string) => void;
  onNotify: (notice: Notice) => void;
}

const MANUAL_ACTION_MESSAGES: Record<ManualAction, string> = {
  publish: "发布成功，这本手册现在可以被智能问答引用。",
  disable: "手册已停用。",
  delete: "手册已删除。",
  reprocess: "已重新开始处理手册。",
};

export function ManualsView({ knowledgeBases, manuals, reload, selectedKnowledgeBaseId, onSelectKnowledgeBase, onNotify }: ManualsViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fileType, setFileType] = useState("all");
  const [deleting, setDeleting] = useState<ApiManual | null>(null);
  const [publishing, setPublishing] = useState<ApiManual | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (knowledgeBases.length && !knowledgeBases.some((item) => item.id === selectedKnowledgeBaseId)) {
      onSelectKnowledgeBase((knowledgeBases.find((item) => item.status === "enabled") || knowledgeBases[0]).id);
    }
  }, [knowledgeBases, onSelectKnowledgeBase, selectedKnowledgeBaseId]);

  const current = knowledgeBases.find((item) => item.id === selectedKnowledgeBaseId)
    || knowledgeBases.find((item) => item.status === "enabled")
    || knowledgeBases[0];
  const currentManuals = useMemo(() => current ? manuals.filter((item) => item.knowledge_base_id === current.id) : [], [current, manuals]);
  const visibleManuals = useMemo(() => currentManuals.filter((manual) => {
    const matchesKeyword = `${manual.name} ${manual.file_name}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesKeyword && (status === "all" || manual.status === status) && (fileType === "all" || manual.file_type === fileType);
  }), [currentManuals, fileType, search, status]);
  const fileTypes = [...new Set(currentManuals.map((manual) => manual.file_type))];
  const activeReplacementFor = (manual: ApiManual) => currentManuals.find((item) => item.id !== manual.id && item.name === manual.name && item.status === "published" && item.is_current);

  async function runAction(manual: ApiManual, action: ManualAction) {
    setBusy(true);
    try {
      await runManualAction(manual.id, action);
      await reload();
      setDeleting(null);
      setPublishing(null);
      onNotify({ type: "success", message: MANUAL_ACTION_MESSAGES[action] });
    } catch (reason) {
      onNotify({ type: "error", message: reason instanceof Error ? reason.message : "手册操作失败" });
    } finally {
      setBusy(false);
    }
  }

  const publishTitle = publishing?.status === "disabled"
    ? activeReplacementFor(publishing) ? "恢复这个历史版本？" : "重新启用这本手册？"
    : "发布到智能问答？";

  return (
    <>
      <div className="mb-4 grid grid-cols-[minmax(320px,0.82fr)_minmax(560px,1.55fr)] gap-3.5 max-[1050px]:grid-cols-1">
        <div className="flex min-h-[88px] items-center rounded-xl border border-[#e2e7f0] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgb(27_45_85_/_3%)]">
          <div className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#eaf0ff] text-base font-bold text-[#356df3]">
            {current?.name.slice(0, 1) || '知'}
          </div>
          <div className="ml-3 min-w-0">
            <span className="block text-[11px] text-[#949eb1]">当前知识库</span>
            <b className="mt-0.5 block truncate text-sm text-[#253047]">{current?.name || '尚无知识库'}</b>
            <small className="mt-1 flex items-center gap-1.5 text-[11px] text-[#7f8a9f]">
              {current ? getStatusLabel(current.status) : '—'}
              <i className="size-[3px] rounded-full bg-[#bdc4d1]" />
              {currentManuals.length} 本手册
            </small>
          </div>
          <Select
            className="ml-auto w-[220px] max-[640px]:w-[160px]"
            value={current?.id}
            onChange={onSelectKnowledgeBase}
            options={knowledgeBases.map((item) => ({
              value: item.id,
              label: `${item.name} · ${manuals.filter((manual) => manual.knowledge_base_id === item.id).length} 本`,
            }))}
          />
        </div>
        <Steps
          className="min-h-[88px] rounded-xl border border-[#e2e7f0] bg-white px-5 py-4"
          size="small"
          current={2}
          items={[
            { title: '上传', description: '添加手册文件', icon: <UploadOutlined /> },
            { title: '处理', description: '解析并建立索引', icon: <LoadingOutlined /> },
            { title: '发布到问答', description: '发布后 AI 才能引用', icon: <CheckOutlined /> },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-[0_2px_10px_rgb(27_45_85_/_3%)]">
        <div className="flex items-center gap-2.5 border-b border-[#edf0f4] p-3 max-[700px]:overflow-x-auto">
          <Input className="w-full max-w-[360px] shrink-0" allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索手册名称或文件名" />
          <Select className="min-w-[140px]" value={status} onChange={setStatus} options={[{ value: "all", label: "全部状态" }, { value: "published", label: "已发布" }, { value: "ready", label: "待发布" }, { value: "failed", label: "处理失败" }, { value: "disabled", label: "已停用" }]} />
          <Select className="min-w-[150px]" value={fileType} onChange={setFileType} options={[{ value: "all", label: "全部文件类型" }, ...fileTypes.map((value) => ({ value, label: value.toUpperCase() }))]} />
        </div>
        <ManualTable manuals={visibleManuals} hasAny={currentManuals.length > 0} activeReplacementFor={activeReplacementFor} onAction={(manual, action) => void runAction(manual, action)} onPublish={setPublishing} onDelete={setDeleting} />
      </div>

      {deleting && <ConfirmDialog title="删除这本手册？" description={`“${deleting.name}”的原始文件、解析片段和检索索引都会被永久删除。`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void runAction(deleting, "delete")} />}
      {publishing && <ConfirmDialog tone="primary" title={publishTitle} description={`确认操作“${publishing.name}”${publishing.version}？操作完成后问答引用状态会立即更新。`} confirmLabel="确认" busy={busy} onCancel={() => setPublishing(null)} onConfirm={() => void runAction(publishing, "publish")} />}
    </>
  );
}
