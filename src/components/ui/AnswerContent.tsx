import { Fragment, type ReactNode } from "react";
import { FileText, ImageSquare } from "@phosphor-icons/react";
import type { ApiCitation } from "../../types";

interface AnswerContentProps {
  content: string;
  onCitation?: (index: number) => void;
  citations?: ApiCitation[];
}

export function AnswerContent({ content, onCitation, citations = [] }: AnswerContentProps) {
  const lines = content.split("\n");
  const shownImageCitationIds = new Set<string>();
  return (
    <div className="formatted-answer">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <div className="answer-space" key={index} />;
        const imageCitations = getLineImageCitations(value, citations, shownImageCitationIds);
        const contentNode = formatLine(value, onCitation, citations);
        return (
          <Fragment key={index}>
            {contentNode}
            {imageCitations.length > 0 && (
              <div className="answer-image-citations" aria-label="这段回答引用的手册图片">
                {imageCitations.map((citation) => (
                  <button
                    key={citation.id}
                    type="button"
                    onClick={() => onCitation?.(Number(citation.id) - 1)}
                  >
                    <img
                      src={citation.image_url || undefined}
                      alt={`${citation.file_name}${citation.chapter ? `：${citation.chapter}` : ""}引用图片`}
                      loading="lazy"
                    />
                    <span>原图依据 [{citation.id}]</span>
                  </button>
                ))}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function formatLine(
  value: string,
  onCitation: ((index: number) => void) | undefined,
  citations: ApiCitation[],
): ReactNode {
  if (/^#{1,4}\s+/.test(value)) {
    return <h3>{inline(value.replace(/^#{1,4}\s+/, ""), onCitation, citations)}</h3>;
  }
  const numbered = value.match(/^(\d+)[.、]\s*(.*)$/);
  if (numbered) {
    return <div className="answer-step"><i>{numbered[1]}</i><p>{inline(numbered[2], onCitation, citations)}</p></div>;
  }
  const bullet = value.match(/^[-*]\s+(.*)$/);
  if (bullet) {
    return <div className="answer-bullet"><i>•</i><p>{inline(bullet[1], onCitation, citations)}</p></div>;
  }
  return <p>{inline(value, onCitation, citations)}</p>;
}

function getLineImageCitations(
  line: string,
  citations: ApiCitation[],
  shownImageCitationIds: Set<string>,
): ApiCitation[] {
  const citationIds = new Set([...line.matchAll(/\[(\d+)\]/g)].map((match) => match[1]));
  const images: ApiCitation[] = [];
  for (const citation of citations) {
    if (
      citation.modality !== "image"
      || !citation.image_url
      || !citationIds.has(citation.id)
      || shownImageCitationIds.has(citation.id)
    ) continue;
    shownImageCitationIds.add(citation.id);
    images.push(citation);
  }
  return images;
}

function inline(
  value: string,
  onCitation: ((index: number) => void) | undefined,
  citations: ApiCitation[],
): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const citation = part.match(/^\[(\d+)\]$/);
    if (citation) {
      const citationIndex = Number(citation[1]) - 1;
      const source = citations.find((item) => item.id === citation[1]);
      const isImage = source?.modality === "image";
      const label = isImage ? `原图 ${citation[1]}` : `原文 ${citation[1]}`;
      return (
        <button
          className={`inline-citation ${isImage ? "image-citation" : "text-citation"}`}
          key={index}
          type="button"
          onClick={() => onCitation?.(citationIndex)}
          aria-label={`查看${label}`}
          title={`查看${label}`}
        >
          {isImage ? <ImageSquare weight="bold" aria-hidden="true" /> : <FileText weight="bold" aria-hidden="true" />}
          {citation[1]}
        </button>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
