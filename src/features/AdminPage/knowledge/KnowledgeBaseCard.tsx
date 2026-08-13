import { ArrowRight, PencilSimple, Power, Trash } from '@phosphor-icons/react';
import styled from 'styled-components';
import type { ApiKnowledgeBase, ApiManual } from '../../../types';
import { getStatusLabel } from '../status';

interface Props {
  item: ApiKnowledgeBase;
  manuals: ApiManual[];
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onManage: () => void;
}

const Card = styled.article`
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: #b9c9f3;
    box-shadow: 0 10px 28px rgb(35 60 116 / 8%);
    transform: translateY(-1px);
  }
`;

const actionClassName =
  'inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#526078] transition-colors hover:bg-[#f3f5f9] hover:text-[#356df3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356df3]';

export function KnowledgeBaseCard({ item, manuals, onEdit, onToggle, onDelete, onManage }: Props) {
  const related = manuals.filter((manual) => manual.knowledge_base_id === item.id);
  const published = related.filter((manual) => manual.status === "published").length;

  return (
    <Card className="flex min-h-[240px] flex-col rounded-xl border border-[#e4e8f0] bg-white p-[18px]">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#eaf0ff] text-base font-bold text-[#356df3]">
          {item.name.slice(0, 1)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="m-0 truncate text-[15px] font-semibold text-[#273147]">{item.name}</h3>
              <span className="mt-1 block truncate text-[11px] text-[#8b95a8]" title={`内部标识：${item.code}`}>
                {item.code}
              </span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                item.status === 'enabled'
                  ? 'bg-[#edf8f1] text-[#2c9562]'
                  : 'bg-[#f0f2f6] text-[#7a8498]'
              }`}
            >
              {getStatusLabel(item.status)}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-4 mt-5 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#71807c]">
        {item.description || `面向公司内部员工的${item.name}操作指南与业务流程。`}
      </p>

      <div className="flex gap-2">
        <span className="rounded-lg bg-[#f5f6f9] px-3 py-2 text-xs text-[#7d8799]">
          <b className="mr-1 text-[13px] text-[#344056]">{related.length}</b>本手册
        </span>
        <span className="rounded-lg bg-[#f5f6f9] px-3 py-2 text-xs text-[#7d8799]">
          <b className="mr-1 text-[13px] text-[#344056]">{published}</b>本已发布
        </span>
      </div>

      <div className="mt-auto flex items-center gap-1 border-t border-[#edf0f4] pt-3">
        <div className="flex min-w-0 items-center gap-0.5">
          <button type="button" className={actionClassName} onClick={onEdit}>
            <PencilSimple aria-hidden="true" />编辑
          </button>
          <button type="button" className={actionClassName} onClick={onToggle}>
            <Power aria-hidden="true" />{item.status === 'enabled' ? '停用' : '启用'}
          </button>
          {related.length === 0 && (
            <button type="button" className={`${actionClassName} hover:!text-[#d14343]`} onClick={onDelete}>
              <Trash aria-hidden="true" />删除
            </button>
          )}
        </div>
        <button
          type="button"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-[#356df3] transition-colors hover:bg-[#edf3ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356df3]"
          onClick={onManage}
        >
          管理手册 <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
