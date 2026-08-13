import { CheckCircle, DownloadSimple, FileText, WarningCircle, X } from '@phosphor-icons/react';
import type { SourceItem } from './chat.types';

interface SourcesPanelProps {
  sources: SourceItem[];
  citationCount: number;
  activeIndex: number;
  isLiveConversation: boolean;
  hasLiveCitations: boolean;
  generating: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export function SourcesPanel({
  sources,
  citationCount,
  activeIndex,
  isLiveConversation,
  hasLiveCitations,
  generating,
  mobileOpen,
  onClose,
  onSelect,
}: SourcesPanelProps) {
  return (
    <aside className={`source-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="source-head">
        <div><b>引用与原文</b><span>共 {citationCount} 处依据</span></div>
        <button
          className="source-close"
          type="button"
          onClick={onClose}
          aria-label="关闭引用面板"
        >
          <X />
        </button>
      </div>
      {!sources.length ? (
        <div className="source-empty">
          <span><FileText weight="duotone" /></span>
          <b>{generating ? '正在生成并核对引用' : '回答未标注引用'}</b>
          <p>
            {generating
              ? '引用会在回答实际使用对应手册原文后显示。'
              : '当前回答没有可展示的实际引用，请谨慎核对回答内容。'}
          </p>
        </div>
      ) : (
        <div className="source-list">
          {sources.map((source, index) => (
            <article
              key={`${source.manualId || source.fileName}-${source.title}-${source.n}`}
              className={`source-card ${activeIndex === index ? 'active' : ''}`}
            >
              <button className="source-card-select" type="button" onClick={() => onSelect(index)}>
                <span className="source-title">
                  <span>{source.n}</span>
                  <span><b>{source.title}</b><small>{source.fileName}</small></span>
                  <i>{source.score}</i>
                </span>
                <span className="source-meta">
                  <span>真实引用</span>
                  <span>{source.title}</span>
                  <span>{source.page ? `第 ${source.page} 页` : '章节定位'}</span>
                </span>
                <blockquote>{source.text}</blockquote>
              </button>
              {source.manualId && (
                <a
                  className="source-download"
                  href={`/api/manuals/${source.manualId}/file`}
                  download={source.fileName}
                  aria-label={`下载原文件：${source.fileName}`}
                >
                  <DownloadSimple aria-hidden="true" />
                  <span>下载原文件</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="source-footer">
        <span>{isLiveConversation && !hasLiveCitations ? <WarningCircle /> : <CheckCircle />}</span>
        <p>
          <b>
            {hasLiveCitations
              ? '仅展示回答实际引用的原文'
              : generating
                ? '正在核对回答引用'
                : '无实际引用'}
          </b>
          <small>
            {isLiveConversation
              ? '候选检索结果不会提前展示'
              : '尚未开始问答'}
          </small>
        </p>
      </div>
    </aside>
  );
}
