import type { ModalType, Notice, View } from "../../types";

export interface AdminPageProps {
  view: Exclude<View, "chat">;
  title: string;
  setModal: (modal: ModalType | null) => void;
  setView: (view: View) => void;
  onOpenManuals: (id: string) => void;
  dataVersion: number;
  selectedKnowledgeBaseId: string;
  onSelectKnowledgeBase: (id: string) => void;
  onNotify: (notice: Notice) => void;
}
