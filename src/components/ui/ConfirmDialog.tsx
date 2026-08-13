import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel = "确认删除", busy = false, tone = "danger", onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal
      open
      centered
      width={460}
      title={<span><ExclamationCircleFilled style={{ color: tone === "danger" ? "#d84c5b" : "#356df3", marginRight: 10 }} />{title}</span>}
      okText={confirmLabel}
      cancelText="取消"
      okButtonProps={{ danger: tone === "danger", loading: busy }}
      cancelButtonProps={{ disabled: busy }}
      closable={!busy}
      maskClosable={!busy}
      onCancel={onCancel}
      onOk={onConfirm}
    >
      <p style={{ margin: "8px 0 20px", color: "#68758b", lineHeight: 1.7 }}>{description}</p>
    </Modal>
  );
}
