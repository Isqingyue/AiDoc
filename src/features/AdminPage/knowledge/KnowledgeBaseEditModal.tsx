import { Form, Input, Modal } from "antd";
import { useState } from "react";
import { updateKnowledgeBase } from "../../../api/knowledgeBases";
import type { ApiKnowledgeBase } from "../../../types";

interface Values { name: string; description: string }
interface Props { item: ApiKnowledgeBase; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }

export function KnowledgeBaseEditModal({ item, onClose, onSaved, onError }: Props) {
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);

  async function save(values: Values) {
    setSaving(true);
    try {
      await updateKnowledgeBase(item.id, values);
      await onSaved();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "知识库保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open centered width={560} title="编辑知识库" okText="保存修改" cancelText="取消" confirmLoading={saving} onOk={() => form.submit()} onCancel={onClose} destroyOnHidden>
      <p className="modal-subtitle">修改用户可见的名称与说明</p>
      <Form form={form} layout="vertical" initialValues={{ name: item.name, description: item.description }} onFinish={save} requiredMark={false}>
        <Form.Item label="知识库名称" name="name" rules={[{ required: true, message: "请输入知识库名称" }]}><Input autoFocus /></Form.Item>
        <Form.Item label="知识库描述（选填）" name="description"><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
  );
}
