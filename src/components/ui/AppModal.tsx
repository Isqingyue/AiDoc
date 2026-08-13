import { InboxOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Select, Upload } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";
import { createKnowledgeBase, listKnowledgeBases } from "../../api/knowledgeBases";
import { uploadManual } from "../../api/manuals";
import { createUser } from "../../api/users";
import type { ApiKnowledgeBase, ApiUser, ModalType } from "../../types";

interface AppModalProps {
  type: ModalType;
  initialKnowledgeBaseId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const roleOptions = [
  { value: "user", label: "普通用户" },
  { value: "knowledge_admin", label: "知识库管理员" },
  { value: "system_admin", label: "系统管理员" },
];

export function AppModal({ type, initialKnowledgeBaseId, onClose, onSuccess }: AppModalProps) {
  const titles = { kb: "创建知识库", user: "创建内部用户", upload: "上传用户手册" };
  const descriptions = {
    kb: "为新的业务系统建立独立知识空间",
    user: "设置登录账号、角色和可访问知识库",
    upload: "上传后将自动解析和切分，支持 PDF、DOCX、TXT 和 Markdown",
  };
  return (
    <Modal rootClassName="app-modal" open centered width={600} title={<div><b>{titles[type]}</b><p className="modal-subtitle">{descriptions[type]}</p></div>} footer={null} onCancel={onClose} destroyOnHidden>
      {type === "kb" && <KnowledgeBaseForm onClose={onClose} onSuccess={onSuccess} />}
      {type === "user" && <UserForm onClose={onClose} onSuccess={onSuccess} />}
      {type === "upload" && <ManualUploadForm initialKnowledgeBaseId={initialKnowledgeBaseId} onClose={onClose} onSuccess={onSuccess} />}
    </Modal>
  );
}

function FormFooter({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return <div className="antd-modal-footer"><Button onClick={onClose}>取消</Button><Button type="primary" htmlType="submit" loading={loading}>{label}</Button></div>;
}

function KnowledgeBaseForm({ onClose, onSuccess }: Pick<AppModalProps, "onClose" | "onSuccess">) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(values: { name: string; description?: string }) {
    setLoading(true); setError("");
    try {
      await createKnowledgeBase(values);
      onSuccess();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "创建知识库失败"); } finally { setLoading(false); }
  }
  return <Form layout="vertical" onFinish={submit} requiredMark={false}><Form.Item label="知识库名称" name="name" rules={[{ required: true, message: "请输入知识库名称" }]}><Input placeholder="例如：供应链管理系统" autoFocus /></Form.Item><Form.Item label="知识库描述（选填）" name="description"><Input.TextArea rows={4} placeholder="例如：包含采购、库存和供应商管理相关手册" /></Form.Item>{error && <Alert type="error" message={error} showIcon />}<FormFooter onClose={onClose} loading={loading} label="创建知识库" /></Form>;
}

function ManualUploadForm({ initialKnowledgeBaseId, onClose, onSuccess }: Pick<AppModalProps, "initialKnowledgeBaseId" | "onClose" | "onSuccess">) {
  const [form] = Form.useForm();
  const [knowledgeBases, setKnowledgeBases] = useState<ApiKnowledgeBase[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void listKnowledgeBases().then((items) => { const enabled = items.filter((item) => item.status === "enabled"); setKnowledgeBases(enabled); form.setFieldValue("knowledge_base_id", enabled.some((item) => item.id === initialKnowledgeBaseId) ? initialKnowledgeBaseId : enabled[0]?.id); }); }, [form, initialKnowledgeBaseId]);
  async function submit(values: { knowledge_base_id: string; name: string; version: string }) {
    const file = fileList[0]?.originFileObj;
    if (!file) { setError("请选择要上传的手册文件"); return; }
    setLoading(true); setError("");
    try {
      await uploadManual({ knowledgeBaseId: values.knowledge_base_id, name: values.name, version: values.version, file });
      onSuccess();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "手册上传失败"); } finally { setLoading(false); }
  }
  return <Form form={form} layout="vertical" initialValues={{ version: "V1.0" }} onFinish={submit} requiredMark={false}><Form.Item label="所属知识库" name="knowledge_base_id" rules={[{ required: true }]}><Select options={knowledgeBases.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item><Form.Item><Upload.Dragger accept=".pdf,.docx,.txt,.md,.markdown" maxCount={1} fileList={fileList} beforeUpload={() => false} onChange={({ fileList: next }) => { setFileList(next); const name = next[0]?.name.replace(/\.[^.]+$/, ""); if (name && !form.getFieldValue("name")) form.setFieldValue("name", name); }}><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">点击或拖拽手册文件到这里</p><p className="ant-upload-hint">支持 PDF、DOCX、TXT、MD，单个文件不超过 100 MB</p></Upload.Dragger></Form.Item><div className="form-grid-2"><Form.Item label="手册名称" name="name" rules={[{ required: true, message: "请输入手册名称" }]}><Input /></Form.Item><Form.Item label="版本号" name="version" rules={[{ required: true }]}><Input /></Form.Item></div>{error && <Alert type="error" message={error} showIcon />}<FormFooter onClose={onClose} loading={loading} label="开始上传" /></Form>;
}

interface UserValues { name: string; username: string; password: string; role: ApiUser["role"]; accessIds?: string[] }
function UserForm({ onClose, onSuccess }: Pick<AppModalProps, "onClose" | "onSuccess">) {
  const [form] = Form.useForm<UserValues>();
  const role = Form.useWatch("role", form);
  const [knowledgeBases, setKnowledgeBases] = useState<ApiKnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void listKnowledgeBases().then(setKnowledgeBases); }, []);
  async function submit(values: UserValues) {
    setLoading(true); setError("");
    try {
      await createUser({
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role,
        knowledgeBaseIds: values.accessIds,
      });
      onSuccess();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "创建用户失败"); } finally { setLoading(false); }
  }
  return <Form form={form} layout="vertical" initialValues={{ role: "user", accessIds: [] }} onFinish={submit} requiredMark={false}><div className="form-grid-2"><Form.Item label="姓名" name="name" rules={[{ required: true, message: "请输入姓名" }]}><Input autoFocus /></Form.Item><Form.Item label="用户名" name="username" rules={[{ required: true }, { pattern: /^[A-Za-z0-9_.-]+$/, message: "仅支持字母、数字及 _.-" }]}><Input /></Form.Item></div><Form.Item label="初始密码" name="password" rules={[{ required: true }, { min: 8, message: "密码至少 8 位" }]}><Input /></Form.Item><Form.Item label="用户角色" name="role"><Select options={roleOptions} /></Form.Item>{role === "user" && <Form.Item label="允许访问的知识库" name="accessIds"><Select mode="multiple" allowClear options={knowledgeBases.map((item) => ({ value: item.id, label: item.name }))} placeholder="请选择知识库" /></Form.Item>}{error && <Alert type="error" message={error} showIcon />}<FormFooter onClose={onClose} loading={loading} label="创建用户" /></Form>;
}
