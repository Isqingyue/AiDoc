import { Fragment, type ReactNode } from "react";

interface AnswerContentProps {
  content: string;
  onCitation?: (index: number) => void;
}

export function AnswerContent({ content, onCitation }: AnswerContentProps) {
  const lines = content.split("\n");
  return (
    <div className="formatted-answer">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <div className="answer-space" key={index} />;
        if (/^#{1,4}\s+/.test(value)) return <h3 key={index}>{inline(value.replace(/^#{1,4}\s+/, ""), onCitation)}</h3>;
        const numbered = value.match(/^(\d+)[.、]\s*(.*)$/);
        if (numbered) return <div className="answer-step" key={index}><i>{numbered[1]}</i><p>{inline(numbered[2], onCitation)}</p></div>;
        const bullet = value.match(/^[-*]\s+(.*)$/);
        if (bullet) return <div className="answer-bullet" key={index}><i>•</i><p>{inline(bullet[1], onCitation)}</p></div>;
        return <p key={index}>{inline(value, onCitation)}</p>;
      })}
    </div>
  );
}

function inline(value: string, onCitation?: (index: number) => void): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const citation = part.match(/^\[(\d+)\]$/);
    if (citation) {
      const citationIndex = Number(citation[1]) - 1;
      return <button className="inline-citation" key={index} onClick={() => onCitation?.(citationIndex)}>{part}</button>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
