import type { ApiCitation } from '../../types';

export interface SourceItem {
  n: number;
  title: string;
  page: number | null;
  text: string;
  score: string;
  fileName: string;
  manualId?: string;
}

export function getReferencedCitations(
  content: string,
  citations: ApiCitation[],
): ApiCitation[] {
  const referencedIds = new Set(
    [...content.matchAll(/\[(\d+)\]/g)].map((match) => match[1]),
  );

  return citations.filter((citation) => referencedIds.has(citation.id));
}

export function citationsToSources(citations: ApiCitation[]): SourceItem[] {
  return citations.map((citation, index) => ({
    n: Number.parseInt(citation.id, 10) || index + 1,
    title: citation.chapter || citation.file_name,
    page: citation.page,
    text: citation.content,
    score: `${Math.round(citation.score * 100)}%`,
    fileName: citation.file_name,
    manualId: citation.manual_id,
  }));
}
